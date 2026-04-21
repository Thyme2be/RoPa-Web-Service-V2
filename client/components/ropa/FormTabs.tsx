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
        <div className="flex items-center gap-4 w-full overflow-x-auto no-scrollbar mb-6">
            {tabs.map((tab) => {
                const isDestruction = tab.id === "destruction";
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "h-[42px] px-6 rounded-md font-bold text-[14px] transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm",
                            isActive
                                ? "bg-[#ED393C] text-white border border-[#ED393C]"
                                : "bg-[#F8F9FA] text-[#1B1C1C] border border-[#E5E2E1] hover:bg-gray-50"
                        )}
                    >
                        {tab.label}
                        {tab.complete && (
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isActive ? "bg-white" : "bg-green-500"
                            )} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
