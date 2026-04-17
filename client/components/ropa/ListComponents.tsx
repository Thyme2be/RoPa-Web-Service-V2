"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";

export function SummaryCard({ label, value, accentColor, subtext, footer }: { label: string; value: string; accentColor: string; subtext?: string; footer?: React.ReactNode }) {
    const borderClass = accentColor === "red" ? "border-l-[#ED393C]" : 
                       accentColor === "teal" ? "border-l-[#0D9488]" : 
                       "border-l-neutral-400";

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 border-l-[4px] ${borderClass} flex flex-col justify-between min-h-[135px]`}>
            <div>
                <p className="text-[13px] font-bold text-secondary tracking-tight mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-[#1B1C1C] tracking-tighter">{value}</p>
                    {subtext && <span className="text-[14px] font-medium text-secondary opacity-60">{subtext}</span>}
                </div>
            </div>
            {footer && (
                <div className="pt-2 border-t border-[#E5E2E1]/20 mt-3">
                    {footer}
                </div>
            )}
        </div>
    );
}

export function AdvancedFilterBar({ initialTimeframe = "30" }: { initialTimeframe?: string }) {
    const [date, setDate] = useState("");
    const [timeframe, setTimeframe] = useState(initialTimeframe);

    const handleClear = () => {
        setDate("");
        setTimeframe(initialTimeframe);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-1.5 pb-[2px]">
                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">วันที่รับข้อมูล</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-11 bg-[#F6F3F2] border border-transparent rounded-xl px-4 py-2 text-sm font-medium outline-none hover:bg-white hover:border-primary/20 transition-all text-[#6B7280]" 
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-lg pointer-events-none">calendar_month</span>
                </div>
            </div>

            <Select 
                label="ช่วงเวลา"
                rounding="xl"
                value={timeframe}
                name="timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
                options={[
                    { label: "30 วันล่าสุด", value: "30" },
                    { label: "90 วันล่าสุด", value: "90" },
                    { label: "ทั้งหมด", value: "all" },
                ]}
            />

            <div className="flex h-11">
                <button 
                    onClick={handleClear}
                    className="w-full h-full bg-[#6B7280] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#4B5563] transition-colors shadow-sm active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">tune</span>
                    ล้างตัวกรอง
                </button>
            </div>
        </div>
    );
}

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

export type RoPaStatusType = "อนุมัติ" | "รอตรวจสอบ" | "ต้องแก้ไข" | "กำลังตรวจสอบ" | "ตรวจสอบเสร็จสิ้น" | "ฉบับร่าง" | "กำลังใช้งาน" | "ปิดการใช้งาน";

export function StatusBadge({ status }: { status: RoPaStatusType }) {
    const styles: Record<string, string> = {
        "อนุมัติ": "bg-[#228B15] text-white",                    // Reference Green
        "ตรวจสอบเสร็จสิ้น": "bg-[#228B15] text-white",           // Reference Green (Review)
        "เสร็จสมบูรณ์": "bg-[#228B15] text-white",               // Reference Green (Processor)
        "รอตรวจสอบ": "bg-[#FBBF24] text-[#5C403D]",               // Yellow
        "ต้องแก้ไข": "bg-[#EF4444] text-white",                  // Reference Red
        "ไม่เสร็จสมบูรณ์": "bg-[#EF4444] text-white",             // Reference Red (Processor)
        "กำลังตรวจสอบ": "bg-[#E5E7EB] text-[#6B7280]",          // Gray (Review)
        "รอดำเนินการ": "bg-[#FBBF24] text-[#5C403D]",                // Yellow
        "ฉบับร่าง": "bg-[#9CA3AF] text-white",                    // Secondary Gray
        "กำลังใช้งาน": "bg-[#228B15] text-white",               // Green
        "ปิดการใช้งาน": "bg-[#ED393C] text-white"                 // Red
    };

    return (
        <span className={`${styles[status] || styles["ฉบับร่าง"]} px-4 py-1 rounded-lg text-[11px] font-black inline-block text-center min-w-[100px] shadow-sm`}>
            {status}
        </span>
    );
}

export function ActionButton({ icon, label, color = "black", onClick, disabled }: { icon: string; label: string; color?: "black" | "red" | "gray"; onClick?: () => void; disabled?: boolean }) {
    const colorClasses = {
        black: "text-[#1B1C1C] opacity-80 hover:opacity-100",
        red: "text-[#ED393C] hover:opacity-80",
        gray: "text-[#9CA3AF] hover:opacity-80"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`flex items-center gap-2 font-black text-[14px] transition-all ${colorClasses[color]} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
            <span className="material-symbols-outlined text-[20px] font-bold">{icon}</span>
            {label}
        </button>
    );
}

export function ListCard({ title, icon, iconColor = "#1B1C1C", children, showSort = false, filled = false }: { title: string; icon: string; iconColor?: string; children: React.ReactNode; showSort?: boolean; filled?: boolean }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40 overflow-hidden">
            <div className="p-5 flex items-center justify-between bg-[#F1EDEC]">
                <div className="flex items-center gap-3">
                    <span 
                        className="material-symbols-outlined font-bold text-[22px]" 
                        style={{ color: iconColor, fontVariationSettings: filled ? "'FILL' 1" : undefined }}
                    >
                        {icon}
                    </span>
                    <h2 className="text-[17px] font-headline font-black text-[#1B1C1C] tracking-tight">{title}</h2>
                </div>
                {showSort && <span className="material-symbols-outlined text-secondary text-lg cursor-pointer">sort</span>}
            </div>
            <div className="p-6 pt-2 overflow-x-auto">
                {children}
            </div>
        </div>
    );
}


export function Pagination({ current, total, onChange }: { current: number; total: number; onChange?: (page: number) => void }) {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);

    return (
        <div className="flex justify-between items-center mt-8 text-[12px] font-bold text-[#6B7280]">
            <p className="opacity-80 font-medium">หน้า {current} จากทั้งหมด {total} หน้า</p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange?.(Math.max(1, current - 1))}
                    disabled={current === 1}
                    className="material-symbols-outlined text-[19px] cursor-pointer disabled:opacity-30 hover:opacity-60 transition-opacity"
                >
                    chevron_left
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onChange?.(p)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${p === current ? "bg-[#ED393C] text-white font-bold shadow-sm" : "hover:bg-gray-100 font-medium"}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange?.(Math.min(total, current + 1))}
                    disabled={current === total}
                    className="material-symbols-outlined text-[19px] cursor-pointer disabled:opacity-30 hover:text-[#ED393C] transition-colors"
                >
                    chevron_right
                </button>
            </div>
        </div>
    );
}

