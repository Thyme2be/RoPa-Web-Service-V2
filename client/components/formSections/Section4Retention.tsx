"use client";

import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import RadioButton from "@/components/ui/RadioButton";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import { cn } from "@/lib/utils";

export default function Section4Retention({ form, handleChange, errors, disabled }: any) {
    const storageOptions = [
        "เข้ารหัส",
        "ใส่แฟ้ม",
        "เก็บในตู้เอกสารหรือสแกนเป็นไฟล์",
        "อื่นๆ"
    ];

    const handleMultiChange = (name: string, values: string[]) => {
        handleChange({
            target: {
                name,
                value: values,
            },
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary" id="section-4">
            {/* Header with Red Accent and Storage Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        inventory_2
                    </span>
                </div>
                <h2 className="font-bold text-xl text-black tracking-tight">
                    ส่วนที่ 4 : การได้มาและการเก็บรักษา
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                {/* Mode and Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight">
                            วิธีการได้มาซึ่งข้อมูล <span className="text-primary">*</span>
                        </label>
                        <div className={cn(
                            "grid grid-cols-2 gap-3 p-1 rounded-xl transition-all",
                            errors?.collectionMethod ? "bg-red-50/50" : "",
                            disabled && "pointer-events-none opacity-60"
                        )}>
                            <RadioButton
                                label="ข้อมูลอิเล็กทรอนิกส์"
                                name="collectionMethod"
                                value="soft file"
                                checked={form?.collectionMethod === "soft file"}
                                onChange={handleChange}
                                alignRight
                                disabled={disabled}
                            />
                            <RadioButton
                                label="เอกสาร"
                                name="collectionMethod"
                                value="hard copy"
                                checked={form?.collectionMethod === "hard copy"}
                                onChange={handleChange}
                                alignRight
                                disabled={disabled}
                            />
                        </div>
                        {errors?.collectionMethod && (
                            <p className="text-[11px] text-red-500 font-medium px-1 mt-1">
                                {errors.collectionMethod}
                            </p>
                        )}
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight">
                            แหล่งที่ได้มาซึ่งข้อมูล <span className="text-primary">*</span>
                        </label>
                        <div className={cn(
                            "grid grid-cols-2 gap-3 p-1 rounded-xl transition-all",
                            errors?.dataSource ? "bg-red-50/50" : "",
                            disabled && "pointer-events-none opacity-60"
                        )}>
                            <RadioButton
                                label="จากเจ้าของข้อมูลโดยตรง"
                                name="dataSource.direct"
                                value="true"
                                checked={!!form?.dataSource?.direct}
                                onChange={handleChange}
                                alignRight
                                disabled={disabled}
                            />
                            <RadioButton
                                label="จากแหล่งอื่น"
                                name="dataSource.indirect"
                                value="true"
                                checked={!!form?.dataSource?.indirect}
                                onChange={handleChange}
                                alignRight
                                disabled={disabled}
                            />
                        </div>
                        {errors?.dataSource && (
                            <p className="text-[11px] text-red-500 font-medium px-1 mt-1">
                                {errors.dataSource}
                            </p>
                        )}
                    </div>
                </div>

                {/* Policy Area Container - Standardized White Background */}
                <div className="p-8 bg-white rounded-3xl space-y-8 border border-[#F0F2F5]">
                    <h3 className="font-bold text-black text-base">นโยบายการเก็บรักษาข้อมูลส่วนบุคคล</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Checkboxes column */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight">
                                ประเภทของข้อมูลที่จัดเก็บ <span className="text-primary">*</span>
                            </label>
                            <div className={cn(
                                "space-y-3 bg-[#F6F3F2] p-6 rounded-2xl border border-[#F6F3F2]",
                                disabled && "opacity-60 pointer-events-none"
                            )}>
                                <Checkbox
                                    label="ข้อมูลอิเล็กทรอนิกส์"
                                    name="retention.storageType"
                                    value="soft file"
                                    checked={form?.retention?.storageType === "soft file"}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                                <Checkbox
                                    label="เอกสาร"
                                    name="retention.storageType"
                                    value="hard copy"
                                    checked={form?.retention?.storageType === "hard copy"}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>
                            {errors?.storageType && (
                                <p className="text-[11px] text-red-500 font-medium px-1 mt-1">
                                    {errors.storageType}
                                </p>
                            )}
                        </div>

                        {/* MultiSelect column */}
                        <div className="space-y-4">
                             <MultiSelect
                                label="วิธีการเก็บรักษาข้อมูล"
                                placeholder="วิธีการเก็บรักษาข้อมูล"
                                options={storageOptions}
                                selectedValues={form?.retention?.method || []}
                                onChange={(values) => handleChange({ target: { name: "retention.method", value: values } })}
                                required
                                error={errors?.retentionMethod}
                                disabled={disabled}
                                description={
                                    <span className="text-[11px] font-bold text-primary tracking-tight">
                                        (ระบุวิธีการหลัก)
                                    </span>
                                }
                            />
                        </div>
                    </div>

                    {/* Footer Inputs - Now inside the grey box */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight">
                                ระยะเวลาการเก็บรักษาข้อมูลส่วนบุคคล <span className="text-primary">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-x-4">
                                <div className="md:col-span-3">
                                    <Input
                                        name="retention.duration"
                                        type="number"
                                        min="1"
                                        value={form?.retention?.duration || ""}
                                        placeholder="ระบุระยะเวลา (เช่น 5)"
                                        required
                                        onChange={handleChange}
                                        error={errors?.retentionDuration}
                                        disabled={disabled}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                     <Select
                                        name="retention.unit"
                                        value={form?.retention?.unit || "year"}
                                        onChange={handleChange}
                                        disabled={disabled}
                                        options={[
                                            { label: "ปี", value: "year" },
                                            { label: "เดือน", value: "month" },
                                            { label: "วัน", value: "day" },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>

                         <Input
                            label="สิทธิและวิธีการเข้าถึงข้อมูลส่วนบุคคล"
                            name="retention.accessControl"
                            value={form?.retention?.accessControl || ""}
                            placeholder="ระบุเงื่อนไขการใช้สิทธิและวิธีการ (เช่น กำหนดสิทธิเฉพาะผู้มีสิทธิ/ฝ่ายขาย/ฝ่าย IT)"
                            required
                            onChange={handleChange}
                            error={errors?.accessControl}
                            disabled={disabled}
                        />

                         <Input
                            label="วิธีการลบหรือทำลายข้อมูลส่วนบุคคลเมื่อสิ้นสุดระยะเวลาจัดเก็บ"
                            name="retention.deletionMethod"
                            value={form?.retention?.deletionMethod || ""}
                            placeholder="ระบุวิธีการลบหรือทำลายข้อมูลส่วนบุคคล (เช่น เครื่องทำลายเอกสาร)"
                            required
                            onChange={handleChange}
                            error={errors?.deletionMethod}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
