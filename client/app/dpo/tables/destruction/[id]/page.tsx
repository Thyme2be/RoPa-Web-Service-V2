"use client";

import Stepper from "@/components/layouts/Stepper";
import GeneralInfo from "@/components/formSections/GeneralInfo";
import ActivityDetails from "@/components/formSections/ActivityDetails";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import RightsChannel from "@/components/formSections/RightsChannel";
import SectionCommentBox from "@/components/ropa/SectionCommentBox";
import DpoRiskAssessment from "@/components/ropa/DpoRiskAssessment";
import Input from "@/components/ui/Input";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import { cn } from "@/lib/utils";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** 
 * Local version of ActivityDetails to allow custom numbering (Part 3) 
 * without modifying the shared friend's file.
 */
function LocalActivityDetails({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const markerColor = "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";

    // Changing "ส่วนที่ 2" to "ส่วนที่ 3" specifically for this page
    const sectionTitle = isProcessor ? "ส่วนที่ 2 : รายละเอียดกิจกรรม" : "ส่วนที่ 3 : รายละเอียดของกิจกรรมและวัตถุประสงค์";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 px-0 py-0 mb-6">
                <div className={cn("p-2.5 rounded-xl flex items-center justify-center", lightBg)}>
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ color: primaryColor }}>
                        accessibility_new
                    </span>
                </div>
                <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
                    {sectionTitle}
                </h2>
            </div>
            {!isProcessor ? (
                <>
                    <div className="grid grid-cols-1">
                        <Input
                            label="ชื่อเจ้าของข้อมูลส่วนบุคคล"
                            required
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
    );
}

/** Local Tabs Component for DPO Destruction */
function DpoFormTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
    const tabs = [
        { id: "owner", label: "ส่วนของผู้รับผิดชอบข้อมูล" },
        { id: "processor", label: "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" },
        { id: "risk", label: "การประเมินความเสี่ยงของเอกสาร" },
        { id: "destruction", label: "คำร้องขอทำลาย" },
    ];

    return (
        <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar bg-[#F6F6F6] p-2 rounded-xl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "h-11 px-6 rounded-lg font-bold text-[14px] transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-1 cursor-pointer",
                        activeTab === tab.id
                            ? "bg-[#ED393C] text-white shadow-md"
                            : "bg-white text-[#1B1C1C] border border-[#E5E2E1] hover:bg-gray-50"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

function DpoDestructionDetailContent() {
    const router = useRouter();
    const params = useParams();
    const recordId = params?.id as string;

    const [activeTab, setActiveTab] = useState("owner");
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");


    // Destruction Review State
    const [destructionStatus, setDestructionStatus] = useState<"approve" | "reject" | "none">("none");
    const [rejectionReason, setRejectionReason] = useState("");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<Partial<OwnerRecord>>({
        document_name: "กำลังโหลด...",
        status: RopaStatus.DeletePending,
        processing_status: { do_status: "done", dp_status: "done" },
    });

    const [processorForm, setProcessorForm] = useState<Partial<ProcessorRecord>>({
        status: RopaStatus.Draft,
    });

    const tabsList = ["owner", "processor", "risk", "destruction"];

    // Load record from API
    useEffect(() => {
        const fetchDetail = async () => {
            if (!recordId) return;
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                // Base document payload (contains deletion requests)
                const response = await fetch(`${API_BASE_URL}/documents/${recordId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch document detail");
                const docData = await response.json();

                const extractArr = (arr: any, key: string) =>
                    Array.isArray(arr)
                        ? arr.map((i: any) =>
                            typeof i === "object" && i !== null ? i[key] : i
                        )
                        : arr;

                const mapRisk = (risk: any) => {
                    if (!risk) return undefined;
                    return {
                        probability: risk.likelihood || risk.probability || 0,
                        impact: risk.impact || 0,
                        total: risk.risk_score || risk.total || 0,
                        level:
                            risk.risk_level === "LOW"
                                ? "ความเสี่ยงต่ำ"
                                : risk.risk_level === "MEDIUM"
                                    ? "ความเสี่ยงปานกลาง"
                                    : risk.risk_level === "HIGH"
                                        ? "ความเสี่ยงสูง"
                                        : risk.level || "",
                        submitted_date: risk.assessed_at || risk.submitted_date,
                    };
                };

                // Pick latest deletion request by requested_at/created_at/id (not array order).
                const latestReq = Array.isArray(docData.deletion_requests)
                    ? [...docData.deletion_requests].sort((a: any, b: any) => {
                        const at = new Date(a?.requested_at || a?.created_at || 0).getTime();
                        const bt = new Date(b?.requested_at || b?.created_at || 0).getTime();
                        if (bt !== at) return bt - at;
                        return String(b?.id || "").localeCompare(String(a?.id || ""));
                    })[0]
                    : null;

                // Load owner section (full mapping like in-progress page)
                const ownerResponse = await fetch(`${API_BASE_URL}/owner/documents/${recordId}/section`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (ownerResponse.ok) {
                    const ownerData = await ownerResponse.json();
                    const os = ownerData.owner_sections?.[0] || ownerData;
                    setForm((prev) => ({
                        ...prev,
                        ...os,
                        id: recordId,
                        document_name: docData.title || os.document_name,
                        data_subject_name:
                            os.data_subject_name ||
                            `${os.title_prefix || ""} ${os.first_name || ""} ${os.last_name || ""}`.trim() ||
                            os.data_owner_name,
                        rights_email:
                            os.contact_email ||
                            docData.contact_email ||
                            os.rights_email ||
                            docData.rights_email,
                        rights_phone:
                            os.company_phone ||
                            docData.company_phone ||
                            os.rights_phone ||
                            docData.rights_phone,
                        purpose_of_processing: os.purpose_of_processing || os.purpose,
                        status: docData.status as RopaStatus,
                        risk_assessment: mapRisk(docData.risk_assessment || os.risk_assessment),
                        processing_status: { do_status: "done", dp_status: "done" },
                        access_condition: os.access_control_policy || os.access_condition || "",
                        rejectionNote: os.refusal_handling || os.rejectionNote || "",
                        transfer_company: os.transfer_in_group || os.transfer_company || "",
                        personal_data_items: extractArr(os.personal_data_items, "type"),
                        data_categories: extractArr(os.data_categories, "category"),
                        data_types: extractArr(os.data_types, "type"),
                        collection_methods: extractArr(os.collection_methods, "method"),
                        collection_method: extractArr(os.collection_methods, "method")?.[0] || "",
                        data_sources: extractArr(os.data_sources, "source"),
                        data_source_direct:
                            extractArr(os.data_sources, "source")?.some(
                                (s: string) => s?.toLowerCase?.() === "direct"
                            ) || false,
                        data_source_indirect:
                            extractArr(os.data_sources, "source")?.some(
                                (s: string) => s?.toLowerCase?.() === "indirect"
                            ) || false,
                        data_source_other: os.data_source_other || "",
                        storage_types: extractArr(os.storage_types, "type"),
                        storage_methods: extractArr(os.storage_methods, "method"),
                        deletion_request: latestReq,
                    }));
                }

                // Load processor section (full mapping like in-progress page)
                const processorResponse = await fetch(`${API_BASE_URL}/owner/documents/${recordId}/processor-section`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (processorResponse.ok) {
                    const processorData = await processorResponse.json();
                    const ps =
                        processorData.processor_sections &&
                        processorData.processor_sections.length > 0
                            ? processorData.processor_sections[0]
                            : processorData;
                    setProcessorForm((prev) => ({
                        ...prev,
                        ...ps,
                        id: recordId,
                        processor_name: ps.processor_name,
                        controllerAddress: ps.controller_address || ps.controllerAddress,
                        processing_activity: ps.processing_activity,
                        purpose_of_processing: ps.purpose_of_processing || ps.purpose,
                        status: (processorData.status || ps.status || docData.status) as RopaStatus,
                        access_condition: ps.access_condition || "",
                        transfer_company: ps.transfer_company || "",
                        personal_data_items: extractArr(ps.personal_data_items, "type"),
                        data_categories: extractArr(ps.data_categories, "category"),
                        data_types: extractArr(ps.data_types, "type"),
                        collection_methods: extractArr(ps.collection_methods, "method"),
                        data_sources: extractArr(ps.data_sources, "source"),
                        storage_types: extractArr(ps.storage_types, "type"),
                        storage_methods: extractArr(ps.storage_methods, "method"),
                    }));
                }

                // Load risk payload if available
                const riskResponse = await fetch(`${API_BASE_URL}/owner/documents/${recordId}/risk`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (riskResponse.ok) {
                    const riskData = await riskResponse.json();
                    setForm((prev) => ({
                        ...prev,
                        risk_assessment: mapRisk(riskData),
                    }));
                }
            } catch (err: any) {
                console.error("Fetch destruction detail error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [recordId]);

    const handleCancel = () => {
        router.push("/dpo/tables/destruction");
    };

    const handleFinalSubmit = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/dpo/destruction-requests/${recordId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: destructionStatus === "approve" ? "APPROVED" : "REJECTED",
                    rejection_reason: rejectionReason
                })
            });

            if (!response.ok) throw new Error("Failed to submit destruction review");

            // Removed alert, redirecting directly
            router.push("/dpo/tables/destruction");
        } catch (err: any) {
            console.error("Submission error:", err);
            // Optionally could keep a silent error log or show a small toast, 
            // but following user's request to remove alerts.
        }
    };

    const currentDeletionStatus = (form as any)?.deletion_request?.status || "";
    const isAlreadyApproved = currentDeletionStatus === "APPROVED";

    // Validation logic for button state
    const isSubmitDisabled =
        isAlreadyApproved ||
        destructionStatus === "none" ||
        (destructionStatus === "reject" && !rejectionReason.trim());

    const handleConfirmReview = () => {
        if (isSubmitDisabled) return;
        setIsConfirmModalOpen(true);
    };

    const emptyHandler = () => { };

    // Navigation logic MATCHING in-progress exactly
    const handlePrevTab = () => {
        const currentIndex = tabsList.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabsList[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push("/dpo/tables/destruction");
        }
    };

    const handleNextTab = () => {
        const currentIndex = tabsList.indexOf(activeTab);
        if (currentIndex < tabsList.length - 1) {
            setActiveTab(tabsList[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const isLastTab = activeTab === "destruction";

    // Sections for Owner - MATCHING in-progress order exactly, using LOCAL activity details
    const ownerSections = [
        { title: "ข้อมูลทั่วไป", component: GeneralInfo },
        { title: "ช่องทางใช้สิทธิ", component: RightsChannel },
        { title: "กิจกรรมประมวลผล", component: LocalActivityDetails },
        { title: "ข้อมูลที่จัดเก็บ", component: StoredInfo },
        { title: "ระยะเวลาการเก็บรักษา", component: RetentionInfo },
        { title: "ฐานทางกฎหมาย", component: LegalInfo },
        { title: "มาตรการรักษาความปลอดภัย", component: SecurityMeasures },
    ];

    // Sections for Processor, also using LOCAL activity details for "Part 3"
    const processorSections = [
        { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
        { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
        { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
        { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
        { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
        { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
    ];

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="h-14 bg-[#F6F6F6] rounded-xl animate-pulse flex p-2 gap-2">
                    <div className="flex-1 bg-white/70 rounded-lg" />
                    <div className="flex-1 bg-white/70 rounded-lg" />
                    <div className="flex-1 bg-white/70 rounded-lg" />
                    <div className="flex-1 bg-white/70 rounded-lg" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-gray-200 overflow-hidden">
                        <div className="h-20 bg-gray-50/50 flex items-center px-8 gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="w-56 h-6 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="px-8 pb-10 pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="w-32 h-4 bg-gray-100 rounded" />
                                    <div className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <div className="w-32 h-4 bg-gray-100 rounded" />
                                    <div className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 animate-in fade-in duration-700">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-6 px-1">
                    <div className="flex-1">
                        <DpoFormTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                </div>

                {/* Tab: Owner */}
                {activeTab === "owner" && (
                    <div className="space-y-12 pb-32">
                        {ownerSections.map((sec, idx) => (
                            <SectionCommentBox
                                key={idx}
                                isOpen={false}
                                onToggle={() => { }}
                                value=""
                                onChange={() => { }}
                                readOnly={true}
                                variant="do"
                            >
                                <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                            </SectionCommentBox>
                        ))}
                    </div>
                )}

                {/* Tab: Processor */}
                {activeTab === "processor" && (
                    <div className="space-y-12 pb-32">
                        {processorSections.map((sec, idx) => (
                            <SectionCommentBox
                                key={idx}
                                isOpen={false}
                                onToggle={() => { }}
                                value=""
                                onChange={() => { }}
                                readOnly={true}
                                variant="dp"
                            >
                                <sec.component form={processorForm} handleChange={emptyHandler} errors={{}} disabled={true} variant="processor" />
                            </SectionCommentBox>
                        ))}
                    </div>
                )}

                {/* Tab: Risk */}
                {activeTab === "risk" && (
                    <div className="mt-4 pb-32 space-y-8">
                        <DpoRiskAssessment
                            key={recordId}
                            doStatus="done"
                            dpStatus="done"
                            existingRisk={form.risk_assessment}
                            activeView="none"
                            onViewDoSection={() => { }}
                            onViewDpSection={() => { }}
                            onSubmit={() => { }}
                            onCancel={() => setActiveTab("owner")}
                            readOnly={true}
                            showFeedback={false}
                            showViewSections={false}
                        />
                    </div>
                )}

                {/* Tab: Destruction */}
                {activeTab === "destruction" && (
                    <div className="space-y-10 pb-32 animate-in fade-in duration-500">
                        {/* Reason for Destruction */}
                        <div className="space-y-6">
                            <h3 className="text-[20px] font-headline font-black text-[#1B1C1C] tracking-tight">เหตุผลในการขอทำลายเอกสาร</h3>
                            <div className="bg-[#F1F1F1] rounded-[16px] p-6 border border-[#E5E2E1]/40">
                                <p className="text-[17px] font-bold text-[#1B1C1C]/80">
                                    {form?.deletion_request?.owner_reason ||
                                        "ครบกำหนดเวลาในการทำลาย"}
                                </p>
                            </div>

                        </div>

                        {/* Approval Status */}
                        {isAlreadyApproved ? (
                            <div className="pt-6 border-t border-[#E5E2E1] space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-start gap-4">
                                    <h4 className="text-[18px] font-black text-[#1B1C1C]">ตรวจสอบสถานะคำร้องปัจจุบัน</h4>
                                    <div className="bg-[#108548] text-white px-6 py-2 rounded-xl font-bold shadow-sm cursor-default">
                                        อนุมัติคำร้อง
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-6 pt-4">
                                    <button
                                        onClick={() => setDestructionStatus("approve")}
                                        className={cn(
                                            "flex-1 h-14 rounded-[16px] border flex items-center px-6 gap-4 transition-all shadow-sm",
                                            destructionStatus === "approve"
                                                ? "bg-white border-[#ED393C] ring-1 ring-[#ED393C]"
                                                : "bg-white border-[#E5E2E1] hover:border-gray-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                            destructionStatus === "approve" ? "border-[#ED393C]" : "border-gray-400"
                                        )}>
                                            {destructionStatus === "approve" && <div className="w-2.5 h-2.5 rounded-full bg-[#ED393C]" />}
                                        </div>
                                        <span className="text-[17px] font-bold text-[#1B1C1C]">อนุมัติคำร้อง</span>
                                    </button>

                                    <button
                                        onClick={() => setDestructionStatus("reject")}
                                        className={cn(
                                            "flex-1 h-14 rounded-[16px] border flex items-center px-6 gap-4 transition-all shadow-sm",
                                            destructionStatus === "reject"
                                                ? "bg-white border-[#ED393C] ring-1 ring-[#ED393C]"
                                                : "bg-white border-[#E5E2E1] hover:border-gray-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                            destructionStatus === "reject" ? "border-[#ED393C]" : "border-gray-400"
                                        )}>
                                            {destructionStatus === "reject" && <div className="w-2.5 h-2.5 rounded-full bg-[#ED393C]" />}
                                        </div>
                                        <span className="text-[17px] font-bold text-[#1B1C1C]">ไม่อนุมัติคำร้อง</span>
                                    </button>
                                </div>

                                {/* Rejection Reason (Conditional) */}
                                <div className={cn(
                                    "space-y-6 pt-4 transition-all duration-300",
                                    destructionStatus === "reject" ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none"
                                )}>
                                    <h3 className="text-[20px] font-headline font-black text-[#1B1C1C] tracking-tight">เหตุผลในการไม่อนุมัติ</h3>
                                    <div className="bg-white rounded-[16px] p-6 border border-[#E5E2E1] focus-within:border-[#ED393C] transition-all shadow-sm">
                                        <textarea
                                            rows={2}
                                            placeholder="ระบุเหตุผลในการไม่อนุมัติ"
                                            className="w-full bg-transparent outline-none text-[17px] font-medium text-[#1B1C1C] placeholder:text-gray-400 resize-none"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            disabled={destructionStatus !== "reject"}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Action Bar (Footer) - EXACT MATCH to in-progress style */}
            <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] border-t border-[#E5E2E1] p-5 px-10 flex items-center justify-between z-40">
                <button
                    onClick={handleCancel}
                    className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
                >
                    ยกเลิก
                </button>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevTab}
                        className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
                    >
                        ย้อนกลับ
                    </button>

                    {isLastTab ? (
                        <button
                            onClick={handleConfirmReview}
                            disabled={isSubmitDisabled}
                            className={cn(
                                "bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl transition-all flex items-center gap-2",
                                isSubmitDisabled
                                    ? "opacity-50 grayscale cursor-not-allowed shadow-none"
                                    : "shadow-red-900/40 hover:brightness-110 active:scale-95 cursor-pointer"
                            )}
                        >
                            {isAlreadyApproved ? "อนุมัติแล้ว" : "ยืนยันการตรวจสอบ"}
                        </button>
                    ) : (
                        <button
                            onClick={handleNextTab}
                            className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                            ถัดไป
                        </button>
                    )}
                </div>
            </div>

            <SaveSuccessModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleFinalSubmit}
                title="ยืนยันการตรวจสอบ"
                subtitle="ยืนยันว่าได้ดำเนินการตรวจสอบครบถ้วนเรียบร้อยแล้ว"
                buttonText="ยืนยันการตรวจสอบ"
            />
        </div>
    );
}

export default function DPODestructionDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 space-y-8">
                    <div className="h-14 bg-[#F6F6F6] rounded-xl animate-pulse" />
                    <div className="h-40 bg-white rounded-2xl border border-[#E5E2E1] animate-pulse" />
                    <div className="h-40 bg-white rounded-2xl border border-[#E5E2E1] animate-pulse" />
                </div>
            }
        >
            <DpoDestructionDetailContent />
        </Suspense>
    );
}
