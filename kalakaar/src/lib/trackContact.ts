import { createClient } from "@/lib/supabase/client";

export type ContactChannel = "whatsapp" | "instagram" | "email";

/**
 * Records that a logged-in visitor tapped an artist's contact button.
 * Fire-and-forget: it must never block or break opening WhatsApp/Instagram/Email.
 * The database rejects anonymous, forged or excessive taps by itself.
 */
export function trackContact(artistId: string | undefined | null, channel: ContactChannel, artworkId?: string | null): void {
  if (!artistId) return;
  try {
    const supabase = createClient();
    void Promise.resolve(
      supabase.from("contact_clicks").insert({ artist_id: artistId, channel, artwork_id: artworkId || null })
    ).catch(() => {});
  } catch {
    /* ignore */
  }
}
