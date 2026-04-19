"use client";
import React from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import MultiSelect from "@/components/ui/MultiSelect";
import { cn } from "@/lib/utils";

export default function RetentionInfo({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const ringColor = isProcessor ? "focus:ring-[#00666E]/20" : "focus:ring-[#ED393C]/20";
    const sectionTitle = isProcessor ? "ส่วนที่ 4 : การได้มาและการเก็บรักษา" : "ส่วนที่ 5 : การได้มาและการเก็บรักษา";
    const markerColor = "#ED393C";

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px]",
            borderLColor
        )}>
            {/* Header: Storage and Retrieval Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        inventory_2
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#5F5E5E] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-8">
                {/* Top Level Grid: Method and Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-4" id={isProcessor ? "collection_methods" : "collection_method"}>
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            วิธีการได้มาซึ่งข้อมูล <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </label>
                        <div className={cn(
                            "bg-[#F6F3F2] p-6 rounded-xl space-y-4 border transition-all",
                            (errors?.collection_method || errors?.collection_methods) ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent"
                        )}>
                            <Checkbox
                                label="ข้อมูลอิเล็กทรอนิกส์"
                                checked={isProcessor ? form?.collection_methods?.includes("soft_file") : form?.collection_method === "soft_file"}
                                onChange={() => handleChange({ target: { name: isProcessor ? "collection_methods[]" : "collection_method", value: "soft_file" } })}
                                disabled={disabled}
                                themeColor={primaryColor}
                            />
                            <Checkbox
                                label="เอกสาร"
                                checked={isProcessor ? form?.collection_methods?.includes("hard_copy") : form?.collection_method === "hard_copy"}
                                onChange={() => handleChange({ target: { name: isProcessor ? "collection_methods[]" : "collection_method", value: "hard_copy" } })}
                                disabled={disabled}
                            />
                        </div>
                        {(errors?.collection_method || errors?.collection_methods) && (
                            <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {errors.collection_method || errors.collection_methods}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4" id={isProcessor ? "data_sources" : "data_source"}>
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            แหล่งที่ได้มาซึ่งข้อมูล <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </label>
                        <div className={cn(
                            "bg-[#F6F3F2] p-6 rounded-xl space-y-4 border transition-all",
                            (errors?.data_source || errors?.data_sources) ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent"
                        )}>
                            <Checkbox
                                label="จากเจ้าของข้อมูลโดยตรง"
                                checked={isProcessor ? form?.data_sources?.includes("direct") : !!form?.data_source_direct}
                                onChange={(e: any) => {
                                    if (isProcessor) {
                                        handleChange({ target: { name: "data_sources[]", value: "direct" } });
                                    } else {
                                        handleChange({ target: { name: "data_source_direct", value: e.target.checked } });
                                    }
                                }}
                                disabled={disabled}
                            />
                            <div className="flex items-center gap-3 h-6">
                                <Checkbox
                                    label="จากแหล่งอื่น โปรดระบุ"
                                    checked={isProcessor ? form?.data_sources?.includes("indirect") : !!form?.data_source_indirect}
                                    onChange={(e: any) => {
                                        if (isProcessor) {
                                            handleChange({ target: { name: "data_sources[]", value: "indirect" } });
                                        } else {
                                            handleChange({ target: { name: "data_source_indirect", value: e.target.checked } });
                                        }
                                    }}
                                    disabled={disabled}
                                />
                                <input
                                    className={cn(
                                        "flex-1 bg-white border-none rounded-full h-8 px-4 text-sm focus:outline-none focus:ring-2 shadow-sm transition-all",
                                        ringColor
                                    )}
                                    disabled={isProcessor ? !form?.data_sources?.includes("indirect") : (!form?.data_source_indirect || disabled)}
                                    placeholder=""
                                    value={form?.data_source_other || ""}
                                    onChange={(e) => handleChange({ target: { name: "data_source_other", value: e.target.value } })}
                                />
                            </div>
                        </div>
                        {(errors?.data_source || errors?.data_sources) && (
                            <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {errors.data_source || errors.data_sources}
                            </p>
                        )}
                    </div>
                </div>

                {/* Nested Policy Box */}
                <div className="bg-[#F6F6F6] p-8 rounded-2xl space-y-8 border border-[#F0F2F5]">
                    <h3 className="font-extrabold text-[#5F5E5E] text-[15px] tracking-tight">
                        นโยบายการเก็บรักษาข้อมูลส่วนบุคคล
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Storage Details */}
                        <div className="space-y-4">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                ประเภทของข้อมูลที่จัดเก็บ <span className="font-bold" style={{ color: markerColor }}>*</span>
                            </label>
                            <div className={cn(
                                "bg-[#F6F3F2] p-6 rounded-xl space-y-4 border transition-all",
                                errors?.storageType ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent"
                            )}>
                                <Checkbox
                                    label="ข้อมูลอิเล็กทรอนิกส์"
                                    checked={form?.retention?.storageType === "soft_file"}
                                    onChange={() => handleChange({ target: { name: "retention.storageType", value: "soft_file" } })}
                                    disabled={disabled}
                                    themeColor={primaryColor}
                                />
                                <Checkbox
                                    label="เอกสาร"
                                    checked={form?.retention?.storageType === "hard_copy"}
                                    onChange={() => handleChange({ target: { name: "retention.storageType", value: "hard_copy" } })}
                                    disabled={disabled}
                                />
                            </div>
                            {errors?.storageType && (
                                <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {errors.storageType}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <MultiSelect
                                label="วิธีการเก็บรักษาข้อมูล"
                                required
                                description={
                                    <p className="text-[11px] font-bold tracking-tight" style={{ color: markerColor }}>
                                        (สามารถระบุได้มากกว่า 1)
                                    </p>
                                }
                                options={[
                                    "เข้ารหัส",
                                    "ใส่แฟ้ม",
                                    "เก็บในตู้เอกสารหรือสแกนเป็นไฟล์",
                                    "อื่นๆ"
                                ]}
                                selectedValues={form?.storage_methods || []}
                                onChange={(values: string[]) => {
                                    handleChange({ target: { name: "storage_methods", value: values } } as any);
                                }}
                                error={errors?.storage_methods}
                                disabled={disabled}
                                placeholder="เลือกวิธีการเก็บรักษา..."
                            />

                            {/* "Other" specification field - visible only when "อื่นๆ" is selected */}
                            {form?.storage_methods?.includes("อื่นๆ") && (
                                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <Input
                                        label="รายละเอียดวิธีการเก็บรักษาอื่น ๆ"
                                        name="storage_methods_other"
                                        value={form?.storage_methods_other || ""}
                                        placeholder="โปรดระบุรายละเอียด (เช่น พิมพ์ออกมาเก็บในตู้เซฟ)"
                                        onChange={handleChange}
                                        disabled={disabled}
                                        focusColor={primaryColor}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Retention Duration Row */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            ระยะเวลาการเก็บรักษาข้อมูลส่วนบุคคล <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Input
                                    name="retention_value"
                                    value={form?.retention_value !== undefined ? form.retention_value : ""}
                                    placeholder="ระบุตัวเลขระยะเวลา (เช่น 5)"
                                    onChange={handleChange}
                                    error={errors?.retention_value}
                                    disabled={disabled}
                                    containerClassName="space-y-0"
                                    focusColor={primaryColor}
                                />
                            </div>
                            <div className="w-[120px]">
                                <Select
                                    name="retention_unit"
                                    value={form?.retention_unit || "YEARS"}
                                    options={[
                                        { label: "ปี", value: "YEARS" },
                                        { label: "เดือน", value: "MONTHS" },
                                        { label: "วัน", value: "DAYS" },
                                    ]}
                                    onChange={handleChange}
                                    disabled={disabled}
                                    rounding="xl"
                                    focusColor={primaryColor}
                                    primaryColor={primaryColor}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rights and Deletion (White BG Inputs) */}
                    <div className="space-y-6">
                        <Input
                            label="สิทธิและวิธีการเข้าถึงข้อมูลส่วนบุคคล"
                            required
                            name="access_condition"
                            value={form?.access_condition || ""}
                            placeholder="ระบุเงื่อนไขการใช้สิทธิและวิธีการ (เช่น กำหนดสิทธิเฉพาะผู้มีสิทธิ/ฝ่ายขาย/ฝ่าย IT)"
                            onChange={handleChange}
                            error={errors?.access_condition}
                            disabled={disabled}
                            className="bg-white"
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                        <Input
                            label="วิธีการลบหรือทำลายข้อมูลส่วนบุคคลเมื่อสิ้นสุดระยะเวลาจัดเก็บ"
                            required
                            name="deletion_method"
                            value={form?.deletion_method || ""}
                            placeholder="ระบุวิธีการลบหรือทำลายข้อมูลส่วนบุคคล (เช่น เครื่องทำลายเอกสาร)"
                            onChange={handleChange}
                            error={errors?.deletion_method}
                            disabled={disabled}
                            className="bg-white"
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
