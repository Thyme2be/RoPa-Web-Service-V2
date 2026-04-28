"use client";

import React from "react";
import { 
    Pagination as OriginalPagination,
    ActionButton as OriginalActionButton,
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
export type RoPaStatusType = OriginalRoPaStatusType | "กำลังใช้งาน" | "ปิดการใช้งาน" | "รอดำเนินการ" | "ไม่เสร็จสมบูรณ์" | "เสร็จสมบูรณ์" | "รอส่วนของ Data Owner แก้ไข" | "รอส่วนของ Data Processor แก้ไข" | "รอการแก้ไข" | "รอตรวจสอบทำลาย" | "อนุมัติการทำลาย" | "ไม่อนุมัติการทำลาย" | "ยังไม่ได้ตรวจสอบ";

export function StatusBadge({ status }: { status: RoPaStatusType }) {
    const styles: Record<string, string> = {
        "อนุมัติ": "bg-[#228B15] text-white",                    // Reference Green
        "ตรวจสอบเสร็จสิ้น": "bg-[#228B15] text-white",           // Reference Green (Review)
        "เสร็จสมบูรณ์": "bg-[#228B15] text-white",               // Reference Green (Processor)
        "รอตรวจสอบ": "bg-[#FBBF24] text-white",               // Reference Amber
        "ต้องแก้ไข": "bg-[#EF4444] text-white",                  // Reference Red
        "รอการแก้ไข": "bg-[#EF4444] text-white",                  // Reference Red
        "รอส่วนของ Data Owner แก้ไข": "bg-[#EF4444] text-white",    // Red
        "รอส่วนของ Data Processor แก้ไข": "bg-[#EF4444] text-white", // Red
        "ไม่เสร็จสมบูรณ์": "bg-[#EF4444] text-white",             // Reference Red (Processor)
        "รอตรวจสอบทำลาย": "bg-[#FBBF24] text-[#5C403D]",          // Yellow
        "อนุมัติการทำลาย": "bg-[#228B15] text-white",             // Green
        "ไม่อนุมัติการทำลาย": "bg-[#EF4444] text-white",          // Red
        "ยังไม่ได้ตรวจสอบ": "bg-[#9CA3AF] text-white",             // Gray
        "กำลังตรวจสอบ": "bg-[#E5E7EB] text-[#6B7280]",          // Gray (Review)
        "รอดำเนินการ": "bg-[#9CA3AF] text-white",                // Secondary Gray (Processor)
        "ฉบับร่าง": "bg-[#9CA3AF] text-white",                    // Secondary Gray
        "กำลังใช้งาน": "bg-[#228B15] text-white",               // Green
        "ปิดการใช้งาน": "bg-[#ED393C] text-white"                 // Red
    };

    return (
        <span className={cn(
            styles[status] || styles["ฉบับร่าง"],
            "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm inline-block"
        )}>
            {status}
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
