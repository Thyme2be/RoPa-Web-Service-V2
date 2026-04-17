"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";

const dpoMenuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: "dashboard", path: "/dpo/dashboard" },
    { id: "tables", label: "ตารางเอกสาร", icon: "list_alt", path: "/dpo/tables" },
];

export default function DPOSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-[var(--sidebar-width)] fixed left-0 top-0 bottom-0 bg-[#E0D9D7] z-50 flex flex-col shadow-sm border-r border-[#E5E2E1]">
            {/* Logo Section */}
            <Link href="/dpo/dashboard" className="p-6 items-center">
                <img src="/Netbay_Logo.svg" alt="Netbay Logo" className="h-16 w-auto opacity-90" />
            </Link>

            {/* Menu Items */}
            <nav className="flex-1 pl-4 space-y-2">
                {dpoMenuItems.map((item) => {
                    const isActive = item.id === "tables" ? pathname.startsWith("/dpo/tables") : pathname === item.path;
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`relative w-full h-12 flex items-center px-4 py-3 transition-all duration-300 group ${isActive
                                ? "bg-[#F0EDED] rounded-xl"
                                : " text-secondary"
                                }`}
                        >
                            {/* Accent Line (Active State Only) */}
                            {isActive && (
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(237,57,60,0.4)]" />
                            )}

                            <span
                                className={`material-symbols-outlined shrink-0 mr-3.5 transition-all duration-300 ${isActive
                                    ? "text-primary scale-110"
                                    : "text-secondary group-hover:text-primary"
                                    }`}
                                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                            >
                                {item.icon}
                            </span>

                            {/* Label */}
                            <span className={`text-[16px] font-bold tracking-tight transition-colors ${isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 mt-auto space-y-3">
                <LogoutButton />
            </div>
        </aside>
    );
}
