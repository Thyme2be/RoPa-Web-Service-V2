"use client";

import React, { useState } from "react";
import LogoutButton from "@/components/ui/LogoutButton";

const menuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: "dashboard" },
    { id: "ropa", label: "รายการ RoPA", icon: "list_alt" },
    { id: "docs", label: "เอกสาร", icon: "description" },
    { id: "advice", label: "ข้อเสนอแนะ", icon: "forum" },
];

export default function Sidebar() {
    const [activeId, setActiveId] = useState("ropa");

    return (
        <aside className="w-[var(--sidebar-width)] fixed left-0 top-0 bottom-0 bg-[#E0D9D7] z-50 flex flex-col shadow-sm border-r border-[#E5E2E1]">
            {/* Logo Section */}
            <a className="transition-all hover:scale-110 active:scale-95 cursor-pointer p-6 items-center ">
                <img src="/Netbay_Logo.svg" alt="Netbay Logo" className="h-16 w-auto opacity-90" />
            </a>
            {/* Menu Items */}
            <nav className="flex-1 pl-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveId(item.id)}
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
                                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                            >
                                {item.icon}
                            </span>

                            {/* Label */}
                            <span className={`text-[16px] font-bold tracking-tight transition-colors ${isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                                }`}>
                                {item.label}
                            </span>
                        </button>
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