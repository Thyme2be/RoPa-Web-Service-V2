"use client";

import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function RightsChannel({ form, handleChange, errors, disabled, variant = "owner", hideHeader = false }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const markerColor = "#ED393C";

    return (
        <div className="space-y-0">
            {/* Header: Rights Channel Icon */}
            {!hideHeader && (
                <div className="flex items-center gap-4 px-8 py-6">
                    <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                        <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                            chat_bubble
                        </span>
                    </div>
                    <h2 className="font-bold text-[18px] text-[#5F5E5E] tracking-tight">
                        ส่วนที่ 2 : ช่องทางการใช้สิทธิของเจ้าของข้อมูล
                    </h2>
                </div>
            )}

            <div className={cn("px-8 pb-8 space-y-6", hideHeader && "pt-4")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                        label="อีเมล"
                        required
                        id="rights_email"
                        name="rights_email"
                        value={form?.rights_email || ""}
                        placeholder="example@netbay.co.th"
                        onChange={handleChange}
                        error={errors?.rights_email}
                        disabled={disabled}
                        focusColor={primaryColor}
                        requiredColor={markerColor}
                    />
                    <Input
                        label="เบอร์โทรศัพท์บริษัท"
                        required
                        id="rights_phone"
                        name="rights_phone"
                        value={form?.rights_phone || ""}
                        placeholder="0XXXXXXXXX (10 หลัก)"
                        onChange={handleChange}
                        error={errors?.rights_phone}
                        disabled={disabled}
                        maxLength={10}
                        focusColor={primaryColor}
                        requiredColor={markerColor}
                    />
                </div>
            </div>
        </div>
    );
}
