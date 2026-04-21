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
import RightsChannel from "@/components/formSections/RightsChannel";
import FeedbackModal from "@/components/ropa/FeedbackModal";
import InlineFeedbackWrapper from "@/components/ropa/InlineFeedbackWrapper";
import RiskAssessment from "@/components/ropa/RiskAssessment";
import FormTabs from "@/components/ropa/FormTabs";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus, SectionStatus, CollectionMethod, RetentionUnit, DataType } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─── Dummy mockDpSections removed ─────────────

function ManagementFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const recordId = searchParams.get("id");
    const snapshotId = searchParams.get("snapshot_id");
    const nameParam = searchParams.get("name");
    const companyParam = searchParams.get("company");
    const dueDateParam = searchParams.get("dueDate");
    const viewMode = searchParams.get("mode") === "view";
    const isNewEdit = searchParams.get("mode") === "edit";

    const [activeTab, setActiveTab] = useState("owner");
    const {
        saveRecord,
        getById,
        getProcessorById,
        submitDoSection,
        sendToDpo,
        saveRiskAssessment,
        fetchFullOwnerRecord,
        fetchFullProcessorRecord,
        createOwnerSnapshot,
        fetchOwnerSnapshot,
        requestDelete,
        submitFeedbackBatch
    } = useRopa();
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);
    // ปลดล็อก form ทันทีถ้าเป็นการเปิดแบบ mode=edit หรือกำลังแก้ไขฉบับร่าง (snapshotId)
    const [isLocked, setIsLocked] = useState(!isNewEdit && !snapshotId);
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; section: string }>({ open: false, section: "" });

    // Feedback states
    const [activeFeedbacks, setActiveFeedbacks] = useState<Record<string, boolean>>({});
    const [draftFeedbacks, setDraftFeedbacks] = useState<Record<string, string>>({});

    const handleFeedbackChange = (sectionId: string, text: string) => setDraftFeedbacks(prev => ({ ...prev, [sectionId]: text }));
    const handleReviewClick = (sectionId: string) => setActiveFeedbacks(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

    const renderDOSection = (id: string, title: string, Component: any) => {
        const suggestion = form.suggestions?.find(s => s.section_id.toString() === id);
        return (
            <InlineFeedbackWrapper
                title={title}
                isDraftingFeedback={!!activeFeedbacks[id]}
                onFeedbackChange={(text) => handleFeedbackChange(id, text)}
                feedbackText={draftFeedbacks[id] || ""}
                existingSuggestion={suggestion ? { text: suggestion.comment, date: suggestion.date } : undefined}
                canReview={false}
                onReviewClick={() => handleReviewClick(id)}
            >
                <Component form={form} handleChange={handleChange} errors={errors} disabled={isLocked || isReviewMode} />
            </InlineFeedbackWrapper>
        );
    };

    const renderDPSection = (id: string, title: string, Component: any) => {
        const suggestion = form.suggestions?.find(s => s.section_id.toString() === id);
        return (
            <InlineFeedbackWrapper
                title={title}
                isDraftingFeedback={!!activeFeedbacks[id]}
                onFeedbackChange={(text) => handleFeedbackChange(id, text)}
                feedbackText={draftFeedbacks[id] || ""}
                existingSuggestion={suggestion ? { text: suggestion.comment, date: suggestion.date } : undefined}
                canReview={dpStatus === "done" && viewMode}
                onReviewClick={() => handleReviewClick(id)}
                isProcessor={true}
            >
                <Component form={dpForm} handleChange={() => { }} errors={{}} disabled={true} variant="processor" />
            </InlineFeedbackWrapper>
        );
    };

    const [form, setForm] = useState<Partial<OwnerRecord>>({
        document_name: nameParam || "",
        processor_company: companyParam || "",
        due_date: dueDateParam || "",
        title_prefix: "",
        first_name: "",
        last_name: "",
        address: "",
        email: "",
        phone: "",
        rights_email: "",
        rights_phone: "",
        status: RopaStatus.Draft,
        id: "",
        data_source_direct: false,
        data_source_indirect: false,
        data_source_other: "",
        minor_consent_under_10: false,
        minor_consent_10_to_20: false,
        minor_consent_none: false,
        has_cross_border_transfer: false,
        data_categories: [],
        personal_data_items: [],
        data_types: [],
        collection_method: "",
        retention_value: 0,
        retention_unit: RetentionUnit.YEARS,
        access_condition: "",
        deletion_method: "",
        legal_basis: "",
        exemption_usage: "",
        workflow: "processing",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load existing record if id is provided
    useEffect(() => {
        let isMounted = true;

        const loadFullRecord = async () => {
            if (recordId) {
                setIsLoadingFull(true);

                let fullRecord;
                if (snapshotId) {
                    fullRecord = await fetchOwnerSnapshot(snapshotId);
                } else {
                    fullRecord = await fetchFullOwnerRecord(recordId);
                }

                if (fullRecord && isMounted) {
                    setForm(prev => ({ ...prev, ...fullRecord }));
                }

                // Also fetch processor data for the other tab if available
                const procRecord = await fetchFullProcessorRecord(recordId);
                if (procRecord && isMounted) {
                    setDpForm(prev => ({ ...prev, ...procRecord }));
                }
                setIsLoadingFull(false);
                return;
            }

            // Fallback to draft for new records
            const savedDraft = localStorage.getItem("ropa_owner_draft");
            if (savedDraft && savedDraft.trim() !== "" && !recordId) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setForm((prev: Partial<OwnerRecord>) => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to parse draft from localStorage", e);
                }
            }
        };

        loadFullRecord();
        return () => { isMounted = false; };
    }, [recordId, snapshotId, user?.role]);

    const [dpForm, setDpForm] = useState<Partial<ProcessorRecord>>({
        processor_name: "", controller_name: "", controller_address: "",
        data_sources: [],
        has_cross_border_transfer: false,
        data_categories: [], personal_data_items: [], data_types: [],
        storage_types: [], storage_methods: [],
        retention_value: 0, retention_unit: "YEARS", access_condition: "", deletion_method: "",
        legal_basis: "",
    });

    // Processor form is already loaded in the initial full record fetch above

    const validateField = (name: string, value: any) => {
        let error = "";
        if (name === "email" || name === "rights_email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                error = "รูปแบบอีเมลไม่ถูกต้อง";
            }
        } else if (name === "phone" || name === "rights_phone") {
            const phoneRegex = /^[0-9]{10}$/;
            if (value && !phoneRegex.test(value)) {
                error = "เบอร์โทรศัพท์ต้องมี 10 หลัก";
            }
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error === "";
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Mapping fields to their respective tabs for auto-switching
        const fieldToTabMap: Record<string, string> = {
            document_name: "owner",
            title_prefix: "owner",
            first_name: "owner",
            last_name: "owner",
            address: "owner",
            email: "owner",
            phone: "owner",
            rights_email: "activity",
            rights_phone: "activity",
            data_subject_name: "activity",
            processing_activity: "activity",
            purpose_of_processing: "activity",
            data_categories: "stored",
            personal_data_items: "stored",
            data_types: "stored",
            collection_method: "retention",
            retention_value: "retention",
            access_condition: "retention",
            deletion_method: "retention",
            legal_basis: "legal",
            minor_consent: "legal",
            has_cross_border_transfer: "legal",
            transfer_country: "legal",
            transfer_company: "legal",
            transfer_method: "legal",
            transfer_protection_standard: "legal",
            transfer_exception: "legal",
            exemption_usage: "legal",
        };

        if (!form.document_name?.trim()) newErrors.document_name = "กรุณากรอกชื่อเอกสาร";

        // Section 1
        if (!form.title_prefix) newErrors.title_prefix = "กรุณาเลือกคำนำหน้า";
        if (!form.first_name) newErrors.first_name = "กรุณากรอกชื่อจริง";
        if (!form.last_name) newErrors.last_name = "กรุณากรอกนามสกุล";
        if (!form.address) newErrors.address = "กรุณากรอกที่อยู่";
        if (!form.email) newErrors.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.phone) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
        else if (!/^[0-9]{10}$/.test(form.phone)) newErrors.phone = "เบอร์โทรศัพท์ต้องมี 10 หลัก";

        // Section 2
        if (!form.rights_email) newErrors.rights_email = "กรุณากรอกอีเมลสำหรับขอใช้สิทธิ";
        if (!form.rights_phone) newErrors.rights_phone = "กรุณากรอกเบอร์โทรศัพท์สำหรับขอใช้สิทธิ";

        // Section 3
        if (!form.data_subject_name) newErrors.data_subject_name = "กรุณากรอกชื่อเจ้าของข้อมูลส่วนบุคคล";
        if (!form.processing_activity) newErrors.processing_activity = "กรุณากรอกกิจกรรมประมวลผล";
        if (!form.purpose_of_processing) newErrors.purpose_of_processing = "กรุณากรอกวัตถุประสงค์";

        // Section 4
        if (!form.data_categories || form.data_categories.length === 0) newErrors.data_categories = "กรุณาเลือกหมวดหมู่ของข้อมูล";
        if (!form.personal_data_items || form.personal_data_items.length === 0) newErrors.personal_data_items = "กรุณาเลือกข้อมูลส่วนบุคคลที่จัดเก็บ";
        if (!form.data_types || (Array.isArray(form.data_types) && form.data_types.length === 0)) newErrors.data_types = "กรุณาเลือกประเภทของข้อมูล";

        // Section 5
        if (!form.collection_method) newErrors.collection_method = "กรุณาเลือกวิธีการได้มาซึ่งข้อมูล";
        if (!form.retention_value || form.retention_value === 0) newErrors.retention_value = "กรุณาระบุระยะเวลจัดเก็บ";
        if (!form.access_condition) newErrors.access_condition = "กรุณาระบุสิทธิและวิธีการเข้าถึง";
        if (!form.deletion_method) newErrors.deletion_method = "กรุณาระบุวิธีการลบหรือทำลาย";

        // Section 6
        if (!form.legal_basis) newErrors.legal_basis = "กรุณาระบุฐานทางกฎหมาย";
        if (!form.minor_consent_under_10 && !form.minor_consent_10_to_20 && !form.minor_consent_none) {
            newErrors.minor_consent = "กรุณาเลือกการขอความยินยอมของผู้เยาว์";
        }
        if (form.has_cross_border_transfer === undefined || form.has_cross_border_transfer === null) {
            newErrors.has_cross_border_transfer = "กรุณาเลือกว่ามีการเปิดเผยไปต่างประเทศหรือไม่";
        }
        if (form.has_cross_border_transfer === true) {
            if (!form.transfer_country) newErrors.transfer_country = "กรุณาระบุประเทศปลายทาง";
            if (!form.transfer_method) newErrors.transfer_method = "กรุณาระบุวิธีการโอนข้อมูล";
        }
        if (!form.exemption_usage) newErrors.exemption_usage = "กรุณาระบุการยกเว้นการใช้งาน";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            const targetTab = fieldToTabMap[firstErrorField] || "owner";

            // 1. Auto-switch tab if necessary
            if (activeTab !== targetTab) {
                setActiveTab(targetTab);
            }

            // 2. Auto-scroll to the first error with a small delay for tab transition
            setTimeout(() => {
                const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);

            return false;
        }
        return true;
    };

    const handleChange = (e: any) => {
        const { name, value, type } = e.target;
        const targetChecked = (e.target as any).checked;

        let val: any = value;

        // 1. Enforce Numeric-only and MaxLength for Phone fields
        if (name === "phone" || name === "rights_phone") {
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
        else if (type === "checkbox" || typeof value === "boolean") {
            const isManualBoolean = typeof value === "boolean";
            const checked = isManualBoolean ? value : targetChecked;

            if (!name.includes("[]")) {
                val = (value && value !== "on" && !isManualBoolean) ? (checked ? value : "") : checked;
            }
        }

        // 5. General String Cleanups & Validation
        if (typeof val === "string") {
            if (name === "email" || name === "rights_email") {
                validateField(name, val);
            }
            if (val.toLowerCase() === "true") val = true;
            else if (val.toLowerCase() === "false") val = false;
        }

        setForm((prev: any) => {
            const next = { ...prev };

            if (name.endsWith("[]")) {
                const arrayKey = name.replace("[]", "");
                const currentArray = prev[arrayKey] || [];
                const checked = (type === "checkbox") ? targetChecked : true;
                const newArray = checked
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                next[arrayKey] = newArray;
                return next;
            }

            if (name.includes(".")) {
                const keys = name.split(".");
                let current = next;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    current[key] = { ...current[key] };
                    current = current[key];
                }
                current[keys[keys.length - 1]] = val;
                return next;
            }

            next[name] = val;
            return next;
        });
    };

    const getCompletedSteps = () => {
        const completed = [];
        if (form.title_prefix && form.first_name && form.last_name && form.address && form.email && form.phone) completed.push(1);
        if (form.rights_email && form.rights_phone) completed.push(2);
        if (form.data_subject_name && form.processing_activity && form.purpose_of_processing) completed.push(3);
        if (form.data_categories && form.data_categories.length > 0 && form.data_types && (Array.isArray(form.data_types) ? form.data_types.length > 0 : true) && form.personal_data_items && form.personal_data_items.length > 0) completed.push(4);
        if (form.collection_method && form.retention_value && form.retention_unit && form.access_condition && form.deletion_method) completed.push(5);
        const isTransferComplete = form.has_cross_border_transfer === false || (form.has_cross_border_transfer === true && form.transfer_country && form.transfer_method);
        if (form.legal_basis && isTransferComplete && form.exemption_usage) completed.push(6);
        if (form.org_measures && form.technical_measures && form.physical_measures) completed.push(7);
        return completed;
    };

    const completedSteps = getCompletedSteps();
    const doStatus = form.status === SectionStatus.SUBMITTED ? "done" : "pending";
    const dpStatus = (dpForm.status === SectionStatus.SUBMITTED && dpForm.is_sent) ? "done" : "pending";

    // ─── Handlers ──────────────────────────────────────────────────────────────

    /** ยกเลิก → ถอยกลับ หรือไปหน้า processing */
    const handleCancel = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/data-owner/management/processing");
        }
    };

    /** บันทึกฉบับร่าง → save Snapshot + กลับหน้า management */
    const handleDraft = async () => {
        if (!recordId) return;
        try {
            // saveRecord จัดการบันทึกทั้งตารางหลัก (Live) และตารางร่าง (Snapshot) ให้ลิงก์กันอัตโนมัติ
            await saveRecord(form);
            setErrors({}); // ล้าง error เมื่อบันทึกร่าง
            setIsDraftSuccessOpen(true); // แสดง modal บันทึกร่างสำเร็จ
        } catch (error) {
            console.error("Failed to save draft:", error);
        }
    };

    /** กดบันทึก → validate → review mode */
    const handleSave = () => {
        if (!form.document_name) {
            setErrors(prev => ({ ...prev, document_name: "กรุณาตั้งชื่อเอกสาร" }));
        }
        if (validateForm()) {
            setIsReviewMode(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    /** ยืนยันบันทึก → submitDoSection → modal สำเร็จ */
    const handleFinalConfirm = async () => {
        const saved = await saveRecord({ ...form, status: RopaStatus.Processing } as OwnerRecord);
        if (saved.id) {
            await submitDoSection(saved.id);
        }
        localStorage.removeItem("ropa_owner_draft");
        setIsSuccessModalOpen(true);
    };

    /** ส่งคำร้องขอเปลี่ยนแปลง DP section */
    const handleFeedbackConfirm = async () => {
        setFeedbackModal({ open: false, section: "" });
        if (!recordId) return;

        try {
            const items = Object.entries(draftFeedbacks).map(([key, comment]) => {
                // key is format like dp-1, dp-2 ...
                const sectionNumberStr = key.split('-')[1];
                const sectionNumber = sectionNumberStr ? parseInt(sectionNumberStr, 10) : 1;
                return {
                    section_number: sectionNumber,
                    comment: comment.trim()
                };
            }).filter(item => item.comment !== "");

            if (items.length > 0) {
                await submitFeedbackBatch(recordId, items);
            }
            setDraftFeedbacks({});
            setActiveFeedbacks({});
            router.push("/data-owner/management/processing");
        } catch (error) {
            console.error("Failed to send feedback batch:", error);
        }
    };

    /** Risk Assessment submitted */
    const handleRiskSubmit = async (likelihood: number, impact: number) => {
        if (recordId) {
            try {
                await saveRiskAssessment(recordId, { likelihood, impact });
                await sendToDpo(recordId);
                router.push("/data-owner/management/processing");
            } catch (error) {
                console.error("Failed to submit risk assessment:", error);
            }
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col overflow-x-hidden">
                <TopBar
                    documentName={form.document_name}
                    pageTitle="ข้อมูลลูกค้า"
                    handleChange={handleChange}
                    status={form.status}
                    hideSearch={true}
                    hasError={!!errors.document_name}
                    formMode={true}
                />

                {isLoadingFull ? (
                    <div className="flex-1 flex items-center justify-center pt-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#B90A1E] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[#5F5E5E] font-bold animate-pulse">กำลังโหลดข้อมูลเอกสาร...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pt-6 pb-36 space-y-6 animate-in fade-in duration-1000">

                        <div className="flex items-center justify-between gap-4 px-10">
                            <div className="flex-1">
                                <FormTabs
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    doComplete={doStatus === "done"}
                                    dpComplete={dpStatus === "done"}
                                />
                            </div>
                            {activeTab === "owner" && !isNewEdit && (
                                <button
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold shrink-0",
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
                            )}
                        </div>

                        <div className="px-10">

                            {/* ─── Tab: DO (ส่วนของผู้รับผิดชอบข้อมูล) ─────────────── */}
                            {activeTab === "owner" && (
                                <div className="space-y-8">
                                    <Stepper completedSteps={completedSteps} />

                                    <div className={cn(
                                        "space-y-8 transition-all duration-300",
                                        isReviewMode && "opacity-75 pointer-events-none grayscale-[0.2]"
                                    )}>
                                        {renderDOSection("1", "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", GeneralInfo)}
                                        {renderDOSection("2", "ส่วนที่ 2 : ช่องทางการติดต่อกรณีต้องการใช้สิทธิ", RightsChannel)}
                                        {renderDOSection("3", "ส่วนที่ 3 : รายละเอียดของกิจกรรมและวัตถุประสงค์", ActivityDetails)}
                                        {renderDOSection("4", "ส่วนที่ 4 : ข้อมูลส่วนบุคคลที่จัดเก็บ", StoredInfo)}
                                        {renderDOSection("5", "ส่วนที่ 5 : การเก็บรักษาข้อมูล", RetentionInfo)}
                                        {renderDOSection("6", "ส่วนที่ 6 : ฐานทางกฎหมาย (Legal Basis)", LegalInfo)}
                                        {renderDOSection("7", "ส่วนที่ 7 : มาตรการการรักษาความมั่นคงปลอดภัย", SecurityMeasures)}
                                    </div>
                                </div>
                            )}

                            {/* ─── Tab: DP (ส่วนของผู้ประมวลผล) ───────────────────── */}
                            {activeTab === "processor" && (
                                <div className="space-y-8 mt-4">
                                    {renderDPSection("dp-1", "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", GeneralInfo)}
                                    {renderDPSection("dp-2", "ส่วนที่ 2 : รายละเอียดกิจกรรม", ActivityDetails)}
                                    {renderDPSection("dp-3", "ส่วนที่ 3 : ข้อมูลส่วนบุคคลที่จัดเก็บ", StoredInfo)}
                                    {renderDPSection("dp-4", "ส่วนที่ 4 : การเก็บรักษาข้อมูล", RetentionInfo)}
                                    {renderDPSection("dp-5", "ส่วนที่ 5 : ฐานทางกฎหมาย (Legal Basis)", LegalInfo)}
                                    {renderDPSection("dp-6", "ส่วนที่ 6 : มาตรการการรักษาความมั่นคงปลอดภัย", SecurityMeasures)}
                                </div>
                            )}

                            {/* ─── Tab: Risk Assessment ────────────────────────────── */}
                            {activeTab === "risk" && (
                                <div className="mt-4 space-y-8">
                                    <RiskAssessment
                                        doStatus={doStatus}
                                        dpStatus={dpStatus}
                                        existingRisk={form.risk_assessment}
                                        dpoSuggestion={(() => {
                                            const riskSuggestion = form.suggestions?.find(s => s.section === "DO_RISK");
                                            return riskSuggestion ? { comment: riskSuggestion.comment, date: riskSuggestion.date } : undefined;
                                        })()}
                                        activeView={riskDocView}
                                        onViewDoSection={() => setRiskDocView(v => v === "owner" ? "none" : "owner")}
                                        onViewDpSection={() => setRiskDocView(v => v === "processor" ? "none" : "processor")}
                                        onSubmit={handleRiskSubmit}
                                        onCancel={() => setActiveTab("owner")}
                                    />

                                    {/* Render view forms below the Risk Assessment UI without switching tabs */}
                                    {riskDocView === "owner" && (
                                        <div className="space-y-8 pb-32 animate-in slide-in-from-top-4 duration-500">
                                            <hr className="border-[#E5E2E1] my-8" />
                                            <h2 className="text-xl font-black text-[#1B1C1C] flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">person</span>
                                                ข้อมูลส่วนของผู้รับผิดชอบข้อมูล
                                            </h2>
                                            {renderDOSection("1", "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", GeneralInfo)}
                                            {renderDOSection("2", "ส่วนที่ 2 : ช่องทางการติดต่อกรณีต้องการใช้สิทธิ", RightsChannel)}
                                            {renderDOSection("3", "ส่วนที่ 3 : รายละเอียดของกิจกรรมและวัตถุประสงค์", ActivityDetails)}
                                            {renderDOSection("4", "ส่วนที่ 4 : ข้อมูลส่วนบุคคลที่จัดเก็บ", StoredInfo)}
                                            {renderDOSection("5", "ส่วนที่ 5 : การเก็บรักษาข้อมูล", RetentionInfo)}
                                            {renderDOSection("6", "ส่วนที่ 6 : ฐานทางกฎหมาย (Legal Basis)", LegalInfo)}
                                            {renderDOSection("7", "ส่วนที่ 7 : มาตรการการรักษาความมั่นคงปลอดภัย", SecurityMeasures)}
                                        </div>
                                    )}

                                    {riskDocView === "processor" && (
                                        <div className="space-y-8 pb-32 animate-in slide-in-from-top-4 duration-500">
                                            <hr className="border-[#E5E2E1] my-8" />
                                            <h2 className="text-xl font-black text-[#1B1C1C] flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">business</span>
                                                ข้อมูลส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                                            </h2>
                                            {renderDPSection("dp-1", "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", GeneralInfo)}
                                            {renderDPSection("dp-2", "ส่วนที่ 2 : รายละเอียดกิจกรรม", ActivityDetails)}
                                            {renderDPSection("dp-3", "ส่วนที่ 3 : ข้อมูลส่วนบุคคลที่จัดเก็บ", StoredInfo)}
                                            {renderDPSection("dp-4", "ส่วนที่ 4 : การเก็บรักษาข้อมูล", RetentionInfo)}
                                            {renderDPSection("dp-5", "ส่วนที่ 5 : ฐานทางกฎหมาย (Legal Basis)", LegalInfo)}
                                            {renderDPSection("dp-6", "ส่วนที่ 6 : มาตรการการรักษาความมั่นคงปลอดภัย", SecurityMeasures)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── Tab: ยื่นคำร้องขอทำลาย ──────────────────────────── */}
                            {activeTab === "destruction" && (
                                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full px-4 border-none shadow-none">
                                    <div className="space-y-4">
                                        <h3 className="text-[18px] font-black text-[#1B1C1C] mb-4">เหตุผลในการขอทำลายเอกสาร</h3>
                                        
                                        <textarea
                                            value={form.deletion_reason || ""}
                                            onChange={(e) => setForm(prev => ({ ...prev, deletion_reason: e.target.value }))}
                                            rows={4}
                                            className="w-full bg-white border border-[#E5E2E1] rounded-xl p-4 text-[#1B1C1C] focus:ring-2 focus:ring-[#B90A1E]/20 transition-all outline-none text-[14px]"
                                            placeholder="ระบุเหตุผลในการขอทำลายเอกสาร เพื่อส่งคำขอไปยังเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                                        />

                                        <div className="flex items-center justify-between mt-8 pt-4">
                                            <button
                                                onClick={() => setActiveTab("owner")}
                                                className="bg-white border text-[#1B1C1C] border-[#E5E2E1] h-[48px] px-8 rounded-full font-bold hover:bg-gray-50 transition-all"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                disabled={!form.deletion_reason || form.deletion_request?.status === "PENDING" || viewMode}
                                                onClick={() => setIsConfirmDeleteOpen(true)}
                                                className="bg-logout-gradient text-white h-[48px] px-8 rounded-full font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                            >
                                                {form.deletion_request?.status === "PENDING" ? "รอดำเนินการ..." : "ส่งคำร้องขอทำลาย"}
                                            </button>
                                        </div>

                                        {/* ─── Deletion Request Status Section (Screenshots) ────────────────── */}
                                        {form.deletion_request && (
                                            <div className="pt-8 border-t border-[#E5E2E1] space-y-6">
                                                <h4 className="text-lg font-black text-[#1B1C1C]">ตรวจสอบสถานะคำร้องปัจจุบัน</h4>

                                                <div className="flex flex-col items-start gap-4">
                                                    {form.deletion_request.status === "APPROVED" && (
                                                        <span className="bg-[#108548] text-white px-8 py-2.5 rounded-xl font-bold text-lg">
                                                            อนุมัติคำร้อง
                                                        </span>
                                                    )}
                                                    {form.deletion_request.status === "REJECTED" && (
                                                        <span className="bg-[#B90A1E] text-white px-8 py-2.5 rounded-xl font-bold text-lg">
                                                            ไม่อนุมัติคำร้อง
                                                        </span>
                                                    )}
                                                    {form.deletion_request.status === "PENDING" && (
                                                        <span className="bg-[#EAB308] text-white px-8 py-2.5 rounded-xl font-bold text-lg">
                                                            รอการตรวจสอบ
                                                        </span>
                                                    )}

                                                    <div className="w-full bg-[#EEEEEE] p-6 rounded-2xl">
                                                        <p className="text-[#1B1C1C] font-bold text-lg">
                                                            {form.deletion_request.status === "APPROVED"
                                                                ? "ครบกำหนดเวลาในการทำลาย"
                                                                : form.deletion_request.status === "REJECTED"
                                                                    ? "ยังไม่ครบกำหนดเวลาในการทำลาย"
                                                                    : "คำร้องของคุณอยู่ในระหว่างการพิจารณาโดย DPO"
                                                            }
                                                        </p>
                                                        {form.deletion_request.dpo_reason && (
                                                            <p className="text-[#5F5E5E] font-medium mt-2">
                                                                เหตุผล: {form.deletion_request.dpo_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Bottom Action Bar ────────────────────────────────────── */}
                {viewMode && Object.values(draftFeedbacks).some(v => v.trim() !== "") ? (
                    /* Feedback Bar takes priority in viewMode if comments are being drafted */
                    <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/60 p-6 px-10 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => { setDraftFeedbacks({}); setActiveFeedbacks({}); }}
                            className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            ยกเลิกการแก้ไข
                        </button>

                        <button
                            onClick={() => setFeedbackModal({ open: true, section: "all" })}
                            className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                        >
                            ส่งคำร้องขอเปลี่ยนแปลง
                        </button>
                    </div>
                ) : activeTab === "owner" && (
                    !isReviewMode ? (
                        /* Normal form mode or view mode (Conditional buttons based on lock state) */
                        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/50 p-6 px-10 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                            {viewMode && isLocked ? (
                                /* Single Centered Back Button in Locked View Mode */
                                <div className="flex justify-center w-full">
                                    <button
                                        onClick={handleCancel}
                                        className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-20 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                    >
                                        กลับ
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Left: Cancellation */}
                                    <button
                                        onClick={handleCancel}
                                        className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                    >
                                        ยกเลิก
                                    </button>

                                    {/* Right Group: Draft + Save */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleDraft}
                                            className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-10 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                        >
                                            บันทึกฉบับร่าง
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                                        >
                                            บันทึก
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Review Confirmation mode */
                        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/60 p-6 px-10 flex items-center justify-end z-40 gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button
                                onClick={() => setIsReviewMode(false)}
                                className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                กลับไปแก้ไข
                            </button>
                            <button
                                onClick={handleFinalConfirm}
                                className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                            >
                                ยืนยันข้อมูล RoPA
                            </button>
                        </div>
                    )
                )}


                {/* View mode close */}
                {/* View Mode empty footer placeholder or just removed */}
            </main>

            {/* ─── Feedback Modal ───────────────────────────────────────────── */}
            <FeedbackModal
                isOpen={feedbackModal.open}
                sectionName={feedbackModal.section}
                onClose={() => setFeedbackModal({ open: false, section: "" })}
                onConfirm={handleFeedbackConfirm}
            />

            {/* ─── Draft Success Modal ──────────────────────────────────────── */}
            {isDraftSuccessOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[500px] rounded-[48px] shadow-2xl p-14 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="bg-[#ED393C]/10 p-4 rounded-2xl mb-6">
                            <span className="material-symbols-outlined text-[#ED393C] text-[40px]">save</span>
                        </div>
                        <h2 className="text-3xl font-black text-[#1B1C1C] tracking-tight mb-2">บันทึกฉบับร่างแล้ว</h2>
                        <p className="text-base font-bold text-[#5F5E5E] mb-8">
                            สามารถกลับมาแก้ไขได้จากหน้าเอกสารที่ดำเนินการ
                        </p>
                        <button
                            onClick={() => router.push("/data-owner/management/processing")}
                            className="bg-logout-gradient leading-none text-white w-full h-[52px] rounded-2xl font-black text-base shadow-lg shadow-[#ED393C]/20 hover:brightness-110 transition-all active:scale-95"
                        >
                            กลับสู่หน้าเอกสารที่ดำเนินการ
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Success Modal ─────────────────────────────────────── */}
            <SaveSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                onConfirm={() => router.push("/data-owner/management/processing")}
            />

            {/* ─── Confirm Delete Request Modal ───────────────────────────────── */}
            {isConfirmDeleteOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl p-8 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setIsConfirmDeleteOpen(false)}
                            className="absolute right-6 top-6 text-[#1B1C1C] hover:bg-gray-100 p-2 rounded-full transition-all"
                        >
                            <span className="material-symbols-outlined text-[28px]">close</span>
                        </button>
                        
                        <h2 className="text-[24px] font-black text-[#1B1C1C] tracking-tight mt-4 mb-2">ส่งคำร้องขอทำลายเอกสาร</h2>
                        <p className="text-[16px] text-[#5F5E5E] font-medium mb-8">
                            โปรดตรวจสอบข้อมูลให้ครบถ้วน
                        </p>
                        
                        <button
                            onClick={async () => {
                                setIsConfirmDeleteOpen(false);
                                if (recordId && form.deletion_reason) {
                                    await requestDelete(recordId, form.deletion_reason);
                                    setIsSuccessModalOpen(true);
                                }
                            }}
                            className="bg-logout-gradient leading-none text-white w-full max-w-[200px] h-[48px] rounded-full font-black text-[16px] shadow-sm hover:brightness-110 transition-all active:scale-95"
                        >
                            ยืนยันการส่งคำร้อง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ManagementFormPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-surface-container-low">
                <div className="text-secondary font-bold animate-pulse text-lg">กำลังโหลด...</div>
            </div>
        }>
            <ManagementFormContent />
        </Suspense>
    );
}

export default ManagementFormPage;
