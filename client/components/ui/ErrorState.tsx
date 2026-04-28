"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
    colSpan?: number;
    isTable?: boolean;
}

export default function ErrorState({
    title = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
    description = "ไม่สามารถดึงข้อมูลจากระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    onRetry,
    className,
    colSpan = 1,
    isTable = true
}: ErrorStateProps) {
    const content = (
        <div className={cn("flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-top-4 duration-500", className)}>
            <div className="bg-[#ED393C]/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-[#ED393C]">
                    error
                </span>
            </div>
            <h3 className="text-[19px] font-black text-[#1B1C1C] tracking-tight mb-2">
                {title}
            </h3>
            <p className="text-[14px] font-bold text-[#5F5E5E] opacity-70 max-w-[320px] leading-relaxed mb-8">
                {description}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-8 h-12 bg-[#ED393C] text-white rounded-xl font-black text-[14px] shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                    ลองใหม่อีกครั้ง
                </button>
            )}
        </div>
    );

    if (isTable) {
        return (
            <tr>
                <td colSpan={colSpan}>
                    {content}
                </td>
            </tr>
        );
    }

    return content;
}
