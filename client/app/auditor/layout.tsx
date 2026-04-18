"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import AuditorGuard from "@/components/auth/AuditorGuard";

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Mock data lookup for display names
    const mockDocs = [
        { id: "RP-2026-03", name: "ข้อมูลลูกค้า" },
        { id: "RP-2026-02", name: "การกำกับดูแลข้อมูลธุรกรรม" },
        { id: "RP-2026-01", name: "การจัดการข้อมูลโครงข่าย" }
    ];

    // Check if we are on the tables page or a detail page
    const isTablesPage = pathname.startsWith("/auditor/tables");
    const isDetailPage = pathname.match(/\/auditor\/tables\/[^\/]+/);
    const docId = isDetailPage ? pathname.split('/').pop() : "";
    const docName = isDetailPage ? (mockDocs.find(d => d.id === docId)?.name || "รายละเอียดเอกสาร") : "";

    // The "ตารางเอกสาร" menu item should be active for both the list and detail pages
    const isMenuTablesActive = isTablesPage;

    return (
        <AuditorGuard>
            <div className="flex min-h-screen bg-surface-container-low">
                {/* Sidebar - Using default Sidebar or we can create AuditorSidebar later */}
                <aside className="w-[var(--sidebar-width)] fixed left-0 top-0 bottom-0 bg-[#E0D9D7] z-50 flex flex-col shadow-sm border-r border-[#E5E2E1]">
                    <div className="p-6 items-center">
                        <img src="/Netbay_Logo.svg" alt="Netbay Logo" className="h-16 w-auto" />
                    </div>

                    <nav className="flex-1 pl-4 space-y-2">
                        <Link href="/auditor/tables" className="block outline-none">
                            <div className={`relative w-full h-12 flex items-center px-4 py-3 transition-all duration-300 rounded-lg cursor-pointer group ${isMenuTablesActive ? "bg-white/60 shadow-sm" : "text-secondary hover:bg-white/30"}`}>
                                {isMenuTablesActive && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]" />
                                )}
                                <span className={`material-symbols-outlined shrink-0 mr-3.5 transition-all duration-300 ${isMenuTablesActive ? "text-primary scale-110" : "text-secondary group-hover:text-primary"}`} style={{ fontVariationSettings: `'FILL' ${isMenuTablesActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
                                    list_alt
                                </span>
                                <span className={`text-[16px] font-bold tracking-tight transition-colors ${isMenuTablesActive ? "text-primary" : "text-secondary group-hover:text-primary"}`}>
                                    ตารางเอกสาร
                                </span>
                            </div>
                        </Link>
                    </nav>

                    <div className="p-4 mt-auto">
                        <button className="w-full flex items-center justify-center gap-2 bg-logout-gradient h-12 rounded-xl text-white font-bold text-[15px] shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            ออกจากระบบ
                        </button>
                    </div>
                </aside>

                <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                    {/* TopBar-like Header */}
                    <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
                        <div className="flex-1 flex items-center">
                            {isDetailPage && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[20px] font-bold text-neutral-900">{docName}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Search Bar - only for the list page */}
                            {!isDetailPage && (
                                <div className="relative group lg:block">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">
                                        search
                                    </span>
                                    <input
                                        className="bg-[#F6F3F2] border-none rounded-2xl pl-10 pr-4 py-2 text-sm w-80 focus:ring-1 focus:ring-primary/40 transition-all outline-none"
                                        placeholder="ค้นหา..."
                                        type="text"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="h-8 w-[1px] bg-neutral-300 mx-2"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-neutral-900">ปริญญา วัฒนานุกุล</span>
                                    <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">ผู้ตรวจสอบ</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AuditorGuard>
    );
}
