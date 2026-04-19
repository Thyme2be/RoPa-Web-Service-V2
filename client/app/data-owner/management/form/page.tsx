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
import { RopaStatus, CollectionMethod, RetentionUnit, DataType } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { cn } from "@/lib/utils";

// ─── Dummy mockDpSections removed ─────────────

function ManagementFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recordId = searchParams.get("id");
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
        requestDelete
    } = useRopa();
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isLocked, setIsLocked] = useState(!isNewEdit);
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);
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
                const fullRecord = await fetchFullOwnerRecord(recordId);
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
    }, [recordId]);

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
        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                error = "รูปแบบอีเมลไม่ถูกต้อง";
            }
        } else if (name === "phoneNumber") {
            const phoneRegex = /^[0-9]{10}$/;
            if (value && !phoneRegex.test(value)) {
                error = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)";
            }
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error === "";
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!form.document_name?.trim()) newErrors.document_name = "กรุณากรอกชื่อเอกสาร";

        // Section 1
        if (!form.title_prefix) newErrors.title_prefix = "กรุณาเลือกคำนำหน้า";
        if (!form.first_name) newErrors.first_name = "กรุณากรอกชื่อ";
        if (!form.last_name) newErrors.last_name = "กรุณากรอกนามสกุล";
        if (!form.address) newErrors.address = "กรุณากรอกที่อยู่";
        if (!form.email) newErrors.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.phone) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
        else if (!/^[0-9]{10}$/.test(form.phone)) newErrors.phone = "เบอร์โทรศัพท์ต้องมี 10 หลัก";

        // Section 2
        if (!form.rights_email) newErrors.rights_email = "กรุณากรอกอีเมลช่องทางใช้สิทธิ";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.rights_email)) newErrors.rights_email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.rights_phone) newErrors.rights_phone = "กรุณากรอกเบอร์โทรศัพท์ช่องทางใช้สิทธิ";

        // Section 3
        if (!form.data_subject_name) newErrors.data_subject_name = "กรุณากรอกชื่อเจ้าของข้อมูลส่วนบุคคล";
        if (!form.processing_activity) newErrors.processing_activity = "กรุณากรอกกิจกรรมประมวลผล";
        if (!form.purpose_of_processing) newErrors.purpose_of_processing = "กรุณากรอกวัตถุประสงค์การประมวลผล";

        // Section 4
        if (!form.personal_data_items || form.personal_data_items.length === 0) newErrors.personal_data_items = "กรุณาเลือกข้อมูลส่วนบุคคลอย่างน้อย 1 รายการ";
        if (!form.data_categories || form.data_categories.length === 0) newErrors.data_categories = "กรุณาเลือกหมวดหมู่ของข้อมูลอย่างน้อย 1 รายการ";
        if (!form.data_types || (Array.isArray(form.data_types) && form.data_types.length === 0)) newErrors.data_types = "กรุณาเลือกประเภทของข้อมูล";

        // Section 5
        if (!form.collection_method) newErrors.collection_method = "กรุณาเลือกวิธีการได้มาซึ่งข้อมูล";
        if (!form.retention_value || form.retention_value <= 0) newErrors.retention_value = "กรุณาระบุระยะเวลาการเก็บรักษาข้อมูล";
        if (!form.access_condition) newErrors.access_condition = "กรุณาระบุสิทธิและวิธีการเข้าถึงข้อมูล";
        if (!form.deletion_method) newErrors.deletion_method = "กรุณาระบุวิธีการลบหรือทำลายข้อมูล";

        // Section 6
        if (!form.legal_basis) newErrors.legal_basis = "กรุณาระบุฐานในการประมวลผล";
        if (!form.minor_consent_under_10 && !form.minor_consent_10_to_20 && !form.minor_consent_none) newErrors.minor_consent = "กรุณาเลือกการขอความยินยอมของผู้เยาว์อย่างน้อย 1 รายการ";
        if (form.has_cross_border_transfer === undefined || form.has_cross_border_transfer === null) newErrors.has_cross_border_transfer = "กรุณาเลือกว่ามีการส่งข้อมูลไปต่างประเทศหรือไม่";

        if (form.has_cross_border_transfer === true) {
            if (!form.transfer_country) newErrors.transfer_country = "กรุณาระบุประเทศปลายทาง";
            if (!form.transfer_company) newErrors.transfer_company = "กรุณาระบุชื่อบริษัท";
            if (!form.transfer_method) newErrors.transfer_method = "กรุณาระบุวิธีการโอนข้อมูล";
            if (!form.transfer_protection_standard) newErrors.transfer_protection_standard = "กรุณาระบุมาตรฐานการคุ้มครองข้อมูล";
            if (!form.transfer_exception) newErrors.transfer_exception = "กรุณาระบุข้อยกเว้นตามมาตรา 28";
        }
        if (!form.exemption_usage) newErrors.exemption_usage = "กรุณาระบุการใช้หรือเปิดเผยข้อมูลที่ได้รับยกเว้น";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
            return false;
        }
        return true;
    };

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

        if (typeof val === "string") {
            if (val.toLowerCase() === "true") val = true;
            else if (val.toLowerCase() === "false") val = false;
        }

        if (name === "email" || name === "phone") {
            validateField(name, val);
        }

        setForm((prev: any) => {
            if (name.endsWith("[]")) {
                const arrayKey = name.replace("[]", "");
                const currentArray = prev[arrayKey] || [];
                const newArray = checked
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                return { ...prev, [arrayKey]: newArray };
            }

            return { ...prev, [name]: val };
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
    const doStatus = "done"; // Mocked to 'done' so Risk Assessment unlocks
    const dpStatus = "done"; // Mocked to 'done' so Risk Assessment unlocks

    // ─── Handlers ──────────────────────────────────────────────────────────────

    /** ยกเลิก → กลับหน้า processing */
    const handleCancel = () => {
        router.push("/data-owner/management/processing");
    };

    /** บันทึกฉบับร่าง → save Draft + กลับ processing */
    const handleDraft = async () => {
        const saved = await saveRecord({ ...form, status: RopaStatus.Draft } as OwnerRecord);
        localStorage.setItem("ropa_owner_draft", JSON.stringify({ ...form, id: saved.id }));
        setErrors({}); // Clear errors on draft
        setIsDraftSuccessOpen(true);
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
    const handleFeedbackConfirm = () => {
        setFeedbackModal({ open: false, section: "" });
        // In real app: call API to notify DP
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
                                <div className="bg-white rounded-[32px] p-12 border border-[#E5E2E1] mt-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="bg-red-50 p-6 rounded-3xl mb-6">
                                                <span className="material-symbols-outlined text-[48px] text-[#B90A1E]">delete_forever</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-[#1B1C1C]">ยื่นคำร้องขอทำลายเอกสาร</h3>
                                            <p className="text-[#5F5E5E] font-bold mt-2">
                                                กรุณากรอกเหตุผลที่ต้องการทำลายเอกสาร RoPA ฉบับนี้ <br />
                                                เพื่อให้ผู้ดูแลระบบ (DPO) พิจารณาอนุมัติ
                                            </p>
                                        </div>

                                        <div className="bg-[#F6F3F2] p-8 rounded-[24px] space-y-4">
                                            <label className="block text-base font-black text-[#1B1C1C]">เหตุผลการขอทำลาย</label>
                                            <textarea
                                                value={form.deletion_reason || ""}
                                                onChange={(e) => setForm(prev => ({ ...prev, deletion_reason: e.target.value }))}
                                                rows={6}
                                                className="w-full bg-white border border-[#E5E2E1] rounded-2xl p-4 text-[#1B1C1C] focus:ring-2 focus:ring-[#B90A1E]/20 transition-all outline-none text-base font-bold"
                                                placeholder="ระบุเหตุผล เช่น สิ้นสุดระยะเวลาเก็บรักษาตามกฎหมาย, กิจกรรมไม่มีการดำเนินการแล้ว..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 justify-center">
                                            <button
                                                onClick={() => setActiveTab("owner")}
                                                className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                disabled={!form.deletion_reason || form.deletion_request?.status === "PENDING" || viewMode}
                                                onClick={async () => {
                                                    if (recordId && form.deletion_reason) {
                                                        await requestDelete(recordId, form.deletion_reason);
                                                        setIsSuccessModalOpen(true);
                                                    }
                                                }}
                                                className="bg-logout-gradient text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
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
                {activeTab === "owner" && !viewMode && (
                    !isReviewMode ? (
                        /* Normal form mode */
                        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/50 p-6 px-10 flex items-center justify-between z-40">
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
                                    className="bg-white border-2 border-[#ED393C] text-[#ED393C] font-bold text-base h-[52px] px-10 rounded-full hover:bg-[#ED393C]/5 transition-all active:scale-95 shadow-sm whitespace-nowrap"
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
                        </div>
                    ) : (
                        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/60 p-6 px-10 flex items-center justify-end z-40 gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button
                                onClick={handleFinalConfirm}
                                className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                            >
                                ยืนยันข้อมูล RoPA
                            </button>
                        </div>
                    )
                )}

                {/* ─── Review Mode Action Bar (Sending Feedback) ───────────── */}
                {viewMode && Object.values(draftFeedbacks).some(v => v.trim() !== "") && (
                    <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/60 p-6 px-10 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => { setDraftFeedbacks({}); setActiveFeedbacks({}); }}
                            className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            ยกเลิก
                        </button>

                        <button
                            onClick={() => setFeedbackModal({ open: true, section: "all" })}
                            className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                        >
                            ส่งคำร้องขอเปลี่ยนแปลง
                        </button>
                    </div>
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
