"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, Trash2, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { AdminService, AdminArtist } from "../../../../services/AdminService";
import { TablePagination } from "../TablePagination";
import { useAdminTable } from "../../../hooks/useAdminTable";

export function AdminArtistsView() {
  const {
    items: artists, setItems: setArtists, total, loading, error, reload,
    page: currentPage, setPage: setCurrentPage, pageSize, setPageSize,
    searchQuery, setSearchQuery, status: statusFilter, setStatus: setStatusFilter, filter: styleFilter, setFilter: setStyleFilter,
    sortField, sortAsc, handleSort, totalPages,
  } = useAdminTable<AdminArtist>(
    async (q) => {
      const res = await AdminService.getArtistsPage({ page: q.page, pageSize: q.pageSize, query: q.query, status: q.status, filter: q.filter, sortField: q.sortField, sortAsc: q.sortAsc });
      return res.success && res.data ? res.data : null;
    },
    { sortField: "full_name", sortAsc: true }
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // a different page / filter is a different set of rows, so clear any selection
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, pageSize, searchQuery, statusFilter, styleFilter, sortField, sortAsc]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(artists.map((a) => a.id));
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

  // Item Actions
  const handleToggleFeature = async (artist: AdminArtist) => {
    const nextState = !artist.is_featured;
    const res = await AdminService.featureArtist(artist.id, nextState);
    if (res.success) {
      setArtists((prev) =>
        prev.map((a) => (a.id === artist.id ? { ...a, is_featured: nextState } : a))
      );
      showFeedback(`Artist ${artist.full_name} is now ${nextState ? "Featured" : "Unfeatured"}.`);
    }
  };

  const handleToggleVerify = async (artist: AdminArtist) => {
    const next = !artist.is_verified;
    const res = await AdminService.verifyArtist(artist.id, next);
    if (res.success) {
      setArtists((prev) => prev.map((a) => (a.id === artist.id ? { ...a, is_verified: next } : a)));
      showFeedback(`${artist.full_name} is now ${next ? "Verified" : "Unverified"}.`);
    } else {
      showFeedback(res.error || "Could not update verification.");
    }
  };

  const handleToggleStatus = async (artist: AdminArtist) => {
    const nextStatus = artist.status === "active" ? "suspended" : "active";
    const res = await AdminService.toggleArtistStatus(artist.id, nextStatus);
    if (res.success) {
      setArtists((prev) =>
        prev.map((a) => (a.id === artist.id ? { ...a, status: nextStatus } : a))
      );
      showFeedback(`Artist ${artist.full_name} is now ${nextStatus}.`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete artist "${name}"?`)) return;
    const res = await AdminService.deleteArtist(id);
    if (res.success) {
      reload();
      setArtists((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showFeedback(`Artist "${name}" has been deleted.`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === "suspend") {
      for (const id of selectedIds) {
        await AdminService.toggleArtistStatus(id, "suspended");
      }
      setArtists((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: "suspended" } : a))
      );
      showFeedback(`Suspended ${selectedIds.length} artists.`);
    } else if (action === "activate") {
      for (const id of selectedIds) {
        await AdminService.toggleArtistStatus(id, "active");
      }
      setArtists((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: "active" } : a))
      );
      showFeedback(`Activated ${selectedIds.length} artists.`);
    } else if (action === "feature") {
      for (const id of selectedIds) {
        await AdminService.featureArtist(id, true);
      }
      setArtists((prev) =>
        prev.map((a) => (selectedIds.includes(a.id) ? { ...a, is_featured: true } : a))
      );
      showFeedback(`Featured ${selectedIds.length} artists.`);
    } else if (action === "delete") {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected artists?`)) return;
      for (const id of selectedIds) {
        await AdminService.deleteArtist(id);
      }
      reload();
      setArtists((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
      showFeedback(`Deleted ${selectedIds.length} artists.`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <UserCheck className="text-[#6B1E2E]" size={24} /> Master Artisans Management
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Audit, feature, activate, or suspend artisan profiles across traditional Indian art styles.
          </p>
        </div>

        {/* Feedback Alert */}
        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A5C4E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, style, or email..."
            className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.18)] focus:border-[#6B1E2E] focus:outline-none pl-9 pr-4 py-1.5 text-xs font-sans text-[#2C1810]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A5C4E]">
            <SlidersHorizontal size={14} className="text-[#6B1E2E]" /> Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-2 py-1"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A5C4E]">
            Folk Style:
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-2 py-1"
            >
              <option value="all">All Styles</option>
              <option value="Madhubani">Madhubani</option>
              <option value="Pattachitra">Pattachitra</option>
              <option value="Warli">Warli</option>
              <option value="Gond">Gond</option>
              <option value="Kalighat">Kalighat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xs overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center font-serif text-sm text-[#2C1810]">
            Loading artisan directory...
          </div>
        ) : artists.length === 0 ? (
          <div className="py-16 text-center text-xs font-sans text-[#7A5C4E]">
            {error || "No artists found matching your criteria."}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#EDE4CE] border-b border-[rgba(107,30,46,0.18)] text-[0.68rem] font-sans uppercase tracking-wider font-bold text-[#6B1E2E]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      artists.length > 0 &&
                      artists.every((a) => selectedIds.includes(a.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="accent-[#6B1E2E]"
                  />
                </th>
                <th className="p-3">Avatar</th>
                <th
                  onClick={() => handleSort("full_name")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Name <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3">Username / Email</th>
                <th
                  onClick={() => handleSort("followers_count")}
                  className="p-3 cursor-pointer hover:bg-[#E2D6BB] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Followers <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3">Artworks</th>
                <th className="p-3">Stories</th>
                <th className="p-3">Collections</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(107,30,46,0.08)] text-xs font-sans text-[#2C1810]">
              {artists.map((artist) => {
                const isSelected = selectedIds.includes(artist.id);

                return (
                  <tr
                    key={artist.id}
                    className={`hover:bg-[#F5EFE0]/60 transition-colors ${
                      isSelected ? "bg-[#EDE4CE]/50" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(artist.id, e.target.checked)}
                        className="accent-[#6B1E2E]"
                      />
                    </td>

                    {/* Avatar */}
                    <td className="p-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#6B1E2E]/30 shrink-0 bg-[#EDE4CE]">
                        <Image
                          src={artist.avatar_url || "/assets/defaults/avatar.svg"}
                          alt={artist.full_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>

                    {/* Name + Badge */}
                    <td className="p-3 font-serif font-semibold text-sm text-[#2C1810]">
                      <div className="flex items-center gap-1.5">
                        {artist.full_name}
                        {artist.is_featured && (
                          <span
                            title="Featured Master Artisan"
                            className="text-[#DAA520] font-sans text-[0.65rem] bg-[#2C1810] px-1.5 py-0.2 uppercase font-bold"
                          >
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-[0.68rem] text-[#7A5C4E] block font-normal">
                        {artist.art_style} • {artist.location}
                      </span>
                    </td>

                    {/* Username / Email */}
                    <td className="p-3 text-[#7A5C4E]">
                      <p className="font-semibold text-[#2C1810]">@{artist.username}</p>
                      <p className="text-[0.7rem]">{artist.email}</p>
                    </td>

                    {/* Counts */}
                    <td className="p-3 font-semibold">{artist.followers_count}</td>
                    <td className="p-3">{artist.artworks_count}</td>
                    <td className="p-3">{artist.stories_count}</td>
                    <td className="p-3">{artist.collections_count}</td>

                    {/* Status */}
                    <td className="p-3">
                      {artist.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[0.68rem] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.68rem] uppercase font-bold text-red-700 bg-red-100 px-2 py-0.5">
                          <XCircle size={10} /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="p-3 text-[#7A5C4E]">{artist.joined_date}</td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleVerify(artist)}
                          className={`p-1 text-[0.68rem] uppercase font-bold px-2 py-1 transition-colors ${
                            artist.is_verified
                              ? "bg-[#1D9BF0] text-white"
                              : "bg-[#EDE4CE] text-[#2C1810] hover:bg-[#1D9BF0] hover:text-white"
                          }`}
                          title={artist.is_verified ? "Remove verified badge" : "Mark as verified"}
                        >
                          <CheckCircle size={12} className="inline mr-1" />
                          {artist.is_verified ? "Verified" : "Verify"}
                        </button>
                        <button
                          onClick={() => handleToggleFeature(artist)}
                          className={`p-1 text-[0.68rem] uppercase font-bold px-2 py-1 transition-colors ${
                            artist.is_featured
                              ? "bg-[#2C1810] text-[#DAA520]"
                              : "bg-[#EDE4CE] text-[#2C1810] hover:bg-[#6B1E2E] hover:text-white"
                          }`}
                          title={artist.is_featured ? "Unfeature Artist" : "Feature Artist"}
                        >
                          <Sparkles size={12} className="inline mr-1" />
                          {artist.is_featured ? "Featured" : "Feature"}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(artist)}
                          className={`p-1 text-[0.68rem] uppercase font-bold px-2 py-1 transition-colors ${
                            artist.status === "active"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }`}
                          title={artist.status === "active" ? "Suspend Artist" : "Activate Artist"}
                        >
                          {artist.status === "active" ? "Suspend" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(artist.id, artist.full_name)}
                          className="p-1 text-red-700 hover:bg-red-100 p-1.5 transition-colors"
                          title="Delete Artist"
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

        {/* Pagination Footer */}
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
            { id: "suspend", label: "Suspend Selected" },
            { id: "activate", label: "Activate Selected" },
            { id: "delete", label: "Delete Selected", danger: true },
          ]}
        />
      </div>
    </div>
  );
}
