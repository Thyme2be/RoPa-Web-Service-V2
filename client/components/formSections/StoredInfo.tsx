"use client";
import React from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import Checkbox from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

export default function StoredInfo({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const sectionTitle = isProcessor ? "ส่วนที่ 3 : ข้อมูลที่จัดเก็บ" : "ส่วนที่ 4 : ข้อมูลส่วนบุคคลที่จัดเก็บ";

    const markerColor = "#ED393C";

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px]",
            borderLColor
        )}>
            {/* Header: Category Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        category
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Column 1: MultiSelect */}
                    <div className="space-y-4">
                        <MultiSelect
                            label="ข้อมูลส่วนบุคคลที่จัดเก็บ"
                            required
                            placeholder="ข้อมูลส่วนบุคคลที่จัดเก็บ"
                            description={
                                <p className="text-[11px] font-bold tracking-tight" style={{ color: markerColor }}>
                                    (สามารถระบุได้มากกว่า 1)
                                </p>
                            }
                            options={[
                                "ชื่อ - นามสกุล",
                                "เลขประจำตัวประชาชน",
                                "วัน/เดือน/ปีเกิด",
                                "อีเมล",
                                "เบอร์โทรศัพท์",
                                "อื่นๆ",
                            ]}
                            selectedValues={form?.personal_data_items || []}
                            onChange={(values: string[]) => {
                                handleChange({ target: { name: "personal_data_items", value: values } } as any);
                            }}
                            error={errors?.personal_data_items}
                            disabled={disabled}
                            variant={variant}
                        />
                    </div>

                    {/* Column 2: Data Category */}
                    <div className="space-y-4" id="data_categories">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            หมวดหมู่ของข้อมูล <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </label>
                        <div className={cn(
                            "space-y-4 p-6 rounded-xl bg-[#F6F3F2] border transition-all",
                            errors?.data_categories ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent",
                            disabled && "pointer-events-none"
                        )}>
                            {["ข้อมูลลูกค้า", "คู่ค้า", "ผู้ติดต่อ", "พนักงาน"].map((cat, idx) => {
                                const values = ["customer", "partner", "contact", "employee"];
                                return (
                                    <Checkbox
                                        key={idx}
                                        label={cat}
                                        checked={!!form?.data_categories?.includes(values[idx])}
                                        onChange={(e: any) => {
                                            const current = form?.data_categories || [];
                                            const newVals = e.target.checked 
                                                ? [...current, values[idx]]
                                                : current.filter((v: string) => v !== values[idx]);
                                            handleChange({ target: { name: "data_categories", value: newVals } });
                                        }}
                                        disabled={disabled}
                                        themeColor={primaryColor}
                                    />
                                );
                            })}
                        </div>
                        {errors?.data_categories && (
                            <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {errors.data_categories}
                            </p>
                        )}
                    </div>

                    {/* Column 3: Data Type */}
                    <div className="space-y-4" id="data_types">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            ประเภทของข้อมูล <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </label>
                        <div className={cn(
                            "space-y-4 p-6 rounded-xl bg-[#F6F3F2] border transition-all",
                            errors?.data_types ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent",
                            disabled && "pointer-events-none"
                        )}>
                            <Checkbox
                                label="ข้อมูลทั่วไป"
                                checked={!!form?.data_types?.includes("general")}
                                onChange={(e: any) => {
                                    const current = Array.isArray(form?.data_types) ? form.data_types : (form?.data_types ? [form.data_types] : []);
                                    const newVals = e.target.checked ? [...current, "general"] : current.filter((v: string) => v !== "general");
                                    handleChange({ target: { name: "data_types", value: newVals } });
                                }}
                                disabled={disabled}
                                themeColor={primaryColor}
                            />
                            <Checkbox
                                label="ข้อมูลอ่อนไหว"
                                checked={!!form?.data_types?.includes("sensitive")}
                                onChange={(e: any) => {
                                    const current = Array.isArray(form?.data_types) ? form.data_types : (form?.data_types ? [form.data_types] : []);
                                    const newVals = e.target.checked ? [...current, "sensitive"] : current.filter((v: string) => v !== "sensitive");
                                    handleChange({ target: { name: "data_types", value: newVals } });
                                }}
                                disabled={disabled}
                                themeColor={primaryColor}
                            />
                        </div>
                        {errors?.data_types && (
                            <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {errors.data_types}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
