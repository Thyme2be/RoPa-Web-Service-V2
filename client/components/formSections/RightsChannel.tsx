"use client";

import Input from "@/components/ui/Input";

export default function RightsChannel({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C]">
            {/* Header: Rights Channel Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        chat_bubble
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 2 : ช่องทางการใช้สิทธิของเจ้าของข้อมูล
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                        label="อีเมล"
                        required
                        name="rights_email"
                        value={form?.rights_email || ""}
                        placeholder="example@netbay.co.th"
                        onChange={handleChange}
                        error={errors?.rights_email}
                        disabled={disabled}
                    />
                    <Input
                        label="เบอร์โทรศัพท์บริษัท"
                        required
                        name="rights_phone"
                        value={form?.rights_phone || ""}
                        placeholder="0XXXXXXXXX (10 หลัก)"
                        onChange={handleChange}
                        error={errors?.rights_phone}
                        disabled={disabled}
                        maxLength={10}
                    />
                </div>
            </div>
        </div>
    );
}
