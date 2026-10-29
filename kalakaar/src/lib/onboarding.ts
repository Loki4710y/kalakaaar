/**
 * The "complete your artist profile" checklist.
 * Every step except "share" is worked out from the real profile, so it can never drift out of sync:
 * the moment the artist saves a photo, bio and so on, the step ticks itself.
 */

export type OnboardingStepId = "photo" | "bio" | "style" | "contact" | "artwork" | "share";

export interface OnboardingInput {
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  primaryArtStyle?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  contactEmail?: string | null;
  artworkCount: number;
  shared: boolean;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  done: boolean;
  /** Where "Do it" goes. Null means the step is done in place (the share step copies the link). */
  href: string | null;
}

const has = (v?: string | null): boolean => typeof v === "string" && v.trim().length > 0;

/** The default avatar is a placeholder image, so it does not count as a real photo. */
const isRealPhoto = (url?: string | null): boolean => has(url) && !/\/assets\/defaults\//.test(url as string);

export function computeOnboarding(input: OnboardingInput): { steps: OnboardingStep[]; done: number; total: number; complete: boolean } {
  const steps: OnboardingStep[] = [
    { id: "photo", done: isRealPhoto(input.avatarUrl), href: "/profile" },
    { id: "bio", done: (input.bio || "").trim().length >= 20, href: "/profile" },
    { id: "style", done: has(input.primaryArtStyle) && has(input.location), href: "/profile" },
    { id: "contact", done: has(input.whatsapp) || has(input.instagram) || has(input.contactEmail), href: "/profile" },
    { id: "artwork", done: input.artworkCount > 0, href: "/artist-portal/upload" },
    { id: "share", done: input.shared, href: null },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, complete: done === steps.length };
}
