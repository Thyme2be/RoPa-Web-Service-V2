"use client";

import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function ActivityDetails({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const markerColor = "#ED393C"; // Fixed RED for required markers as per request
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";
    const sectionTitle = isProcessor ? "ส่วนที่ 2 : รายละเอียดกิจกรรม" : "ส่วนที่ 2 : รายละเอียดของกิจกรรมและวัตถุประสงค์";

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px] overflow-hidden",
            borderLColor
        )}>
            {/* Header: Activity Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        accessibility_new
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                {!isProcessor ? (
                    <>
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
                                focusColor={primaryColor}
                                requiredColor={markerColor}
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
                                focusColor={primaryColor}
                                requiredColor={markerColor}
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
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input
                            label="ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
                            required
                            name="processorName"
                            value={form?.processorName || ""}
                            placeholder="ระบุชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.processorName}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
                            required
                            name="controllerAddress"
                            value={form?.controllerAddress || ""}
                            placeholder="ระบุที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.controllerAddress}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="กิจกรรมประมวลผล"
                            required
                            name="processingActivity"
                            value={form?.processingActivity || ""}
                            placeholder="ระบุกิจกรรมประมวลผล (เช่น ดำเนินการตามสัญญาว่าจ้าง)"
                            onChange={handleChange}
                            error={errors?.processingActivity}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="วัตถุประสงค์ของการประมวลผล"
                            required
                            name="purpose"
                            value={form?.purpose || ""}
                            placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อจัดจ้าง ออกแบบ/พัฒนาระบบ)"
                            onChange={handleChange}
                            error={errors?.purpose}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
