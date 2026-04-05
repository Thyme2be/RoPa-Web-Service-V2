"use client";

import React from "react";

interface StatsCardProps {
    icon: string;
    label: string;
    value: string;
    subLabel?: string;
    accentColor?: "blue" | "red" | "gray";
}

export function StatsCard({ icon, label, value, subLabel, accentColor }: StatsCardProps) {
    const accentClass = accentColor === "blue" ? "border-b-[4px] border-b-[#4F7CFF]" : 
                       accentColor === "red" ? "border-b-[4px] border-b-[#ED393C]" : "";

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/50 flex flex-col justify-between min-h-[160px] ${accentClass}`}>
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[22px]">{icon}</span>
                </div>
                <div className="text-right">
                    <p className="text-[13px] font-bold text-secondary tracking-tight mb-1">{label}</p>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-4xl font-black text-[#1B1C1C] tracking-tighter">{value}</p>
                {subLabel && <p className="text-[11px] text-[#5F5E5E] font-medium mt-1">{subLabel}</p>}
            </div>
        </div>
    );
}

export function FilterBar() {
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E5E2E1]/50 flex justify-between items-center px-8">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">filter_list</span>
                <span className="text-[15px] font-bold text-[#1B1C1C]">ตัวกรองข้อมูล</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#1B1C1C]">ช่วงเวลา</span>
                <div className="relative group">
                    <select className="bg-white border border-[#E5E2E1] rounded-md px-4 py-2 text-[13px] font-medium w-64 focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer appearance-none">
                        <option>30 วันล่าสุด</option>
                        <option>90 วันล่าสุด</option>
                        <option>1 ปีที่ผ่านมา</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                        expand_more
                    </span>
                </div>
            </div>
        </div>
    );
}
