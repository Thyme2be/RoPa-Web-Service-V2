"use client";

import React from "react";
import Link from "next/link";

interface SelectionCardProps {
    title: string;
    description: string;
    icon: string;
    href: string;
    accentColor: "red" | "teal" | "blue";
}

export function SelectionCard({ title, description, icon, href, accentColor }: SelectionCardProps) {
    const accentClasses = {
        red: "group-hover:text-[#ED393C] text-secondary",
        teal: "group-hover:text-[#0D9488] text-secondary",
        blue: "group-hover:text-[#3B82F6] text-secondary",
    };

    const borderClasses = {
        red: "hover:border-[#ED393C]/30",
        teal: "hover:border-[#0D9488]/30",
        blue: "hover:border-[#3B82F6]/30",
    };

    return (
        <Link href={href} className={`block bg-white p-8 rounded-2xl shadow-sm border border-[#E5E2E1]/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${borderClasses[accentColor]}`}>
            <div className="space-y-6">
                <div className="w-14 h-14 bg-[#F6F3F2] rounded-xl flex items-center justify-center transition-colors group-hover:bg-white">
                    <span className={`material-symbols-outlined text-[32px] transition-colors ${accentClasses[accentColor]}`}>
                        {icon}
                    </span>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-headline font-black text-[#1B1C1C] tracking-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-[#5F5E5E] text-[15px] font-medium leading-relaxed opacity-80">
                        {description}
                    </p>
                </div>
                <div className="flex items-center text-[13px] font-bold text-primary group-hover:translate-x-1 transition-transform">
                    เริ่มต้นใช้งาน
                    <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                </div>
            </div>
        </Link>
    );
}
