"use client";
import { useCallback, useRef, useState } from "react";

/**
 * "Load more" for lists that are paginated on the server. The first page comes from the server render;
 * each press of the button asks the database for the next page and appends it (skipping duplicates).
 */
export function useServerPages<T extends { id: string }>(initial: { items: T[]; total: number; page: number }) {
  const [items, setItems] = useState<T[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const pageRef = useRef(initial.page);
  const busy = useRef(false);

  const replace = useCallback((nextItems: T[], nextTotal: number, page = 1) => {
    setItems(nextItems);
    setTotal(nextTotal);
    pageRef.current = page;
  }, []);

  const loadMore = useCallback(async (fetchPage: (page: number) => Promise<{ items: T[]; total: number } | null>) => {
    if (busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    setFailed(false);
    const next = pageRef.current + 1;
    try {
      const res = await fetchPage(next);
      if (res) {
        setItems((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...res.items.filter((x) => !seen.has(x.id))];
        });
        setTotal(res.total);
        pageRef.current = next;
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, []);

  return { items, total, hasMore: items.length < total, loadMore, replace, loadingMore, failed };
}
