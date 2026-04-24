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
import InlineFeedbackWrapper from "@/components/ropa/InlineFeedbackWrapper";
import { ProcessorRecord } from "@/types/dataProcessor";
import { SectionStatus } from "@/types/enums";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcessor } from "@/context/ProcessorContext";
import { cn } from "@/lib/utils";

function DataProcessorFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recordId = searchParams.get("id");
    const snapshotId = searchParams.get("snapshot_id");
    const nameParam = searchParams.get("name");
    const companyParam = searchParams.get("company");
    const dueDateParam = searchParams.get("dueDate");

    const { submitDpSection, saveProcessorRecord, fetchFullProcessorRecord, fetchProcessorSnapshot } = useProcessor();
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<Partial<ProcessorRecord>>({
        processor_name: "",
        controller_name: "",
        controller_address: "",
        title_prefix: "",
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
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
        audit_measures: "",
        suggestions: []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load existing record or snapshot
    useEffect(() => {
        let isMounted = true;

        const loadFullRecord = async () => {
            if (snapshotId) {
                setIsLoadingFull(true);
                const snapshotData = await fetchProcessorSnapshot(snapshotId);
                if (snapshotData && isMounted) {
                    setForm(prev => ({ ...prev, ...snapshotData }));
                    setIsLocked(false); // Snapshots are typically loaded for editing
                }
                setIsLoadingFull(false);
            } else if (recordId) {
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
    }, [recordId, snapshotId]);

    const validateField = (name: string, value: any) => {
        let error = "";
        if (name === "phone") {
            if (value && value.length !== 10) {
                error = "กรุณาระบุเบอร์โทรศัพท์ให้ครบ 10 หลัก";
            }
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error === "";
    };

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
        if (!form.data_types || form.data_types.length === 0) newErrors.data_types = "กรุณาเลือกประเภทข้อมูล";

        // Step 4: Retention
        if (!form.collection_methods || form.collection_methods.length === 0) newErrors.collection_methods = "กรุณาเลือกวิธีการได้มา";
        if (!form.data_sources || form.data_sources.length === 0) newErrors.data_sources = "กรุณาเลือกแหล่งที่มา";
        if (!form.retention_value || Number(form.retention_value) <= 0) newErrors.retention_value = "กรุณาระบุระยะเวลา";
        if (!form.phone || form.phone.length !== 10) newErrors.phone = "กรุณาระบุเบอร์โทรศัพท์ให้ครบ 10 หลัก";
        if (!form.access_condition) newErrors.access_condition = "กรุณาระบุการควบคุมการเข้าถึง";

        // Step 5: Legal
        if (!form.legal_basis) newErrors.legal_basis = "กรุณาระบุฐานการประมวลผล";

        // Step 6: Security (Optional)
        // All fields in Section 6 are now optional as per request

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            const errorMessage = newErrors[firstErrorField];

            // Auto-scroll to the first error with a small delay
            setTimeout(() => {
                const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                    // Fallback alert if element not found in DOM
                    alert(`กรุณาตรวจสอบข้อมูล: ${errorMessage}`);
                }
            }, 100);

            return false;
        }
        return true;
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            await saveProcessorRecord(form as ProcessorRecord, recordId || undefined);
            setIsDraftSuccessOpen(true);
        } catch (error) {
            console.error("Save draft failed:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกฉบับร่าง กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalConfirm = async () => {
        if (!validateForm()) {
            setIsLocked(false); // Automatically unlock to allow fixing errors
            return;
        }
        setIsSuccessModalOpen(true);
    };

    const handleActualSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (recordId) {
                // Perform the final submit (saves data + updates status)
                await submitDpSection(recordId, form);
            } else {
                // New draft save if no recordId (shouldn't happen for DP assignments)
                await saveProcessorRecord({ ...form, status: SectionStatus.SUBMITTED } as ProcessorRecord);
            }

            // Note: refresh() is called inside submitDpSection/saveProcessorRecord
            setIsSuccessModalOpen(false);
            router.push("/data-processor/management/processing");
        } catch (error) {
            console.error("Submit failed:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value, type } = e.target;
        const targetChecked = (e.target as any).checked;

        let val: any = value;

        // 1. Enforce Numeric-only and MaxLength for Phone
        if (name === "phone") {
            val = value.replace(/[^0-9]/g, "").slice(0, 10);
            if (val.length === 10) validateField(name, val);
        }
        // 2. Enforce Numeric-only for Retention Value
        else if (name === "retention_value") {
            val = value.replace(/[^0-9]/g, "");
            val = val === "" ? "" : Number(val);
        }
        // 3. Handle Standard Numeric Inputs
        else if (type === "number") {
            val = value === "" ? "" : Math.max(0, Number(value));
        }
        // 4. Handle Checkboxes
        else if (type === "checkbox") {
            if (!name.includes("[]")) {
                val = (value && value !== "on") ? (targetChecked ? value : "") : targetChecked;
            }
        }

        setForm((prev: any) => {
            const next = { ...prev };

            if (name.endsWith("[]")) {
                const arrayKey = name.replace("[]", "");
                const currentArray = prev[arrayKey] || [];
                const newArray = targetChecked
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                next[arrayKey] = newArray;
                return next;
            }

            if (name.includes(".")) {
                const keys = name.split(".");
                let curr = next;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    curr[key] = { ...curr[key] };
                    curr = curr[key];
                }
                curr[keys[keys.length - 1]] = val;
                return next;
            }

            next[name] = val;
            return next;
        });
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

                <div className="bg-white border-b border-[#E5E2E1]/50 sticky top-[72px] z-30">
                    <Stepper completedSteps={[1, 2, 3, 4, 5, 6]} variant="processor" />
                </div>

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
                                        ? "text-[#ED393C] border-none hover:bg-[#ED393C]/5"
                                        : "text-[#00666E] border-none hover:bg-[#00666E]/5"
                                )}
                            >
                                <span className={cn("material-symbols-outlined text-[22px]", isLocked ? "text-[#ED393C]" : "text-[#00666E]")}>
                                    {isLocked ? "edit_square" : "check_circle"}
                                </span>
                                <span className="text-[15px]">{isLocked ? "แก้ไขเอกสาร" : "เสร็จสิ้นการแก้ไข"}</span>
                            </button>
                        </div>

                        <div className="px-10 space-y-8">
                            {(() => {
                                const renderSection = (id: string, title: string, Component: any) => {
                                    // key is format like dp-1, dp-2 ...
                                    const sectionNo = parseInt(id.replace("dp-", ""), 10);
                                    const sectionFeedbacks = form.feedbacks?.filter((f: any) => f.section_number === sectionNo) || [];
                                    
                                    return (
                                        <InlineFeedbackWrapper
                                            key={id}
                                            title={title}
                                            isDraftingFeedback={false}
                                            onFeedbackChange={() => { }}
                                            feedbackText=""
                                            existingSuggestions={sectionFeedbacks.map((f: any) => ({
                                                text: f.comment,
                                                date: f.created_at
                                            }))}
                                            isProcessor={true}
                                            canReview={false}
                                        >
                                            <Component form={form} handleChange={handleChange} errors={errors} disabled={isLocked} variant="processor" />
                                        </InlineFeedbackWrapper>
                                    );
                                };

                                return (
                                    <>
                                        {renderSection("dp-1", "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", GeneralInfo)}
                                        {renderSection("dp-2", "ส่วนที่ 2 : รายละเอียดกิจกรรม", ActivityDetails)}
                                        {renderSection("dp-3", "ส่วนที่ 3 : ข้อมูลส่วนบุคคลที่จัดเก็บ", StoredInfo)}
                                        {renderSection("dp-4", "ส่วนที่ 4 : การเก็บรักษาข้อมูล", RetentionInfo)}
                                        {renderSection("dp-5", "ส่วนที่ 5 : ฐานทางกฎหมาย (Legal Basis)", LegalInfo)}
                                        {renderSection("dp-6", "ส่วนที่ 6 : มาตรการการรักษาความมั่นคงปลอดภัย", SecurityMeasures)}
                                    </>
                                );
                            })()}
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
                            disabled={isSaving || isSubmitting}
                            className={cn(
                                "bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-10 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap flex items-center gap-2",
                                (isSaving || isSubmitting) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-[#5C403D]/30 border-t-[#5C403D] rounded-full animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : "บันทึกฉบับร่าง"}
                        </button>
                        <button
                            onClick={handleFinalConfirm}
                            disabled={isSaving || isSubmitting}
                            className={cn(
                                "bg-logout-gradient text-white px-20 h-[52px] rounded-full font-black text-base shadow-xl shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2",
                                (isSaving || isSubmitting) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    กำลังดำเนินการ...
                                </>
                            ) : "บันทึก"}
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
                            กลับสู่ตารางเอกสาร
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal (Standardized Red for DP) */}
            <SaveSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => !isSubmitting && setIsSuccessModalOpen(false)}
                title="บันทึกรายการ RoPA เสร็จสิ้น"
                subtitle="สามารถดูเอกสารได้ที่ตารางแสดงเอกสารที่ดำเนินการ"
                buttonText="ยืนยันการบันทึก"
                isLoading={isSubmitting}
                onConfirm={handleActualSubmit}
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
