# Kalakaar — Lean Launch Plan (v1.1)

Ye plan `BACKEND_PLAN.md` ko chhota karta hai. Goal: public launch, minimum backend, baaki baad mein.

## 1. Contact model (no in-app messaging)

Collector artist se **bahar** baat karega: WhatsApp / Instagram / Email pe redirect.

| Button | Link | Prefilled |
|---|---|---|
| WhatsApp | `https://wa.me/<number>?text=...` | "Hi, mujhe aapki artwork '<title>' pasand aayi: <artwork URL>" |
| Instagram | `https://instagram.com/<handle>` | (IG prefill support nahi karta) |
| Email | `mailto:<email>?subject=...&body=...` | Artwork title + link |

Backend ka kaam sirf **contact details store karna** — koi message/commission table nahi.

**Privacy (public launch ke liye zaroori):** phone/email public page pe seedha dikhe to scraping/spam hoga.
- Table `artist_contacts(artist_id PK, whatsapp_number, instagram_handle, contact_email, show_whatsapp, show_instagram, show_email)`
- Artist khud chunta hai kaunsa channel dikhana hai.
- RLS: **sirf logged-in users** read kar sakte hain; artist apna edit karta hai. (Login ek halka spam-filter ban jata hai.)
- Login email (`auth.users`) alag rehta hai, kabhi expose nahi hota. `contact_email` artist ka chosen public email hai.
- Agar tum chaho ki bina login ke bhi dikhe: ek line ka change (policy `anon` ko bhi allow). Trade-off: zyada leads, zyada spam.

## 2. Launch scope: kya rakhein, kya baad mein

### Tier A — Launch pe chahiye (9 tables)
`profiles`, `artist_contacts`, `artworks`, `stories`, `collections`, `collection_artworks`, `artwork_likes`, `wishlists`, `followers`

| Feature | Backend |
|---|---|
| Signup/login (email + Google), reset password | Supabase Auth + trigger jo profile banata hai |
| Artist profile + onboarding | `profiles`, `artist_contacts`, bucket `avatars` |
| Upload / edit / publish artwork, mark sold | `artworks`, bucket `artworks` |
| Stories, Collections | `stories`, `collections`, `collection_artworks` |
| Explore + Search | Normal queries + `ilike`/trigram index (**RPC `search_everything` nahi**) |
| Like, Save | `artwork_likes`, `wishlists` + counter trigger |
| Follow | `followers` + counter trigger |
| Views counter | 1 chhota function `increment_view` |
| Admin | Supabase dashboard + app mein simple panel (neeche) |

### Tier B — Launch ke **baad** (jab users aa jayein)
Reviews (fake review/moderation ka bojh; UI abhi hide karo), notifications, reports table, announcements, platform_settings, Artist-of-the-Month table, analytics RPC, quotes/cultural_facts tables (local content already fallback hai), commissions, community posts, collection drag-reorder RPC.

Isse tables ~20 se ~9 ho gaye, RPC 6 se 1.

## 3. Admin ko chhota rakho (naya table nahi)

Admin panel bas ye kare, sab `profiles/artworks/stories/collections` ke flags se:
- Artist / artwork / story ko **feature** karna (`is_featured`)
- Content **hide** karna (`status='archived'`)
- User **suspend** karna (`is_active=false`)
- Delete
- "Artist of the Month" = ek featured artist (flag), alag table nahi
- Report: har page pe "Report" button -> `mailto:` tumhare email pe (table nahi)
- Pehla admin: tum dashboard SQL se khud ko `super_admin` banate ho

Dashboard counts: simple `count(*)` queries (RPC nahi).

## 4. Security (ye chhodna nahi — public launch mein sabse zaroori)

1. `role`, `is_featured`, `is_verified`, `is_active` aur counters ko user khud na badal sake (trigger guard).
2. RLS har table pe ON; anon ko sirf zaroori `SELECT`.
3. Drafts/archived sirf owner + admin ko dikhe.
4. Storage: user sirf apne folder mein upload kare, file size/type limit.
5. Env missing ho to app clearly fail kare (placeholder keys nahi).
6. Service-role key kabhi frontend/Vercel public env mein nahi.

## 5. Public launch checklist (backend ke alawa)

- **Privacy Policy + Terms** page (phone/email collect kar rahe ho, to zaroori). Artist ko onboarding mein consent line: "mera contact logged-in visitors ko dikhega".
- **Moderation rule:** naye artists ka content turant live ho ya admin approve kare? Recommend: pehle 20-30 artists ko tum khud invite karo (curated launch), phir open signup.
- Supabase Auth: Site URL + redirect URLs (localhost + production domain), Google OAuth keys.
- Custom domain + Vercel env vars (2 keys).
- SEO/OG tags artist aur artwork pages pe (already planned), image size limit + compression.
- Backup: Supabase free tier pe project **inactivity pe pause** ho sakta hai aur storage limit chhoti hoti hai — launch ke time current limits dekh ke paid plan (~$25/mo) consider karo.
- Basic abuse control: upload limit per artist, Supabase Auth rate limits default ON.

## 6. Build order (chhota)

| Phase | Kaam |
|---|---|
| 1 | Decisions + naya Supabase project + migrations (9 tables, RLS, storage, triggers) + RLS test |
| 2 | Auth: clients, middleware, callback, AuthContext |
| 3 | Profile + contacts + avatar + onboarding |
| 4 | Artworks + stories + collections |
| 5 | Like / save / follow + explore + search |
| 6 | Admin (flag based) + hide Tier B UI (reviews, notifications, commissions) |
| 7 | Security pass, `next build`, Vercel deploy, 3 test users se prod check |

## 7. Decisions chahiye

1. Contact details **login ke baad** dikhein (recommended) ya sabko?
2. Launch curated (invite-only artists) ya open signup?
3. Reviews launch pe hide karein (recommended)?
4. Google login launch pe chahiye, ya sirf email+password se shuru?
