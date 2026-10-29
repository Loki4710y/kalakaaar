import { Wishlist } from "@/src/views/Wishlist";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Saved Heritage Masterworks | Kalakaar Wishlist",
  description: "View your personal saved collection of Indian folk paintings, artisan profiles, and heritage masterworks.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <Wishlist />;
}
