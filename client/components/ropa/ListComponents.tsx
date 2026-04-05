"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";

export function SummaryCard({ label, value, accentColor }: { label: string; value: string; accentColor: string }) {
    const borderClass = accentColor === "red" ? "border-l-[#ED393C]" : 
                       accentColor === "teal" ? "border-l-[#0D9488]" : 
                       "border-l-neutral-400";

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 border-l-[4px] ${borderClass} flex flex-col justify-center min-h-[110px]`}>
            <p className="text-[13px] font-bold text-secondary tracking-tight mb-2">{label}</p>
            <p className="text-3xl font-black text-[#1B1C1C] tracking-tighter">{value}</p>
        </div>
    );
}

export function AdvancedFilterBar({ initialTimeframe = "30" }: { initialTimeframe?: string }) {
    const [status, setStatus] = useState("all");
    const [date, setDate] = useState("");
    const [timeframe, setTimeframe] = useState(initialTimeframe);

    const handleClear = () => {
        setStatus("all");
        setDate("");
        setTimeframe(initialTimeframe);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <Select 
                label="สถานะ"
                rounding="xl"
                value={status}
                name="status"
                onChange={(e) => setStatus(e.target.value)}
                options={[
                    { label: "สถานะทั้งหมด", value: "all" },
                    { label: "อนุมัติ", value: "approved" },
                    { label: "รอตรวจสอบ", value: "pending" },
                    { label: "ต้องแก้ไข", value: "fix" },
                ]}
            />
            
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

export type RoPaStatusType = "อนุมัติ" | "รอตรวจสอบ" | "ต้องแก้ไข" | "กำลังตรวจสอบ" | "ตรวจสอบเสร็จสิ้น" | "ฉบับร่าง";

export function StatusBadge({ status }: { status: RoPaStatusType }) {
    const styles: Record<string, string> = {
        "อนุมัติ": "bg-[#228B15] text-white",                    // Reference Green
        "ตรวจสอบเสร็จสิ้น": "bg-[#228B15] text-white",           // Reference Green (Review)
        "รอตรวจสอบ": "bg-[#FBBF24] text-white",               // Reference Amber
        "ต้องแก้ไข": "bg-[#EF4444] text-white",                  // Reference Red
        "กำลังตรวจสอบ": "bg-[#E5E7EB] text-[#6B7280]",          // Gray (Review)
        "ฉบับร่าง": "bg-[#9CA3AF] text-white"                    // Secondary Gray
    };

    return (
        <span className={`${styles[status] || styles["ฉบับร่าง"]} px-4 py-1 rounded-lg text-[11px] font-black inline-block text-center min-w-[100px] shadow-sm`}>
            {status}
        </span>
    );
}

export function ActionButton({ icon, label, color = "black", onClick }: { icon: string; label: string; color?: "black" | "red" | "gray"; onClick?: () => void }) {
    const colorClasses = {
        black: "text-[#1B1C1C] opacity-80 hover:opacity-100",
        red: "text-[#DC2626] hover:opacity-80",
        gray: "text-[#4B5563] opacity-70 hover:opacity-100"
    };

    return (
        <button onClick={onClick} className={`flex items-center gap-2 font-black text-[12.5px] transition-all ${colorClasses[color]}`}>
            <span className="material-symbols-outlined text-[20px] font-bold">{icon}</span>
            {label}
        </button>
    );
}

export function ListCard({ title, icon, iconColor = "#1B1C1C", children, showSort = false }: { title: string; icon: string; iconColor?: string; children: React.ReactNode; showSort?: boolean }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40 overflow-hidden">
            <div className="p-5 flex items-center justify-between bg-[#F1EDEC]">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined font-bold text-[22px]" style={{ color: iconColor }}>{icon}</span>
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

export function Pagination({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex justify-between items-center mt-8 text-[12px] font-bold text-[#6B7280]">
            <p className="opacity-80 font-medium">แสดง 1 ถึง {current} จากทั้งหมด {total} รายการ</p>
            <div className="flex items-center gap-2">
                <button className="material-symbols-outlined text-[19px] cursor-pointer opacity-30 hover:opacity-60 transition-opacity">chevron_left</button>
                {[1, 2, 3].map(p => (
                    <button key={p} className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${p === 1 ? "bg-[#ED393C] text-white font-bold" : "hover:bg-gray-100 font-medium"}`}>
                        {p}
                    </button>
                ))}
                <button className="material-symbols-outlined text-[19px] cursor-pointer hover:text-[#ED393C] transition-colors">chevron_right</button>
            </div>
        </div>
    );
}
