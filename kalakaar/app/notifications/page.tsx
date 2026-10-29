import { notFound } from "next/navigation";
import { Notifications } from "@/src/views/Notifications";
import { FEATURES } from "@/src/config/features";

export const metadata = { title: "Notifications | Kalakaar", robots: { index: false, follow: false } };

export default function NotificationsPage() {
  if (!FEATURES.notifications) notFound();
  return <Notifications />;
}
