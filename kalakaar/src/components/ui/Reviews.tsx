"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { GoldButton } from "./GoldButton";
import { Star } from "lucide-react";
import { ReviewService } from "../../../services/ReviewService";

export function Reviews({ artworkId, artistId }: { artworkId: string, artistId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      if (!artistId) return;
      setLoading(true);
      const res = await ReviewService.getReviews(artistId);
      if (res.success && res.data) {
        setReviews(res.data);
      }
      setLoading(false);
    }
    loadReviews();
  }, [artistId]);

  const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  const stats = { avg: avgRating, count: reviews.length };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const newReview = {
      id: `rev-${Date.now()}`,
      reviewer_name: user.name || 'Collector',
      rating,
      comment,
      created_at: new Date().toISOString()
    };

    setReviews([newReview, ...reviews]);
    setHasReviewed(true);
    setComment("");
    setSubmitting(false);
  };

  return (
    <div className="mt-16 border-t border-[#6B1E2E]/[0.09] pt-12">
      <h3 className="font-serif text-[2rem] font-semibold text-[#2C1810] mb-4">Reviews</h3>
      <div className="flex items-center gap-2 mb-10">
        {stats.count > 0 ? (
          <span className="font-sans text-[1.1rem] text-[#6B1E2E] font-medium flex items-center gap-1">
            {stats.avg} <Star className="fill-current w-5 h-5" /> ({stats.count} reviews)
          </span>
        ) : (
          <span className="font-sans text-[1rem] text-[#7A5C4E]">No reviews yet</span>
        )}
      </div>

      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} className="mb-12 bg-[#FFFDF7] p-6 border border-[rgba(107,30,46,0.18)]">
          <h4 className="font-serif text-[1.2rem] text-[#2C1810] mb-4">Write a Review</h4>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                onClick={() => setRating(star)}
                className={`w-6 h-6 cursor-pointer transition-colors ${rating >= star ? "text-[#6B1E2E] fill-current" : "text-[#7A5C4E] opacity-30"}`}
              />
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your thoughts on this artwork..."
            className="w-full p-4 mb-4 bg-[#FDFBF7] border border-[rgba(107,30,46,0.18)] font-sans text-[0.95rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] min-h-[100px]"
            required
          />
          <GoldButton variant="primary" disabled={submitting} type="submit">
            {submitting ? "Submitting..." : "Submit Review"}
          </GoldButton>
        </form>
      )}

      {user && hasReviewed && (
        <div className="mb-12 p-4 bg-[#EDE4CE]/50 border border-[#EDE4CE] text-center font-sans text-[#7A5C4E] text-[0.9rem]">
          You&apos;ve already reviewed this artwork.
        </div>
      )}

      {!user && (
        <div className="mb-12 p-4 bg-[#EDE4CE]/50 border border-[#EDE4CE] text-center font-sans text-[#7A5C4E] text-[0.9rem]">
          Please log in to write a review.
        </div>
      )}

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="text-center text-[#7A5C4E] py-4">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="pb-6 border-b border-[#6B1E2E]/[0.09] last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-serif text-[1.1rem] text-[#2C1810]">{review.reviewer_name || review.profiles?.full_name || 'Anonymous'}</p>
                  <p className="font-sans text-[0.7rem] text-[#9C7A6A] tracking-wider uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-0.5 text-[#6B1E2E]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "opacity-20"}`} />
                  ))}
                </div>
              </div>
              <p className="font-sans text-[0.95rem] text-[#7A5C4E] leading-relaxed mt-3">
                {review.comment}
              </p>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
