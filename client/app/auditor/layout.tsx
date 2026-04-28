"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import AuditorGuard from "@/components/auth/AuditorGuard";
import { useAuth } from "@/context/AuthContext";

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const [docName, setDocName] = React.useState("รายละเอียดเอกสาร");
    const [searchQuery, setSearchQuery] = React.useState("");
    const isTablesPage = pathname.startsWith("/auditor/tables");
    const isDetailPage = pathname.match(/\/auditor\/tables\/[^\/]+/);
    const docId = isDetailPage ? pathname.split('/').pop() : "";

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            setSearchQuery(params.get("search") || "");
        }
    }, [pathname]);

    React.useEffect(() => {
        if (isDetailPage && docId) {
            const fetchDocName = async () => {
                const token = localStorage.getItem("token");
                if (!token) return;
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setDocName(data.title || "รายละเอียดเอกสาร");
                    }
                } catch (err) {
                    console.error("Failed to fetch doc name for topbar:", err);
                }
            };
            fetchDocName();
        }
    }, [isDetailPage, docId]);

    // The "ตารางเอกสาร" menu item should be active for both the list and detail pages
    const isMenuTablesActive = isTablesPage;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
            // Fallback for extreme cases
            localStorage.clear();
            window.location.href = "/login";
        }
    };

    const handleSearchChange = (e: any) => {
        const val = e.target.value;
        setSearchQuery(val);
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        if (val) params.set("search", val);
        else params.delete("search");
        router.push(`${pathname}?${params.toString()}`);
    };

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
                            <div className={`relative w-full h-12 flex items-center px-4 py-3 transition-all duration-300 rounded-lg cursor-pointer group ${isMenuTablesActive ? "bg-white/60 shadow-sm" : "text-[#5F5E5E] hover:bg-white/30"}`}>
                                {isMenuTablesActive && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]" />
                                )}
                                <span className={`material-symbols-outlined shrink-0 mr-3.5 transition-all duration-300 ${isMenuTablesActive ? "text-primary scale-110" : "text-[#5F5E5E] group-hover:text-primary"}`} style={{ fontVariationSettings: `'FILL' ${isMenuTablesActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
                                    list_alt
                                </span>
                                <span className={`text-[16px] font-bold tracking-tight transition-colors ${isMenuTablesActive ? "text-primary" : "text-[#5F5E5E] group-hover:text-primary"}`}>
                                    ตารางเอกสาร
                                </span>
                            </div>
                        </Link>
                    </nav>

                    <div className="p-4 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-logout-gradient h-12 rounded-xl text-white font-bold text-[15px] shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            ออกจากระบบ
                        </button>
                    </div>
                </aside>

                <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                    <TopBar
                        showBack={!!isDetailPage}
                        backUrl="/auditor/tables"
                        pageTitle={isDetailPage ? docName : " "}
                        hideSearch={!!isDetailPage}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                    />

                    {/* Main Content */}
                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AuditorGuard>
    );
}
