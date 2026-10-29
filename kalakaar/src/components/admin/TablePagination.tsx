"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectedCount?: number;
  onBulkAction?: (action: string) => void;
  bulkActions?: { id: string; label: string; danger?: boolean }[];
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedCount = 0,
  onBulkAction,
  bulkActions = [],
}: TablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-[#FFFDF7] px-4 py-3 border-t border-[rgba(107,30,46,0.18)] flex flex-wrap items-center justify-between gap-4 font-sans text-xs text-[#2C1810]">
      {/* Left: Bulk selection or info */}
      <div className="flex items-center gap-3">
        {selectedCount > 0 && onBulkAction && bulkActions.length > 0 ? (
          <div className="flex items-center gap-2 bg-[#EDE4CE] px-3 py-1 border border-[#6B1E2E]/30 animate-in fade-in">
            <span className="font-semibold text-[#6B1E2E]">
              {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
            </span>
            <span className="text-[#9C7A6A]">|</span>
            <div className="flex items-center gap-1">
              {bulkActions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => onBulkAction(act.id)}
                  className={`px-2 py-0.5 text-[0.7rem] uppercase font-bold tracking-wider transition-colors ${
                    act.danger
                      ? "bg-red-700 text-white hover:bg-red-800"
                      : "bg-[#6B1E2E] text-white hover:bg-[#802437]"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-[#7A5C4E]">
            Showing <strong className="text-[#2C1810]">{startItem}</strong> to{" "}
            <strong className="text-[#2C1810]">{endItem}</strong> of{" "}
            <strong className="text-[#2C1810]">{totalItems}</strong> entries
          </span>
        )}
      </div>

      {/* Right: Page Size & Navigation */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-[#7A5C4E]">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] px-2 py-1 focus:outline-none focus:border-[#6B1E2E] font-medium"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Prev / Next buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 border border-[rgba(107,30,46,0.2)] bg-[#F5EFE0] hover:bg-[#EDE4CE] disabled:opacity-40 disabled:hover:bg-[#F5EFE0] transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 font-semibold text-[#2C1810]">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 border border-[rgba(107,30,46,0.2)] bg-[#F5EFE0] hover:bg-[#EDE4CE] disabled:opacity-40 disabled:hover:bg-[#F5EFE0] transition-colors"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
