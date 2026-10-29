import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createAnonClient } from "@/lib/supabase/anon";
import { SITE_URL } from "@/src/lib/site";
import {
  CARD_SIZES, clipText, isAllowedImageUrl, isCardId, isCardKind, parseLang, parseSize,
  type CardLang, type CardSize,
} from "@/src/lib/shareCard";

// Needs Node (fonts from disk, sharp for image conversion).
export const runtime = "nodejs";

const BURGUNDY = "#6B1E2E";
const CREAM = "#F5EFE0";
const SURFACE = "#FFFDF7";
const INK = "#2C1810";
const MUTED = "#7A5C4E";
const GOLD = "#E8C99A";

const TEXT: Record<CardLang, { tagline: string; by: string; artist: string; cta: string }> = {
  en: { tagline: "Discover original Indian folk art", by: "by", artist: "Folk artist", cta: "View on" },
  hi: { tagline: "भारत की मौलिक लोक कला खोजें", by: "कलाकार:", artist: "लोक कलाकार", cta: "देखें:" },
};

let fontCache: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" }[]> | null = null;
function loadFonts() {
  if (!fontCache) {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const f = (file: string) => readFile(path.join(dir, file));
    fontCache = Promise.all([
      f("playfair-display-latin-700-normal.woff"),
      f("crimson-pro-latin-400-normal.woff"),
      f("crimson-pro-latin-600-normal.woff"),
      f("noto-sans-devanagari-devanagari-400-normal.woff"),
      f("noto-sans-devanagari-devanagari-700-normal.woff"),
    ]).then(([pf700, cr400, cr600, nd400, nd700]) => [
      { name: "Playfair", data: pf700, weight: 700 as const, style: "normal" as const },
      { name: "Crimson", data: cr400, weight: 400 as const, style: "normal" as const },
      { name: "Crimson", data: cr600, weight: 600 as const, style: "normal" as const },
      { name: "Deva", data: nd400, weight: 400 as const, style: "normal" as const },
      { name: "Deva", data: nd700, weight: 700 as const, style: "normal" as const },
    ]);
    fontCache.catch(() => { fontCache = null; });
  }
  return fontCache;
}

/** Downloads an image from our own storage, crops it to the frame and returns it as a small JPEG data URL. */
async function loadPhoto(url: string | null | undefined, w: number, h: number): Promise<string | null> {
  if (!isAllowedImageUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NODE_ENV === "production")) return null;
  try {
    const res = await fetch(url as string, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 10_000_000) return null;
    const out = await sharp(buf).rotate().resize(w, h, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

/** A repeating Madhubani-style diamond-and-dot border band. */
function Band({ count, size = 22 }: { count: number; size?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke={BURGUNDY} strokeWidth="2" />
          <circle cx="12" cy="12" r="2.6" fill={i % 2 === 0 ? BURGUNDY : GOLD} />
        </svg>
      ))}
    </div>
  );
}

/** Photo size per card. Artist photos are square so the round frame is a true circle. */
function photoSize(kind: "artwork" | "artist", size: CardSize): { w: number; h: number } {
  if (size === "og") return kind === "artist" ? { w: 450, h: 450 } : { w: 430, h: 470 };
  if (size === "post") return kind === "artist" ? { w: 600, h: 600 } : { w: 840, h: 720 };
  return kind === "artist" ? { w: 840, h: 840 } : { w: 840, h: 1000 };
}

interface CardData {
  kind: "artwork" | "artist";
  title: string;
  line1: string; // artist name for artworks, art style / location for artists
  line2: string;
  photo: string | null;
  lang: CardLang;
}

function Wordmark({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 * scale }}>
      <svg width={34 * scale} height={34 * scale} viewBox="0 0 24 24">
        <path d="M12 2 L22 12 L12 22 L2 12 Z" fill={BURGUNDY} />
        <circle cx="12" cy="12" r="3.2" fill={GOLD} />
      </svg>
      <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 700, fontSize: 38 * scale, color: BURGUNDY, letterSpacing: 1 }}>Kalakaar</div>
    </div>
  );
}

function PhotoFrame({ photo, width, height, round }: { photo: string | null; width: number; height: number; round?: boolean }) {
  return (
    <div style={{ display: "flex", padding: 10, background: SURFACE, border: `3px solid ${BURGUNDY}`, borderRadius: round ? 9999 : 0 }}>
      <div style={{ display: "flex", width, height, background: "#EDE4CE", borderRadius: round ? 9999 : 0, overflow: "hidden", border: `2px solid ${GOLD}` }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={width} height={height} alt="" style={{ width, height, objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", width, height, alignItems: "center", justifyContent: "center", color: BURGUNDY, fontFamily: "Playfair", fontSize: Math.round(width / 3) }}>
            ❖
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ d, size }: { d: CardData; size: CardSize }) {
  const { width, height } = CARD_SIZES[size];
  const T = TEXT[d.lang];
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const isArtist = d.kind === "artist";
  const family = "Playfair, Deva";
  const body = "Crimson, Deva";

  if (size === "og") {
    const { w: imgW, h: imgH } = photoSize(d.kind, "og");
    return (
      <div style={{ display: "flex", width, height, background: CREAM, padding: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `6px solid ${BURGUNDY}`, padding: 14, background: CREAM }}>
          <div style={{ display: "flex", flex: 1, border: `2px solid ${GOLD}`, padding: "26px 34px", alignItems: "center", gap: 40 }}>
            <PhotoFrame photo={d.photo} width={imgW} height={imgH} round={isArtist} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: imgH + 26, justifyContent: "space-between" }}>
              <Wordmark scale={0.9} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                {isArtist && <div style={{ display: "flex", fontFamily: body, fontWeight: 600, fontSize: 24, color: MUTED, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{T.artist}</div>}
                <div style={{ display: "flex", fontFamily: family, fontWeight: 700, fontSize: d.title.length > 34 ? 46 : 56, color: INK, lineHeight: 1.12 }}>{d.title}</div>
                <div style={{ display: "flex", fontFamily: body, fontSize: 30, color: MUTED, marginTop: 16 }}>
                  {isArtist ? d.line1 : `${T.by} ${d.line1}`}
                </div>
                {d.line2 && <div style={{ display: "flex", fontFamily: body, fontSize: 24, color: BURGUNDY, marginTop: 6 }}>{d.line2}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Band count={14} size={20} />
                <div style={{ display: "flex", fontFamily: body, fontWeight: 600, fontSize: 24, color: BURGUNDY, marginTop: 10 }}>{T.cta} {host}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vertical cards: Instagram post (4:5) and story (9:16).
  const story = size === "story";
  const { w: imgW, h: imgH } = photoSize(d.kind, size);
  const titleSize = d.title.length > 30 ? (story ? 62 : 54) : story ? 76 : 66;
  return (
    <div style={{ display: "flex", width, height, background: CREAM, padding: story ? 34 : 28 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `8px solid ${BURGUNDY}`, padding: 16, background: CREAM }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `2px solid ${GOLD}`, padding: story ? "70px 56px 56px" : "44px 56px 40px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <Wordmark scale={story ? 1.25 : 1.05} />
            <div style={{ display: "flex", width: "100%", marginTop: story ? 34 : 22 }}><Band count={story ? 30 : 30} size={26} /></div>
          </div>

          <PhotoFrame photo={d.photo} width={imgW} height={imgH} round={isArtist} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
            {isArtist && <div style={{ display: "flex", fontFamily: body, fontWeight: 600, fontSize: 28, color: MUTED, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>{T.artist}</div>}
            <div style={{ display: "flex", justifyContent: "center", fontFamily: family, fontWeight: 700, fontSize: titleSize, color: INK, lineHeight: 1.12 }}>{d.title}</div>
            <div style={{ display: "flex", fontFamily: body, fontSize: story ? 40 : 36, color: MUTED, marginTop: 16 }}>
              {isArtist ? d.line1 : `${T.by} ${d.line1}`}
            </div>
            {d.line2 && <div style={{ display: "flex", fontFamily: body, fontSize: story ? 32 : 30, color: BURGUNDY, marginTop: 8 }}>{d.line2}</div>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <Band count={30} size={26} />
            <div style={{ display: "flex", fontFamily: body, fontSize: story ? 32 : 28, color: MUTED, marginTop: 16 }}>{T.tagline}</div>
            <div style={{ display: "flex", fontFamily: body, fontWeight: 600, fontSize: story ? 38 : 34, color: BURGUNDY, marginTop: 6 }}>{host}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NOT_FOUND = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });

export async function GET(req: Request, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await ctx.params;
  if (!isCardKind(kind) || !isCardId(id)) return NOT_FOUND();

  const url = new URL(req.url);
  const size = parseSize(url.searchParams.get("size"));
  const lang = parseLang(url.searchParams.get("lang"));
  const { width, height } = CARD_SIZES[size];

  try {
    const supabase = createAnonClient();
    let data: CardData;
    // Row Level Security means the anonymous client only ever sees published, public rows.
    if (kind === "artwork") {
      const { data: row } = await supabase
        .from("artworks")
        .select("id, title, category, image_urls, cover_image_index, profiles:artist_id(display_name)")
        .eq("id", id)
        .maybeSingle();
      if (!row) return NOT_FOUND();
      const r: any = row;
      const cover = r.image_urls?.[r.cover_image_index || 0] || r.image_urls?.[0];
      data = {
        kind,
        title: clipText(r.title, 64) || "Untitled",
        line1: clipText(r.profiles?.display_name, 40) || "Kalakaar",
        line2: clipText(r.category, 40),
        photo: await loadPhoto(cover, photoSize("artwork", size).w, photoSize("artwork", size).h),
        lang,
      };
    } else {
      const { data: row } = await supabase
        .from("profiles")
        .select("id, display_name, primary_art_style, location, avatar_url, role")
        .eq("id", id)
        .eq("role", "artist")
        .maybeSingle();
      if (!row) return NOT_FOUND();
      const r: any = row;
      data = {
        kind,
        title: clipText(r.display_name, 44) || "Kalakaar artist",
        line1: clipText(r.primary_art_style, 40) || TEXT[lang].artist,
        line2: clipText(r.location, 40),
        photo: await loadPhoto(r.avatar_url, photoSize("artist", size).w, photoSize("artist", size).h),
        lang,
      };
    }

    const png = new ImageResponse(<Card d={data} size={size} />, { width, height, fonts: await loadFonts() });
    const raw = Buffer.from(await png.arrayBuffer());
    // JPEG keeps link previews small (WhatsApp ignores big preview images).
    let body: Buffer = raw;
    let type = "image/png";
    try {
      body = await sharp(raw).flatten({ background: CREAM }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
      type = "image/jpeg";
    } catch {
      /* keep the PNG */
    }
    const download = url.searchParams.get("download") === "1";
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        ...(download ? { "Content-Disposition": `attachment; filename="kalakaar-${kind}-${size}.${type === "image/jpeg" ? "jpg" : "png"}"` } : {}),
      },
    });
  } catch (err) {
    console.error("[share-card]", err);
    return new Response("Could not create the card", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
