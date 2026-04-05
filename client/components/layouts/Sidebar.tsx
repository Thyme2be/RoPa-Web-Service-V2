"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";

const menuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: "dashboard", href: "/data-owner/dashboard" },
    { id: "ropa", label: "รายการ RoPA", icon: "list_alt", href: "/data-owner/form" },
    { id: "docs", label: "เอกสาร", icon: "description", href: "#" },
    { id: "advice", label: "ข้อเสนอแนะ", icon: "forum", href: "#" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-[var(--sidebar-width)] fixed left-0 top-0 bottom-0 bg-[#E0D9D7] z-50 flex flex-col shadow-sm border-r border-[#E5E2E1]">
            {/* Logo Section */}
            <div className="p-6 items-center">
                <img src="/Netbay_Logo.svg" alt="Netbay Logo" className="h-16 w-auto" />
            </div>

            {/* Menu Items */}
            <nav className="flex-1 pl-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`relative w-full h-12 flex items-center px-4 py-3 transition-all duration-300 group ${isActive
                                ? "bg-[#F0EDED] rounded-lg"
                                : " text-secondary"
                                }`}
                        >
                            {/* Accent Line (Active State Only) */}
                            {isActive && (
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]" />
                            )}

                            <span
                                className={`material-symbols-outlined shrink-0 mr-3.5 transition-all duration-300 ${isActive
                                    ? "text-primary scale-110"
                                    : "text-secondary group-hover:text-primary"
                                    }`}
                                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                            >
                                {item.icon}
                            </span>

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