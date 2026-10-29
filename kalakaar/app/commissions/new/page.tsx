import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { NewCommission } from "@/src/views/NewCommission";
import { FEATURES } from "@/src/config/features";

export default function NewCommissionPage() {
  if (!FEATURES.commissions) notFound();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewCommission />
    </Suspense>
  );
}
