"use client";

import Stepper from "@/components/layouts/Stepper";
import GeneralInfo from "@/components/formSections/GeneralInfo";
import ActivityDetails from "@/components/formSections/ActivityDetails";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import RightsChannel from "@/components/formSections/RightsChannel";
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
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border-l-[6px] overflow-hidden",
            borderLColor
        )}>
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
                // In DPO view, we fetch the document detail using recordId
                const response = await fetch(`${API_BASE_URL}/documents/${recordId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch document detail");
                const docData = await response.json();

                // Map Owner Section
                if (docData.owner_sections && docData.owner_sections.length > 0) {
                    const os = docData.owner_sections[0];
                    const req = docData.deletion_requests && docData.deletion_requests.length > 0
                        ? docData.deletion_requests[docData.deletion_requests.length - 1]
                        : null;

                    setForm({
                        ...os,
                        id: recordId,
                        document_name: docData.title,
                        data_subject_name: `${os.first_name || ""} ${os.last_name || ""}`.trim(),
                        status: docData.status as RopaStatus,
                        risk_assessment: docData.risk_assessment,
                        processing_status: { do_status: "done", dp_status: "done" },
                        deletion_request: req
                    });
                }


                // Map Processor Section
                if (docData.processor_sections && docData.processor_sections.length > 0) {
                    const ps = docData.processor_sections[0];
                    setProcessorForm({
                        processor_name: ps.processor_name,
                        processing_activity: ps.processing_activity,
                        purpose_of_processing: ps.purpose_of_processing || ps.purpose,
                        status: docData.status as RopaStatus
                    });
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

    // Validation logic for button state
    const isSubmitDisabled =
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
                            <div key={idx}>
                                <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Processor */}
                {activeTab === "processor" && (
                    <div className="space-y-12 pb-32">
                        {processorSections.map((sec, idx) => (
                            <div key={idx}>
                                <sec.component form={processorForm} handleChange={emptyHandler} errors={{}} disabled={true} variant="processor" />
                            </div>
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
                                    {form?.deletion_request?.owner_reason || "ครบกำหนดเวลาในการทำลาย"}
                                </p>
                            </div>

                        </div>

                        {/* Approval Status */}
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
                            ยืนยันการตรวจสอบ
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
        <Suspense fallback={<div className="p-8">กำลังโหลดข้อมูล...</div>}>
            <DpoDestructionDetailContent />
        </Suspense>
    );
}
