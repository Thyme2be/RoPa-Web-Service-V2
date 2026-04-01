"use client";

import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import RadioButton from "@/components/ui/RadioButton";

export default function Section5Legal({ form, handleChange }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary">
            {/* Header with Red Accent and Gavel Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        verified_user
                    </span>
                </div>
                <h2 className="font-bold text-xl text-black tracking-tight">
                    ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-8">
                {/* Basis and Minors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <Input
                            label="ฐานในการประมวลผล"
                            name="legalBasis"
                            value={form?.legalBasis || ""}
                            placeholder="ระบุฐานในการประมวลผล (เช่น ฐานปฏิบัติตามสัญญา)"
                            required
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            การขอความยินยอมของผู้เยาว์ <span className="text-primary">*</span>
                        </label>
                        <div className="space-y-3 bg-[#F6F3F2] p-6 rounded-2xl border border-[#F6F3F2]">
                            <Checkbox 
                                label="อายุไม่เกิน 10 ปี" 
                                name="minorConsent.under10" 
                                checked={!!form?.minorConsent?.under10} 
                                onChange={handleChange} 
                            />
                            <Checkbox 
                                label="อายุ 10 - 20 ปี" 
                                name="minorConsent.age10to20" 
                                checked={!!form?.minorConsent?.age10to20} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                </div>

                {/* International Transfer Container - Standardized White Background */}
                <div className="p-8 bg-white rounded-3xl space-y-8 border border-[#F6F3F2]">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#5C403D] text-base flex items-center gap-1">
                            ส่งหรือโอนข้อมูลส่วนบุคคลไปยังต่างประเทศ
                            <span className="text-primary">*</span>
                        </h3>
                        <div className="flex items-center gap-6">
                            <RadioButton
                                label="มี"
                                name="internationalTransfer.isTransfer"
                                value="true"
                                required
                                checked={form?.internationalTransfer?.isTransfer === true}
                                onChange={handleChange}
                                alignRight
                            />
                            <RadioButton
                                label="ไม่มี"
                                name="internationalTransfer.isTransfer"
                                value="false"
                                required
                                checked={form?.internationalTransfer?.isTransfer === false}
                                onChange={handleChange}
                                alignRight
                            />
                        </div>
                    </div>

                    <div className="space-y-8 pt-4 border-t border-gray-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <Input
                                label="หากมีการส่งหรือโอนข้อมูลโปรดระบุประเทศปลายทาง"
                                name="internationalTransfer.country"
                                value={form?.internationalTransfer?.country || ""}
                                placeholder="ระบุประเทศปลายทาง (เช่น จีน)"
                                required={form?.internationalTransfer?.isTransfer}
                                onChange={handleChange}
                            />
                            <Input
                                label="ส่งข้อมูลไปยังต่างประเทศของกลุ่มบริษัทในเครือหรือไม่"
                                name="internationalTransfer.companyName"
                                value={form?.internationalTransfer?.companyName || ""}
                                placeholder="หากใช่ระบุชื่อบริษัท (เช่น บริษัท B)"
                                required={form?.internationalTransfer?.isTransfer}
                                onChange={handleChange}
                            />
                            <Input
                                label="วิธีการโอนข้อมูล"
                                name="internationalTransfer.transferMethod"
                                value={form?.internationalTransfer?.transferMethod || ""}
                                placeholder="ระบุวิธีการโอนข้อมูล (เช่น โอนทางอิเล็กทรอนิกส์)"
                                required={form?.internationalTransfer?.isTransfer}
                                onChange={handleChange}
                            />
                            <Input
                                label="มาตรฐานการคุ้มครองข้อมูลส่วนบุคคลของประเทศปลายทาง"
                                name="internationalTransfer.protectionStandard"
                                value={form?.internationalTransfer?.protectionStandard || ""}
                                placeholder="ระบุมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล"
                                required={form?.internationalTransfer?.isTransfer}
                                onChange={handleChange}
                            />
                        </div>
                        <Input
                            label="ข้อยกเว้นตามมาตรา 28"
                            name="internationalTransfer.exception"
                            value={form?.internationalTransfer?.exception || ""}
                            placeholder="ระบุข้อยกเว้นตามมาตรา 28 (เช่น ปฏิบัติตามกฎหมาย ความยินยอม ปฏิบัติตามสัญญา ป้องกันอันตรายต่อชีวิต)"
                            required={form?.internationalTransfer?.isTransfer}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Bottom Full-width Fields */}
                <div className="space-y-8">
                    <Input
                        label="การใช้หรือเปิดเผยข้อมูลส่วนบุคคลที่ได้รับยกเว้นไม่ต้องขอความยินยอม"
                        name="exemptionDisclosure"
                        value={form?.exemptionDisclosure || ""}
                        placeholder="ระบุกรณีงัดเว้นตามกฎหมาย (ระบุให้สอดคล้องกับฐานในการประมวลผล)"
                        required
                        onChange={handleChange}
                    />
                    <Input
                        label="การปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูลส่วนบุคคล"
                        name="rejectionNote"
                        value={form?.rejectionNote || ""}
                        placeholder="ระบุการปฏิเสธคำขอหรือคัดค้านการใช้สิทธิของเจ้าของข้อมูล เมื่อมีการปฏิเสธการใช้สิทธิ"
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}
