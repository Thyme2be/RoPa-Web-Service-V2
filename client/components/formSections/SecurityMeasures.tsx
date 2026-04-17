"use client";
import React from "react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function SecurityMeasures({ form, handleChange, errors, disabled }: any) {
    const measures = [
        { id: "securityMeasures.organizational", label: "มาตรการเชิงองค์กร", icon: "corporate_fare", placeholder: "ระบุมาตรการเชิงองค์กร" },
        { id: "securityMeasures.accessControl", label: "การควบคุมการเข้าถึงข้อมูล", icon: "lock", placeholder: "ระบุการควบคุมการเข้าถึงข้อมูล" },
        { id: "securityMeasures.technical", label: "มาตรการเชิงเทคนิค", icon: "shield", placeholder: "ระบุมาตรการเชิงเทคนิค" },
        { id: "securityMeasures.responsibility", label: "การกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน", icon: "assignment_ind", placeholder: "ระบุการกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน" },
        { id: "securityMeasures.physical", label: "มาตรการทางกายภาพ", icon: "security", placeholder: "ระบุมาตรการทางกายภาพ" },
        { id: "securityMeasures.audit", label: "มาตรการการตรวจสอบย้อนหลัง", icon: "assignment_turned_in", placeholder: "ระบุมาตรการการตรวจสอบย้อนหลัง" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Security Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        security
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 7 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {measures.map((m) => {
                        const keys = m.id.split(".");
                        const value = keys.length === 2 
                            ? (form as any)[keys[0]]?.[keys[1]] 
                            : (form as any)[m.id];

                        return (
                            <div key={m.id} className="flex flex-col space-y-4">
                                {/* Top Label Box: White with Icon */}
                                <div className={cn(
                                    "flex items-center gap-4 px-5 py-4 bg-white border border-[#F0F2F5] rounded-2xl shadow-sm transition-all",
                                    disabled && "pointer-events-none"
                                )}>
                                    <div className="text-gray-500/80">
                                        <span className="material-symbols-outlined text-[20px]">
                                            {m.icon}
                                        </span>
                                    </div>
                                    <label className="text-[14px] font-extrabold text-[#5C403D] tracking-tight">
                                        {m.label}
                                    </label>
                                </div>

                                {/* Bottom Input Box: Standard Gray */}
                                <Input
                                    name={m.id}
                                    value={value || ""}
                                    placeholder={m.placeholder}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    className="bg-[#F6F3F2] border-none"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
