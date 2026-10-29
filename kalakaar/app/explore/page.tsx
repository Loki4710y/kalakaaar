import { Explore } from "@/src/views/Explore";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicExplorePage, type ExploreParams } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { itemListLd, breadcrumbLd } from "@/src/lib/jsonld";
import { buildHref, choiceParam, pageParam, textParam, type RawParams } from "@/src/lib/listParams";

type Props = { searchParams: Promise<RawParams> };

const SORTS = ["featured", "newest", "price_asc", "price_desc"] as const;

function readParams(sp: RawParams): ExploreParams {
  return {
    page: pageParam(sp),
    category: textParam(sp, "category", 40) || "ALL",
    sort: choiceParam(sp, "sort", SORTS, "featured"),
    q: textParam(sp, "q", 60),
  };
}

const hrefOf = (p: Partial<ExploreParams>) =>
  buildHref("/explore", { category: p.category && p.category !== "ALL" ? p.category : undefined, page: p.page });

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = readParams(await searchParams);
  const filtered = p.q !== "" || p.sort !== "featured"; // search/sort variants are not worth indexing
  const cat = p.category !== "ALL" ? p.category : "";
  const pageSuffix = p.page > 1 ? ` (Page ${p.page})` : "";
  const title = cat
    ? `${cat} Paintings: Original Handmade Folk Art${pageSuffix} | Kalakaar`
    : `Indian Folk Paintings: Madhubani, Warli, Gond${pageSuffix} | Kalakaar`;
  const description = cat
    ? `Browse original handmade ${cat} paintings by Indian folk artists. See each artwork, meet the artist and contact them directly on Kalakaar.`
    : "Browse original handmade Indian folk paintings: Madhubani, Pattachitra, Warli, Gond and more. Filter by art style and price, then contact the artist directly.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: filtered ? "/explore" : hrefOf(p) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: filtered ? "/explore" : hrefOf(p) },
  };
}

export default async function Page({ searchParams }: Props) {
  const params = readParams(await searchParams);
  const data = await getPublicExplorePage(params);

  // A page number past the end (for example after artworks were removed) goes to the last real page.
  if (data && data.items.length === 0 && data.total > 0 && params.page > data.totalPages) {
    redirect(buildHref("/explore", { category: params.category !== "ALL" ? params.category : undefined, sort: params.sort !== "featured" ? params.sort : undefined, q: params.q || undefined, page: data.totalPages }));
  }

  return (
    <>
      {data && data.items.length > 0 && (
        <JsonLdScript data={itemListLd("Indian folk paintings on Kalakaar", data.items.map((a) => ({ name: a.title, path: `/artwork/${a.id}` })))} />
      )}
      <JsonLdScript data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Explore", path: "/explore" }])} />
      <Explore initial={data} params={params} />
    </>
  );
}
