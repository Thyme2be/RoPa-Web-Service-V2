"use client";

import React from "react";

interface RiskDataEntry {
    label: string;
    value: number;
    color: string;
}

interface RiskDonutChartProps {
    data: RiskDataEntry[];
    total: number;
}

export default function RiskDonutChart({ data, total }: RiskDonutChartProps) {
    const size = 180;
    const strokeWidth = 25;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativeValue = 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/50 p-8 h-full flex flex-col items-center">
            <div className="w-full text-left mb-6">
                <h3 className="text-base font-black text-[#1B1C1C] tracking-tight">ความเสี่ยงของเอกสารทั้งหมด</h3>
            </div>

            <div className="relative flex items-center justify-center mb-8">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {data.map((item, idx) => {
                        const offset = (cumulativeValue / total) * circumference;
                        const dashArray = `${(item.value / total) * circumference} ${circumference}`;
                        cumulativeValue += item.value;

                        return (
                            <circle
                                key={idx}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dashArray}
                                strokeDashoffset={-offset}
                                transform={`rotate(-90 ${center} ${center})`}
                                className="transition-all duration-1000 ease-out"
                            />
                        );
                    })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-[#5F5E5E] leading-tight">จากเอกสารทั้งหมด</p>
                    <p className="text-xl font-black text-[#1B1C1C] tracking-tighter">{total} ฉบับ</p>
                </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-[#5F5E5E]">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-[#1B1C1C] tracking-tight">{item.value} ฉบับ</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
