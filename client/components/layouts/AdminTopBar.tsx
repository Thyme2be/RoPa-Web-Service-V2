"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminTopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
    const [user, setUser] = useState<{ first_name: string; last_name: string; role: string | null } | null>({
        first_name: "พรรษชล",
        last_name: "บุญมาก",
        role: "Admin"
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

        // Push the new URL with the search param
        router.push(`${pathname}?${params.toString()}`);
    };



    // Role mapping to Thai
    const mapRoleToThai = (role: string | null) => {
        switch (role) {
            case "Admin": return "ผู้ดูแลระบบ";
            case "Data Owner": return "ผู้รับผิดชอบข้อมูล";
            case "Data processor": return "ผู้ประมวลผลข้อมูลส่วนบุคคล";
            case "Auditor": return "ผู้ตรวจสอบ";
            default: return "สิทธิ์ทั่วไป";
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await fetch("http://localhost:8000/users/me", {
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

    return (
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
            {/* Left side spacer */}
            <div className="flex items-center gap-4 flex-1">
                {/* Logo or page title could go here if needed in the future */}
            </div>

            {/* Notifications, Search, Account */}
            <div className="flex items-center gap-6">
                {/* Search Bar - Show on any table page except the main menu */}
                {pathname !== "/admin/tables" && pathname.startsWith("/admin/tables") && (
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
