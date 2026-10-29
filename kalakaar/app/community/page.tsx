import React from "react";
import { Community } from "@/src/views/Community";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Folk Art Community | Kalakaar" },
  alternates: { canonical: "/community" },
  description: "Join discussions with Indian folk artists, art lovers and collectors on Kalakaar.",
};

export default function CommunityPage() {
  return <Community />;
}
