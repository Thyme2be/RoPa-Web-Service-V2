"use client";
import React from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function GeneralInfo({ form, handleChange, errors, disabled }: any) {
    const titleOptions = [
        { label: "คำนำหน้า", value: "" },
        { label: "นาย", value: "นาย" },
        { label: "นาง", value: "นาง" },
        { label: "นางสาว", value: "นางสาว" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Icon and Section Title to match image */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        person_edit
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA
                </h2>
            </div>

            <div className="px-8 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Left Column: Name-Surname and Email */}
                    <div className="space-y-6">
                        {/* Unified Name-Surname Field */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                ชื่อ-นามสกุล <span className="text-[#ED393C] font-bold">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-[130px] shrink-0">
                                    <Select
                                        name="title"
                                        value={form?.title || ""}
                                        options={titleOptions}
                                        onChange={handleChange}
                                        disabled={disabled}
                                        error={errors?.title}
                                        rounding="xl"
                                        placeholder="คำนำหน้า"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        name="firstName"
                                        value={form?.firstName || ""}
                                        placeholder="ระบุชื่อจริง"
                                        onChange={handleChange}
                                        error={errors?.firstName}
                                        disabled={disabled}
                                        containerClassName="space-y-0"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        name="lastName"
                                        value={form?.lastName || ""}
                                        placeholder="ระบุนามสกุล"
                                        onChange={handleChange}
                                        error={errors?.lastName}
                                        disabled={disabled}
                                        containerClassName="space-y-0"
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
                        />

                        {/* Phone Field */}
                        <Input
                            label="เบอร์โทรศัพท์"
                            required
                            name="phoneNumber"
                            value={form?.phoneNumber || ""}
                            placeholder="02-XXX-XXXX"
                            onChange={handleChange}
                            error={errors?.phoneNumber}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
