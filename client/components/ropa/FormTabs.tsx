"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { id: "owner", label: "ส่วนของผู้รับผิดชอบข้อมูล" },
    { id: "processor", label: "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" },
    { id: "risk", label: "การประเมินความเสี่ยงของเอกสาร" },
    { id: "destruction", label: "ยื่นคำร้องขอทำลาย" },
];

export default function FormTabs({ activeTab, onTabChange }: FormTabsProps) {
    return (
        <div className="flex items-center gap-2 w-full px-10">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "h-12 px-6 rounded-lg font-bold text-sm transition-all flex items-center justify-center whitespace-nowrap border shadow-sm",
                        activeTab === tab.id
                            ? "bg-[#ED393C] text-white border-[#ED393C] shadow-red-200"
                            : "bg-[#F6F3F2] text-[#5C403D] border-[#E5E2E1] hover:bg-white"
                    )}
                >
                    {tab.label}
                </button>
            ))}
            
            <button className="ml-auto flex items-center gap-2 text-[#ED393C] font-bold text-sm hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                แก้ไขเอกสาร
            </button>
        </div>
    );
}
