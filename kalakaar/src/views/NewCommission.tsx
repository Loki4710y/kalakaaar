"use client";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { notify } from "../lib/notify";

export function NewCommission() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    dimensions: "Medium (18x24 inches)",
    reference_note: ""
  });
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notify.error("Please login first");
      router.push("/auth?next=/commissions/new");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify.success("Custom order requested successfully!");
      router.push("/profile");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <main className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
         <h1 className="font-serif text-[2.5rem] text-[#2C1810] mb-2">Request Custom Order</h1>
         <p className="font-sans text-[1rem] text-[#7A5C4E] mb-8 pb-6 border-b border-[rgba(107,30,46,0.18)]">
            Commission a unique piece directly from an artist.
         </p>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Title / Subject</label>
               <input 
                 required type="text"
                 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                 placeholder="e.g. Portrait of my dog, Abstract sunset landscape"
               />
            </div>
            
            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Detailed Description</label>
               <textarea 
                 required rows={4}
                 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810] resize-none"
                 placeholder="Describe what you are looking for in detail..."
               />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                  <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Budget (₹)</label>
                  <input 
                    type="number"
                    value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                    placeholder="e.g. 5000"
                  />
               </div>
               <div>
                  <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Deadline</label>
                  <input 
                    type="date"
                    value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
               </div>
            </div>

            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Preferred Size</label>
               <select 
                 value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
               >
                  <option>Small (Up to 12x12 inches)</option>
                  <option>Medium (18x24 inches)</option>
                  <option>Large (24x36 inches)</option>
                  <option>Extra Large (Custom Wall Size)</option>
               </select>
            </div>

            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Reference Note</label>
               <textarea 
                 rows={2}
                 value={formData.reference_note} onChange={e => setFormData({...formData, reference_note: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810] resize-none"
                 placeholder="Any specific colors or themes to include..."
               />
            </div>

            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Reference Image (Optional)</label>
               <div className="border border-[rgba(107,30,46,0.25)] p-4 flex flex-col items-center justify-center relative bg-[#FDFBF7]">
                 <input type="file" id="reference-upload" accept="image/*" className="hidden" onChange={(e) => setReferenceFile(e.target.files?.[0] || null)} />
                 <label htmlFor="reference-upload" className="cursor-pointer px-6 py-2 border border-[rgba(107,30,46,0.18)] text-[#6B1E2E] hover:bg-[#6B1E2E]-pale transition-colors font-sans text-[0.75rem] uppercase tracking-[0.1em] font-medium flex items-center gap-2">
                   <Upload size={16} /> {referenceFile ? referenceFile.name : "Upload Image"}
                 </label>
               </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.85rem] uppercase tracking-wider font-semibold py-4 hover:bg-[#8A2B3E] transition-colors disabled:opacity-50">
               {loading ? 'Submitting...' : 'Send Request to Artist'}
            </button>
         </form>
      </main>
    </div>
  );
}
