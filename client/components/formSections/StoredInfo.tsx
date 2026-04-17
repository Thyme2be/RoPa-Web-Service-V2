"use client";
import React from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import Checkbox from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

export default function StoredInfo({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Category Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        category
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 4 : ข้อมูลส่วนบุคคลที่จัดเก็บ
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
                                <p className="text-[11px] font-bold text-[#ED393C] tracking-tight">
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
                            selectedValues={form?.storedDataTypes || []}
                            onChange={(values: string[]) => {
                                handleChange({ target: { name: "storedDataTypes", value: values } } as any);
                            }}
                            error={errors?.storedDataTypes}
                            disabled={disabled}
                        />
                    </div>

                    {/* Column 2: Data Category */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            หมวดหมู่ของข้อมูล <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className={cn(
                            "space-y-4 p-6 rounded-xl bg-[#F6F3F2]",
                            disabled && "pointer-events-none"
                        )}>
                            {["ข้อมูลลูกค้า", "คู่ค้า", "ผู้ติดต่อ", "พนักงาน"].map((cat, idx) => {
                                const values = ["customer", "partner", "contact", "employee"];
                                return (
                                    <Checkbox
                                        key={idx}
                                        label={cat}
                                        checked={!!form?.dataCategories?.includes(values[idx])}
                                        onChange={(e: any) => {
                                            const current = form?.dataCategories || [];
                                            const newVals = e.target.checked 
                                                ? [...current, values[idx]]
                                                : current.filter((v: string) => v !== values[idx]);
                                            handleChange({ target: { name: "dataCategories", value: newVals } });
                                        }}
                                        disabled={disabled}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Column 3: Data Type */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            ประเภทของข้อมูล <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className={cn(
                            "space-y-4 p-6 rounded-xl bg-[#F6F3F2]",
                            disabled && "pointer-events-none"
                        )}>
                            <Checkbox
                                label="ข้อมูลทั่วไป"
                                checked={!!form?.dataType?.includes("general")}
                                onChange={(e: any) => {
                                    const current = Array.isArray(form?.dataType) ? form.dataType : (form?.dataType ? [form.dataType] : []);
                                    const newVals = e.target.checked ? [...current, "general"] : current.filter((v: string) => v !== "general");
                                    handleChange({ target: { name: "dataType", value: newVals } });
                                }}
                                disabled={disabled}
                            />
                            <Checkbox
                                label="ข้อมูลอ่อนไหว"
                                checked={!!form?.dataType?.includes("sensitive")}
                                onChange={(e: any) => {
                                    const current = Array.isArray(form?.dataType) ? form.dataType : (form?.dataType ? [form.dataType] : []);
                                    const newVals = e.target.checked ? [...current, "sensitive"] : current.filter((v: string) => v !== "sensitive");
                                    handleChange({ target: { name: "dataType", value: newVals } });
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
