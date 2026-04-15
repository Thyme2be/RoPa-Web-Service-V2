"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";

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
    const [timeframe, setTimeframe] = useState("30");
    
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E5E2E1]/50 flex justify-between items-center px-8">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary font-bold">filter_list</span>
                <span className="text-[15px] font-black text-[#1B1C1C] tracking-tight">ตัวกรองข้อมูล</span>
            </div>
            
            <Select 
                label="ช่วงเวลา"
                rounding="xl"
                containerClassName="!w-64 !space-y-1"
                value={timeframe}
                name="timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
                options={[
                    { label: "30 วันล่าสุด", value: "30" },
                    { label: "90 วันล่าสุด", value: "90" },
                    { label: "1 ปีที่ผ่านมา", value: "365" },
                ]}
            />
        </div>
    );
}
