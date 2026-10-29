import { Suspense } from "react";
import { ResetPassword } from "@/src/views/ResetPassword";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
          <p className="font-serif text-lg text-[#2C1810]">Loading Reset Password...</p>
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
