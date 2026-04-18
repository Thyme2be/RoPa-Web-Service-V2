"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminTopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
    const [user, setUser] = useState<{ first_name: string; last_name: string; role: string | null } | null>(null);

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

        // Push the new URL with the search param
        router.push(`${pathname}?${params.toString()}`);
    };



    // Role mapping to Thai
    const mapRoleToThai = (role: string | null) => {
        if (!role) return "สิทธิ์ทั่วไป";
        const r = role.toUpperCase();
        switch (r) {
            case "ADMIN": return "ผู้ดูแลระบบ";
            case "OWNER": return "ผู้รับผิดชอบข้อมูล";
            case "PROCESSOR": return "ผู้ประมวลผลข้อมูลส่วนบุคคล";
            case "DPO": return "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล";
            case "AUDITOR": return "ผู้ตรวจสอบ";
            default: return "สิทธิ์ทั่วไป";
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("[AdminTopBar] Token from localStorage:", token ? "Found" : "Not Found");
                
                if (!token) {
                    console.warn("[AdminTopBar] No token found, staying on default user.");
                    return;
                }

                const apiUrl = "http://localhost:8000/auth/me";
                console.log("[AdminTopBar] Fetching profile from:", apiUrl);

                const response = await fetch(apiUrl, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                console.log("[AdminTopBar] API Response Status:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("[AdminTopBar] Profile data received:", data);
                    setUser(data);
                } else if (response.status === 401) {
                    console.error("[AdminTopBar] Unauthorized: Token might be expired.");
                    // Fallback to default but could also trigger logout here
                } else {
                    console.error("[AdminTopBar] Failed to fetch profile. Status:", response.status);
                }
            } catch (error) {
                console.error("[AdminTopBar] Network error while fetching profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
            {/* Left side spacer */}
            <div className="flex items-center gap-4 flex-1">
                {/* Logo or page title could go here if needed in the future */}
            </div>

            {/* Notifications, Search, Account */}
            <div className="flex items-center gap-6">
                {/* Search Bar - Show on table pages except the main menu and individual dashboards */}
                {pathname !== "/admin/tables" && pathname.startsWith("/admin/tables") && !pathname.includes("/dashboard") && (
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
                    {/* Divider */}
                    <div className="h-8 w-[1px] bg-neutral-300 mx-2"></div>

                    {/* User Profile */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-neutral-900">
                            {user ? `${user.first_name} ${user.last_name}` : "กำลังโหลด..."}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">
                            {user ? mapRoleToThai(user.role) : "กำลังตรวจสอบสิทธิ์..."}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
