"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();
    const isProcessor = pathname.includes("/data-processor");

    // Theme colors
    const primaryColor = isProcessor ? "#ED393C" : "#ED393C";
    const primaryRgb = isProcessor ? "237, 57, 60" : "237, 57, 60";

    // Menu Configuration
    const ownerMenu = [
        { id: "dashboard", label: "แดชบอร์ด", icon: "dashboard", path: "/data-owner/dashboard" },
        { id: "documents", label: "การจัดการเอกสาร", icon: "description", path: "/data-owner/documents" },
    ];

    const processorMenu = [
        { id: "processing", label: "ตารางเอกสาร", icon: "description", path: "/data-processor/management/processing" },
    ];

    const menuItems = isProcessor ? processorMenu : ownerMenu;

    return (
        <aside className="w-[var(--sidebar-width)] fixed left-0 top-0 bottom-0 bg-[#E0D9D7] z-50 flex flex-col shadow-sm border-r border-[#E5E2E1]">
            {/* Logo Section */}
            <div className="p-6 flex items-center">
                <img src="/Netbay_Logo.svg" alt="Netbay Logo" className="h-16 w-auto opacity-90" />
            </div>

            {/* Menu Items */}
            <nav className="flex-1 pl-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.path) || 
                                   (item.id === "processing" && pathname.startsWith("/data-processor/management/")) ||
                                   (item.id === "documents" && pathname.startsWith("/data-owner/management/"));
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={cn(
                                "relative w-full h-12 flex items-center px-4 py-3 transition-all duration-300 group",
                                isActive ? "bg-[#F0EDED] rounded-l-xl" : "text-[#5F5E5E] hover:text-primary"
                            )}
                        >
                            {/* Accent Line (Active State Only) */}
                            {isActive && (
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                                    style={{
                                        backgroundColor: primaryColor,
                                        boxShadow: `0 0 12px rgba(${primaryRgb}, 0.4)`
                                    }}
                                />
                            )}

                            <span
                                className="material-symbols-outlined shrink-0 mr-3.5 transition-all duration-300"
                                style={{
                                    fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                                    color: isActive ? primaryColor : "#5F5E5E"
                                }}
                            >
                                {item.icon}
                            </span>

                            {/* Label */}
                            <span
                                className="text-[16px] font-bold tracking-tight transition-colors"
                                style={{ color: isActive ? primaryColor : "#5F5E5E" }}
                            >
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
