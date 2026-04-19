"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    doComplete?: boolean;
    dpComplete?: boolean;
}

export default function FormTabs({ activeTab, onTabChange, doComplete, dpComplete }: FormTabsProps) {
    const tabs = [
        {
            id: "owner",
            label: "ส่วนของผู้รับผิดชอบข้อมูล",
            complete: doComplete,
        },
        {
            id: "processor",
            label: "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล",
            complete: dpComplete,
        },
        {
            id: "risk",
            label: "การประเมินความเสี่ยงของเอกสาร",
            complete: undefined,
        },
        {
            id: "destruction",
            label: "ยื่นคำร้องขอทำลาย",
            complete: undefined,
        },
    ];

    return (
        <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar bg-[#F6F6F6] p-2 rounded-xl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "h-11 px-6 rounded-lg font-bold text-[14px] transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-1",
                        activeTab === tab.id
                            ? "bg-[#ED393C] text-white shadow-md"
                            : "bg-white text-[#1B1C1C] border border-[#E5E2E1] hover:bg-gray-50"
                    )}
                >
                    {tab.label}
                    {tab.complete && (
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            activeTab === tab.id ? "bg-[#ED393C]" : "bg-green-500"
                        )} />
                    )}
                </button>
            ))}
        </div>
    );
}
