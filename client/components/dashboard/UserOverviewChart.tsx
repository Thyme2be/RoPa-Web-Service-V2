"use client";

import React from "react";

const roleMap: Record<string, { label: string, color: string }> = {
    OWNER: { label: "ผู้รับผิดชอบข้อมูล", color: "#BF0D21" },
    PROCESSOR: { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", color: "#E1424E" },
    DPO: { label: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", color: "#FFB000" },
    AUDITOR: { label: "ผู้ตรวจสอบ", color: "#1F4E79" },
    ADMIN: { label: "ผู้ดูแลระบบ", color: "#4472C4" },
    EXECUTIVE: { label: "ผู้บริหารระดับสูง", color: "#7030A0" }
};

interface UserOverviewChartProps {
    userStats: any;
}

export default function UserOverviewChart({ userStats }: UserOverviewChartProps) {
    const overview = userStats.user_overview || { total: 0, roles: {} };
    const roleChartData = Object.entries(overview.roles).map(([key, count]) => ({
        title: roleMap[key]?.label || key,
        count: count as number,
        color: roleMap[key]?.color || "#CCC"
    }));
    const totalUsersCount = overview.total || 0;
    let currentOffset = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
            <div className="relative w-56 h-56 drop-shadow-md cursor-pointer group">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                    {roleChartData.map((item, idx) => {
                        const pct = totalUsersCount > 0 ? (item.count / totalUsersCount) * 100 : 0;
                        const dashArray = `${pct} 100`;
                        const offset = currentOffset;
                        currentOffset -= pct;
                        return (
                            <circle key={idx} cx="18" cy="18" fill="transparent" r="16" stroke={item.color} strokeWidth="3.5" strokeDasharray={dashArray} strokeDashoffset={offset} className="transition-all duration-1000 ease-out"></circle>
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-300 group-hover:scale-105 text-center px-4">
                    <span className="text-[20px] font-bold text-neutral-800 leading-tight">จำนวนผู้ใช้ทั้งหมด</span>
                </div>
            </div>
            <div className="w-full max-w-[320px] space-y-1">
                {roleChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                        <div className="flex items-center gap-4">
                            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-bold text-neutral-700 whitespace-nowrap">{item.title}</span>
                        </div>
                        <span className="text-sm font-black text-neutral-500 shrink-0 ml-4">{item.count} คน</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
