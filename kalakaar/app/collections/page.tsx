import { CollectionsExplore } from "@/src/views/CollectionsExplore";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicCollectionsPage, getPublicFeaturedCollections, type CollectionsParams } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { itemListLd, breadcrumbLd } from "@/src/lib/jsonld";
import { buildHref, pageParam, textParam, type RawParams } from "@/src/lib/listParams";

type Props = { searchParams: Promise<RawParams> };

function readParams(sp: RawParams): CollectionsParams {
  return { page: pageParam(sp), q: textParam(sp, "q", 60) };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = readParams(await searchParams);
  const searching = p.q !== "";
  const pageSuffix = p.page > 1 ? ` (Page ${p.page})` : "";
  const title = `Curated Indian Folk Art Collections${pageSuffix} | Kalakaar`;
  const description = "Explore themed collections of original Indian folk art: Madhubani motifs, Pattachitra scrolls, Warli village life and Gond nature paintings.";
  const canonical = searching ? "/collections" : buildHref("/collections", { page: p.page });
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(searching ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: canonical },
  };
}

export default async function Page({ searchParams }: Props) {
  const params = readParams(await searchParams);
  const [data, featured] = await Promise.all([
    getPublicCollectionsPage(params),
    params.page === 1 && !params.q ? getPublicFeaturedCollections(6) : Promise.resolve([]),
  ]);

  if (data && data.items.length === 0 && data.total > 0 && params.page > data.totalPages) {
    redirect(buildHref("/collections", { q: params.q || undefined, page: data.totalPages }));
  }

  return (
    <>
      {data && data.items.length > 0 && (
        <JsonLdScript data={itemListLd("Collections on Kalakaar", data.items.map((c: any) => ({ name: c.title, path: `/collections/${c.id}` })))} />
      )}
      <JsonLdScript data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }])} />
      <CollectionsExplore initial={data} featured={featured} params={params} />
    </>
  );
}
