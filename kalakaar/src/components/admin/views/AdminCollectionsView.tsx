"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Layers, Search, SlidersHorizontal, ArrowUpDown, Sparkles, Archive, Trash2 } from "lucide-react";
import { AdminService, AdminCollection } from "../../../../services/AdminService";
import { TablePagination } from "../TablePagination";
import { useAdminTable } from "../../../hooks/useAdminTable";

export function AdminCollectionsView() {
  const {
    items: collections, setItems: setCollections, total, loading, error, reload,
    page: currentPage, setPage: setCurrentPage, pageSize, setPageSize,
    searchQuery, setSearchQuery, status: statusFilter, setStatus: setStatusFilter,
    sortField, sortAsc, handleSort, totalPages,
  } = useAdminTable<AdminCollection>(
    async (q) => {
      const res = await AdminService.getCollectionsPage({ page: q.page, pageSize: q.pageSize, query: q.query, status: q.status, sortField: q.sortField, sortAsc: q.sortAsc });
      return res.success && res.data ? res.data : null;
    },
    { sortField: "title", sortAsc: true }
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // a different page / filter is a different set of rows, so clear any selection
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, pageSize, searchQuery, statusFilter, sortField, sortAsc]);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleFeature = async (col: AdminCollection) => {
    const nextState = !col.is_featured;
    const res = await AdminService.featureCollection(col.id, nextState);
    if (res.success) {
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, is_featured: nextState } : c))
      );
      showFeedback(`Collection "${col.title}" is now ${nextState ? "Featured" : "Unfeatured"}.`);
    }
  };

  const handleToggleArchive = async (col: AdminCollection) => {
    const nextStatus = col.status === "archived" ? "active" : "archived";
    const res = await AdminService.setCollectionStatus(col.id, nextStatus);
    if (res.success) {
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, status: nextStatus } : c))
      );
      showFeedback(`Collection "${col.title}" set to ${nextStatus}.`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete collection "${title}"?`)) return;
    const res = await AdminService.deleteCollection(id);
    if (res.success) {
      reload();
      setCollections((prev) => prev.filter((c) => c.id !== id));
      showFeedback(`Collection "${title}" deleted.`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === "feature") {
      for (const id of selectedIds) {
        await AdminService.featureCollection(id, true);
      }
      setCollections((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, is_featured: true } : c))
      );
      showFeedback(`Featured ${selectedIds.length} collections.`);
    } else if (action === "archive") {
      for (const id of selectedIds) {
        await AdminService.setCollectionStatus(id, "archived");
      }
      setCollections((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: "archived" } : c))
      );
      showFeedback(`Archived ${selectedIds.length} collections.`);
    } else if (action === "delete") {
      if (!confirm(`Delete ${selectedIds.length} selected collections?`)) return;
      for (const id of selectedIds) {
        await AdminService.deleteCollection(id);
      }
      reload();
      setCollections((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      showFeedback(`Deleted ${selectedIds.length} collections.`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Layers className="text-[#6B1E2E]" size={24} /> Curated Collections
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Audit, feature, archive, and manage thematic folk art collections.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A5C4E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by collection title or artist..."
            className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.18)] focus:border-[#6B1E2E] focus:outline-none pl-9 pr-4 py-1.5 text-xs font-sans text-[#2C1810]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A5C4E]">
          <SlidersHorizontal size={14} className="text-[#6B1E2E]" /> Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-2 py-1"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xs overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center font-serif text-sm text-[#2C1810]">
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div className="py-16 text-center text-xs font-sans text-[#7A5C4E]">
            {error || "No collections found."}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#EDE4CE] border-b border-[rgba(107,30,46,0.18)] text-[0.68rem] font-sans uppercase tracking-wider font-bold text-[#6B1E2E]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      collections.length > 0 &&
                      collections.every((c) => selectedIds.includes(c.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(collections.map((c) => c.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="accent-[#6B1E2E]"
                  />
                </th>
                <th className="p-3">Cover</th>
                <th
                  onClick={() => handleSort("title")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Title <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3">Artisan</th>
                <th className="p-3">Artworks</th>
                <th className="p-3">Views</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(107,30,46,0.08)] text-xs font-sans text-[#2C1810]">
              {collections.map((col) => {
                const isSelected = selectedIds.includes(col.id);

                return (
                  <tr
                    key={col.id}
                    className={`hover:bg-[#F5EFE0]/60 transition-colors ${
                      isSelected ? "bg-[#EDE4CE]/50" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, col.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((i) => i !== col.id));
                          }
                        }}
                        className="accent-[#6B1E2E]"
                      />
                    </td>

                    <td className="p-3">
                      <div className="relative w-10 h-10 bg-[#EDE4CE] border border-[rgba(107,30,46,0.15)] shrink-0 overflow-hidden">
                        <Image
                          src={col.cover_url || "/assets/defaults/collection.svg"}
                          alt={col.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>

                    <td className="p-3 font-serif font-semibold text-sm text-[#2C1810]">
                      <div className="flex items-center gap-1.5">
                        {col.title}
                        {col.is_featured && (
                          <span className="text-[#DAA520] font-sans text-[0.65rem] bg-[#2C1810] px-1.5 py-0.2 uppercase font-bold">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-[#7A5C4E]">{col.artist_name}</td>
                    <td className="p-3 font-bold">{col.artwork_count} items</td>
                    <td className="p-3 text-[#7A5C4E]">{col.views_count}</td>

                    <td className="p-3">
                      {col.status === "active" ? (
                        <span className="text-[0.68rem] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5">
                          Active
                        </span>
                      ) : (
                        <span className="text-[0.68rem] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleFeature(col)}
                          className={`p-1 text-[0.68rem] uppercase font-bold px-2 py-1 transition-colors ${
                            col.is_featured
                              ? "bg-[#2C1810] text-[#DAA520]"
                              : "bg-[#EDE4CE] text-[#2C1810] hover:bg-[#6B1E2E] hover:text-white"
                          }`}
                        >
                          <Sparkles size={12} className="inline mr-1" />
                          {col.is_featured ? "Featured" : "Feature"}
                        </button>

                        <button
                          onClick={() => handleToggleArchive(col)}
                          className="p-1 text-[0.68rem] uppercase font-bold bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white px-2 py-1 transition-colors"
                        >
                          <Archive size={12} className="inline mr-1" />
                          {col.status === "archived" ? "Unarchive" : "Archive"}
                        </button>

                        <button
                          onClick={() => handleDelete(col.id, col.title)}
                          className="p-1 text-red-700 hover:bg-red-100 p-1.5 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          selectedCount={selectedIds.length}
          onBulkAction={handleBulkAction}
          bulkActions={[
            { id: "feature", label: "Feature Selected" },
            { id: "archive", label: "Archive Selected" },
            { id: "delete", label: "Delete Selected", danger: true },
          ]}
        />
      </div>
    </div>
  );
}
