"use client";

import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Stepper from "@/components/layouts/Stepper";
import GeneralInfo from "@/components/formSections/GeneralInfo";
import ActivityDetails from "@/components/formSections/ActivityDetails";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus, CollectionMethod, RetentionUnit, DataType } from "@/types/enums";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { cn } from "@/lib/utils";

function DataProcessorFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recordId = searchParams.get("id");
    const nameParam = searchParams.get("name");
    const companyParam = searchParams.get("company");
    const dueDateParam = searchParams.get("dueDate");

    const { getById, submitDpSection, getProcessorById, saveProcessorRecord } = useRopa();
    const [isLocked, setIsLocked] = useState(true);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);

    const [form, setForm] = useState<Partial<ProcessorRecord>>({
        processorName: "",
        controllerName: "",
        controllerAddress: "",
        status: RopaStatus.Draft,
        dataSource: { direct: false, indirect: false },
        internationalTransfer: { isTransfer: false },
        dataCategories: [],
        storedDataTypes: [],
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: [],
            duration: 0,
            unit: RetentionUnit.Year,
            accessCondition: "",
            accessControl: "",
            deletionMethod: ""
        },
        dataType: [DataType.General],
        securityMeasures: {},
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load existing record
    useEffect(() => {
        if (recordId) {
            // Priority 1: Current Processor session record (linked by shared ID)
            const existingProc = getProcessorById(recordId);
            if (existingProc) {
                setForm(prev => ({ ...prev, ...existingProc }));
                return;
            }

            // Priority 2: Initialize from DO record (Source of Truth)
            const existingOwner = getById(recordId);
            if (existingOwner) {
                setForm(prev => ({ 
                    ...prev, 
                    documentName: existingOwner.documentName,
                    processorName: existingOwner.processorCompany || existingOwner.assignedProcessor?.name || "",
                    id: recordId 
                }));
            }
        }
    }, [recordId, getById, getProcessorById]);

    const handleChange = (e: any) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        let val: any = value;
        if (type === "number") {
            val = value === "" ? "" : Math.max(0, Number(value));
        }
        if (type === "checkbox") {
            if (!name.includes("[]")) {
                val = (value && value !== "on") ? (checked ? value : "") : checked;
            }
        }

        setForm((prev: any) => {
            const keys = name.split(".");

            if (name.endsWith("[]")) {
                const arrayKey = name.replace("[]", "");
                const currentArray = prev[arrayKey] || [];
                const newArray = checked
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                return { ...prev, [arrayKey]: newArray };
            }

            if (keys.length === 1) return { ...prev, [name]: val };
            if (keys.length === 2) {
                const [p, c] = keys;
                return { ...prev, [p]: { ...prev[p], [c]: val } };
            }
            return prev;
        });
    };

    const completedSteps = useMemo(() => {
        const completed = [];
        // Step 1: General (DP needs controllerName/processorName for processor)
        if (form.controllerName && form.processorName && form.title && form.firstName && form.lastName) completed.push(1);
        // Step 2: Activity
        if (form.processorName && form.controllerAddress && form.processingActivity && form.purpose) completed.push(2);
        // Step 3: Stored Info
        if (form.dataCategories && form.dataCategories.length > 0 && form.storedDataTypes && form.storedDataTypes.length > 0) completed.push(3);
        // Step 4: Retention
        if (form.collectionMethod && form.retention?.duration && form.retention?.accessControl) completed.push(4);
        // Step 5: Legal
        if (form.legalBasis && form.exemptionDisclosure) completed.push(5);
        // Step 6: Security
        const sm = form.securityMeasures;
        if (sm?.organizational && sm?.accessControl && sm?.technical) completed.push(6);
        return completed;
    }, [form]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        // Step 1: General
        if (!form.controllerName) newErrors.controllerName = "กรุณาระบุชื่อผู้ควบคุมข้อมูล";
        if (!form.processorName) newErrors.processorName = "กรุณาระบุชื่อผู้ประมวลผลข้อมูล";
        if (!form.title) newErrors.title = "กรุณาระบุคำนำหน้า";
        if (!form.firstName) newErrors.firstName = "กรุณาระบุชื่อ";
        if (!form.lastName) newErrors.lastName = "กรุณาระบุนามสกุล";

        // Step 2: Activity
        if (!form.controllerAddress) newErrors.controllerAddress = "กรุณาระบุที่อยู่ผู้ควบคุมข้อมูล";
        if (!form.processingActivity) newErrors.processingActivity = "กรุณาระบุกิจกรรมการประมวลผล";
        if (!form.purpose) newErrors.purpose = "กรุณาระบุวัตถุประสงค์";

        // Step 3: Stored Info
        if (!form.dataCategories || form.dataCategories.length === 0) newErrors.dataCategories = "กรุณาเลือกหมวดหมู่ข้อมูล";
        if (!form.storedDataTypes || form.storedDataTypes.length === 0) newErrors.storedDataTypes = "กรุณาประเภทข้อมูล";

        // Step 4: Retention
        if (!form.retention?.duration) newErrors["retention.duration"] = "กรุณาระบุระยะเวลา";
        if (!form.retention?.accessControl) newErrors["retention.accessControl"] = "กรุณาระบุการควบคุมการเข้าถึง";

        // Step 5: Legal
        if (!form.legalBasis) newErrors.legalBasis = "กรุณาระบุฐานการประมวลผล";
        if (!form.exemptionDisclosure) newErrors.exemptionDisclosure = "กรุณาระบุข้อยกเว้น";

        // Step 6: Security
        const sm = form.securityMeasures;
        if (!sm?.organizational) newErrors["securityMeasures.organizational"] = "กรุณาระบุมาตรการด้านบริหารจัดการ";
        if (!sm?.accessControl) newErrors["securityMeasures.accessControl"] = "กรุณาระบุการควบคุมการเข้าถึง";
        if (!sm?.technical) newErrors["securityMeasures.technical"] = "กรุณาระบุมาตรการด้านเทคนิค";

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            // Scroll to top or first error could be added here
            return false;
        }
        return true;
    };

    const handleSaveDraft = () => {
        saveProcessorRecord(form as ProcessorRecord);
        setIsDraftSuccessOpen(true);
    };

    const handleFinalConfirm = () => {
        if (!validateForm()) return;
        
        saveProcessorRecord({ ...form, status: RopaStatus.Processing } as ProcessorRecord);
        if (recordId) {
            submitDpSection(recordId);
        }
        setIsSuccessModalOpen(true);
    };

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low overflow-x-hidden">
                <TopBar
                    documentName="ข้อมูลลูกค้า"
                    handleChange={handleChange}
                    status={form.status}
                    hideSearch={true}
                    formMode={true}
                    isProcessor={true}
                />

                <div className="flex-1 overflow-y-auto pt-8 pb-36 space-y-6 animate-in fade-in duration-1000">
                    <div className="px-10 flex items-center justify-between gap-4">
                        <div className="flex-1 overflow-visible">
                            <Stepper variant="processor" completedSteps={completedSteps} />
                        </div>
                        
                        <button
                            onClick={() => setIsLocked(!isLocked)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold shrink-0 mt-[-36px]",
                                isLocked 
                                    ? "text-[#B90A1E] border-none hover:bg-[#B90A1E]/5 shadow-none" 
                                    : "text-[#5C403D] border-none hover:bg-black/5"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isLocked ? "edit" : "done_all"}
                            </span>
                            {isLocked ? "แก้ไขเอกสาร" : "เสร็จสิ้นการแก้ไข"}
                        </button>
                    </div>

                    <div className="px-10 space-y-8">
                        <GeneralInfo form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                        <ActivityDetails form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                        <StoredInfo form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                        <RetentionInfo form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                        <LegalInfo form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                        <SecurityMeasures form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                    </div>
                </div>

                {/* Footer Action Bar (Fixed Red as per request) */}
                <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] backdrop-blur-md border-t border-[#E5E2E1]/50 p-6 px-10 flex items-center justify-between z-40">
                    <button
                        onClick={() => router.back()}
                        className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                    >
                        ยกเลิก
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSaveDraft}
                            className="bg-white border-2 border-[#ED393C] text-[#ED393C] font-bold text-base h-[52px] px-10 rounded-full hover:bg-[#ED393C]/5 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            บันทึกฉบับร่าง
                        </button>
                        <button
                            onClick={handleFinalConfirm}
                            className="bg-gradient-to-r from-[#ED393C] to-[#8C0E10] text-white px-20 h-[52px] rounded-full font-black text-base shadow-xl shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            </main>

            {/* Success Modals (Teal themed for DP) */}
            {isDraftSuccessOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[500px] rounded-[48px] shadow-2xl p-14 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="bg-[#ED393C]/10 p-4 rounded-2xl mb-6">
                            <span className="material-symbols-outlined text-[#ED393C] text-[40px]">save</span>
                        </div>
                        <h2 className="text-3xl font-black text-[#1B1C1C] tracking-tight mb-2">บันทึกฉบับร่างแล้ว</h2>
                        <button
                            onClick={() => router.push("/data-processor/management/processing")}
                            className="bg-logout-gradient leading-none text-white w-full h-[52px] rounded-2xl font-black text-base mt-4 shadow-lg shadow-[#ED393C]/20 hover:brightness-110 transition-all active:scale-95"
                        >
                            กลับสู่หน้าหลัก
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal (Standardized Red for DP) */}
            <SaveSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                onConfirm={() => router.push("/data-processor/management/processing")}
            />
        </div>
    );
}

export default function DataProcessorFormPage() {
    return (
        <Suspense fallback={<div>กำลังโหลด...</div>}>
            <DataProcessorFormContent />
        </Suspense>
    );
}
