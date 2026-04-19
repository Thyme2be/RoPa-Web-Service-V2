"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * DonutData Interface
 */
export interface DonutData {
    label: string;
    value: number;
    color: string;
}

/**
 * Premium Ropa Donut Chart
 * Enhanced with Material Design 3 styles, round caps, and premium shadows.
 */
export function RopaDonutChart({
    data,
    totalLabel,
    size = 200,
    strokeWidth = 20,
    variant = "default",
    title,
    total,
    unit = "ฉบับ"
}: {
    data: DonutData[];
    totalLabel?: string;
    size?: number;
    strokeWidth?: number;
    variant?: "default" | "card" | "full";
    title?: string;
    total?: number;
    unit?: string;
}) {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const totalValue = total || data.reduce((acc, item) => acc + item.value, 0);
    let cumulativeValue = 0;

    const chartSVG = (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#F6F3F2" strokeWidth={strokeWidth} />
                {data.map((item, idx) => {
                    if (totalValue === 0) return null;
                    const sliceValue = (item.value / totalValue) * circumference;
                    const offset = (cumulativeValue / totalValue) * circumference;
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
                            strokeDasharray={`${sliceValue} ${circumference}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-700 ease-out"
                            strokeLinecap={item.value > 0 ? "round" : "butt"}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                {totalLabel ? (
                    <p className="text-[14px] font-bold text-neutral-400 leading-[1.3] whitespace-pre-line">{totalLabel}</p>
                ) : (
                    <>
                        <p className="text-[12px] font-bold text-neutral-400 leading-tight">จากเอกสารทั้งหมด</p>
                        <p className="text-[20px] font-black text-[#1B1C1C] tracking-tighter">{totalValue} {unit}</p>
                    </>
                )}
            </div>
        </div>
    );

    if (variant === "card" || variant === "full") {
        return (
            <div className={cn(
                "bg-white p-8 h-full flex flex-col items-center",
                variant === "card" ? "rounded-[32px] border border-[#F6F3F2] shadow-[0_8px_30px_rgba(0,0,0,0.02)]" : "rounded-2xl"
            )}>
                {title && <div className="w-full text-left mb-8"><h3 className="text-[18px] font-black text-[#1B1C1C] tracking-tight">{title}</h3></div>}
                <div className="mb-10">{chartSVG}</div>
                <div className="w-full space-y-3 px-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-[14px] font-bold text-[#5F5E5E] group-hover:text-[#1B1C1C] transition-colors">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[15px] font-black text-[#1B1C1C]">{item.value}</span>
                                <span className="text-[12px] text-neutral-400 font-bold">{unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return chartSVG;
}

export default RopaDonutChart;
