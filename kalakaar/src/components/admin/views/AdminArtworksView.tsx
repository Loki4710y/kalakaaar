"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Search, SlidersHorizontal, ArrowUpDown, Sparkles, Archive, Trash2, Eye, Heart } from "lucide-react";
import { AdminService, AdminArtwork } from "../../../../services/AdminService";
import { TablePagination } from "../TablePagination";
import { useAdminTable } from "../../../hooks/useAdminTable";

export function AdminArtworksView() {
  const {
    items: artworks, setItems: setArtworks, total, loading, error, reload,
    page: currentPage, setPage: setCurrentPage, pageSize, setPageSize,
    searchQuery, setSearchQuery, status: statusFilter, setStatus: setStatusFilter, filter: categoryFilter, setFilter: setCategoryFilter,
    sortField, sortAsc, handleSort, totalPages,
  } = useAdminTable<AdminArtwork>(
    async (q) => {
      const res = await AdminService.getArtworksPage({ page: q.page, pageSize: q.pageSize, query: q.query, status: q.status, filter: q.filter, sortField: q.sortField, sortAsc: q.sortAsc });
      return res.success && res.data ? res.data : null;
    },
    { sortField: "title", sortAsc: true }
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // a different page / filter is a different set of rows, so clear any selection
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, pageSize, searchQuery, statusFilter, categoryFilter, sortField, sortAsc]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(artworks.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleFeature = async (art: AdminArtwork) => {
    const nextState = !art.is_featured;
    const res = await AdminService.featureArtwork(art.id, nextState);
    if (res.success) {
      setArtworks((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, is_featured: nextState } : a))
      );
      showFeedback(`Artwork "${art.title}" is now ${nextState ? "Featured" : "Unfeatured"}.`);
    }
  };

  const handleToggleArchive = async (art: AdminArtwork) => {
    const nextStatus = art.status === "archived" ? "available" : "archived";
    const res = await AdminService.setArtworkStatus(art.id, nextStatus);
    if (res.success) {
      setArtworks((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, status: nextStatus } : a))
      );
      showFeedback(`Artwork "${art.title}" status changed to ${nextStatus}.`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete artwork "${title}"?`)) return;
    const res = await AdminService.deleteArtwork(id);
    if (res.success) {
      reload();
      setArtworks((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showFeedback(`Artwork "${title}" deleted.`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === "feature") {
      for (const id of selectedIds) {
        await AdminService.featureArtwork(id, true);
      }
      setArtworks((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, is_featured: true } : a))
      );
      showFeedback(`Featured ${selectedIds.length} artworks.`);
    } else if (action === "archive") {
      for (const id of selectedIds) {
        await AdminService.setArtworkStatus(id, "archived");
      }
      setArtworks((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: "archived" } : a))
      );
      showFeedback(`Archived ${selectedIds.length} artworks.`);
    } else if (action === "delete") {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected artworks?`)) return;
      for (const id of selectedIds) {
        await AdminService.deleteArtwork(id);
      }
      reload();
      setArtworks((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
      showFeedback(`Deleted ${selectedIds.length} artworks.`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <ImageIcon className="text-[#6B1E2E]" size={24} /> Traditional Artwork Management
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Audit, feature, price check, archive, or remove masterwork inventory items.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A5C4E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, artist, or style category..."
            className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.18)] focus:border-[#6B1E2E] focus:outline-none pl-9 pr-4 py-1.5 text-xs font-sans text-[#2C1810]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A5C4E]">
            <SlidersHorizontal size={14} className="text-[#6B1E2E]" /> Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-2 py-1"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A5C4E]">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="Madhubani">Madhubani</option>
              <option value="Pattachitra">Pattachitra</option>
              <option value="Warli">Warli</option>
              <option value="Gond">Gond</option>
              <option value="Kalighat">Kalighat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xs overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center font-serif text-sm text-[#2C1810]">
            Loading artwork repository...
          </div>
        ) : artworks.length === 0 ? (
          <div className="py-16 text-center text-xs font-sans text-[#7A5C4E]">
            {error || "No artworks found."}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#EDE4CE] border-b border-[rgba(107,30,46,0.18)] text-[0.68rem] font-sans uppercase tracking-wider font-bold text-[#6B1E2E]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      artworks.length > 0 &&
                      artworks.every((a) => selectedIds.includes(a.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="accent-[#6B1E2E]"
                  />
                </th>
                <th className="p-3">Thumbnail</th>
                <th
                  onClick={() => handleSort("title")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Title <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3">Artist</th>
                <th className="p-3">Category</th>
                <th
                  onClick={() => handleSort("price")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Price <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("views_count")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Views <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3">Likes</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(107,30,46,0.08)] text-xs font-sans text-[#2C1810]">
              {artworks.map((art) => {
                const isSelected = selectedIds.includes(art.id);

                return (
                  <tr
                    key={art.id}
                    className={`hover:bg-[#F5EFE0]/60 transition-colors ${
                      isSelected ? "bg-[#EDE4CE]/50" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(art.id, e.target.checked)}
                        className="accent-[#6B1E2E]"
                      />
                    </td>

                    <td className="p-3">
                      <div className="relative w-10 h-10 bg-[#EDE4CE] border border-[rgba(107,30,46,0.15)] shrink-0 overflow-hidden">
                        <Image
                          src={art.thumbnail_url || "/assets/defaults/artwork.svg"}
                          alt={art.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>

                    <td className="p-3 font-serif font-semibold text-sm text-[#2C1810]">
                      <div className="flex items-center gap-1.5">
                        {art.title}
                        {art.is_featured && (
                          <span className="text-[#DAA520] font-sans text-[0.65rem] bg-[#2C1810] px-1.5 py-0.2 uppercase font-bold">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 font-medium text-[#7A5C4E]">{art.artist_name}</td>
                    <td className="p-3">{art.category}</td>
                    <td className="p-3 font-bold text-[#6B1E2E]">₹{art.price.toLocaleString("en-IN")}</td>
                    <td className="p-3 font-medium flex items-center gap-1">
                      <Eye size={12} className="text-[#9C7A6A]" /> {art.views_count}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-[#6B1E2E] font-medium">
                        <Heart size={12} /> {art.likes_count}
                      </span>
                    </td>

                    <td className="p-3">
                      {art.status === "available" && (
                        <span className="text-[0.68rem] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5">
                          Available
                        </span>
                      )}
                      {art.status === "sold" && (
                        <span className="text-[0.68rem] uppercase font-bold text-[#6B1E2E] bg-[#EDE4CE] px-2 py-0.5">
                          Sold
                        </span>
                      )}
                      {art.status === "archived" && (
                        <span className="text-[0.68rem] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-[#7A5C4E]">{art.created_at}</td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleFeature(art)}
                          className={`p-1 text-[0.68rem] uppercase font-bold px-2 py-1 transition-colors ${
                            art.is_featured
                              ? "bg-[#2C1810] text-[#DAA520]"
                              : "bg-[#EDE4CE] text-[#2C1810] hover:bg-[#6B1E2E] hover:text-white"
                          }`}
                          title={art.is_featured ? "Unfeature Artwork" : "Feature Artwork"}
                        >
                          <Sparkles size={12} className="inline mr-1" />
                          {art.is_featured ? "Featured" : "Feature"}
                        </button>

                        <button
                          onClick={() => handleToggleArchive(art)}
                          className="p-1 text-[0.68rem] uppercase font-bold bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white px-2 py-1 transition-colors"
                          title="Archive Artwork"
                        >
                          <Archive size={12} className="inline mr-1" />
                          {art.status === "archived" ? "Unarchive" : "Archive"}
                        </button>

                        <button
                          onClick={() => handleDelete(art.id, art.title)}
                          className="p-1 text-red-700 hover:bg-red-100 p-1.5 transition-colors"
                          title="Delete Artwork"
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
