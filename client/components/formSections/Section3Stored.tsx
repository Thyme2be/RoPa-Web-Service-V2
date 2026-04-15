"use client";

import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import RadioButton from "@/components/ui/RadioButton";
import MultiSelect from "@/components/ui/MultiSelect";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function Section3Stored({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary">
            {/* Header with Red Accent and Category Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center self-start">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        category
                    </span>
                </div>
                <div className="flex flex-col">
                    <h2 className="font-bold text-xl text-black tracking-tight">
                        ส่วนที่ 3 : ข้อมูลที่จัดเก็บ
                    </h2>
                </div>
            </div>

            <div className="px-8 pb-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Column 1: Personal Data Types (MultiSelect) */}
                    <div className="space-y-1">
                        <MultiSelect
                            label="ข้อมูลส่วนบุคคลที่จัดเก็บ"
                            placeholder="ข้อมูลส่วนบุคคลที่จัดเก็บ"
                            required
                            disabled={disabled}
                            description={
                                <p className="text-[11px] font-bold text-primary tracking-tight">
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
                        />

                        {/* Note: Storing "Other" value in the array directly via MultiSelect or separate handling */}
                        {form?.storedDataTypes?.includes("อื่นๆ") && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Input
                                    label="กรุณาระบุข้อมูลส่วนบุคคลอื่นๆ"
                                    name="storedDataTypesOther" // Update name to match new field
                                    value={form?.storedDataTypesOther || ""}
                                    placeholder="เช่น กรุ๊ปเลือด , ไอดีไลน์"
                                    required
                                    disabled={disabled}
                                    onChange={handleChange}
                                    error={errors?.storedDataTypesOther}
                                />
                            </div>
                        )}
                    </div>

                    {/* Column 2: Data Category (Checkboxes) */}
                    <div className="space-y-4">
                        <label className={cn(
                            "text-sm font-bold text-[#5C403D] block tracking-tight",
                            disabled && "opacity-60"
                        )}>
                            หมวดหมู่ของข้อมูล <span className="text-primary">*</span>
                        </label>
                        <div className={cn(
                            "space-y-2 p-6 rounded-2xl border transition-all",
                            errors?.dataCategories ? "bg-red-50/30 border-red-200" : "bg-[#F6F3F2] border-gray-50",
                            disabled && "opacity-60 pointer-events-none"
                        )}>
                            <Checkbox 
                                label="ข้อมูลลูกค้า" 
                                name="dataCategories[]" 
                                value="customer"
                                disabled={disabled}
                                checked={!!form?.dataCategories?.includes("customer")} 
                                onChange={handleChange} 
                            />
                            <Checkbox 
                                label="คู่ค้า" 
                                name="dataCategories[]" 
                                value="partner"
                                disabled={disabled}
                                checked={!!form?.dataCategories?.includes("partner")} 
                                onChange={handleChange} 
                            />
                            <Checkbox 
                                label="ผู้ติดต่อ" 
                                name="dataCategories[]" 
                                value="contact"
                                disabled={disabled}
                                checked={!!form?.dataCategories?.includes("contact")} 
                                onChange={handleChange} 
                            />
                            <Checkbox 
                                label="พนักงาน" 
                                name="dataCategories[]" 
                                value="employee"
                                disabled={disabled}
                                checked={!!form?.dataCategories?.includes("employee")} 
                                onChange={handleChange} 
                            />
                        </div>
                        {errors?.dataCategories && (
                            <p className="text-[11px] text-red-500 font-medium px-1 mt-1">
                                {errors.dataCategories}
                            </p>
                        )}
                    </div>

                    {/* Column 3: Type of Data (Radios) */}
                    <div className="space-y-4">
                        <label className={cn(
                            "text-sm font-bold text-[#5C403D] block tracking-tight",
                            disabled && "opacity-60"
                        )}>
                            ประเภทของข้อมูล <span className="text-primary">*</span>
                        </label>
                        <div className={cn(
                            "flex flex-col gap-3",
                            disabled && "pointer-events-none"
                        )}>
                            {errors?.dataType && (
                                <p className="text-[11px] text-red-500 font-medium px-1 mb-1">
                                    {errors.dataType}
                                </p>
                            )}
                            <RadioButton
                                label="ข้อมูลทั่วไป"
                                name="dataType"
                                value="general"
                                alignRight
                                disabled={disabled}
                                checked={form?.dataType === "general"}
                                onChange={handleChange}
                            />
                            <RadioButton
                                label="ข้อมูลอ่อนไหว"
                                name="dataType"
                                value="sensitive"
                                alignRight
                                disabled={disabled}
                                checked={form?.dataType === "sensitive"}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

