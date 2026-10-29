import { ProfileService } from "../../services/ProfileService";

/** Asks the server to drop its cached copies of the pages that show this person (best effort, never throws). */
export async function refreshPublicPages(): Promise<void> {
  try {
    await fetch("/api/revalidate/profile", { method: "POST", credentials: "same-origin" });
  } catch {
    /* the pages will refresh by themselves within a few minutes */
  }
}

/**
 * Saves a new profile photo straight away and makes it show up everywhere:
 * the database, the signed-in screens (navbar etc.) and the public pages.
 */
export async function saveAvatarEverywhere(
  userId: string,
  url: string,
  refreshUser: () => Promise<void>
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await ProfileService.updateProfile(userId, { avatar_url: url });
  if (error) return { ok: false, error: error.message };
  // The data layer drops addresses it does not accept. Make sure the photo really was saved before saying so.
  if ((data?.avatar_url || "") !== url) return { ok: false, error: "The photo could not be saved." };
  await refreshUser();
  void refreshPublicPages();
  return { ok: true };
}
