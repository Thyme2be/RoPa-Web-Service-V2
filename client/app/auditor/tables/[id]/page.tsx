"use client";

import GeneralInfo from "@/components/formSections/GeneralInfo";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import RightsChannel from "@/components/formSections/RightsChannel";
import DpoRiskAssessment from "@/components/ropa/DpoRiskAssessment";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** Tabs Component for Auditor document review */
function AuditorFormTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
    const tabs = [
        { id: "owner", label: "ส่วนของผู้รับผิดชอบข้อมูล" },
        { id: "processor", label: "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" },
        { id: "risk", label: "การประเมินความเสี่ยงของเอกสาร" },
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

/** 
 * Local version of ActivityDetails to allow custom numbering (Part 3) 
 */
function LocalActivityDetails({ form, handleChange, errors, disabled, variant = "owner" }: any) {
    const isProcessor = variant === "processor";
    const primaryColor = isProcessor ? "#00666E" : "#ED393C";
    const markerColor = "#ED393C";
    const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
    const borderLColor = isProcessor ? "border-l-[#00666E]" : "border-l-[#ED393C]";

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
                                name="data_subject_name"
                                value={form?.data_subject_name || ""}
                                placeholder="ไม่มีข้อมูล"
                                onChange={handleChange}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <Input
                                label="กิจกรรมประมวลผล"
                                name="processing_activity"
                                value={form?.processing_activity || ""}
                                placeholder="ไม่มีข้อมูล"
                                onChange={handleChange}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                            <Input
                                label="วัตถุประสงค์การประมวลผล"
                                name="purpose_of_processing"
                                value={form?.purpose_of_processing || ""}
                                placeholder="ไม่มีข้อมูล"
                                onChange={handleChange}
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
                            name="processor_name"
                            value={form?.processor_name || ""}
                            placeholder="ไม่มีข้อมูล"
                            onChange={handleChange}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
                            name="controller_address"
                            value={form?.controller_address || ""}
                            placeholder="ไม่มีข้อมูล"
                            onChange={handleChange}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="กิจกรรมประมวลผล"
                            name="processing_activity"
                            value={form?.processing_activity || ""}
                            placeholder="ไม่มีข้อมูล"
                            onChange={handleChange}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="วัตถุประสงค์ของการประมวลผล"
                            name="purpose_of_processing"
                            value={form?.purpose_of_processing || ""}
                            placeholder="ไม่มีข้อมูล"
                            onChange={handleChange}
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

function AuditorDetailContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const recordId = params?.id as string;
    const assignmentId = searchParams.get("assignment");

    const [activeTab, setActiveTab] = useState("owner");
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<Partial<OwnerRecord>>({
        document_name: "กำลังโหลด...",
        status: RopaStatus.UNDER_REVIEW,
    });

    const [processorForm, setProcessorForm] = useState<Partial<ProcessorRecord>>({
        status: RopaStatus.Draft,
    });

    const [dpoComments, setDpoComments] = useState<any[]>([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!recordId) return;
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No token found");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch document detail
                const docRes = await fetch(`${API_BASE_URL}/documents/${recordId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!docRes.ok) throw new Error("Failed to fetch document");
                const docData = await docRes.json();

                // Map Owner Section
                if (docData.owner_sections && docData.owner_sections.length > 0) {
                    const os = docData.owner_sections[0];
                    setForm(prev => ({
                        ...prev,
                        id: recordId,
                        document_name: docData.title,
                        title_prefix: os.title_prefix || "",
                        first_name: os.first_name || "",
                        last_name: os.last_name || "",
                        data_subject_name: `${os.first_name || ""} ${os.last_name || ""}`.trim(),
                        email: os.email || "",
                        phone: os.phone || "",
                        address: os.address || "",
                        processing_activity: os.processing_activity || "",
                        purpose_of_processing: os.purpose_of_processing || "",
                        
                        // Lists
                        personal_data_items: os.personal_data_categories || [],
                        data_categories: os.subject_categories || [],
                        data_types: os.data_types || [],
                        
                        // Retention
                        retention_value: os.retention_value || "",
                        retention_unit: os.retention_unit || "",
                        storage_methods: os.storage_method || "",
                        deletion_method: os.destruction_method || "",
                        
                        // Legal & Security
                        legal_basis: os.legal_basis || "",
                        technical_measures: os.technical_measures || "",
                        org_measures: os.org_measures || "",
                        
                        status: docData.status as RopaStatus,
                        risk_assessment: docData.risk_assessment
                    }));
                } else {
                    setForm(prev => ({ ...prev, document_name: docData.title, status: docData.status as RopaStatus }));
                }

                // Map Processor Section
                if (docData.processor_sections && docData.processor_sections.length > 0) {
                    const ps = docData.processor_sections[0];
                    setProcessorForm(prev => ({
                        ...prev,
                        id: recordId,
                        title_prefix: ps.title_prefix || "",
                        first_name: ps.first_name || "",
                        last_name: ps.last_name || "",
                        processor_name: ps.processor_name || "",
                        email: ps.email || "",
                        phone: ps.phone || "",
                        address: ps.address || "",
                        processing_activity: ps.processing_activity || "",
                        purpose_of_processing: ps.purpose_of_processing || "",
                        
                        // Lists (Casting strings from API to any for simple display)
                        personal_data_items: (ps.personal_data_categories || []) as any,
                        data_categories: (ps.subject_categories || []) as any,
                        data_types: (ps.data_types || []) as any,
                        
                        // Retention
                        retention_value: ps.retention_value || "",
                        retention_unit: ps.retention_unit || "",
                        storage_methods: ps.storage_method || "",
                        deletion_method: ps.destruction_method || "",
                        
                        // Legal & Security
                        legal_basis: ps.legal_basis || "",
                        technical_measures: ps.technical_measures || "",
                        org_measures: ps.org_measures || "",
                        
                        status: docData.status as RopaStatus
                    }));
                }

                // 2. Fetch DPO comments
                const commentRes = await fetch(`${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (commentRes.ok) {
                    const comments = await commentRes.json();
                    setDpoComments(comments);
                }

            } catch (err: any) {
                console.error("Fetch detail error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [recordId]);

    const tabs = ["owner", "processor", "risk"];

    const handleNextTab = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevTab = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            router.push("/auditor/tables");
        }
    };

    const handleCancel = () => {
        router.push("/auditor/tables");
    };

    const isLastTab = activeTab === tabs[tabs.length - 1];
    const emptyHandler = () => { };

    if (loading) return <div className="p-8 font-bold text-[#5F5E5E] animate-pulse">กำลังโหลดข้อมูลเอกสาร...</div>;
    if (error) return <div className="p-8 font-bold text-[#ED393C]">เกิดข้อผิดพลาด: {error}</div>;

    return (
        <div className="flex-1 space-y-6 animate-in fade-in duration-700">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-6 px-1">
                    <div className="flex-1">
                        <AuditorFormTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>
                </div>

                {/* Tab: DO (Data Owner) */}
                {activeTab === "owner" && (
                    <div className="space-y-12 pb-32">
                        {[
                            { title: "ข้อมูลทั่วไป", component: GeneralInfo },
                            { title: "ช่องทางใช้สิทธิ", component: RightsChannel },
                            { title: "กิจกรรมประมวลผล", component: LocalActivityDetails },
                            { title: "ข้อมูลที่จัดเก็บ", component: StoredInfo },
                            { title: "ระยะเวลาการเก็บรักษา", component: RetentionInfo },
                            { title: "ฐานทางกฎหมาย", component: LegalInfo },
                            { title: "มาตรการรักษาความปลอดภัย", component: SecurityMeasures },
                        ].map((sec, idx) => (
                            <div key={idx}>
                                <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: DP (Data Processor) */}
                {activeTab === "processor" && (
                    <div className="space-y-12 pb-32">
                        {[
                            { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
                            { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
                            { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
                            { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
                            { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
                            { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
                        ].map((sec, idx) => (
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
                            activeView={riskDocView}
                            onViewDoSection={() => setRiskDocView(prev => prev === "owner" ? "none" : "owner")}
                            onViewDpSection={() => setRiskDocView(prev => prev === "processor" ? "none" : "processor")}
                            onSubmit={emptyHandler}
                            onCancel={() => setActiveTab("owner")}
                            readOnly={true}
                            showFeedback={true}
                            feedbackData={dpoComments}
                            showViewSections={false}
                        />

                        {riskDocView === "owner" && (
                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                                <hr className="border-[#E5E2E1] my-8" />
                                <h3 className="text-xl font-black text-[#1B1C1C]">ข้อมูลส่วนของผู้รับผิดชอบข้อมูล</h3>
                                <div className="space-y-12">
                                    {[
                                        { title: "ข้อมูลทั่วไป", component: GeneralInfo },
                                        { title: "ช่องทางใช้สิทธิ", component: RightsChannel },
                                        { title: "กิจกรรมประมวลผล", component: LocalActivityDetails },
                                        { title: "ข้อมูลที่จัดเก็บ", component: StoredInfo },
                                        { title: "ระยะเวลาการเก็บรักษา", component: RetentionInfo },
                                        { title: "ฐานทางกฎหมาย", component: LegalInfo },
                                        { title: "มาตรการรักษาความปลอดภัย", component: SecurityMeasures },
                                    ].map((sec, idx) => (
                                        <div key={idx}>
                                            <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {riskDocView === "processor" && (
                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                                <hr className="border-[#E5E2E1] my-8" />
                                <h3 className="text-xl font-black text-[#1B1C1C]">ข้อมูลส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล</h3>
                                <div className="space-y-12">
                                    {[
                                        { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
                                        { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
                                        { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
                                        { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
                                        { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
                                        { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
                                    ].map((sec, idx) => (
                                        <div key={idx}>
                                            <sec.component form={processorForm} handleChange={emptyHandler} errors={{}} disabled={true} variant="processor" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Bar (Footer) */}
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
                            onClick={() => setIsConfirmModalOpen(true)}
                            className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
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
                onConfirm={async () => {
                    const token = localStorage.getItem("token");
                    if (assignmentId && token) {
                        try {
                            const res = await fetch(`${API_BASE_URL}/auditor/assignments/${assignmentId}/verify`, {
                                method: "PATCH",
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            if (!res.ok) throw new Error("Verification failed");
                        } catch (err) {
                            console.error("Audit verification error:", err);
                            alert("เกิดข้อผิดพลาดในการยืนยันการตรวจสอบ");
                            return;
                        }
                    } else {
                        // Fallback for demo/manual testing if assignmentId is missing
                        const completedIds = JSON.parse(localStorage.getItem("auditor_completed_ids") || "[]");
                        if (!completedIds.includes(recordId)) {
                            localStorage.setItem("auditor_completed_ids", JSON.stringify([...completedIds, recordId]));
                        }
                    }
                    setIsConfirmModalOpen(false);
                    router.push("/auditor/tables");
                }}
                title="ยืนยันการตรวจสอบ"
                subtitle="ยืนยันว่าได้ดำเนินการตรวจสอบครบถ้วนเรียบร้อยแล้ว"
                buttonText="ยืนยันการตรวจสอบ"
            />
        </div>
    );
}

export default function AuditorTableDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 font-bold text-[#5F5E5E]">กำลังโหลดข้อมูล...</div>}>
            <AuditorDetailContent />
        </Suspense>
    );
}
