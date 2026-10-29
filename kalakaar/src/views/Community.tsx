"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { StoryService, Story } from "../../services/StoryService";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

export function Community() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    async function loadStories() {
      setLoading(true);
      const res = await StoryService.getFeaturedStories(10);
      if (res.success && res.data) {
        setStories(res.data);
      }
      setLoading(false);
    }
    loadStories();
  }, []);

  const handlePost = () => {
    if (!user || !newPost.trim()) return;
    const postObj = {
      id: `post-${Date.now()}`,
      user_id: user.id,
      content: newPost,
      likes_count: 0,
      created_at: new Date().toISOString(),
      profiles: { full_name: user.name || 'Art Lover', avatar_url: user.avatar }
    };
    setPosts([postObj, ...posts]);
    setNewPost("");
  };

  const handleLike = (postId: string, currentLikes: number) => {
    if (!user) return;
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <main className="pt-24 pb-32">
        {/* Stories Ribbon */}
        <section className="bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)] py-6 px-4">
           <div className="max-w-3xl mx-auto flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stories.map(story => (
                 <Link href={`/stories/${story.id}`} key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#6B1E2E] to-[#C8A84B]">
                       <div className="w-full h-full rounded-full border-2 border-[#FFFDF7] overflow-hidden relative">
                          <Image src={story.profiles?.avatar_url || '/assets/defaults/avatar.svg'} alt="avatar" fill className="object-cover" />
                       </div>
                    </div>
                    <span className="font-sans text-[0.7rem] text-[#2C1810] group-hover:text-[#6B1E2E] transition-colors max-w-[70px] truncate text-center">
                       {story.profiles?.username || story.profiles?.full_name?.split(' ')[0] || 'User'}
                    </span>
                 </Link>
              ))}
           </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 mt-8">
           <h1 className="font-serif text-[2rem] text-[#2C1810] mb-8">Community</h1>
           
           {/* Create Post */}
           {user && (
             <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 mb-8 shadow-sm">
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#EDE4CE] shrink-0" />
                   <div className="flex-1">
                      <textarea 
                         value={newPost}
                         onChange={(e) => setNewPost(e.target.value)}
                         placeholder="Share your creative thoughts..."
                         className="w-full bg-transparent resize-none font-sans text-[0.95rem] text-[#2C1810] outline-none placeholder:text-[#9C7A6A]"
                         rows={3}
                      />
                      <div className="flex justify-end mt-2 pt-3 border-t border-[rgba(107,30,46,0.1)]">
                         <button onClick={handlePost} disabled={!newPost.trim()} className="px-6 py-2 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.75rem] uppercase tracking-wider font-semibold disabled:opacity-50">
                           Post
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* Feed */}
           {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-t border-[#6B1E2E] animate-spin"></div></div>
           ) : posts.length === 0 ? (
              <div className="text-center py-24 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)]">
                <p className="font-sans text-[1.1rem] text-[#7A5C4E]">No posts yet. Start the conversation!</p>
              </div>
           ) : (
             <div className="space-y-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-sm">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-full overflow-hidden bg-[#EDE4CE] relative">
                          <Image src={post.profiles?.avatar_url || '/assets/defaults/avatar.svg'} alt="avatar" fill className="object-cover" />
                       </div>
                       <div>
                          <h4 className="font-sans text-[0.95rem] text-[#2C1810] font-semibold">{post.profiles?.full_name || 'Anonymous User'}</h4>
                          <p className="font-sans text-[0.75rem] text-[#9C7A6A]">{new Date(post.created_at).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <p className="font-sans text-[0.95rem] text-[#2C1810] whitespace-pre-line mb-6">
                       {post.content}
                     </p>
                     
                     <div className="flex items-center gap-6 border-t border-[rgba(107,30,46,0.1)] pt-4">
                        <button onClick={() => handleLike(post.id, post.likes_count)} className="flex items-center gap-2 text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors">
                           <Heart size={18} />
                           <span className="font-sans text-[0.8rem]">{post.likes_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors">
                           <MessageCircle size={18} />
                           <span className="font-sans text-[0.8rem]">Comment</span>
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
