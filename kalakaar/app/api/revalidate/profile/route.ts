import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// One refresh per person every few seconds. Enough to stop button-mashing from repeatedly clearing the cache.
const lastRun = new Map<string, number>();
const MIN_GAP_MS = 5000;

/**
 * Called by the browser right after a signed-in person changes their name or photo.
 * It clears the saved (cached) copies of the pages that show that person, so the new photo appears on the
 * next visit instead of after the cache expires. It trusts nothing from the request: who you are comes from
 * your login, and the list of pages is fixed here.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const now = Date.now();
  if (now - (lastRun.get(user.id) ?? 0) < MIN_GAP_MS) return NextResponse.json({ ok: true, skipped: true });
  lastRun.set(user.id, now);
  if (lastRun.size > 5000) lastRun.clear(); // never grow without limit

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();

  revalidatePath("/");
  revalidatePath("/artists");
  revalidatePath("/explore");
  revalidatePath("/stories");
  revalidatePath("/collections");
  revalidatePath(`/artist/${user.id}`);
  if (profile?.username) revalidatePath(`/artists/${profile.username}`);
  // Every artwork, story and collection page shows its artist's photo.
  revalidatePath("/artwork/[id]", "page");
  revalidatePath("/stories/[id]", "page");
  revalidatePath("/collections/[id]", "page");

  return NextResponse.json({ ok: true });
}
