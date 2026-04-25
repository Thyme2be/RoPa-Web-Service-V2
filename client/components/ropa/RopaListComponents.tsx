"use client";

import React from "react";
import { 
    Pagination as OriginalPagination,
    ActionButton as OriginalActionButton,
    StatusBadge as OriginalStatusBadge,
    RoPaStatusType as OriginalRoPaStatusType
} from "./ListComponents";
import { cn } from "@/lib/utils";

/**
 * RopaListComponents.tsx
 * 
 * This file contains custom versions of list components for the Ropa Audit features.
 * We extend the original components to maintain decoupling from the friend's codebase.
 */

// 1. GenericFilterBar (Restored Component)
export function GenericFilterBar({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
    return (
        <div className="bg-[#EAE6E4]/70 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-end justify-between border border-[#E5E2E1]/40">
            <div className="flex flex-wrap gap-6 text-[#5C403D] flex-1">
                {children}
            </div>

            <button
                onClick={onClear}
                className="h-[42px] px-8 bg-[#6B7280] text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#4B5563] transition-colors shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                ล้างตัวกรอง
            </button>
        </div>
    );
}

// 2. Upgraded RoPaStatusType & StatusBadge
export type RoPaStatusType = OriginalRoPaStatusType | string;

export function StatusBadge({ code, label }: { code?: string; label?: string }) {
    // 1. Mapping for Status Codes (Backend Codes)
    const codeStyles: Record<string, { bg: string; text: string; label: string }> = {
        // Completed States (Green)
        "DO_DONE": { bg: "bg-[#107C41]", text: "text-white", label: "Data Owner ดำเนินการเสร็จสิ้น" },
        "DP_DONE": { bg: "bg-[#107C41]", text: "text-white", label: "Data Processor ดำเนินการเสร็จสิ้น" },
        "CHECK_DONE": { bg: "bg-[#107C41]", text: "text-white", label: "ตรวจสอบเสร็จสิ้น" },
        "APPROVED": { bg: "bg-[#107C41]", text: "text-white", label: "อนุมัติแล้ว" },
        "เสร็จสมบูรณ์": { bg: "bg-[#107C41]", text: "text-white", label: "เสร็จสมบูรณ์" },

        // Waiting States (Yellow)
        "WAITING_DO": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอส่วนของ Data Owner" },
        "WAITING_DP": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอส่วนของ Data Processor" },
        "WAITING_CHECK": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอตรวจสอบ" },
        "DP_NEED_FIX": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอ Data Processor แก้ไข" },
        "DPO_REJECTED": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอ Data Owner แก้ไข" },
        "รอดำเนินการ": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอดำเนินการ" },
        "ต้องแก้ไข": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอแก้ไข" },

        // Rejected / Unapproved States (Red)
        "REJECTED": { bg: "bg-[#ED393C]", text: "text-white", label: "ไม่อนุมัติ" },
        "ไม่อนุมัติ": { bg: "bg-[#ED393C]", text: "text-white", label: "ไม่อนุมัติ" },

        // Neutral/Draft States (Gray)
        "DRAFT": { bg: "bg-[#9CA3AF]", text: "text-white", label: "ฉบับร่าง" },
        "ฉบับร่าง": { bg: "bg-[#9CA3AF]", text: "text-white", label: "ฉบับร่าง" },

        // Additional Backend Enums Synchronization
        "EXPIRED": { bg: "bg-[#ED393C]", text: "text-white", label: "หมดอายุ" },
        "DELETE_PENDING": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รออนุมัติทำลาย" },
        "PENDING": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอดำเนินการ" },
        "DELETED": { bg: "bg-[#107C41]", text: "text-white", label: "ทำลายแล้ว" },
        "UNDER_REVIEW": { bg: "bg-[#FFC107]", text: "text-[#5C403D]", label: "รอตรวจสอบ" },
        "COMPLETED": { bg: "bg-[#107C41]", text: "text-white", label: "เสร็จสมบูรณ์" },
    };

    // 2. Logic to determine look and feel
    // Prioritize Code mapping, then Label mapping, then default to Label text with Gray background
    const config = (code && codeStyles[code]) || (label && codeStyles[label]) || {
        bg: "bg-[#9CA3AF]",
        text: "text-white",
        label: label || code || "ไม่ระบุ"
    };

    return (
        <span className={cn(
            config.bg, 
            config.text,
            "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm inline-block"
        )}>
            {label || config.label}
        </span>
    );
}

// 3. Custom ListCard following the team's design but with extended props
export function ListCard({ 
    title, 
    icon, 
    iconColor = "#1B1C1C", 
    children, 
    showSort = false,
    filled = false,
    bodyClassName = "p-6 pt-2"
}: { 
    title: string; 
    icon: string; 
    iconColor?: string; 
    children: React.ReactNode; 
    showSort?: boolean;
    filled?: boolean;
    bodyClassName?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40">
            <div className="p-5 flex items-center justify-between bg-[#E0D9D7] rounded-t-[11px]">
                <div className="flex items-center gap-3">
                    <span 
                        className="material-symbols-outlined font-bold text-[22px]" 
                        style={{ 
                            color: iconColor,
                            fontVariationSettings: filled ? "'FILL' 1" : undefined
                        }}
                    >
                        {icon}
                    </span>
                    <h2 className="text-[17px] font-headline font-black text-[#1B1C1C] tracking-tight">{title}</h2>
                </div>
                {showSort && <span className="material-symbols-outlined text-[#5F5E5E] text-lg cursor-pointer">sort</span>}
            </div>
            <div className={`${bodyClassName} overflow-x-auto`}>
                {children}
            </div>
        </div>
    );
}

export { OriginalPagination as Pagination };
export { OriginalActionButton as ActionButton };
export { ActionIconWithTooltip, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell } from "./ListComponents";
