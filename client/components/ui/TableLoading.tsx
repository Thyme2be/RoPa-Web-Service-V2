"use client";

import React from "react";

interface TableLoadingProps {
    colSpan: number;
    message?: string;
    subMessage?: string;
}

export default function TableLoading({
    colSpan,
    message = "กำลังโหลดข้อมูล...",
    subMessage = "กรุณารอสักครู่"
}: TableLoadingProps) {
    return (
        <tr className="animate-in fade-in duration-500">
            <td colSpan={colSpan} className="py-24">
                <div className="flex flex-col items-center justify-center gap-5">
                    {/* Modern Spinner */}
                    <div className="relative">
                        <div className="w-14 h-14 border-[4px] border-[#ED393C]/10 border-t-[#ED393C] rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#ED393C] rounded-full animate-pulse shadow-[0_0_10px_rgba(237,57,60,0.4)]"></div>
                        </div>
                    </div>

                    {/* Text Area */}
                    <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[17px] font-black text-[#1B1C1C] tracking-tight">
                            {message}
                        </span>
                        <span className="text-[14px] font-bold text-[#5F5E5E] opacity-60">
                            {subMessage}
                        </span>
                    </div>
                </div>
            </td>
        </tr>
    );
}
