import { describe, it, expect } from "vitest";
import { artworkLd, artistLd, storyLd, collectionLd, breadcrumbLd } from "../src/lib/jsonld";

const art = { id: "a1", title: "Fish", description: "d", image_urls: ["https://x/1.jpg", "http://insecure/2.jpg"], category: "Madhubani", price: 4500, is_sold: false, tags: ["fish"] };

describe("structured data", () => {
  it("builds a Product + VisualArtwork with an INR offer", () => {
    const j: any = artworkLd(art, "Sita");
    expect(j["@type"]).toEqual(["Product", "VisualArtwork"]);
    expect(j.offers.priceCurrency).toBe("INR");
    expect(j.offers.availability).toBe("https://schema.org/InStock");
    expect(j.creator.name).toBe("Sita");
  });
  it("only keeps https images", () => {
    expect((artworkLd(art) as any).image).toEqual(["https://x/1.jpg"]);
  });
  it("marks sold works as SoldOut and omits the offer when there is no price", () => {
    expect((artworkLd({ ...art, is_sold: true }) as any).offers.availability).toBe("https://schema.org/SoldOut");
    expect((artworkLd({ ...art, price: undefined }) as any).offers).toBeUndefined();
  });
  it("never emits undefined fields (JSON-safe)", () => {
    expect(JSON.stringify(artworkLd({ id: "x", title: "t" }))).not.toContain("undefined");
  });
  it("builds artist, story, collection and breadcrumb data", () => {
    expect((artistLd({ full_name: "Sita", bio: "b" }, "u1") as any).mainEntity.name).toBe("Sita");
    expect((storyLd({ id: "s", title: "T" }, "Sita") as any).author.name).toBe("Sita");
    expect((collectionLd({ id: "c", title: "C" }, [{ id: "a1", title: "Fish" }]) as any).mainEntity.numberOfItems).toBe(1);
    expect((breadcrumbLd([{ name: "Home", path: "/" }]) as any).itemListElement[0].position).toBe(1);
  });
});
