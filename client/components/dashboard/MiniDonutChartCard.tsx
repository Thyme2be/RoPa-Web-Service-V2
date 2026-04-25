"use client";

import React from "react";

interface MiniDonutChartCardProps {
    title: string;
    completed: number;
    empty: number;
}

export default function MiniDonutChartCard({ title, completed, empty }: MiniDonutChartCardProps) {
    const total = completed + empty;
    const completedPct = total > 0 ? (completed / total) * 100 : 0;
    const emptyPct = total > 0 ? (empty / total) * 100 : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col items-center justify-between min-h-[360px]">
            <h4 className="text-sm font-bold text-neutral-900 w-full text-left mb-6 leading-relaxed h-10">{title}</h4>
            <div className="relative w-40 h-40 mb-6 drop-shadow-sm">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#f0eded" strokeWidth="4"></circle>
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#ED393C" strokeDasharray={`${emptyPct} 100`} strokeDashoffset="0" strokeWidth="4" className="transition-all duration-1000 ease-out"></circle>
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`-${emptyPct}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-100"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                    <span className="text-[10px] font-bold text-neutral-800 leading-tight">
                        จำนวนเอกสารทั้งหมด
                    </span>
                </div>
            </div>
            <div className="w-full space-y-2">
                <StatRow color="#2C8C00" label="เสร็จสมบูรณ์" value={completed} />
                <StatRow color="#ED393C" label="ไม่เสร็จสมบูรณ์" value={empty} />
            </div>
        </div>
    );
}

function StatRow({ color, label, value }: { color: string, label: string, value: number }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-sm font-bold text-neutral-700">{label}</span>
            </div>
            <span className="text-sm font-medium text-neutral-500">{value} ฉบับ</span>
        </div>
    );
}
