"use client";

import Input from "@/components/ui/Input";

export default function ActivityDetails({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-[#ED393C] overflow-hidden">
            {/* Header: Activity Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-[#ED393C]/10 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ED393C] text-2xl font-bold">
                        accessibility_new
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    ส่วนที่ 3 : รายละเอียดกิจกรรม
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-1">
                    <Input
                        label="ชื่อเจ้าของข้อมูลส่วนบุคคล"
                        required
                        name="dataSubjectName"
                        value={form?.dataSubjectName || ""}
                        placeholder="ระบุเจ้าของข้อมูล (เช่น บริษัท A)"
                        onChange={handleChange}
                        error={errors?.dataSubjectName}
                        disabled={disabled}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                        label="กิจกรรมประมวลผล"
                        required
                        name="processingActivity"
                        value={form?.processingActivity || ""}
                        placeholder="ระบุกิจกรรมประมวลผล (เช่น การรับสมัครพนักงาน)"
                        onChange={handleChange}
                        error={errors?.processingActivity}
                        disabled={disabled}
                    />
                    <Input
                        label="วัตถุประสงค์การประมวลผล"
                        required
                        name="purpose"
                        value={form?.purpose || ""}
                        placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อรับสมัครบุคคลเข้าทำงาน)"
                        onChange={handleChange}
                        error={errors?.purpose}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
