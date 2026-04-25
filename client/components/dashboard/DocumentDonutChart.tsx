"use client";

import React from "react";

interface DocumentDonutChartProps {
    chartData: {
        draft: number;
        pending: number;
        completed: number;
        reviewing: number;
    };
}

export default function DocumentDonutChart({ chartData }: DocumentDonutChartProps) {
    const totalDocs = chartData.draft + chartData.pending + chartData.completed + chartData.reviewing;
    const completedPct = totalDocs > 0 ? (chartData.completed / totalDocs) * 100 : 0;
    const reviewingPct = totalDocs > 0 ? (chartData.reviewing / totalDocs) * 100 : 0;
    const pendingPct = totalDocs > 0 ? (chartData.pending / totalDocs) * 100 : 0;
    const draftPct = totalDocs > 0 ? (chartData.draft / totalDocs) * 100 : 0;

    const completedOffset = 0;
    const reviewingOffset = -completedPct;
    const pendingOffset = reviewingOffset - reviewingPct;
    const draftOffset = pendingOffset - pendingPct;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
            <div className="relative w-56 h-56 group cursor-pointer drop-shadow-md">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                    {completedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`${completedOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-200"></circle>}
                    {reviewingPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ED393C" strokeDasharray={`${reviewingPct} 100`} strokeDashoffset={`${reviewingOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-300"></circle>}
                    {pendingPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#FFCC00" strokeDasharray={`${pendingPct} 100`} strokeDashoffset={`${pendingOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-100"></circle>}
                    {draftPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#F0EDED" strokeDasharray={`${draftPct} 100`} strokeDashoffset={`${draftOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out"></circle>}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-500 group-hover:scale-110 text-center px-4">
                    <span className="text-[20px] font-bold text-neutral-800 leading-relaxed">จำนวนเอกสาร<br />ทั้งหมด</span>
                </div>
            </div>
            <div className="w-56 space-y-1">
                <LegendItem color="#F0EDED" label="ฉบับร่าง" value={chartData.draft} />
                <LegendItem color="#FFCC00" label="รอดำเนินการ" value={chartData.pending} />
                <LegendItem color="#ED393C" label="รอตรวจสอบ" value={chartData.reviewing} />
                <LegendItem color="#2C8C00" label="เสร็จสมบูรณ์" value={chartData.completed} />
            </div>
        </div>
    );
}

function LegendItem({ color, label, value }: { color: string, label: string, value: number }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
            <div className="flex items-center gap-4">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm border border-zinc-200" style={{ backgroundColor: color }}></div>
                <span className="text-sm font-bold text-neutral-700">{label}</span>
            </div>
            <span className="text-sm font-black text-neutral-500">{value} ฉบับ</span>
        </div>
    );
}
