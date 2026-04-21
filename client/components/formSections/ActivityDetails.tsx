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
            "bg-white rounded-2xl shadow-sm border-l-[6px]",
            borderLColor
        )}>
            {/* Header: Activity Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        accessibility_new
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#5F5E5E] tracking-tight">
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
                                id="data_subject_name"
                                name="data_subject_name"
                                value={form?.data_subject_name || ""}
                                placeholder="ระบุเจ้าของข้อมูล (เช่น บริษัท A)"
                                onChange={handleChange}
                                error={errors?.data_subject_name}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <Input
                                label="กิจกรรมประมวลผล"
                                required
                                id="processing_activity"
                                name="processing_activity"
                                value={form?.processing_activity || ""}
                                placeholder="ระบุกิจกรรมประมวลผล (เช่น การรับสมัครพนักงาน)"
                                onChange={handleChange}
                                error={errors?.processing_activity}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                            <Input
                                label="วัตถุประสงค์การประมวลผล"
                                required
                                id="purpose_of_processing"
                                name="purpose_of_processing"
                                value={form?.purpose_of_processing || ""}
                                placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อรับสมัครบุคคลเข้าทำงาน)"
                                onChange={handleChange}
                                error={errors?.purpose_of_processing}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input
                            label="ชื่อผู้ควบคุมข้อมูลส่วนบุคคล"
                            required
                            name="controller_name"
                            value={form?.controller_name || ""}
                            placeholder="ระบุชื่อผู้ควบคุมข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.controller_name}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
                            required
                            name="processor_name"
                            value={form?.processor_name || ""}
                            placeholder="ระบุชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.processor_name}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
                            required
                            name="controller_address"
                            value={form?.controller_address || ""}
                            placeholder="ระบุที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.controller_address}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="กิจกรรมประมวลผล"
                            required
                            name="processing_activity"
                            value={form?.processing_activity || ""}
                            placeholder="ระบุกิจกรรมประมวลผล (เช่น ดำเนินการตามสัญญาว่าจ้าง)"
                            onChange={handleChange}
                            error={errors?.processing_activity}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="วัตถุประสงค์ของการประมวลผล"
                            required
                            name="purpose_of_processing"
                            value={form?.purpose_of_processing || ""}
                            placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อจัดจ้าง ออกแบบ/พัฒนาระบบ)"
                            onChange={handleChange}
                            error={errors?.purpose_of_processing}
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
