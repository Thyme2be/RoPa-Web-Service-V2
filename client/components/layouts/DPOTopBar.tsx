"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { mockOwnerRecords } from "@/lib/ropaMockRecords";

export default function DPOTopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
    const [user, setUser] = useState<{ first_name: string; last_name: string; role: string | null } | null>({
        first_name: "กิตติพงศ์",
        last_name: "ศรีวัฒนากุล",
        role: "DPO"
    });

    // Update local state when URL search param changes
    useEffect(() => {
        setSearchValue(searchParams.get("search") || "");
    }, [searchParams]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchValue(query);

        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set("search", query);
        } else {
            params.delete("search");
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    // Check if we are on a table list page (not the menu or detail pages)
    const isTableListPage = pathname.startsWith("/dpo/tables/") && !pathname.match(/\/dpo\/tables\/[^\/]+\/[^\/]+/);
    
    // Check if we are on any DPO detail page
    const detailPaths = ["in-progress", "destruction", "auditor-submission"];
    const isDetailPage = detailPaths.some(p => pathname.includes(`/dpo/tables/${p}/`) && pathname.split('/').length > 4);
    const docId = isDetailPage ? pathname.split('/').pop() : "";
    const docName = isDetailPage ? (mockOwnerRecords.find(d => d.id === docId)?.document_name || "รายละเอียดเอกสาร") : "";

    return (
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
            <div className="flex-1 flex items-center">
                {isDetailPage && (
                    <span className="text-[20px] font-bold text-neutral-900">{docName}</span>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Search Bar - only for specific table pages */}
                {isTableListPage && (
                    <div className="relative group hidden lg:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">
                            search
                        </span>
                        <input
                            className="bg-[#F6F3F2] border-none rounded-2xl pl-10 pr-4 py-2 text-sm w-80 focus:ring-1 focus:ring-primary/40 transition-all outline-none"
                            placeholder="ค้นหา..."
                            type="text"
                            value={searchValue}
                            onChange={handleSearchChange}
                        />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="h-8 w-[1px] bg-neutral-300 mx-2"></div>

                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-neutral-900">
                            {user ? `${user.first_name} ${user.last_name}` : "กำลังโหลด..."}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">
                            เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
