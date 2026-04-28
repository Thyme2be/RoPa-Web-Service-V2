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
import ConfirmModal from "@/components/ropa/ConfirmModal";
import SaveConfirmModal from "@/components/ropa/SaveConfirmModal";
import DestructionConfirmModal from "@/components/ropa/DestructionConfirmModal";

import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import toast from "react-hot-toast";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus, SectionStatus, CollectionMethod, RetentionUnit, DataType } from "@/types/enums";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOwner } from "@/context/OwnerContext";
import { useProcessor } from "@/context/ProcessorContext";
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
    const isNewCreate = searchParams.get("mode") === "create";

    const [activeTab, setActiveTab] = useState("owner");
    const {
        saveRecord,
        getById,
        submitDoSection,
        sendToDpo,
        saveRiskAssessment,
        fetchFullOwnerRecord,
        createOwnerSnapshot,
        fetchOwnerSnapshot,
        requestDelete,
        submitFeedbackBatch
    } = useOwner();
    const { fetchFullProcessorRecord } = useProcessor();
    const record = getById(recordId || "");
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);
    
    // Strict Locking: ล็อก form ทันทีสำหรับเอกสารเดิม (แม้จะมาด้วย mode=edit)
    // จะปลดล็อกอัตโนมัติเฉพาะกรณี: 1. กำลังสร้างใหม่ (mode=create) 2. กำลังแก้ไขฉบับร่าง (snapshotId)
    const [isLocked, setIsLocked] = useState(!isNewCreate && !snapshotId);
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");
    const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
    const [isConfirmRiskOpen, setIsConfirmRiskOpen] = useState(false);
    const [pendingRisk, setPendingRisk] = useState({ probability: 0, impact: 0 });
    const [isDraftSuccessOpen, setIsDraftSuccessOpen] = useState(false);
    const [isConfirmDeletionOpen, setIsConfirmDeletionOpen] = useState(false);
    const [deletionReason, setDeletionReason] = useState("");
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; section: string }>({ open: false, section: "" });

    // Feedback states
    const [activeFeedbacks, setActiveFeedbacks] = useState<Record<string, boolean>>({});
    const [draftFeedbacks, setDraftFeedbacks] = useState<Record<string, string>>({});

    const handleFeedbackChange = (sectionId: string, text: string) => setDraftFeedbacks(prev => ({ ...prev, [sectionId]: text }));
    const handleReviewClick = (sectionId: string) => setActiveFeedbacks(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

    const getLatestSuggestions = (items: any[] = [], limit = 1) =>
        [...items]
            .sort((a, b) => {
                const aTime = new Date(a?.created_at || a?.date || 0).getTime();
                const bTime = new Date(b?.created_at || b?.date || 0).getTime();
                return bTime - aTime;
            })
            .slice(0, limit);

    const handleFeedbackConfirm = async () => {
        if (!recordId) return;
        
        const feedbackItems = Object.entries(draftFeedbacks)
            .filter(([_, text]) => text.trim() !== "")
            .map(([sectionId, text]) => ({
                section_number: parseInt(sectionId.replace("dp-", "")),
                comment: text
            }));

        try {
            await submitFeedbackBatch(recordId, feedbackItems);
            // Refresh record to get new status
            const procRecord = await fetchFullProcessorRecord(recordId);
            if (procRecord) {
                setDpForm(prev => ({ ...prev, ...procRecord }));
            }
            setDraftFeedbacks({});
            setActiveFeedbacks({});
            setFeedbackModal({ open: false, section: "" }); // Important: Close the modal
            toast.success("ส่งคำร้องขอเปลี่ยนแปลงสำเร็จ เอกสารถูกตีกลับไปที่ผู้ประมวลผลแล้ว");
        } catch (e) {
            console.error("Failed to submit feedback batch", e);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        }
    };

    const renderDOSection = (id: string, title: string, Component: any) => {
        const suggestions = form.suggestions?.filter(s => s.section_id.toString() === id) || [];
        const latestSuggestions = getLatestSuggestions(suggestions, 2).reverse();
        return (
            <InlineFeedbackWrapper
                title={title}
                isDraftingFeedback={!!activeFeedbacks[id]}
                onFeedbackChange={(text) => handleFeedbackChange(id, text)}
                feedbackText={draftFeedbacks[id] || ""}
                existingSuggestions={latestSuggestions.length > 0 ? latestSuggestions.map((s: any) => ({ text: s.comment, date: s.date, reviewer: s.reviewer })) : undefined}
                canReview={false}
                onReviewClick={() => handleReviewClick(id)}
            >
                <Component form={form} handleChange={handleChange} errors={errors} disabled={effectiveIsLocked || isReviewMode} />
            </InlineFeedbackWrapper>
        );
    };

    const renderDPSection = (id: string, title: string, Component: any) => {
        const sectionNo = parseInt(id.replace("dp-", ""), 10);
        const feedbacks = dpForm.feedbacks?.filter((f: any) => f.section_number === sectionNo) || [];
        const latestTwoFeedbacks = getLatestSuggestions(feedbacks, 2).reverse();
        return (
            <InlineFeedbackWrapper
                title={title}
                isDraftingFeedback={!!activeFeedbacks[id]}
                onFeedbackChange={(text) => handleFeedbackChange(id, text)}
                feedbackText={draftFeedbacks[id] || ""}
                existingSuggestions={latestTwoFeedbacks.length > 0 ? latestTwoFeedbacks.map((f: any) => ({ text: f.comment, date: f.created_at, reviewer: f.from_user_name || "Data Owner (ผู้รับผิดชอบข้อมูล)" })) : undefined}
                canReview={viewMode && !isWaitingDpResubmitGlobal}
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
        minor_consent_types: [],
        storage_types: [],
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
        storage_methods: "",
        workflow: "processing",
    });

    const isWaitingDpoApproval = 
        (form.document_status === RopaStatus.UNDER_REVIEW || form.document_status === RopaStatus.COMPLETED) && 
        !form.suggestions?.some(s => s.section && s.section.startsWith("DO_"));

    const isLockedByDeletion = form.deletion_status === "DELETE_PENDING";
    const effectiveIsLocked = isLocked || isLockedByDeletion || isWaitingDpoApproval;

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

        if (searchParams.get("mode") === "deletion") {
            setActiveTab("destruction");
        }

        return () => { isMounted = false; };
    }, [recordId, snapshotId, user?.role, searchParams]);

    const [dpForm, setDpForm] = useState<Partial<ProcessorRecord>>({
        processor_name: "", controller_name: "", controller_address: "",
        data_sources: [],
        has_cross_border_transfer: false,
        data_categories: [], personal_data_items: [], data_types: [],
        storage_types: [], storage_methods: [],
        retention_value: 0, retention_unit: "YEARS", access_condition: "", deletion_method: "",
        legal_basis: "",
    });
    const hasPendingDpFeedback = (dpForm.feedbacks || []).some((f: any) => {
        const state = String(f?.status || "").toUpperCase();
        return !["RESOLVED", "FIXED", "CLOSED"].includes(state);
    });
    const isWaitingDpResubmitGlobal =
        record?.processor_status?.code === "DP_NEED_FIX" || hasPendingDpFeedback;

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
            title_prefix: "owner",
            first_name: "owner",
            last_name: "owner",
            address: "owner",
            email: "owner",
            phone: "owner",
            rights_email: "owner",
            rights_phone: "owner",
            data_subject_name: "owner",
            processing_activity: "owner",
            purpose_of_processing: "owner",
            data_categories: "owner",
            personal_data_items: "owner",
            data_types: "owner",
            collection_method: "owner",
            storage_types: "owner",
            storage_methods: "owner",
            retention_value: "owner",
            access_condition: "owner",
            deletion_method: "owner",
            legal_basis: "owner",
            minor_consent_types: "owner",
            has_cross_border_transfer: "owner",
            transfer_country: "owner",
            transfer_company: "owner",
            transfer_method: "owner",
            transfer_protection_standard: "owner",
            transfer_exception: "owner",
            exemption_usage: "owner",
        };

        // document_name removed from validation per user request

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
        if (!form.storage_types || form.storage_types.length === 0) newErrors.storage_types = "กรุณาเลือกประเภทของข้อมูลที่จัดเก็บ";
        if (!form.retention_value || form.retention_value === 0) newErrors.retention_value = "กรุณาระบุระยะเวลจัดเก็บ";
        if (!form.access_condition) newErrors.access_condition = "กรุณาระบุสิทธิและวิธีการเข้าถึง";
        if (!form.deletion_method) newErrors.deletion_method = "กรุณาระบุวิธีการลบหรือทำลาย";

        // Section 6
        if (!form.legal_basis) newErrors.legal_basis = "กรุณาระบุฐานทางกฎหมาย";
        if (!form.minor_consent_types || form.minor_consent_types.length === 0) {
            newErrors.minor_consent_types = "กรุณาเลือกการขอความยินยอมของผู้เยาว์";
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
            const errorMessage = newErrors[firstErrorField];

            // 1. Auto-switch tab if necessary
            if (activeTab !== targetTab) {
                setActiveTab(targetTab);
            }

            // 2. Auto-scroll to the first error with a small delay for tab transition
            setTimeout(() => {
                const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
                if (element) {
                    const yOffset = -120; // Fixed header offset
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                } else {
                    // Fallback alert if element not found in DOM
                    toast.error(`กรุณาตรวจสอบข้อมูล: ${errorMessage}`);
                }
            }, 250);

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
    const doStatus = (form.status === SectionStatus.SUBMITTED || form.status === RopaStatus.Processing) ? "done" : "pending";
    
    // Check DP status more robustly using badge code from backend if available
    const dpStatus = (
        record?.processor_status?.code === "DP_DONE" || 
        ((dpForm.status === SectionStatus.SUBMITTED || dpForm.status === RopaStatus.Processing) && dpForm.is_sent)
    ) ? "done" : "pending";
    
    // Risk assessment is editable if both sections are done AND not yet under review/completed by DPO
    // OR if it's a DPO feedback round (indicated by existing suggestions) and DO is done
    const isOwner = user?.role === "OWNER";
    const hasDpoFeedback = (form.suggestions && form.suggestions.length > 0) || record?.owner_status?.code === "DPO_REJECTED" || record?.processor_status?.code === "DPO_REJECTED";
    const canEditRisk = isOwner && doStatus === "done" && (dpStatus === "done" || hasDpoFeedback) && !isWaitingDpoApproval && !isLockedByDeletion && !isLocked;

    // ─── Handlers ──────────────────────────────────────────────────────────────

    /** ยกเลิก → ถอยกลับ หรือไปหน้า processing */
    const handleCancel = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/data-owner/management/processing");
        }
    };

    /** บันทึกฉบับร่าง → save ฉบับร่าง + กลับหน้า management */
    const handleDraft = async () => {
        if (!recordId) return;
        try {
            // saveRecord จัดการบันทึกทั้งตารางหลัก (Live) และตารางร่าง (ฉบับร่าง) ให้ลิงก์กันอัตโนมัติ
            await saveRecord(form);
            setErrors({}); // ล้าง error เมื่อบันทึกร่าง
            setIsDraftSuccessOpen(true); // แสดง modal บันทึกร่างสำเร็จ
        } catch (error) {
            console.error("Failed to save draft:", error);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        }
    };

    /** กดบันทึก → validate → แสดง modal ยืนยัน */
    const handleSave = () => {
        if (validateForm()) {
            setIsConfirmSaveOpen(true);
        }
    };

    /** กดยืนยันใน modal → ทริกเกอร์การบันทึกและเปลี่ยนสถานะ */
    const confirmSave = async () => {
        setIsConfirmSaveOpen(false);
        await handleFinalConfirm();
    };

    /** ยืนยันบันทึก → submitDoSection → modal สำเร็จ */
    const handleFinalConfirm = async () => {
        try {
            const saved = await saveRecord({ ...form, status: RopaStatus.Processing } as OwnerRecord);
            if (saved.id) {
                await submitDoSection(saved.id, saved);
            }
            localStorage.removeItem("ropa_owner_draft");
            router.push("/data-owner/management/processing");
        } catch (error) {
            console.error("Failed to confirm document:", error);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        }
    };



    /** Risk Assessment submitted */
    const handleRiskSubmit = useCallback((probability: number, impact: number) => {
        setPendingRisk({ probability, impact });
    }, []);

    const confirmRiskAssessment = async () => {
        if (!recordId) return;
        if (!pendingRisk.probability || !pendingRisk.impact) {
            toast.error("กรุณาประเมินโอกาสและผลกระทบให้ครบก่อนยืนยันการส่ง");
            setIsConfirmRiskOpen(false);
            return;
        }
        try {
            // Save only the risk assessment, do not send to DPO yet
            await saveRiskAssessment(recordId, pendingRisk);
            router.push("/data-owner/management/processing");
        } catch (error) {
            console.error("Failed to submit risk assessment:", error);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        } finally {
            setIsConfirmRiskOpen(false);
        }
    };

    /** ยืนยันการส่งคำขอลบ */
    const handleFinalDeletionRequest = async () => {
        if (!recordId || !deletionReason) return;
        setIsSubmittingDeletion(true);
        try {
            await requestDelete(recordId, deletionReason);
            setIsConfirmDeletionOpen(false);
            // Refresh to update locked state
            const fullRecord = await fetchFullOwnerRecord(recordId);
            if (fullRecord) {
                setForm(prev => ({ ...prev, ...fullRecord }));
            }
            toast.success("ส่งคำร้องขอทำลายเอกสารสำเร็จ");
        } catch (error) {
            console.error("Failed to submit deletion request:", error);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        } finally {
            setIsSubmittingDeletion(false);
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
                            <p className="text-[#5F5E5E] font-bold animate-pulse">กำลังโหลด...</p>
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
                            {activeTab !== "destruction" && !isNewCreate && (
                                <button
                                    disabled={isLockedByDeletion || isWaitingDpoApproval}
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={cn(
                                        "flex items-center gap-2 h-[42px] px-4 rounded-md transition-all font-bold shrink-0 mb-6 border border-[#E5E2E1] bg-[#F8F9FA]",
                                        isLocked
                                            ? "text-[#ED393C] hover:bg-red-50"
                                            : "text-[#00666E] hover:bg-green-50",
                                        (isLockedByDeletion || isWaitingDpoApproval) && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                                    )}
                                    title={isLockedByDeletion ? "ไม่สามารถแก้ไขได้เนื่องจากอยู่ระหว่างรอการลบ" : isWaitingDpoApproval ? "ไม่สามารถแก้ไขได้เนื่องจากอยู่ระหว่างการตรวจสอบโดย DPO" : ""}
                                >
                                    <span className={cn("material-symbols-outlined text-[20px]", isLocked ? "text-[#ED393C]" : "text-[#00666E]")}>
                                        {isLocked ? "edit" : "check_circle"}
                                    </span>
                                    <span className="text-[14px]">{isLocked ? "แก้ไขเอกสาร" : "เสร็จสิ้นการแก้ไข"}</span>
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

                                    {/* ─── Buttons removed from here and moved to fixed footer ─── */}
                                </div>
                            )}

                            {/* ─── Tab: Risk Assessment ────────────────────────────── */}
                            {activeTab === "risk" && (
                                <div className="mt-4 space-y-8">
                                    <RiskAssessment
                                        doStatus={doStatus}
                                        dpStatus={dpStatus}
                                        dpRawStatus={dpForm.status}
                                        dpIsSent={dpForm.is_sent}

                                        existingRisk={form.risk_assessment}
                                        dpoSuggestion={(() => {
                                            const riskSuggestion = form.suggestions?.find(s => s.section === "DO_RISK" || s.section_id === "risk" || s.section === "risk");
                                            return riskSuggestion ? { comment: riskSuggestion.comment, date: riskSuggestion.date } : undefined;
                                        })()}
                                        activeView={riskDocView}
                                        onViewDoSection={() => setRiskDocView(v => v === "owner" ? "none" : "owner")}
                                        onViewDpSection={() => setRiskDocView(v => v === "processor" ? "none" : "processor")}
                                        onSubmit={handleRiskSubmit}
                                        onCancel={() => setActiveTab("owner")}
                                        disabled={!canEditRisk}
                                        hasDpoFeedback={hasDpoFeedback}
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
                                            value={deletionReason}
                                            onChange={(e) => setDeletionReason(e.target.value)}
                                            rows={4}
                                            disabled={isLockedByDeletion}
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
                                                disabled={!deletionReason || isLockedByDeletion}
                                                onClick={() => setIsConfirmDeletionOpen(true)}
                                                className="bg-logout-gradient text-white h-[48px] px-8 rounded-full font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                            >
                                                {isLockedByDeletion ? "รอดำเนินการ..." : "ส่งคำร้องขอทำลาย"}
                                            </button>
                                        </div>

                                        {/* ─── Deletion Request Status Section (Refined UI) ────────────────── */}
                                        {form.deletion_request && (
                                            <div className="pt-10 border-t border-[#E5E2E1] space-y-6 mt-10 animate-in fade-in slide-in-from-top-4 duration-700">
                                                <div className="flex items-center justify-start gap-4">
                                                    <h4 className="text-[18px] font-black text-[#1B1C1C]">ตรวจสอบสถานะคำร้องปัจจุบัน</h4>
                                                    
                                                    {form.deletion_request.status === "APPROVED" && (
                                                        <div className="bg-[#108548] text-white px-6 py-2 rounded-xl font-bold shadow-sm scale-110 active:scale-100 transition-all cursor-default">
                                                            อนุมัติคำร้อง
                                                        </div>
                                                    )}
                                                    {form.deletion_request.status === "REJECTED" && (
                                                        <div className="bg-[#B90A1E] text-white px-6 py-2 rounded-xl font-bold shadow-sm cursor-default">
                                                            ไม่อนุมัติคำร้อง
                                                        </div>
                                                    )}
                                                    {form.deletion_request.status === "PENDING" && (
                                                        <div className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold shadow-sm cursor-default">
                                                            รอการตรวจสอบ
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-full bg-[#EEEEEE] p-6 rounded-2xl border border-transparent hover:border-[#E5E2E1] transition-all group shadow-sm">
                                                    <p className="text-[#1B1C1C] font-bold text-[18px] leading-relaxed">
                                                        {form.deletion_request.status === "APPROVED"
                                                            ? "ครบกำหนดเวลาในการทำลาย"
                                                            : form.deletion_request.status === "REJECTED"
                                                                ? "ยังไม่ครบกำหนดเวลาในการทำลาย"
                                                                : "คำร้องของคุณอยู่ในระหว่างการพิจารณาโดย DPO"
                                                        }
                                                    </p>
                                                    {form.deletion_request.dpo_reason && (
                                                        <div className="mt-3 flex items-start gap-2 text-[#5F5E5E]">
                                                            <span className="material-symbols-outlined text-[20px] mt-0.5">info</span>
                                                            <p className="font-medium text-[14px]">
                                                                {form.deletion_request.dpo_reason}
                                                            </p>
                                                        </div>
                                                    )}
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
                {activeTab === "processor" && viewMode ? (
                    <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/60 p-6 px-10 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => {
                                setDraftFeedbacks({});
                                setActiveFeedbacks({});
                            }}
                            className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-12 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            ยกเลิก
                        </button>

                        <button
                            onClick={() => setFeedbackModal({ open: true, section: "all" })}
                            disabled={!Object.values(draftFeedbacks).some(v => v.trim() !== "")}
                            className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-2xl font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.5]"
                        >
                            ส่งคำร้องขอเปลี่ยนแปลง
                        </button>
                    </div>
                ) : (
                    <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-background/80 backdrop-blur-md border-t border-[#E5E2E1]/50 p-6 px-10 flex items-center justify-between z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        {isLocked ? (
                            /* Center Group in Locked View Mode: Back + Edit */
                            <div className="flex items-center justify-center w-full gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-base h-[52px] px-14 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                >
                                    กลับ
                                </button>

                                {!isWaitingDpoApproval && !isLockedByDeletion && activeTab !== "destruction" && (
                                    <button
                                        onClick={() => setIsLocked(false)}
                                        className="bg-[#ED393C] text-white px-14 h-[52px] rounded-full font-black text-base shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                        แก้ไขเอกสาร
                                    </button>
                                )}
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

                                {/* Right Group: Draft + Save or Risk Submit */}
                                <div className="flex items-center gap-4">
                                    {activeTab === "risk" ? (
                                        <button
                                            onClick={() => {
                                                const probability = form.risk_assessment?.probability ?? pendingRisk.probability;
                                                const impact = form.risk_assessment?.impact ?? pendingRisk.impact;
                                                if (!probability || !impact) {
                                                    toast.error("กรุณาประเมินโอกาสและผลกระทบก่อนกดยืนยันการส่งการประเมิน");
                                                    return;
                                                }
                                                setPendingRisk({ probability, impact });
                                                setIsConfirmRiskOpen(true);
                                            }}
                                            disabled={!canEditRisk}
                                            className="bg-logout-gradient leading-none text-white px-14 h-[52px] rounded-full font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                                        >
                                            ยืนยันการส่งการประเมิน
                                        </button>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </>
                        )}
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

            {/* ─── Confirm Delete Request Modal ───────────────────────────────── */}
            <DestructionConfirmModal
                isOpen={isConfirmDeletionOpen}
                isLoading={isSubmittingDeletion}
                onConfirm={handleFinalDeletionRequest}
                onClose={() => setIsConfirmDeletionOpen(false)}
            />

            <SaveConfirmModal
                isOpen={isConfirmSaveOpen}
                title="ยืนยันการบันทึกข้อมูล"
                description="ข้อมูลจะถูกบันทึกและสถานะจะถูกเปลี่ยนเป็นเสร็จสมบูรณ์"
                confirmText="ยืนยันการบันทึก"
                onConfirm={confirmSave}
                onClose={() => setIsConfirmSaveOpen(false)}
            />

            <SaveConfirmModal
                isOpen={isConfirmRiskOpen}
                title="ยืนยันการส่งข้อมูล"
                description="ทำการส่งข้อมูลการประเมินให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                confirmText="ยืนยันการส่งข้อมูล"
                onConfirm={confirmRiskAssessment}
                onClose={() => setIsConfirmRiskOpen(false)}
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
