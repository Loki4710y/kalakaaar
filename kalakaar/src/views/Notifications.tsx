"use client";
import React from "react";
import { useStore } from "../contexts/StoreContext";
import { Check, Circle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "../components/ui/EmptyState";

export function Notifications() {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useStore();
  const router = useRouter();

  const handleNotificationClick = async (id: string, referenceId?: string, type?: string) => {
    await markNotificationAsRead(id);

    if (type === "featured_artwork" || type === "artwork_liked" || type === "artwork_saved") {
      if (referenceId) router.push(`/artwork/${referenceId}`);
      else router.push("/explore");
    } else if (type === "story_published" || type === "featured_story") {
      if (referenceId) router.push(`/stories/${referenceId}`);
      else router.push("/stories");
    } else if (type === "collection_published" || type === "featured_collection") {
      if (referenceId) router.push(`/collections/${referenceId}`);
      else router.push("/explore");
    } else if (type === "new_follower" || type === "new_review") {
      router.push("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[rgba(107,30,46,0.18)] pb-6 mb-8 gap-4">
          <div>
            <h1 className="font-serif text-[2.5rem] md:text-[3rem] text-[#2C1810] leading-none">
              Notifications
            </h1>
            <p className="font-sans text-sm text-[#7A5C4E] mt-2">
              Updates on followed artists, reviews, collections, and art interactions
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[#6B1E2E] font-sans text-[0.8rem] uppercase tracking-wider hover:underline flex items-center gap-1.5 font-medium"
              >
                <Check size={16} /> Mark all read
              </button>
              <button
                onClick={clearAllNotifications}
                className="text-[#9C7A6A] hover:text-[#D32F2F] font-sans text-[0.8rem] uppercase tracking-wider hover:underline flex items-center gap-1.5 font-medium"
              >
                <Trash2 size={16} /> Clear all
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            type="no_notifications"
            actionHref="/explore"
            actionLabel="Explore Folk Art"
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-4 p-5 md:p-6 border transition-colors ${
                  !notif.is_read
                    ? "bg-[#FFFDF7] border-[#6B1E2E]/40 shadow-xs"
                    : "bg-[#FDFBF7] border-[rgba(107,30,46,0.1)] opacity-85"
                }`}
              >
                <div
                  onClick={() => handleNotificationClick(notif.id, notif.reference_id, notif.type)}
                  className="flex gap-4 cursor-pointer flex-1"
                >
                  <div className="mt-1 shrink-0">
                    {!notif.is_read ? (
                      <div className="w-3 h-3 rounded-full bg-[#6B1E2E] mt-1" />
                    ) : (
                      <Circle size={12} className="text-[#9C7A6A] mt-1 opacity-50" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`font-sans text-[1rem] ${
                        !notif.is_read ? "text-[#6B1E2E] font-bold" : "text-[#2C1810]"
                      }`}
                    >
                      {notif.title || "Notification"}
                    </h3>
                    <p className="font-sans text-[0.92rem] text-[#7A5C4E] mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="font-sans text-[0.72rem] text-[#9C7A6A] mt-2 uppercase tracking-wider">
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="text-[#9C7A6A] hover:text-[#D32F2F] p-1 transition-colors"
                  title="Remove notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

