"use client";
import React from "react";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

export default function LegalInfo({ form, handleChange, errors, disabled }: any) {
    const isTransfer = form?.internationalTransfer?.isTransfer;

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Legal Basis and Transfer */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        verified_user
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 6 : ฐานทางกฎหมายและการส่งต่อ
                </h2>
            </div>

            <div className="px-8 pb-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <Input
                        label="ฐานในการประมวลผล"
                        required
                        name="legalBasis"
                        value={form?.legalBasis || ""}
                        placeholder="ระบุฐานในการประมวลผล (เช่น ฐานปฏิบัติตามสัญญา)"
                        onChange={handleChange}
                        error={errors?.legalBasis}
                        disabled={disabled}
                    />

                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            การขอความยินยอมของผู้เยาว์ <span className="text-[#ED393C] font-bold">*</span>
                        </label>
                        <div className="bg-[#F6F3F2] p-6 rounded-xl space-y-3">
                            <Checkbox
                                label="อายุไม่เกิน 10 ปี"
                                checked={!!form?.minorConsent?.under10}
                                onChange={(e: any) => handleChange({ target: { name: "minorConsent.under10", value: e.target.checked } })}
                                disabled={disabled}
                            />
                            <Checkbox
                                label="อายุ 10 - 20 ปี"
                                checked={!!form?.minorConsent?.age10to20}
                                onChange={(e: any) => handleChange({ target: { name: "minorConsent.age10to20", value: e.target.checked } })}
                                disabled={disabled}
                            />
                            <Checkbox
                                label="ไม่มีการขอความยินยอมของผู้เยาว์"
                                checked={!!form?.minorConsent?.none}
                                onChange={(e: any) => handleChange({ target: { name: "minorConsent.none", value: e.target.checked } })}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Nested Box: International Transfer */}
                <div className="bg-[#F6F6F6] p-8 rounded-2xl relative space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-extrabold text-[#1B1C1C] text-[15px] tracking-tight">
                            ส่งหรือโอนข้อมูลส่วนบุคคลไปยังต่างประเทศ
                        </h3>

                        {/* Custom Toggle: มี / ไม่มี */}
                        <div className="flex bg-white/50 p-1 rounded-2xl border border-gray-200">
                            <button
                                onClick={() => handleChange({ target: { name: "internationalTransfer.isTransfer", value: true } })}
                                disabled={disabled}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-2 rounded-xl transition-all font-bold text-sm",
                                    isTransfer
                                        ? "bg-white border-[#ED393C] border shadow-sm text-[#1B1C1C]"
                                        : "text-gray-400 opacity-60"
                                )}
                            >
                                <span>มี</span>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    isTransfer ? "border-[#ED393C]" : "border-gray-300"
                                )}>
                                    {isTransfer && <div className="w-2 h-2 rounded-full bg-[#ED393C]" />}
                                </div>
                            </button>
                            <button
                                onClick={() => handleChange({ target: { name: "internationalTransfer.isTransfer", value: false } })}
                                disabled={disabled}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-2 rounded-xl transition-all font-bold text-sm",
                                    !isTransfer
                                        ? "bg-white border-[#ED393C] border shadow-sm text-[#1B1C1C]"
                                        : "text-gray-400 opacity-60"
                                )}
                            >
                                <span>ไม่มี</span>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    !isTransfer ? "border-[#ED393C]" : "border-gray-300"
                                )}>
                                    {!isTransfer && <div className="w-2 h-2 rounded-full bg-[#ED393C]" />}
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 transition-all duration-300",
                        !isTransfer && "pointer-events-none grayscale-[0.05]" /* Reduced fading for clarity as requested */
                    )}>
                        <Input
                            label="หากมีการส่งหรือโอนข้อมูลโปรดระบุประเทศปลายทาง"
                            required
                            name="internationalTransfer.country"
                            value={form?.internationalTransfer?.country || ""}
                            placeholder="ระบุประเทศปลายทาง (เช่น จีน)"
                            onChange={handleChange}
                            disabled={disabled || !isTransfer}
                        />
                        <Input
                            label="ส่งข้อมูลไปยังต่างประเทศของกลุ่มบริษัทในเครือหรือไม่"
                            required
                            name="internationalTransfer.companyName"
                            value={form?.internationalTransfer?.companyName || ""}
                            placeholder="หากใช่ระบุชื่อบริษัท (เช่น บริษัท B)"
                            onChange={handleChange}
                            disabled={disabled || !isTransfer}
                        />
                        <Input
                            label="วิธีการโอนข้อมูล"
                            required
                            name="internationalTransfer.transferMethod"
                            value={form?.internationalTransfer?.transferMethod || ""}
                            placeholder="ระบุวิธีการโอนข้อมูล (เช่น โอนทางอิเล็กทรอนิกส์)"
                            onChange={handleChange}
                            disabled={disabled || !isTransfer}
                        />
                        <Input
                            label="มาตรฐานการคุ้มครองข้อมูลส่วนบุคคลของประเทศปลายทาง"
                            required
                            name="internationalTransfer.protectionStandard"
                            value={form?.internationalTransfer?.protectionStandard || ""}
                            placeholder="ระบุมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            disabled={disabled || !isTransfer}
                        />
                    </div>

                    <div className={cn(
                        "transition-all duration-300",
                        !isTransfer && "pointer-events-none grayscale-[0.05]"
                    )}>
                        <Input
                            label="ข้อยกเว้นตามมาตรา 28"
                            required
                            name="internationalTransfer.exception"
                            value={form?.internationalTransfer?.exception || ""}
                            placeholder="ระบุข้อยกเว้นตามมาตรา 28 (เช่น ปฏิบัติตามกฎหมาย ความยินยอม ปฏิบัติตามสัญญา ป้องกันอันตรายต่อชีวิต)"
                            onChange={handleChange}
                            disabled={disabled || !isTransfer}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-y-8">
                    <Input
                        label="การใช้หรือเปิดเผยข้อมูลส่วนบุคคลที่ได้รับยกเว้นไม่ต้องขอความยินยอม"
                        required
                        name="exemptionDisclosure"
                        value={form?.exemptionDisclosure || ""}
                        placeholder="ระบุกรณียกเว้นตามกฎหมาย (ระบุให้สอดคล้องกับฐานในการประมวลผล)"
                        onChange={handleChange}
                        error={errors?.exemptionDisclosure}
                        disabled={disabled}
                    />
                    <Input
                        label="การปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูลส่วนบุคคล"
                        name="rejectionNote"
                        value={form?.rejectionNote || ""}
                        placeholder="ระบุการปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูล เมื่อมีการปฏิเสธการใช้สิทธิ"
                        onChange={handleChange}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
