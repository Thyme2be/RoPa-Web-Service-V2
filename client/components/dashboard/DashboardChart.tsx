"use client";

import React from "react";

const chartData = [
    { month: "ม.ค.", current: 20, last: 15 },
    { month: "ก.พ.", current: 25, last: 18 },
    { month: "มี.ค.", current: 45, last: 22 },
    { month: "เม.ย.", current: 30, last: 26 },
    { month: "พ.ค.", current: 55, last: 32 },
    { month: "มิ.ย.", current: 70, last: 38 },
    { month: "ก.ค.", current: 60, last: 42 },
];

export function DashboardChart() {
    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E2E1]/30">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-headline font-black text-[#1B1C1C] tracking-tight">
                    แนวโน้มการเพิ่มข้อมูลรายเดือน
                </h2>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        <span className="text-[14px] font-bold text-primary">ปีนี้</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#6B7280]"></div>
                        <span className="text-[14px] font-bold text-[#6B7280]">ปีที่แล้ว</span>
                    </div>
                </div>
            </div>

            <div className="relative h-[280px] flex items-end gap-12 px-4">
                {chartData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div className="flex items-end gap-1.5 h-[85%] pb-2">
                            {/* Previous Year Bar */}
                            <div 
                                className="w-10 bg-[#6B7280] rounded-t-sm transition-all duration-700 delay-100 ease-out group-hover:brightness-110" 
                                style={{ height: `${data.last}%` }}
                            ></div>
                            {/* Current Year Bar */}
                            <div 
                                className="w-10 bg-primary rounded-t-sm transition-all duration-700 ease-out group-hover:brightness-110 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.1)]" 
                                style={{ height: `${data.current}%` }}
                            ></div>
                        </div>
                        <span className="text-[12px] font-bold text-[#6B7280] mt-4">{data.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
