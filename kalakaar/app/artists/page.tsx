import { Artists } from "@/src/views/Artists";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicArtistsPage, type ArtistsParams } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { itemListLd, breadcrumbLd } from "@/src/lib/jsonld";
import { buildHref, pageParam, textParam, type RawParams } from "@/src/lib/listParams";

type Props = { searchParams: Promise<RawParams> };

function readParams(sp: RawParams): ArtistsParams {
  return { page: pageParam(sp), style: textParam(sp, "style", 30) || "ALL", q: textParam(sp, "q", 60) };
}

const hrefOf = (p: Partial<ArtistsParams>) =>
  buildHref("/artists", { style: p.style && p.style !== "ALL" ? p.style : undefined, page: p.page });

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = readParams(await searchParams);
  const searching = p.q !== "";
  const style = p.style !== "ALL" ? titleCase(p.style) : "";
  const pageSuffix = p.page > 1 ? ` (Page ${p.page})` : "";
  const title = style ? `${style} Artists in India${pageSuffix} | Kalakaar` : `Meet Indian Folk Artists & Painters${pageSuffix} | Kalakaar`;
  const description = style
    ? `Meet ${style} artists from across India. See their paintings, read their story and contact them directly on Kalakaar.`
    : "Meet the folk artists behind Madhubani, Warli, Pattachitra and Gond paintings. See their work, read their story and contact them directly.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: searching ? "/artists" : hrefOf(p) },
    ...(searching ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: searching ? "/artists" : hrefOf(p) },
  };
}

export default async function Page({ searchParams }: Props) {
  const params = readParams(await searchParams);
  const data = await getPublicArtistsPage(params);

  if (data && data.items.length === 0 && data.total > 0 && params.page > data.totalPages) {
    redirect(buildHref("/artists", { style: params.style !== "ALL" ? params.style : undefined, q: params.q || undefined, page: data.totalPages }));
  }

  return (
    <>
      {data && data.items.length > 0 && (
        <JsonLdScript data={itemListLd("Folk artists on Kalakaar", data.items.map((a: any) => ({ name: a.full_name || a.display_name || a.username || "Artist", path: `/artist/${a.id}` })))} />
      )}
      <JsonLdScript data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Artists", path: "/artists" }])} />
      <Artists initial={data} params={params} />
    </>
  );
}
