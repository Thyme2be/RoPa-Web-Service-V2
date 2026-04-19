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
import { SectionStatus } from "@/types/enums";
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

    const { getById, submitDpSection, getProcessorById, saveProcessorRecord, fetchFullProcessorRecord } = useRopa();
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);

    const [form, setForm] = useState<Partial<ProcessorRecord>>({
        processor_name: "",
        controller_name: "",
        controller_address: "",
        status: SectionStatus.DRAFT,
        collection_methods: [],
        data_sources: [],
        data_source_other: "",
        has_cross_border_transfer: false,
        data_categories: [],
        personal_data_items: [],
        data_types: [],
        storage_types: [],
        storage_methods: [],
        retention_value: 0,
        retention_unit: "YEARS",
        access_condition: "",
        deletion_method: "",
        legal_basis: "",
        exemption_usage: "",
        org_measures: "",
        technical_measures: "",
        physical_measures: "",
        access_control_measures: "",
        responsibility_measures: "",
        audit_measures: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load existing record
    useEffect(() => {
        let isMounted = true;

        const loadFullRecord = async () => {
            if (recordId) {
                setIsLoadingFull(true);
                const fullRecord = await fetchFullProcessorRecord(recordId);
                if (fullRecord && isMounted) {
                    setForm(prev => ({ ...prev, ...fullRecord }));
                }
                setIsLoadingFull(false);
            }
        };

        loadFullRecord();
        return () => { isMounted = false; };
    }, [recordId]);

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
            // Note: In the new flattened structure, keys.length should mostly be 1.
            // Keeping nested support for backward compat if any component still uses it temporarily
            if (keys.length === 2) {
                const [p, c] = keys;
                return { ...prev, [p]: { ...prev[p], [c]: val } };
            }
            return prev;
        });
    };

    const completedSteps = useMemo(() => {
        const completed = [];
        // Step 1: General
        if (form.controller_name && form.processor_name && form.title_prefix && form.first_name && form.last_name) completed.push(1);
        // Step 2: Activity
        if (form.processor_name && form.controller_address && form.processing_activity && form.purpose_of_processing) completed.push(2);
        // Step 3: Stored Info
        if (form.data_categories && form.data_categories.length > 0 && form.personal_data_items && form.personal_data_items.length > 0) completed.push(3);
        // Step 4: Retention
        if (form.collection_methods && form.collection_methods.length > 0 && form.retention_value && form.access_condition) completed.push(4);
        // Step 5: Legal
        if (form.legal_basis && form.exemption_usage) completed.push(5);
        // Step 6: Security
        if (form.org_measures && form.access_control_measures && form.technical_measures) completed.push(6);
        return completed;
    }, [form]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Step 1: General
        if (!form.controller_name) newErrors.controller_name = "กรุณาระบุชื่อผู้ควบคุมข้อมูล";
        if (!form.processor_name) newErrors.processor_name = "กรุณาระบุชื่อผู้ประมวลผลข้อมูล";
        if (!form.title_prefix) newErrors.title_prefix = "กรุณาระบุคำนำหน้า";
        if (!form.first_name) newErrors.first_name = "กรุณาระบุชื่อ";
        if (!form.last_name) newErrors.last_name = "กรุณาระบุนามสกุล";

        // Step 2: Activity
        if (!form.controller_address) newErrors.controller_address = "กรุณาระบุที่อยู่ผู้ควบคุมข้อมูล";
        if (!form.processing_activity) newErrors.processing_activity = "กรุณาระบุกิจกรรมการประมวลผล";
        if (!form.purpose_of_processing) newErrors.purpose_of_processing = "กรุณาระบุวัตถุประสงค์";

        // Step 3: Stored Info
        if (!form.data_categories || form.data_categories.length === 0) newErrors.data_categories = "กรุณาเลือกหมวดหมู่ข้อมูล";
        if (!form.personal_data_items || form.personal_data_items.length === 0) newErrors.personal_data_items = "กรุณาประเภทข้อมูล";

        // Step 4: Retention
        if (!form.retention_value) newErrors.retention_value = "กรุณาระบุระยะเวลา";
        if (!form.access_condition) newErrors.access_condition = "กรุณาระบุการควบคุมการเข้าถึง";

        // Step 5: Legal
        if (!form.legal_basis) newErrors.legal_basis = "กรุณาระบุฐานการประมวลผล";
        if (!form.exemption_usage) newErrors.exemption_usage = "กรุณาระบุข้อยกเว้น";

        // Step 6: Security
        if (!form.org_measures) newErrors.org_measures = "กรุณาระบุมาตรการด้านบริหารจัดการ";
        if (!form.access_control_measures) newErrors.access_control_measures = "กรุณาระบุการควบคุมการเข้าถึง";
        if (!form.technical_measures) newErrors.technical_measures = "กรุณาระบุมาตรการด้านเทคนิค";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
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

        saveProcessorRecord({ ...form, status: SectionStatus.SUBMITTED } as ProcessorRecord);
        if (recordId) {
            submitDpSection(recordId);
        }
        setIsSuccessModalOpen(true);
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col overflow-x-hidden">
                <TopBar
                    documentName={form.document_name}
                    pageTitle="ข้อมูลลูกค้า"
                    handleChange={handleChange}
                    status={form.status}
                    hideSearch={true}
                    formMode={true}
                    isProcessor={true}
                />

                {isLoadingFull ? (
                    <div className="flex-1 flex items-center justify-center pt-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#B90A1E] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[#5F5E5E] font-bold animate-pulse">กำลังโหลดข้อมูลเอกสาร...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pt-8 pb-36 space-y-6 animate-in fade-in duration-1000">
                        <div className="px-10 flex justify-end">
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
                )}

                {/* Footer Action Bar (Fixed Red as per request) */}
                <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/50 p-6 px-10 flex items-center justify-between z-40">
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
