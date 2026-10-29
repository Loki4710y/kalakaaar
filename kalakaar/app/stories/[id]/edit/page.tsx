import { Suspense } from "react";
import { CreateStory } from "@/src/views/CreateStory";

export const metadata = {
  title: "Edit Story | Kalakaar",
  description: "Edit your artisan story on Kalakaar.",
};

export default function EditStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] pt-24 text-center font-sans text-[#7A5C4E]">Loading...</div>}>
      <CreateStory />
    </Suspense>
  );
}
