import { StoriesExplore } from "@/src/views/StoriesExplore";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicStoriesPage, type StoriesParams } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { itemListLd, breadcrumbLd } from "@/src/lib/jsonld";
import { buildHref, pageParam, textParam, type RawParams } from "@/src/lib/listParams";

type Props = { searchParams: Promise<RawParams> };

function readParams(sp: RawParams): StoriesParams {
  return { page: pageParam(sp), category: textParam(sp, "category", 40) || "All", q: textParam(sp, "q", 60) };
}

const hrefOf = (p: Partial<StoriesParams>) =>
  buildHref("/stories", { category: p.category && p.category !== "All" ? p.category : undefined, page: p.page });

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = readParams(await searchParams);
  const searching = p.q !== "";
  const cat = p.category !== "All" ? p.category : "";
  const pageSuffix = p.page > 1 ? ` (Page ${p.page})` : "";
  const title = cat ? `${cat} Stories: Folk Art Heritage${pageSuffix} | Kalakaar` : `Folk Art Stories & Heritage Articles${pageSuffix} | Kalakaar`;
  const description = "Read stories, techniques and oral histories of Indian folk art, written by the artists and heritage storytellers who keep these traditions alive.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: searching ? "/stories" : hrefOf(p) },
    ...(searching ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: searching ? "/stories" : hrefOf(p) },
  };
}

export default async function StoriesPage({ searchParams }: Props) {
  const params = readParams(await searchParams);
  const data = await getPublicStoriesPage(params);

  if (data && data.items.length === 0 && data.total > 0 && params.page > data.totalPages) {
    redirect(buildHref("/stories", { category: params.category !== "All" ? params.category : undefined, q: params.q || undefined, page: data.totalPages }));
  }

  return (
    <>
      {data && data.items.length > 0 && (
        <JsonLdScript data={itemListLd("Stories on Kalakaar", data.items.map((s: any) => ({ name: s.title, path: `/stories/${s.id}` })))} />
      )}
      <JsonLdScript data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }])} />
      <StoriesExplore initial={data} params={params} />
    </>
  );
}
