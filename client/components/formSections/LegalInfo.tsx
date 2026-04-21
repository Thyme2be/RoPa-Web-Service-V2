"use client";
import React from "react";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

export default function LegalInfo({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const markerColor = "#ED393C";
    const sectionTitle = isProcessor ? "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ" : "ส่วนที่ 6 : ฐานทางกฎหมายและการส่งต่อ";
    const isTransfer = form?.internationalTransfer?.isTransfer;

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px]",
            borderLColor
        )}>
            {/* Header: Legal Basis and Transfer */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        verified_user
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#5F5E5E] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-8">
                <div className={cn("grid grid-cols-1 gap-y-6", !isProcessor && "md:grid-cols-2 gap-x-12")}>
                    <Input
                        label="ฐานในการประมวลผล"
                        required
                        id="legal_basis"
                        name="legal_basis"
                        value={form?.legal_basis || ""}
                        placeholder="ระบุฐานในการประมวลผล (เช่น ฐานปฏิบัติตามสัญญา)"
                        onChange={handleChange}
                        error={errors?.legal_basis}
                        disabled={disabled}
                        requiredColor={markerColor}
                        focusColor={primaryColor}
                    />

                    {!isProcessor && (
                        <div className="space-y-4" id="minor_consent_types">
                            <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                                การขอความยินยอมของผู้เยาว์ <span className="font-bold" style={{ color: markerColor }}>*</span>
                            </label>
                            <div className={cn(
                                "bg-[#F6F3F2] p-6 rounded-xl space-y-3 border transition-all",
                                errors?.minor_consent_types ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent"
                            )}>
                                <Checkbox
                                    label="อายุไม่เกิน 10 ปี"
                                    checked={form?.minor_consent_types?.includes("UNDER_10")}
                                    onChange={(e: any) => {
                                        const checked = e.target.checked;
                                        let newTypes = [...(form.minor_consent_types || [])];
                                        if (checked) {
                                            newTypes = [...newTypes.filter(t => t !== "NONE"), "UNDER_10"];
                                        } else {
                                            newTypes = newTypes.filter(t => t !== "UNDER_10");
                                        }
                                        handleChange({ target: { name: "minor_consent_types", value: newTypes } });
                                    }}
                                    disabled={disabled}
                                />
                                <Checkbox
                                    label="อายุ 10 - 20 ปี"
                                    checked={form?.minor_consent_types?.includes("AGE_10_20")}
                                    onChange={(e: any) => {
                                        const checked = e.target.checked;
                                        let newTypes = [...(form.minor_consent_types || [])];
                                        if (checked) {
                                            newTypes = [...newTypes.filter(t => t !== "NONE"), "AGE_10_20"];
                                        } else {
                                            newTypes = newTypes.filter(t => t !== "AGE_10_20");
                                        }
                                        handleChange({ target: { name: "minor_consent_types", value: newTypes } });
                                    }}
                                    disabled={disabled}
                                    themeColor={primaryColor}
                                />
                                <Checkbox
                                    label="ไม่มีการขอความยินยอมของผู้เยาว์"
                                    checked={form?.minor_consent_types?.includes("NONE")}
                                    onChange={(e: any) => {
                                        const checked = e.target.checked;
                                        const newTypes = checked ? ["NONE"] : [];
                                        handleChange({ target: { name: "minor_consent_types", value: newTypes } });
                                    }}
                                    disabled={disabled}
                                    themeColor={primaryColor}
                                />
                            </div>
                            {errors?.minor_consent_types && (
                                <p className="text-[11px] text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {errors.minor_consent_types}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Nested Box: International Transfer */}
                <div className={cn(
                    "bg-[#F6F6F6] p-8 rounded-2xl relative space-y-8 border transition-all",
                    errors?.has_cross_border_transfer ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/30" : "border-transparent"
                )} id="has_cross_border_transfer">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-extrabold text-[#5F5E5E] text-[15px] tracking-tight">
                            ส่งหรือโอนข้อมูลส่วนบุคคลไปยังต่างประเทศ <span className="font-bold" style={{ color: markerColor }}>*</span>
                        </h3>

                        {/* Radio Selection: มี / ไม่มี to match image */}
                        <div className="flex items-center gap-6 pr-4">
                            <button
                                onClick={() => !disabled && handleChange({ target: { name: "has_cross_border_transfer", value: true } })}
                                className="flex items-center gap-2 group cursor-pointer"
                                disabled={disabled}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                    form?.has_cross_border_transfer ? "border-gray-400" : "border-gray-300"
                                )} style={form?.has_cross_border_transfer ? { borderColor: primaryColor } : {}}>
                                    {form?.has_cross_border_transfer && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                                </div>
                                <span className={cn("text-sm font-bold transition-all", form?.has_cross_border_transfer ? "text-[#1B1C1C]" : "text-gray-400")}>มี</span>
                            </button>
                            <button
                                onClick={() => !disabled && handleChange({ target: { name: "has_cross_border_transfer", value: false } })}
                                className="flex items-center gap-2 group cursor-pointer"
                                disabled={disabled}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                    form?.has_cross_border_transfer === false ? "border-gray-400" : "border-gray-300"
                                )} style={form?.has_cross_border_transfer === false ? { borderColor: primaryColor } : {}}>
                                    {form?.has_cross_border_transfer === false && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                                </div>
                                <span className={cn("text-sm font-bold transition-all", form?.has_cross_border_transfer === false ? "text-[#1B1C1C]" : "text-gray-400")}>ไม่มี</span>
                            </button>
                        </div>
                    </div>
                    {errors?.has_cross_border_transfer && (
                        <p className="text-[11px] text-red-500 font-medium px-1 mt-[-20px] animate-in fade-in slide-in-from-top-1 duration-200">
                            {errors.has_cross_border_transfer}
                        </p>
                    )}

                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 transition-all duration-300",
                        !form?.has_cross_border_transfer && "pointer-events-none grayscale-[0.05]" 
                    )}>
                        <Input
                            label="หากมีการส่งหรือโอนข้อมูลโปรดระบุประเทศปลายทาง"
                            required
                            id="transfer_country"
                            name="transfer_country"
                            value={form?.transfer_country || ""}
                            placeholder="ระบุประเทศปลายทาง (เช่น จีน)"
                            onChange={handleChange}
                            error={errors?.transfer_country}
                            disabled={disabled || !form?.has_cross_border_transfer}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                        <Input
                            label="ส่งข้อมูลไปยังต่างประเทศของกลุ่มบริษัทในเครือหรือไม่"
                            required
                            id="transfer_company"
                            name="transfer_company"
                            value={form?.transfer_company || ""}
                            placeholder="หากใช่ระบุชื่อบริษัท (เช่น บริษัท B)"
                            onChange={handleChange}
                            error={errors?.transfer_company}
                            disabled={disabled || !form?.has_cross_border_transfer}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                        <Input
                            label="วิธีการโอนข้อมูล"
                            required
                            id="transfer_method"
                            name="transfer_method"
                            value={form?.transfer_method || ""}
                            placeholder="ระบุวิธีการโอนข้อมูล (เช่น โอนทางอิเล็กทรอนิกส์)"
                            onChange={handleChange}
                            error={errors?.transfer_method}
                            disabled={disabled || !form?.has_cross_border_transfer}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                        <Input
                            label="มาตรฐานการคุ้มครองข้อมูลส่วนบุคคลของประเทศปลายทาง"
                            required
                            id="transfer_protection_standard"
                            name="transfer_protection_standard"
                            value={form?.transfer_protection_standard || ""}
                            placeholder="ระบุมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.transfer_protection_standard}
                            disabled={disabled || !form?.has_cross_border_transfer}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                    </div>

                    <div className={cn(
                        "transition-all duration-300",
                        !form?.has_cross_border_transfer && "pointer-events-none grayscale-[0.05]"
                    )}>
                        <Input
                            label="ข้อยกเว้นตามมาตรา 28"
                            required
                            id="transfer_exception"
                            name="transfer_exception"
                            value={form?.transfer_exception || ""}
                            placeholder="ระบุข้อยกเว้นตามมาตรา 28 (เช่น ปฏิบัติตามกฎหมาย ความยินยอม ปฏิบัติตามสัญญา ป้องกันอันตรายต่อชีวิต)"
                            onChange={handleChange}
                            error={errors?.transfer_exception}
                            disabled={disabled || !form?.has_cross_border_transfer}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                    </div>
                </div>

                {!isProcessor && (
                    <div className="grid grid-cols-1 gap-y-8">
                        <Input
                            label="การใช้หรือเปิดเผยข้อมูลส่วนบุคคลที่ได้รับยกเว้นไม่ต้องขอความยินยอม"
                            required
                            id="exemption_usage"
                            name="exemption_usage"
                            value={form?.exemption_usage || ""}
                            placeholder="ระบุกรณียกเว้นตามกฎหมาย (ระบุให้สอดคล้องกับฐานในการประมวลผล)"
                            onChange={handleChange}
                            error={errors?.exemption_usage}
                            disabled={disabled}
                            requiredColor={markerColor}
                            focusColor={primaryColor}
                        />
                        <Input
                            label="การปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูลส่วนบุคคล"
                            name="rejectionNote"
                            value={form?.rejectionNote || ""}
                            placeholder="ระบุการปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูล เมื่อมีการปฏิเสธการใช้สิทธิ"
                            onChange={handleChange}
                            disabled={disabled}
                            focusColor={primaryColor}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
