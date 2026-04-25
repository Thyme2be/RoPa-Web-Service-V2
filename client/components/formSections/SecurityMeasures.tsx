"use client";
import React from "react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function SecurityMeasures({ form, handleChange, errors, disabled, variant = "owner", hideHeader = false }: any) {
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
        <div className="space-y-0">
            {/* Header: Security Icon */}
            {!hideHeader && (
                <div className="flex items-center gap-4 px-8 py-6">
                    <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                        <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                            security
                        </span>
                    </div>
                    <h2 className="font-bold text-[18px] text-[#5F5E5E] tracking-tight">
                        {sectionTitle}
                    </h2>
                </div>
            )}

            <div className={cn("px-8 pb-10 space-y-10", hideHeader && "pt-4")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {measures.map((m) => {
                        const value = (form as any)?.[m.id];
                        const isRequired = false; // All 6 security measures are now optional

                        return (
                            <div key={m.id} className="flex flex-col space-y-4">
                                <Input
                                    label={m.label}
                                    required={isRequired}
                                    name={m.id}
                                    value={value || ""}
                                    placeholder={m.placeholder}
                                    onChange={handleChange}
                                    error={errors?.[m.id]}
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
