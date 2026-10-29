import { UploadArtwork } from "@/src/views/UploadArtwork";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
        <p className="font-serif text-lg text-[#2C1810]">Loading Upload Studio...</p>
      </div>
    }>
      <UploadArtwork />
    </Suspense>
  );
}
