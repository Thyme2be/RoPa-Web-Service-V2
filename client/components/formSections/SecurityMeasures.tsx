"use client";
import React from "react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function SecurityMeasures({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const sectionTitle = isProcessor ? "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)" : "ส่วนที่ 7 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)";

    const measures = [
        { id: "org_measures", label: "มาตรการเชิงองค์กร", icon: "corporate_fare", placeholder: "ระบุมาตรการเชิงองค์กร" },
        { id: "access_control_measures", label: "การควบคุมการเข้าถึงข้อมูล", icon: "lock", placeholder: "ระบุการควบคุมการเข้าถึงข้อมูล" },
        { id: "technical_measures", label: "มาตรการเชิงเทคนิค", icon: "shield", placeholder: "ระบุมาตรการเชิงเทคนิค" },
        { id: "responsibility_measures", label: "การกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน", icon: "assignment_ind", placeholder: "ระบุการกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน" },
        { id: "physical_measures", label: "มาตรการทางกายภาพ", icon: "security", placeholder: "ระบุมาตรการทางกายภาพ" },
        { id: "audit_measures", label: "มาตรการการตรวจสอบย้อนหลัง", icon: "assignment_turned_in", placeholder: "ระบุมาตรการการตรวจสอบย้อนหลัง" },
    ];

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px] overflow-hidden",
            borderLColor
        )}>
            {/* Header: Security Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        security
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {measures.map((m) => {
                        const value = (form as any)?.[m.id];

                        return (
                            <div key={m.id} className="flex flex-col space-y-4">
                                <Input
                                    label={m.label}
                                    name={m.id}
                                    value={value || ""}
                                    placeholder={m.placeholder}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    focusColor={primaryColor}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
