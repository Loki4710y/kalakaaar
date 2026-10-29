import { describe, it, expect } from "vitest";
import { clipText, isAllowedImageUrl, isCardId, isCardKind, parseLang, parseSize, shareCardPath } from "../src/lib/shareCard";

const SUPA = "https://abcd.supabase.co";

describe("share card helpers", () => {
  it("accepts only known kinds, uuids, sizes and languages", () => {
    expect(isCardKind("artwork")).toBe(true);
    expect(isCardKind("artist")).toBe(true);
    expect(isCardKind("story")).toBe(false);
    expect(isCardId("22222222-2222-4222-8222-000000000001")).toBe(true);
    expect(isCardId("../../etc/passwd")).toBe(false);
    expect(parseSize("story")).toBe("story");
    expect(parseSize("post")).toBe("post");
    expect(parseSize("huge")).toBe("og");
    expect(parseSize(null)).toBe("og");
    expect(parseLang("hi")).toBe("hi");
    expect(parseLang("fr")).toBe("en");
  });

  it("clips long text at a word and keeps short text as it is", () => {
    expect(clipText("  Madhubani   Fish ", 40)).toBe("Madhubani Fish");
    expect(clipText("A very long painting title about peacocks in the monsoon", 30)).toBe("A very long painting title…");
    expect(clipText(null, 10)).toBe("");
    expect(clipText("x".repeat(100), 10)).toHaveLength(10);
  });

  it("only downloads images from our own storage (or Google photos)", () => {
    expect(isAllowedImageUrl(`${SUPA}/storage/v1/object/public/artworks/a.webp`, SUPA, true)).toBe(true);
    expect(isAllowedImageUrl("https://lh3.googleusercontent.com/a/x", SUPA, true)).toBe(true);
    expect(isAllowedImageUrl("https://evil.example/a.webp", SUPA, true)).toBe(false);
    expect(isAllowedImageUrl("http://169.254.169.254/latest/meta-data", SUPA, true)).toBe(false);
    expect(isAllowedImageUrl(`${SUPA}.evil.com/a.webp`, SUPA, true)).toBe(false);
    expect(isAllowedImageUrl("https://user:pw@abcd.supabase.co/a.webp", SUPA, true)).toBe(false);
    expect(isAllowedImageUrl("not a url", SUPA, true)).toBe(false);
    expect(isAllowedImageUrl(null, SUPA, true)).toBe(false);
    expect(isAllowedImageUrl(`${SUPA}/a.webp`, undefined, true)).toBe(false);
  });

  it("allows plain http only for a local test backend outside production", () => {
    const local = "http://127.0.0.1:54999";
    expect(isAllowedImageUrl(`${local}/img/a.webp`, local, false)).toBe(true);
    expect(isAllowedImageUrl(`${local}/img/a.webp`, local, true)).toBe(false);
    expect(isAllowedImageUrl("http://abcd.supabase.co/a.webp", SUPA, false)).toBe(false);
  });

  it("builds card paths", () => {
    const id = "22222222-2222-4222-8222-000000000001";
    expect(shareCardPath("artwork", id)).toBe(`/api/share-card/artwork/${id}`);
    expect(shareCardPath("artist", id, "story", "hi")).toBe(`/api/share-card/artist/${id}?size=story&lang=hi`);
    expect(shareCardPath("artist", id, "og", "hi")).toBe(`/api/share-card/artist/${id}?lang=hi`);
  });
});

describe("card address changes with the photo", () => {
  it("gives a different address when the photo changes, and the same one when it does not", async () => {
    const { shareCardPath, versionOf } = await import("../src/lib/shareCard");
    const id = "11111111-1111-4111-8111-111111111111";
    const a = shareCardPath("artist", id, "og", "en", versionOf("https://x.supabase.co/a.webp"));
    const b = shareCardPath("artist", id, "og", "en", versionOf("https://x.supabase.co/b.webp"));
    const a2 = shareCardPath("artist", id, "og", "en", versionOf("https://x.supabase.co/a.webp"));
    expect(a).not.toBe(b);
    expect(a).toBe(a2);
    expect(a).toContain("v=");
    expect(shareCardPath("artist", id)).toBe(`/api/share-card/artist/${id}`); // no version: unchanged
    expect(versionOf(null)).toBe(versionOf(""));
  });
});
