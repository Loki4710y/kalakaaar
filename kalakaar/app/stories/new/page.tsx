import { Suspense } from "react";
import { CreateStory } from "@/src/views/CreateStory";

export const metadata = {
  title: "Write a Story | Kalakaar",
  description: "Share your artistic journey and traditional techniques on Kalakaar.",
};

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] pt-24 text-center font-sans text-[#7A5C4E]">Loading...</div>}>
      <CreateStory />
    </Suspense>
  );
}
