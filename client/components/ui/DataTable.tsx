"use client";

import React from "react";

export interface Column<T> {
    header: string;
    key: string;
    width?: string;
    align?: "left" | "center" | "right";
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
    emptyMessage?: string;
    filters?: React.ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    searchQuery,
    onSearchChange,
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
    emptyMessage = "ไม่พบข้อมูล",
    filters,
}: DataTableProps<T>) {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] overflow-hidden">
            {/* Filters & Search Bar */}
            <div className="px-6 py-4 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                    {filters}
                </div>

                {onSearchChange !== undefined && (
                    <div className="flex-1 max-w-md relative mx-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl shadow-[0px_2px_8px_rgba(27,28,28,0.04)] border-none text-sm font-medium text-on-surface focus:ring-2 focus:ring-[#B90A1E]/20 transition-all outline-none"
                        />
                    </div>
                )}

                <div className="text-[14px] font-bold uppercase tracking-widest text-[#1B1C1C]">
                    แสดงผล {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-surface-container-low/40 border-b border-surface-container/30">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    style={{ width: col.width }}
                                    className={`px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                                        }`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-surface-container/30">
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={`px-6 py-4 ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                                                }`}
                                        >
                                            {col.render ? col.render(item) : (item as any)[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
                <div className="px-6 py-3 bg-surface-container-low/30 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`text-xs font-bold flex items-center gap-1 transition-all ${currentPage === 1 ? "text-secondary opacity-50 cursor-not-allowed" : "text-secondary hover:text-[#B90A1E] cursor-pointer"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span> ย้อนกลับ
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${currentPage === page
                                    ? "bg-[#B90A1E] text-white shadow-md shadow-red-900/10"
                                    : "hover:bg-surface-container-high text-on-surface"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`text-xs font-bold flex items-center gap-1 transition-all ${currentPage === totalPages ? "text-secondary opacity-50 cursor-not-allowed" : "text-secondary hover:text-[#B90A1E] cursor-pointer"
                            }`}
                    >
                        ถัดไป <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
}
