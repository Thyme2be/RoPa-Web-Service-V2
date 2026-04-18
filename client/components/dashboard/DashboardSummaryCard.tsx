"use client";

import React from "react";

interface SummaryCardProps {
    icon: string;
    label: string;
    value?: string | number;
    subLabel?: string;
    accentColor?: "danger" | "warning" | "info" | "success" | "accent" | "caution" | "neutral" | "muted" | "sky" | "error";
    splitValues?: {
        label: string;
        value: string | number;
    }[];
}

export default function DashboardSummaryCard({
    icon,
    label,
    value,
    subLabel,
    accentColor = "neutral",
    splitValues,
}: SummaryCardProps) {
    const borderColors = {
        danger: "border-b-[#BA1A1A]",
        warning: "border-b-[#ED393C]",
        info: "border-b-[#3B82F6]",
        success: "border-b-[#2C8C00]",
        accent: "border-b-[#9747FF]",
        caution: "border-b-[#FF9800]",
        neutral: "border-b-[#6B7280]",
        muted: "border-b-[#BFC4CF]",
        sky: "border-b-[#56B6FF]",
        error: "border-b-[#D91729]",
    };

    const iconColors = {
        danger: "bg-red-50 text-[#BA1A1A]",
        warning: "bg-red-50 text-[#ED393C]",
        info: "bg-blue-50 text-[#3B82F6]",
        success: "bg-green-50 text-[#2C8C00]",
        accent: "bg-purple-50 text-[#9747FF]",
        caution: "bg-orange-50 text-[#FF9800]",
        neutral: "bg-gray-50 text-[#6B7280]",
        muted: "bg-slate-50 text-[#BFC4CF]",
        sky: "bg-sky-50 text-[#56B6FF]",
        error: "bg-red-50 text-[#D91729]",
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-[#E5E2E1]/50 border-b-[4px] ${borderColors[accentColor]} p-6 flex flex-col h-full min-h-[160px]`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[accentColor]}`}>
                    <span className="material-symbols-outlined text-2xl font-bold">{icon}</span>
                </div>
                <div className="text-right flex-1 ml-4">
                    <p className="text-sm font-bold text-[#71717A] tracking-tight">{label}</p>
                </div>
            </div>

            <div className="flex-1 flex items-end">
                {splitValues ? (
                    <div className="grid grid-cols-2 w-full divide-x divide-[#E5E2E1]">
                        {splitValues.map((sv, idx) => (
                            <div key={idx} className={`flex flex-col items-center ${idx === 0 ? "pr-4" : "pl-4"}`}>
                                <p className="text-3xl font-black text-[#1B1C1C] tracking-tighter">{sv.value}</p>
                                <p className="text-[11px] text-[#5F5E5E] font-medium text-center leading-tight mt-1">{sv.label}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <p className="text-4xl font-black text-[#1B1C1C] tracking-tighter">{value}</p>
                        {subLabel && (
                            <p className="text-[11px] text-[#5F5E5E] font-medium mt-1">{subLabel}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
