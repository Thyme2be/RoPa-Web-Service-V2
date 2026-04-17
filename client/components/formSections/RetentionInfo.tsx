"use client";
import React from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import MultiSelect from "@/components/ui/MultiSelect";
import { cn } from "@/lib/utils";

export default function RetentionInfo({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Storage and Retrieval Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        inventory_2
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 5 : การได้มาและการเก็บรักษา
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-8">
                {/* Top Level Grid: Method and Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            วิธีการได้มาซึ่งข้อมูล <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className="bg-[#F6F3F2] p-6 rounded-xl space-y-4">
                            <Checkbox
                                label="ข้อมูลอิเล็กทรอนิกส์"
                                checked={form?.collectionMethod === "soft_file"}
                                onChange={() => handleChange({ target: { name: "collectionMethod", value: "soft_file" } })}
                                disabled={disabled}
                            />
                            <Checkbox
                                label="เอกสาร"
                                checked={form?.collectionMethod === "hard_copy"}
                                onChange={() => handleChange({ target: { name: "collectionMethod", value: "hard_copy" } })}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            แหล่งที่ได้มาซึ่งข้อมูล <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className="bg-[#F6F3F2] p-6 rounded-xl space-y-4">
                            <Checkbox
                                label="จากเจ้าของข้อมูลโดยตรง"
                                checked={!!form?.dataSource?.direct}
                                onChange={(e: any) => handleChange({ target: { name: "dataSource.direct", value: e.target.checked } })}
                                disabled={disabled}
                            />
                            <div className="flex items-center gap-3 h-6">
                                <Checkbox
                                    label="จากแหล่งอื่น โปรดระบุ"
                                    checked={!!form?.dataSource?.indirect}
                                    onChange={(e: any) => handleChange({ target: { name: "dataSource.indirect", value: e.target.checked } })}
                                    disabled={disabled}
                                />
                                <input
                                    className="flex-1 bg-white border-none rounded-full h-8 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED393C]/20 shadow-sm transition-all"
                                    disabled={!form?.dataSource?.indirect || disabled}
                                    placeholder=""
                                    value={form?.dataSource?.indirectText || ""}
                                    onChange={(e) => handleChange({ target: { name: "dataSource.indirectText", value: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nested Policy Box */}
                <div className="bg-[#F6F6F6] p-8 rounded-2xl space-y-8 border border-[#F0F2F5]">
                    <h3 className="font-extrabold text-[#1B1C1C] text-[15px] tracking-tight">
                        นโยบายการเก็บรักษาข้อมูลส่วนบุคคล
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Storage Details */}
                        <div className="space-y-4">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                ประเภทของข้อมูลที่จัดเก็บ <span className="text-[#ED393C] font-bold">*</span>
                            </label>
                            <div className="bg-[#F6F3F2] p-6 rounded-xl space-y-4">
                                <Checkbox
                                    label="ข้อมูลอิเล็กทรอนิกส์"
                                    checked={form?.retention?.storageType === "soft_file"}
                                    onChange={() => handleChange({ target: { name: "retention.storageType", value: "soft_file" } })}
                                    disabled={disabled}
                                />
                                <Checkbox
                                    label="เอกสาร"
                                    checked={form?.retention?.storageType === "hard_copy"}
                                    onChange={() => handleChange({ target: { name: "retention.storageType", value: "hard_copy" } })}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                วิธีการเก็บรักษาข้อมูล <span className="text-[#ED393C] font-bold">*</span>
                                &nbsp;<span className="text-[#ED393C] font-bold text-[11px]">(สามารถระบุได้มากกว่า 1)</span>
                            </label>
                            <div className="bg-[#F6F3F2] p-0 rounded-xl overflow-hidden">
                                <Select
                                    name="retention.method"
                                    placeholder="วิธีการเก็บรักษาข้อมูล"
                                    value={form?.retention?.method || ""}
                                    options={[
                                        { label: "Cloud Storage", value: "cloud" },
                                        { label: "Server", value: "server" },
                                        { label: "ตู้เอกสาร", value: "cabinet" }
                                    ]}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    rounding="xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Retention Duration Row */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            ระยะเวลาการเก็บรักษาข้อมูลส่วนบุคคล <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Input
                                    name="retention.duration"
                                    value={form?.retention?.duration || ""}
                                    placeholder="ระบุระยะเวลา (เช่น 5)"
                                    onChange={handleChange}
                                    disabled={disabled}
                                    containerClassName="space-y-0"
                                />
                            </div>
                            <div className="w-[120px]">
                                <Select
                                    name="retention.unit"
                                    value={form?.retention?.unit || "year"}
                                    options={[
                                        { label: "ปี", value: "year" },
                                        { label: "เดือน", value: "month" },
                                        { label: "วัน", value: "day" },
                                    ]}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    rounding="xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rights and Deletion (White BG Inputs) */}
                    <div className="space-y-6">
                        <Input
                            label="สิทธิและวิธีการเข้าถึงข้อมูลส่วนบุคคล"
                            required
                            name="retention.accessControl"
                            value={form?.retention?.accessControl || ""}
                            placeholder="ระบุเงื่อนไขการใช้สิทธิและวิธีการ (เช่น กำหนดสิทธิเฉพาะผู้มีสิทธิ/ฝ่ายขาย/ฝ่าย IT)"
                            onChange={handleChange}
                            disabled={disabled}
                            className="bg-white"
                        />
                        <Input
                            label="วิธีการลบหรือทำลายข้อมูลส่วนบุคคลเมื่อสิ้นสุดระยะเวลาจัดเก็บ"
                            required
                            name="retention.deletionMethod"
                            value={form?.retention?.deletionMethod || ""}
                            placeholder="ระบุวิธีการลบหรือทำลายข้อมูลส่วนบุคคล (เช่น เครื่องทำลายเอกสาร)"
                            onChange={handleChange}
                            disabled={disabled}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
