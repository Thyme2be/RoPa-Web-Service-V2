"use client";

import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function Section6TOMs({ form, handleChange, errors, disabled }: any) {
    const measures = [
        { id: "securityMeasures.organizational", label: "มาตรการเชิงองค์กร", icon: "corporate_fare", placeholder: "ระบุมาตรการเชิงองค์กร" },
        { id: "securityMeasures.accessControl", label: "การควบคุมการเข้าถึงข้อมูล", icon: "lock", placeholder: "ระบุการควบคุมการเข้าถึงข้อมูล" },
        { id: "securityMeasures.technical", label: "มาตรการเชิงเทคนิค", icon: "shield", placeholder: "ระบุมาตรการเชิงเทคนิค" },
        { id: "securityMeasures.responsibility", label: "การกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน", icon: "assignment_ind", placeholder: "ระบุการกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน" },
        { id: "securityMeasures.physical", label: "มาตรการทางกายภาพ", icon: "security", placeholder: "ระบุมาตรการทางกายภาพ" },
        { id: "securityMeasures.audit", label: "มาตรการการตรวจสอบย้อนหลัง", icon: "assignment_turned_in", placeholder: "ระบุมาตรการการตรวจสอบย้อนหลัง" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary">
            {/* Header with Red Accent and Security Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        policy
                    </span>
                </div>
                <h2 className="font-bold text-xl text-black tracking-tight">
                    ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)
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
                                <div className={cn(
                                    "flex items-center gap-4 px-5 py-4 bg-white border border-[#F0F2F5] rounded-2xl shadow-sm",
                                    disabled && "opacity-60"
                                )}>
                                    <div className="text-gray-500/80">
                                        <span className="material-symbols-outlined text-[22px]">
                                            {m.icon}
                                        </span>
                                    </div>
                                    <label className="text-sm font-bold text-[#5C403D] tracking-tight">
                                        {m.label}
                                    </label>
                                </div>

                                <Input
                                    name={m.id}
                                    value={value || ""}
                                    placeholder={m.placeholder}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
