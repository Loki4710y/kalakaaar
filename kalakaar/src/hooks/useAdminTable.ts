"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AdminTableQuery {
  page: number;
  pageSize: number;
  query: string;
  status: string;
  filter: string;
  sortField: string;
  sortAsc: boolean;
}

/**
 * Drives an admin table whose paging, search, filters and sorting all happen in the database.
 * Typing in the search box waits 350ms; any change of filter/sort goes back to page 1.
 */
export function useAdminTable<T>(
  fetchPage: (q: AdminTableQuery) => Promise<{ items: T[]; total: number } | null>,
  initial: { sortField: string; sortAsc: boolean; pageSize?: number }
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initial.pageSize ?? 10);
  const [searchQuery, setSearchQueryState] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatusState] = useState("all");
  const [filter, setFilterState] = useState("all");
  const [sortField, setSortField] = useState(initial.sortField);
  const [sortAsc, setSortAsc] = useState(initial.sortAsc);
  const [reloadTick, setReloadTick] = useState(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    fetchRef.current({ page, pageSize, query: debounced, status, filter, sortField, sortAsc })
      .then((res) => {
        if (id !== reqId.current) return;
        if (res) {
          setItems(res.items);
          setTotal(res.total);
          setError(null);
          // the last row of the last page was removed: step back
          if (res.items.length === 0 && res.total > 0 && page > 1) setPage(Math.max(1, Math.ceil(res.total / pageSize)));
        } else {
          setError("Could not load this list. Please try again.");
        }
      })
      .catch(() => { if (id === reqId.current) setError("Could not load this list. Please try again."); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [page, pageSize, debounced, status, filter, sortField, sortAsc, reloadTick]);

  const setSearchQuery = useCallback((v: string) => { setSearchQueryState(v); setPage(1); }, []);
  const setStatus = useCallback((v: string) => { setStatusState(v); setPage(1); }, []);
  const setFilter = useCallback((v: string) => { setFilterState(v); setPage(1); }, []);
  const setPageSize = useCallback((v: number) => { setPageSizeState(v); setPage(1); }, []);
  const handleSort = useCallback((field: string) => {
    setPage(1);
    setSortField((cur) => {
      if (cur === field) { setSortAsc((a) => !a); return cur; }
      setSortAsc(true);
      return field;
    });
  }, []);
  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  return {
    items, setItems, total, setTotal, loading, error,
    page, setPage, pageSize, setPageSize,
    searchQuery, setSearchQuery, status, setStatus, filter, setFilter,
    sortField, sortAsc, handleSort, reload,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
