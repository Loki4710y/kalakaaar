/**
 * Builders for schema.org structured data (JSON-LD). Only real, visible page facts go in:
 * no invented ratings, reviews or prices. Fields that are missing are simply left out.
 */
import { SITE_URL } from "./site";

const abs = (u?: string | null) => (u ? (u.startsWith("http") ? u : `${SITE_URL}${u}`) : undefined);
const clean = <T extends Record<string, any>>(o: T): T => JSON.parse(JSON.stringify(o)); // drops undefined

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function artworkLd(a: any, artistName?: string) {
  const images = (a.image_urls || []).filter((u: string) => /^https:\/\//i.test(u));
  const sold = a.is_sold === true;
  return clean({
    "@context": "https://schema.org",
    "@type": ["Product", "VisualArtwork"],
    name: a.title,
    description: a.description || undefined,
    image: images.length ? images : undefined,
    url: `${SITE_URL}/artwork/${a.id}`,
    sku: a.id,
    category: a.category || undefined,
    artform: a.category || undefined,
    artMedium: a.medium || undefined,
    material: a.materials || undefined,
    dateCreated: a.creation_year ? String(a.creation_year) : undefined,
    keywords: a.tags?.length ? a.tags.join(", ") : undefined,
    creator: artistName ? { "@type": "Person", name: artistName } : undefined,
    offers:
      typeof a.price === "number" && a.price > 0
        ? {
            "@type": "Offer",
            url: `${SITE_URL}/artwork/${a.id}`,
            price: a.price,
            priceCurrency: "INR",
            availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          }
        : undefined,
  });
}

export function artistLd(p: any, id: string) {
  return clean({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: p.full_name || p.display_name,
      description: p.bio || undefined,
      image: /^https:\/\//i.test(p.avatar_url || "") ? p.avatar_url : undefined,
      jobTitle: "Folk Artist",
      knowsAbout: p.primary_art_style ? [p.primary_art_style, "Indian Folk Art"] : ["Indian Folk Art"],
      homeLocation: p.location ? { "@type": "Place", name: p.location } : undefined,
      url: `${SITE_URL}/artist/${id}`,
    },
  });
}

export function storyLd(s: any, authorName?: string) {
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: s.title,
    description: s.excerpt || undefined,
    image: /^https:\/\//i.test(s.cover_image_url || "") ? [s.cover_image_url] : undefined,
    author: { "@type": "Person", name: authorName || "Kalakaar artist" },
    publisher: { "@type": "Organization", name: "Kalakaar", url: SITE_URL },
    datePublished: s.published_at || s.created_at || undefined,
    dateModified: s.updated_at || s.published_at || undefined,
    mainEntityOfPage: `${SITE_URL}/stories/${s.id}`,
  });
}

export function collectionLd(c: any, items: { id: string; title: string }[]) {
  return clean({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.title,
    description: c.description || undefined,
    url: `${SITE_URL}/collections/${c.id}`,
    image: /^https:\/\//i.test(c.cover_image_url || "") ? c.cover_image_url : undefined,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/artwork/${it.id}`,
        name: it.title,
      })),
    },
  });
}

export function itemListLd(name: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${it.path}`, name: it.name })),
  };
}

export { abs };
