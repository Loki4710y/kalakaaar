import { ListSkeleton } from "@/src/components/ui/PageSkeletons";

// Shown instantly while the list is fetched on the server.
export default function Loading() {
  return <ListSkeleton />;
}
