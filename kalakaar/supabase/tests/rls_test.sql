-- LOCAL TEST: run after 00_shim.sql + migrations 001-003 on a scratch database.
\set ON_ERROR_STOP off
drop schema if exists t cascade; create schema t;
create table t.results (n serial, name text, ok boolean, info text);

create function t.run_as(uid uuid, q text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  if uid is null then set local role anon; else set local role authenticated; end if;
  execute q;
  reset role;
exception when others then reset role; raise;
end $$;

create function t.scalar(uid uuid, q text) returns text language plpgsql as $$
declare r text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  if uid is null then set local role anon; else set local role authenticated; end if;
  execute q into r;
  reset role;
  return r;
exception when others then reset role; return 'ERROR: ' || sqlerrm;
end $$;

create function t.ok(name text, cond boolean, info text default null) returns void language sql as
$$ insert into t.results(name, ok, info) values (name, coalesce(cond, false), info) $$;

create function t.denied(name text, uid uuid, q text) returns void language plpgsql as $$
begin
  perform t.run_as(uid, q);
  insert into t.results(name, ok, info) values (name, false, 'statement succeeded but should be denied');
exception when others then
  insert into t.results(name, ok, info) values (name, true, sqlerrm);
end $$;

create function t.allowed(name text, uid uuid, q text) returns void language plpgsql as $$
begin
  perform t.run_as(uid, q);
  insert into t.results(name, ok) values (name, true);
exception when others then
  insert into t.results(name, ok, info) values (name, false, sqlerrm);
end $$;

-- ---------- fixtures ----------
insert into auth.users(id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000b1','buyer@x.com','{"display_name":"Buyer One"}'),
 ('00000000-0000-0000-0000-0000000000a1','artist1@x.com','{"display_name":"Artist One","is_artist":true}'),
 ('00000000-0000-0000-0000-0000000000a2','artist2@x.com','{"display_name":"Artist Two","role":"artist"}'),
 ('00000000-0000-0000-0000-0000000000ad','admin@x.com','{"display_name":"Admin","role":"super_admin"}'),
 ('00000000-0000-0000-0000-0000000000e1','ab@x.com','{}');
update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000ad'; -- done as superuser (dashboard)

select t.ok('signup: artist metadata -> artist',
  (select role from public.profiles where id='00000000-0000-0000-0000-0000000000a1')='artist');
select t.ok('signup: role=artist metadata -> artist',
  (select role from public.profiles where id='00000000-0000-0000-0000-0000000000a2')='artist');
select t.ok('signup: role=super_admin metadata is clamped to buyer',
  (select role from public.profiles where id='00000000-0000-0000-0000-0000000000ad')='admin'
  and not exists (select 1 from public.profiles where id='00000000-0000-0000-0000-0000000000b1' and role<>'buyer'));
select t.ok('signup: short email prefix still gets valid username',
  (select username from public.profiles where id='00000000-0000-0000-0000-0000000000e1') ~ '^[a-z0-9_]{3,30}$');
select t.ok('signup: profile has no email column', not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='email'));

-- ---------- profiles ----------
select t.denied('profile: user cannot make self admin', '00000000-0000-0000-0000-0000000000b1',
  $q$update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000b1'$q$);
select t.denied('profile: user cannot make self super_admin', '00000000-0000-0000-0000-0000000000b1',
  $q$update public.profiles set role='super_admin' where id='00000000-0000-0000-0000-0000000000b1'$q$);
select t.denied('profile: user cannot self-feature', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.profiles set is_featured=true where id='00000000-0000-0000-0000-0000000000a1'$q$);
select t.denied('profile: user cannot self-verify', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.profiles set is_verified=true where id='00000000-0000-0000-0000-0000000000a1'$q$);
select t.denied('profile: user cannot edit counters', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.profiles set follower_count=9999 where id='00000000-0000-0000-0000-0000000000a1'$q$);
select t.denied('profile: user cannot reactivate/deactivate', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.profiles set is_active=false where id='00000000-0000-0000-0000-0000000000a1'$q$);
select t.allowed('profile: buyer can switch to artist', '00000000-0000-0000-0000-0000000000b1',
  $q$update public.profiles set role='artist', bio='hello' where id='00000000-0000-0000-0000-0000000000b1'$q$);
select t.ok('profile: switch persisted', (select role from public.profiles where id='00000000-0000-0000-0000-0000000000b1')='artist');
update public.profiles set role='buyer' where id='00000000-0000-0000-0000-0000000000b1';
select t.ok('profile: other user edit affects 0 rows',
  t.scalar('00000000-0000-0000-0000-0000000000a2',
   $q$with u as (update public.profiles set bio='hacked' where id='00000000-0000-0000-0000-0000000000a1' returning 1) select count(*)::text from u$q$)='0');
select t.denied('profile: anon cannot insert', null,
  $q$insert into public.profiles(id,username,display_name) values (gen_random_uuid(),'hacker','x')$q$);
select t.ok('profile: delete affects 0 rows / denied',
  t.scalar('00000000-0000-0000-0000-0000000000a1',
   $q$with d as (delete from public.profiles where id='00000000-0000-0000-0000-0000000000a1' returning 1) select count(*)::text from d$q$) like 'ERROR%');
select t.allowed('profile: admin can feature artist', '00000000-0000-0000-0000-0000000000ad',
  $q$update public.profiles set is_featured=true, featured_since=now() where id='00000000-0000-0000-0000-0000000000a1'$q$);
select t.ok('profile: anon sees featured artist', t.scalar(null,$q$select is_featured::text from public.profiles where id='00000000-0000-0000-0000-0000000000a1'$q$)='true');

-- ---------- artworks ----------
select t.denied('artwork: buyer cannot create', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.artworks(artist_id,title,slug,category) values ('00000000-0000-0000-0000-0000000000b1','t','buyer-art','Madhubani')$q$);
select t.allowed('artwork: artist can create draft', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(id,artist_id,title,slug,category) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','Draft','draft-1','Madhubani')$q$);
select t.denied('artwork: artist cannot create for someone else', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(artist_id,title,slug,category) values ('00000000-0000-0000-0000-0000000000a2','t','spoof-1','Warli')$q$);
select t.allowed('artwork: artist can create published', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(id,artist_id,title,slug,category,status,is_featured,view_count,like_count) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a1','Pub','pub-1','Madhubani','published',true,500,500)$q$);
select t.ok('artwork: insert forces is_featured/counters to defaults',
  (select not is_featured and view_count=0 and like_count=0 from public.artworks where id='10000000-0000-0000-0000-000000000002'));
select t.ok('artwork: published_at set on publish', (select published_at is not null from public.artworks where id='10000000-0000-0000-0000-000000000002'));
select t.ok('artwork: draft has no published_at', (select published_at is null from public.artworks where id='10000000-0000-0000-0000-000000000001'));
select t.ok('artwork: anon sees only published', t.scalar(null,$q$select count(*)::text from public.artworks$q$)='1');
select t.ok('artwork: other artist cannot see draft', t.scalar('00000000-0000-0000-0000-0000000000a2',$q$select count(*)::text from public.artworks where id='10000000-0000-0000-0000-000000000001'$q$)='0');
select t.ok('artwork: owner sees draft', t.scalar('00000000-0000-0000-0000-0000000000a1',$q$select count(*)::text from public.artworks where id='10000000-0000-0000-0000-000000000001'$q$)='1');
select t.ok('artwork: admin sees draft', t.scalar('00000000-0000-0000-0000-0000000000ad',$q$select count(*)::text from public.artworks where id='10000000-0000-0000-0000-000000000001'$q$)='1');
select t.ok('artwork: other artist update affects 0 rows',
  t.scalar('00000000-0000-0000-0000-0000000000a2',$q$with u as (update public.artworks set title='pwn' where id='10000000-0000-0000-0000-000000000002' returning 1) select count(*)::text from u$q$)='0');
select t.ok('artwork: other artist delete affects 0 rows',
  t.scalar('00000000-0000-0000-0000-0000000000a2',$q$with d as (delete from public.artworks where id='10000000-0000-0000-0000-000000000002' returning 1) select count(*)::text from d$q$)='0');
select t.denied('artwork: owner cannot self-feature', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.artworks set is_featured=true where id='10000000-0000-0000-0000-000000000002'$q$);
select t.denied('artwork: owner cannot set counters', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.artworks set like_count=999 where id='10000000-0000-0000-0000-000000000002'$q$);
select t.denied('artwork: owner cannot reassign artist_id', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.artworks set artist_id='00000000-0000-0000-0000-0000000000a2' where id='10000000-0000-0000-0000-000000000002'$q$);
select t.allowed('artwork: owner can mark sold + edit', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.artworks set is_sold=true, title='Pub edited' where id='10000000-0000-0000-0000-000000000002'$q$);
select t.allowed('artwork: admin can feature', '00000000-0000-0000-0000-0000000000ad',
  $q$update public.artworks set is_featured=true where id='10000000-0000-0000-0000-000000000002'$q$);
select t.allowed('artwork: admin can archive (hide)', '00000000-0000-0000-0000-0000000000ad',
  $q$update public.artworks set status='archived' where id='10000000-0000-0000-0000-000000000001'$q$);
select t.denied('artwork: bad slug rejected', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(artist_id,title,slug,category) values ('00000000-0000-0000-0000-0000000000a1','t','Bad Slug!','x')$q$);
select t.denied('artwork: negative price rejected', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(artist_id,title,slug,category,price) values ('00000000-0000-0000-0000-0000000000a1','t','neg-1','x',-5)$q$);
select t.denied('artwork: >10 images rejected', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artworks(artist_id,title,slug,category,image_urls) values ('00000000-0000-0000-0000-0000000000a1','t','img-1','x',array_fill('u'::text, array[11]))$q$);
select t.ok('profile counter: artwork_count = published only', (select artwork_count from public.profiles where id='00000000-0000-0000-0000-0000000000a1')=1);

-- ---------- view counter ----------
select t.allowed('views: anon can increment published', null, $q$select public.increment_view('artwork','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('views: count incremented', (select view_count from public.artworks where id='10000000-0000-0000-0000-000000000002')=1);
select t.allowed('views: archived artwork ignored', null, $q$select public.increment_view('artwork','10000000-0000-0000-0000-000000000001')$q$);
select t.ok('views: archived count unchanged', (select view_count from public.artworks where id='10000000-0000-0000-0000-000000000001')=0);
select t.denied('views: invalid kind rejected', null, $q$select public.increment_view('profile','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('views: updated_at not bumped by counters',
  (select updated_at < now() + interval '1 second' from public.artworks where id='10000000-0000-0000-0000-000000000002'));

-- ---------- likes / wishlist ----------
select t.allowed('like: user can like published', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.artwork_likes(user_id,artwork_id) values ('00000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('like: like_count = 1', (select like_count from public.artworks where id='10000000-0000-0000-0000-000000000002')=1);
select t.denied('like: cannot like as another user', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.artwork_likes(user_id,artwork_id) values ('00000000-0000-0000-0000-0000000000a2','10000000-0000-0000-0000-000000000002')$q$);
select t.denied('like: cannot like archived artwork', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.artwork_likes(user_id,artwork_id) values ('00000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-000000000001')$q$);
select t.denied('like: duplicate rejected', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.artwork_likes(user_id,artwork_id) values ('00000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('like: anon cannot read likes', t.scalar(null,$q$select count(*)::text from public.artwork_likes$q$) like 'ERROR%');
select t.ok('like: others cannot see my like', t.scalar('00000000-0000-0000-0000-0000000000a2',$q$select count(*)::text from public.artwork_likes$q$)='0');
select t.allowed('like: unlike', '00000000-0000-0000-0000-0000000000b1',
  $q$delete from public.artwork_likes where user_id='00000000-0000-0000-0000-0000000000b1'$q$);
select t.ok('like: like_count back to 0', (select like_count from public.artworks where id='10000000-0000-0000-0000-000000000002')=0);

select t.allowed('wishlist: user can save', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.wishlists(user_id,artwork_id) values ('00000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('wishlist: count = 1', (select wishlist_count from public.artworks where id='10000000-0000-0000-0000-000000000002')=1);
select t.ok('wishlist: private from others', t.scalar('00000000-0000-0000-0000-0000000000a1',$q$select count(*)::text from public.wishlists$q$)='0');
select t.ok('wishlist: private from anon', t.scalar(null,$q$select count(*)::text from public.wishlists$q$) like 'ERROR%');
select t.ok('wishlist: owner sees own', t.scalar('00000000-0000-0000-0000-0000000000b1',$q$select count(*)::text from public.wishlists$q$)='1');

-- ---------- followers ----------
select t.allowed('follow: user follows artist', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.followers(follower_id,artist_id) values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1')$q$);
select t.ok('follow: follower_count = 1', (select follower_count from public.profiles where id='00000000-0000-0000-0000-0000000000a1')=1);
select t.denied('follow: cannot follow as someone else', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.followers(follower_id,artist_id) values ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1')$q$);
select t.denied('follow: cannot follow self', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.followers(follower_id,artist_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a1')$q$);
select t.denied('follow: cannot follow a non-artist', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.followers(follower_id,artist_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1')$q$);
select t.allowed('follow: unfollow', '00000000-0000-0000-0000-0000000000b1',
  $q$delete from public.followers where follower_id='00000000-0000-0000-0000-0000000000b1'$q$);
select t.ok('follow: follower_count back to 0', (select follower_count from public.profiles where id='00000000-0000-0000-0000-0000000000a1')=0);

-- ---------- contacts ----------
select t.allowed('contacts: artist saves contacts', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artist_contacts(artist_id,whatsapp_number,instagram_handle,contact_email,show_instagram)
     values ('00000000-0000-0000-0000-0000000000a1','919876543210','artist.one','a1@mail.com',false)$q$);
select t.denied('contacts: invalid phone rejected', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.artist_contacts(artist_id,whatsapp_number) values ('00000000-0000-0000-0000-0000000000a2','+91 98-abc')$q$);
select t.denied('contacts: invalid email rejected', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.artist_contacts(artist_id,contact_email) values ('00000000-0000-0000-0000-0000000000a2','not-an-email')$q$);
select t.denied('contacts: cannot write for another artist', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.artist_contacts(artist_id,whatsapp_number) values ('00000000-0000-0000-0000-0000000000a1','911111111111')$q$);
select t.denied('contacts: buyer cannot create contacts', '00000000-0000-0000-0000-0000000000e1',
  $q$insert into public.artist_contacts(artist_id,whatsapp_number) values ('00000000-0000-0000-0000-0000000000e1','911111111111')$q$);
select t.ok('contacts: anon cannot read view', t.scalar(null,$q$select count(*)::text from public.artist_contacts_public$q$) like 'ERROR%');
select t.ok('contacts: anon cannot read base table', t.scalar(null,$q$select count(*)::text from public.artist_contacts$q$) like 'ERROR%');
select t.ok('contacts: logged-in sees shown whatsapp', t.scalar('00000000-0000-0000-0000-0000000000b1',$q$select whatsapp_number from public.artist_contacts_public where artist_id='00000000-0000-0000-0000-0000000000a1'$q$)='919876543210');
select t.ok('contacts: hidden instagram is NULL in view', t.scalar('00000000-0000-0000-0000-0000000000b1',$q$select coalesce(instagram_handle,'NULL') from public.artist_contacts_public where artist_id='00000000-0000-0000-0000-0000000000a1'$q$)='NULL');
select t.ok('contacts: others cannot read base table rows', t.scalar('00000000-0000-0000-0000-0000000000b1',$q$select count(*)::text from public.artist_contacts$q$)='0');
select t.ok('contacts: owner reads own base row (incl hidden)', t.scalar('00000000-0000-0000-0000-0000000000a1',$q$select instagram_handle from public.artist_contacts$q$)='artist.one');

-- ---------- collections ----------
select t.allowed('collection: artist creates', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.collections(id,artist_id,title,slug,status) values ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','C1','c-1','published')$q$);
select t.allowed('collection: add own artwork', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.collection_artworks(collection_id,artwork_id,position) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',0)$q$);
select t.allowed('collection: artist2 creates own', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.collections(id,artist_id,title,slug,status) values ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a2','C2','c-2','published')$q$);
select t.denied('collection: cannot add someone else''s artwork', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.collection_artworks(collection_id,artwork_id) values ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002')$q$);
select t.denied('collection: cannot add to someone else''s collection', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.collection_artworks(collection_id,artwork_id) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002')$q$);
select t.ok('collection: anon reads published links', t.scalar(null,$q$select count(*)::text from public.collection_artworks$q$)='1');

-- ---------- stories ----------
select t.allowed('story: artist creates', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.stories(id,artist_id,title,slug,content,status) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','S','s-1','<p>hi</p>','published')$q$);
select t.denied('story: buyer cannot create', '00000000-0000-0000-0000-0000000000e1',
  $q$insert into public.stories(artist_id,title,slug,content) values ('00000000-0000-0000-0000-0000000000e1','S','s-2','x')$q$);
select t.ok('story: anon reads published', t.scalar(null,$q$select count(*)::text from public.stories$q$)='1');
select t.denied('story: owner cannot feature', '00000000-0000-0000-0000-0000000000a1',
  $q$update public.stories set is_featured=true where id='30000000-0000-0000-0000-000000000001'$q$);

-- ---------- suspension ----------
update public.profiles set is_active=false where id='00000000-0000-0000-0000-0000000000a2';
select t.ok('suspend: profile hidden from anon', t.scalar(null,$q$select count(*)::text from public.profiles where id='00000000-0000-0000-0000-0000000000a2'$q$)='0');
select t.ok('suspend: their collection hidden from anon', t.scalar(null,$q$select count(*)::text from public.collections where id='20000000-0000-0000-0000-000000000002'$q$)='0');
select t.denied('suspend: cannot create content', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.artworks(artist_id,title,slug,category) values ('00000000-0000-0000-0000-0000000000a2','t','susp-1','x')$q$);
select t.ok('suspend: still inactive after self-reactivate attempt', (select not is_active from public.profiles where id='00000000-0000-0000-0000-0000000000a2'));
update public.profiles set is_active=true where id='00000000-0000-0000-0000-0000000000a2';

-- ---------- limits ----------
insert into public.artworks(artist_id,title,slug,category)
  select '00000000-0000-0000-0000-0000000000a2','t','lim-'||g,'x' from generate_series(1,100) g;
select t.denied('limit: 101st artwork rejected', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.artworks(artist_id,title,slug,category) values ('00000000-0000-0000-0000-0000000000a2','t','lim-101','x')$q$);

-- ---------- storage ----------
insert into storage.objects(bucket_id,name) values ('artworks','dummy/x.png');
select t.allowed('storage: artist uploads to own folder', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into storage.objects(bucket_id,name) values ('artworks','00000000-0000-0000-0000-0000000000a1/p/1.png')$q$);
select t.denied('storage: artist cannot upload to others folder', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into storage.objects(bucket_id,name) values ('artworks','00000000-0000-0000-0000-0000000000a2/p/1.png')$q$);
select t.denied('storage: buyer cannot upload artworks', '00000000-0000-0000-0000-0000000000e1',
  $q$insert into storage.objects(bucket_id,name) values ('artworks','00000000-0000-0000-0000-0000000000e1/1.png')$q$);
select t.allowed('storage: buyer can upload own avatar', '00000000-0000-0000-0000-0000000000e1',
  $q$insert into storage.objects(bucket_id,name) values ('avatars','00000000-0000-0000-0000-0000000000e1/a.png')$q$);
select t.denied('storage: anon cannot upload', null,
  $q$insert into storage.objects(bucket_id,name) values ('avatars','x/a.png')$q$);
select t.ok('storage: other user cannot delete my file',
  t.scalar('00000000-0000-0000-0000-0000000000a2',$q$with d as (delete from storage.objects where bucket_id='artworks' and name like '00000000-0000-0000-0000-0000000000a1/%' returning 1) select count(*)::text from d$q$)='0');
select t.ok('storage: owner can delete own file',
  t.scalar('00000000-0000-0000-0000-0000000000a1',$q$with d as (delete from storage.objects where bucket_id='artworks' and name like '00000000-0000-0000-0000-0000000000a1/%' returning 1) select count(*)::text from d$q$)='1');
select t.ok('storage: anon cannot list objects', t.scalar(null,$q$select count(*)::text from storage.objects$q$)='0' or t.scalar(null,$q$select count(*)::text from storage.objects$q$) like 'ERROR%');
select t.ok('storage: user cannot list other users files',
  t.scalar('00000000-0000-0000-0000-0000000000a2',$q$select count(*)::text from storage.objects where name like '00000000-0000-0000-0000-0000000000a1/%'$q$)='0');
select t.ok('storage: size/MIME limits configured',
  (select bool_and(file_size_limit is not null and allowed_mime_types = array['image/jpeg','image/png','image/webp']) from storage.buckets)
  and (select count(*) from storage.buckets)=4);


-- ---------- reports ----------
select t.allowed('reports: signed-in user can report', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.reports(item_type,item_id,reason) values ('artist','00000000-0000-0000-0000-0000000000a1','spam profile')$q$);
select t.denied('reports: cannot report twice', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.reports(item_type,item_id,reason) values ('artist','00000000-0000-0000-0000-0000000000a1','again')$q$);
select t.denied('reports: cannot report as someone else', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.reports(reporter_id,item_type,item_id,reason) values ('00000000-0000-0000-0000-0000000000a1','story','00000000-0000-0000-0000-0000000000a1','fake')$q$);
select t.denied('reports: anon cannot report', null,
  $q$insert into public.reports(reporter_id,item_type,item_id,reason) values ('00000000-0000-0000-0000-0000000000a2','story','00000000-0000-0000-0000-0000000000a1','fake')$q$);
select t.ok('reports: normal user cannot read reports',
  t.scalar('00000000-0000-0000-0000-0000000000a2',$q$select count(*)::text from public.reports$q$)='0');
select t.allowed('reports: insert with a forged status is accepted but neutralised', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.reports(item_type,item_id,reason,status) values ('artist','00000000-0000-0000-0000-0000000000a2','bad','reviewed')$q$);
select t.ok('reports: forged status was forced back to pending',
  (select status from public.reports where reporter_id='00000000-0000-0000-0000-0000000000a1' limit 1)='pending');

-- ---------- rate limits ----------
select t.allowed('ratelimit: follow under the limit works', '00000000-0000-0000-0000-0000000000a2',
  $q$insert into public.followers(follower_id, artist_id) values ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1')$q$);
create table public.rl_probe (owner uuid not null, created_at timestamptz not null default now());
grant insert, select on public.rl_probe to authenticated;
create trigger trg_probe before insert on public.rl_probe
  for each row execute function public.enforce_rate_limit('owner', '3', '60');
select t.allowed('ratelimit: insert 1/3', '00000000-0000-0000-0000-0000000000a2', $q$insert into public.rl_probe(owner) values ('00000000-0000-0000-0000-0000000000a2')$q$);
select t.allowed('ratelimit: insert 2/3', '00000000-0000-0000-0000-0000000000a2', $q$insert into public.rl_probe(owner) values ('00000000-0000-0000-0000-0000000000a2')$q$);
select t.allowed('ratelimit: insert 3/3', '00000000-0000-0000-0000-0000000000a2', $q$insert into public.rl_probe(owner) values ('00000000-0000-0000-0000-0000000000a2')$q$);
select t.denied('ratelimit: 4th insert in the window is blocked', '00000000-0000-0000-0000-0000000000a2', $q$insert into public.rl_probe(owner) values ('00000000-0000-0000-0000-0000000000a2')$q$);
select t.allowed('ratelimit: other user is not affected', '00000000-0000-0000-0000-0000000000a1', $q$insert into public.rl_probe(owner) values ('00000000-0000-0000-0000-0000000000a1')$q$);
drop table public.rl_probe;
select t.ok('ratelimit: trigger exists on likes/follows/artworks/stories/collections',
  (select count(*) from pg_trigger where tgname like 'trg_rl_%')=7);


-- ---------- contact_clicks ----------
select t.allowed('clicks: buyer can log a tap on an artist', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.contact_clicks(artist_id, channel) values ('00000000-0000-0000-0000-0000000000a1','whatsapp')$q$);
select t.denied('clicks: anon cannot log', null,
  $q$insert into public.contact_clicks(artist_id, channel) values ('00000000-0000-0000-0000-0000000000a1','whatsapp')$q$);
select t.denied('clicks: cannot forge another visitor_id', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.contact_clicks(artist_id, visitor_id, channel) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2','email')$q$);
select t.denied('clicks: cannot tap your own profile', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.contact_clicks(artist_id, channel) values ('00000000-0000-0000-0000-0000000000a1','email')$q$);
select t.denied('clicks: invalid channel rejected', '00000000-0000-0000-0000-0000000000b1',
  $q$insert into public.contact_clicks(artist_id, channel) values ('00000000-0000-0000-0000-0000000000a1','telegram')$q$);
select t.ok('clicks: artist sees own count', t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select count(*)::text from public.contact_clicks$q$)='1');
select t.ok('clicks: other artist sees none', t.scalar('00000000-0000-0000-0000-0000000000a2', $q$select count(*)::text from public.contact_clicks$q$)='0');
select t.ok('clicks: buyer cannot read clicks', t.scalar('00000000-0000-0000-0000-0000000000b1', $q$select count(*)::text from public.contact_clicks$q$)='0');
select t.ok('clicks: artist CANNOT read visitor_id',
  t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select visitor_id::text from public.contact_clicks limit 1$q$) like 'ERROR%');
select t.ok('clicks: my_contact_stats returns whatsapp=1',
  t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select clicks::text from public.my_contact_stats(30) where channel='whatsapp'$q$)='1');
select t.denied('clicks: nobody can edit clicks', '00000000-0000-0000-0000-0000000000a1', $q$update public.contact_clicks set channel='email'$q$);
select t.denied('clicks: nobody can delete clicks', '00000000-0000-0000-0000-0000000000a1', $q$delete from public.contact_clicks$q$);

-- ---------- 009: artist analytics ----------
select t.ok('analytics: increment_view wrote a daily row',
  (select coalesce(sum(views),0) from public.artwork_daily_views where artwork_id='10000000-0000-0000-0000-000000000002') >= 1);
select t.ok('analytics: archived/draft artwork gets no daily row',
  not exists (select 1 from public.artwork_daily_views where artwork_id='10000000-0000-0000-0000-000000000001'));
select t.denied('analytics: nobody can read the daily table directly', '00000000-0000-0000-0000-0000000000a1', $q$select * from public.artwork_daily_views$q$);
select t.denied('analytics: nobody can write the daily table directly', '00000000-0000-0000-0000-0000000000a1',
  $q$insert into public.artwork_daily_views(artwork_id, day, views) values ('10000000-0000-0000-0000-000000000002', current_date, 999)$q$);
select t.denied('analytics: anon cannot call my_analytics', null, $q$select public.my_analytics(30)$q$);
select t.ok('analytics: artist gets a 30-day series',
  json_array_length(t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(30)->'daily')::text$q$)::json) = 30);
select t.ok('analytics: days are clamped to 7..90',
  json_array_length(t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(1)->'daily')::text$q$)::json) = 7
  and json_array_length(t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(5000)->'daily')::text$q$)::json) = 90);
select t.ok('analytics: artist sees own views, likes and the tap',
  (t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(30)->'totals'->>'views')$q$))::int >= 1
  and (t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(30)->'totals'->>'contacts')$q$))::int = 1
  and (t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(30)->'totals'->>'followers')$q$))::int >= 1);
select t.ok('analytics: another artist sees none of it',
  (t.scalar('00000000-0000-0000-0000-0000000000a2', $q$select (public.my_analytics(30)->'totals'->>'views')$q$))::int = 0
  and (t.scalar('00000000-0000-0000-0000-0000000000a2', $q$select (public.my_analytics(30)->'totals'->>'contacts')$q$))::int = 0
  and (t.scalar('00000000-0000-0000-0000-0000000000a2', $q$select json_array_length(public.my_analytics(30)->'top')::text$q$))::int = 0);
select t.ok('analytics: top list holds only own published work',
  t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select (public.my_analytics(30)->'top'->0->>'id')$q$) = '10000000-0000-0000-0000-000000000002'
  and (t.scalar('00000000-0000-0000-0000-0000000000a1', $q$select json_array_length(public.my_analytics(30)->'top')::text$q$))::int = 1);

-- ---------- 008: account deletion + admin overview ----------
select t.denied('delete_my_account: anon cannot call it', null, $q$select public.delete_my_account()$q$);
select t.ok('delete_my_account: signed-out call errors',
  t.scalar(null, $q$select public.delete_my_account()::text$q$) like 'ERROR%');
select t.ok('delete_my_account: admin cannot self-delete',
  t.scalar('00000000-0000-0000-0000-0000000000ad', $q$select public.delete_my_account()::text$q$) like 'ERROR%'
  and exists (select 1 from auth.users where id='00000000-0000-0000-0000-0000000000ad'));
select t.denied('admin_overview: buyer denied', '00000000-0000-0000-0000-0000000000b1', $q$select public.admin_overview()$q$);
select t.denied('admin_overview: anon denied', null, $q$select public.admin_overview()$q$);
select t.ok('admin_overview: admin gets 7 days of data',
  json_array_length(t.scalar('00000000-0000-0000-0000-0000000000ad', $q$select (public.admin_overview()->'daily')::text$q$)::json) = 7);
select t.allowed('delete_my_account: buyer can delete self', '00000000-0000-0000-0000-0000000000b1', $q$select public.delete_my_account()$q$);
select t.ok('delete_my_account: auth user and profile are gone',
  not exists (select 1 from auth.users where id='00000000-0000-0000-0000-0000000000b1')
  and not exists (select 1 from public.profiles where id='00000000-0000-0000-0000-0000000000b1'));
select t.ok('delete_my_account: other users untouched',
  exists (select 1 from public.profiles where id='00000000-0000-0000-0000-0000000000a1'));

-- ---------- grants sanity ----------
select t.ok('grants: anon has no write on any public table',
  not exists (select 1 from information_schema.role_table_grants where grantee='anon' and table_schema='public'
              and privilege_type in ('INSERT','UPDATE','DELETE')));
select t.ok('grants: anon cannot read artist_contacts_public / contacts / likes / wishlists',
  not exists (select 1 from information_schema.role_table_grants where grantee='anon' and table_schema='public'
              and table_name in ('artist_contacts','artist_contacts_public','artwork_likes','wishlists')));
select t.ok('rls: enabled on every public table',
  not exists (select 1 from pg_tables where schemaname='public' and not rowsecurity));

\echo
select case when ok then 'PASS' else 'FAIL' end as result, name, case when ok then '' else info end as info
from t.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from t.results;
