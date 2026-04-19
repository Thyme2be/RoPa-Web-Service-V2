"use client";
import React from "react";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function GeneralInfo({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";

    const titleOptions = [
        { label: "คำนำหน้า", value: "" },
        { label: "นาย", value: "นาย" },
        { label: "นาง", value: "นาง" },
        { label: "นางสาว", value: "นางสาว" },
    ];

    const markerColor = "#ED393C";

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px] overflow-hidden",
            borderLColor
        )}>
            {/* Header: Icon and Section Title to match image */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-red-brand text-2xl font-bold" style={{ color: primaryColor }}>
                        person_edit
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    {isProcessor ? "ส่วนที่ 1 : รายละเอียดของผู้ประมวลผล" : "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA"}
                </h2>
            </div>

            <div className="px-8 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Left Column: Name-Surname and Email */}
                    <div className="space-y-6">
                        {/* Unified Name-Surname Field */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                ชื่อ-นามสกุล <span className="font-bold" style={{ color: markerColor }}>*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-[130px] shrink-0">
                                    <Select
                                        name="title_prefix"
                                        value={form?.title_prefix || ""}
                                        options={titleOptions}
                                        onChange={handleChange}
                                        disabled={disabled}
                                        error={errors?.title_prefix}
                                        rounding="xl"
                                        placeholder="คำนำหน้า"
                                        primaryColor={primaryColor}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        name="first_name"
                                        value={form?.first_name || ""}
                                        placeholder="ระบุชื่อจริง"
                                        onChange={handleChange}
                                        error={errors?.first_name}
                                        disabled={disabled}
                                        containerClassName="space-y-0"
                                        focusColor={primaryColor}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        name="last_name"
                                        value={form?.last_name || ""}
                                        placeholder="ระบุนามสกุล"
                                        onChange={handleChange}
                                        error={errors?.last_name}
                                        disabled={disabled}
                                        containerClassName="space-y-0"
                                        focusColor={primaryColor}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Field */}
                        <Input
                            label="อีเมล"
                            required
                            name="email"
                            value={form?.email || ""}
                            placeholder="example@netbay.co.th"
                            onChange={handleChange}
                            error={errors?.email}
                            disabled={disabled}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                    </div>

                    {/* Right Column: Address and Phone */}
                    <div className="space-y-6">
                        {/* Address Field */}
                        <Input
                            label="ที่อยู่"
                            required
                            name="address"
                            value={form?.address || ""}
                            placeholder="ระบุที่อยู่"
                            onChange={handleChange}
                            error={errors?.address}
                            disabled={disabled}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />

                        {/* Phone Field */}
                        <Input
                            label="เบอร์โทรศัพท์"
                            required
                            name="phone"
                            value={form?.phone || ""}
                            placeholder="02-XXX-XXXX"
                            onChange={handleChange}
                            error={errors?.phone}
                            disabled={disabled}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
