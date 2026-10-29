import { buildMetadata } from "@/src/lib/seoData";
import { StoryDetails } from "@/src/views/StoryDetails";
import { Metadata } from "next";
import { getPublicStory, getPublicFeaturedStories, NOT_FOUND } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { storyLd, breadcrumbLd } from "@/src/lib/jsonld";
import { getStoryAuthorName } from "@/src/lib/storyUtils";

// Cached by the CDN and refreshed at most every 5 minutes: shared links cost almost nothing.
export const revalidate = 300;

// Empty list = build nothing up front, but build each page on its first visit and then cache it.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  return buildMetadata("story", id, `/stories/${id}`, {
    title: "Story | Kalakaar",
    description: "Stories from traditional Indian artists.",
  });
}

export default async function StoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const found = await getPublicStory(id);
  // Drafts/archived items are invisible to the anonymous reader, so they cannot be told apart from missing ones:
  // render nothing server-side (the owner still sees them through the client view) and mark the page noindex.
  const story = found === NOT_FOUND ? null : found;
  const more = story ? await getPublicFeaturedStories(4) : [];
  return (
    <>
      {story && (
        <>
          <JsonLdScript data={storyLd(story, getStoryAuthorName(story))} />
          <JsonLdScript
            data={breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
              { name: story.title, path: `/stories/${story.id}` },
            ])}
          />
        </>
      )}
      <StoryDetails initialStory={story} initialMore={more} />
    </>
  );
}
