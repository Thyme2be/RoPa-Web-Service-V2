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
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/** Local Tabs Component for DPO (No status dots to avoid conflict) */
function DpoFormTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
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
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { mockOwnerRecords, mockProcessorRecords } from "@/lib/ropaMockRecords";

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
                                name="dataSubjectName"
                                value={form?.dataSubjectName || ""}
                                placeholder="ระบุเจ้าของข้อมูล (เช่น บริษัท A)"
                                onChange={handleChange}
                                error={errors?.dataSubjectName}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <Input
                                label="กิจกรรมประมวลผล"
                                required
                                name="processingActivity"
                                value={form?.processingActivity || ""}
                                placeholder="ระบุกิจกรรมประมวลผล (เช่น การรับสมัครพนักงาน)"
                                onChange={handleChange}
                                error={errors?.processingActivity}
                                disabled={disabled}
                                focusColor={primaryColor}
                                requiredColor={markerColor}
                            />
                            <Input
                                label="วัตถุประสงค์การประมวลผล"
                                required
                                name="purpose"
                                value={form?.purpose || ""}
                                placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อรับสมัครบุคคลเข้าทำงาน)"
                                onChange={handleChange}
                                error={errors?.purpose}
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
                            name="processorName"
                            value={form?.processorName || ""}
                            placeholder="ระบุชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
                            onChange={handleChange}
                            error={errors?.processorName}
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
                            name="processingActivity"
                            value={form?.processingActivity || ""}
                            placeholder="ระบุกิจกรรมประมวลผล (เช่น ดำเนินการตามสัญญาว่าจ้าง)"
                            onChange={handleChange}
                            error={errors?.processingActivity}
                            disabled={disabled}
                            focusColor={primaryColor}
                            requiredColor={markerColor}
                        />
                        <Input
                            label="วัตถุประสงค์ของการประมวลผล"
                            required
                            name="purpose"
                            value={form?.purpose || ""}
                            placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อจัดจ้าง ออกแบบ/พัฒนาระบบ)"
                            onChange={handleChange}
                            error={errors?.purpose}
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

/** 
 * DPO Management Form Page (Detail View)
 * Located at: client/app/dpo/tables/in-progress/[id]/page.tsx
 * Allows DPO to view document details and provide feedback.
 */
function DpoInProgressDetailContent() {
    const router = useRouter();
    const params = useParams();
    const recordId = params?.id as string;

    const [activeTab, setActiveTab] = useState("owner");
    const [riskDocView, setRiskDocView] = useState<"none" | "owner" | "processor">("none");
    const { getById, getProcessorById, saveRiskAssessment } = useRopa();
    const [openFeedbackSections, setOpenFeedbackSections] = useState<string[]>([]);
    const [sectionFeedbacks, setSectionFeedbacks] = useState<Record<string, string>>({});

    const [form, setForm] = useState<Partial<OwnerRecord>>({
        documentName: "กำลังโหลด...",
        status: RopaStatus.Processing,
        processingStatus: { doStatus: "pending", dpStatus: "pending" },
    });

    const [processorForm, setProcessorForm] = useState<Partial<ProcessorRecord>>({
        status: RopaStatus.Draft,
    });



// Load existing record and drafts
useEffect(() => {
    if (recordId) {
        const existing = getById(recordId);
        if (existing) {
            // Local Merge: Priority for mock data on document RP-2026-03
            // This ensures DPO always sees the pre-filled values for testing/demo
            const mockMatch = mockOwnerRecords.find(m => m.id === recordId);
            const merged = mockMatch ? {
                ...existing,
                // Force prioritize mock values for these specific fields for the demonstration record
                riskAssessment: (mockMatch.riskAssessment && Object.keys(mockMatch.riskAssessment).length > 0) 
                    ? mockMatch.riskAssessment 
                    : existing.riskAssessment,
                processingStatus: mockMatch.processingStatus || existing.processingStatus
            } : existing;

            console.log("DPO Detail Load:", { recordId, hasMock: !!mockMatch, risk: merged.riskAssessment });
            setForm(merged);
        }

            // Load Processor Part with Merge
            const procData = getProcessorById(recordId);
            const mockProcMatch = mockProcessorRecords.find(m => m.id === recordId);
            const mergedProc = mockProcMatch ? { ...(procData || {}), ...mockProcMatch } : procData;
            if (mergedProc) {
                setProcessorForm(mergedProc as any);
            }

            // Load feedback drafts from localStorage
            const savedFeedback = localStorage.getItem(`dpo-feedback-${recordId}`);
            const savedOpenSections = localStorage.getItem(`dpo-open-sections-${recordId}`);
            if (savedFeedback) {
                try {
                    setSectionFeedbacks(JSON.parse(savedFeedback));
                } catch (e) { console.error("Error parsing saved feedback", e); }
            }
            if (savedOpenSections) {
                try {
                    setOpenFeedbackSections(JSON.parse(savedOpenSections));
                } catch (e) { console.error("Error parsing saved open sections", e); }
            }
        }
    }, [recordId, getById, getProcessorById]);

    // Save drafts to localStorage whenever they change
    useEffect(() => {
        if (recordId && Object.keys(sectionFeedbacks).length > 0) {
            localStorage.setItem(`dpo-feedback-${recordId}`, JSON.stringify(sectionFeedbacks));
        }
    }, [sectionFeedbacks, recordId]);

    useEffect(() => {
        if (recordId && openFeedbackSections.length > 0) {
            localStorage.setItem(`dpo-open-sections-${recordId}`, JSON.stringify(openFeedbackSections));
        }
    }, [openFeedbackSections, recordId]);

    const doStatus = form.processingStatus?.doStatus ?? "done";
    const dpStatus = form.processingStatus?.dpStatus ?? "done";
    const tabs = ["owner", "processor", "risk"];

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const toggleFeedback = (section: string) => {
        setOpenFeedbackSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

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
            // If on first tab, "Back" goes to the table
            router.push("/dpo/tables/in-progress");
        }
    };

    const handleCancel = () => {
        // Clear drafts on cancel
        localStorage.removeItem(`dpo-feedback-${recordId}`);
        localStorage.removeItem(`dpo-open-sections-${recordId}`);
        router.push("/dpo/tables/in-progress");
    };

    const handleReturnForEdit = () => {
        // In real app: call API with all collected feedbacks in 'sectionFeedbacks'
        console.log("Feedbacks to send:", sectionFeedbacks);

        // Clear drafts on successful submission
        localStorage.removeItem(`dpo-feedback-${recordId}`);
        localStorage.removeItem(`dpo-open-sections-${recordId}`);

        router.push("/dpo/tables/in-progress");
    };

    const isLastTab = activeTab === tabs[tabs.length - 1];
    const isFirstTab = activeTab === tabs[0];

    const emptyHandler = () => { };

    const renderOwnerSections = (isInline = false) => (
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
                <div key={idx} className="flex flex-col gap-4">
                    {/* Inline Feedback Box */}
                    {openFeedbackSections.includes(sec.title) && (
                        <div className={cn(
                            "bg-white rounded-[20px] shadow-sm border-l-[6px] p-6 animate-in slide-in-from-top-4 duration-300",
                            isInline ? "border-l-[#ED393C]" : "border-l-[#ED393C]"
                        )}>
                            <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                                <textarea
                                    rows={1}
                                    ref={(el) => {
                                        if (el) {
                                            el.style.height = "auto";
                                            el.style.height = `${el.scrollHeight}px`;
                                        }
                                    }}
                                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none overflow-hidden"
                                    placeholder="ระบุข้อเสนอแนะสำหรับผู้รับผิดชอบข้อมูล"
                                    value={sectionFeedbacks[sec.title] || ""}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    onChange={(e) => setSectionFeedbacks(prev => ({ ...prev, [sec.title]: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <button
                            onClick={() => toggleFeedback(sec.title)}
                            className={cn(
                                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                                openFeedbackSections.includes(sec.title)
                                    ? "bg-[#ED393C] text-white"
                                    : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]"
                            )}
                            title={`ข้อเสนอแนะส่วน${sec.title}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
                            </span>
                        </button>
                        <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderProcessorSections = () => (
        <div className="space-y-12">
            {[
                { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
                { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
                { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
                { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
                { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
                { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
            ].map((sec, idx) => (
                <div key={idx} className="flex flex-col gap-4">
                    {/* Inline Feedback Box for DP */}
                    {openFeedbackSections.includes(sec.title) && (
                        <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#00666E] p-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                                <textarea
                                    rows={1}
                                    ref={(el) => {
                                        if (el) {
                                            el.style.height = "auto";
                                            el.style.height = `${el.scrollHeight}px`;
                                        }
                                    }}
                                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none overflow-hidden"
                                    placeholder="ระบุข้อเสนอแนะสำหรับส่วนผู้ประมวลผลข้อมูล"
                                    value={sectionFeedbacks[sec.title] || ""}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    onChange={(e) => setSectionFeedbacks(prev => ({ ...prev, [sec.title]: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <button
                            onClick={() => toggleFeedback(sec.title)}
                            className={cn(
                                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                                openFeedbackSections.includes(sec.title)
                                    ? "bg-[#00666E] text-white"
                                    : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]"
                            )}
                            title={`ข้อเสนอแนะส่วน${sec.title}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
                            </span>
                        </button>
                        <sec.component form={processorForm} handleChange={emptyHandler} errors={{}} disabled={true} variant="processor" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 space-y-6 animate-in fade-in duration-700">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-6 px-1">
                    <div className="flex-1">
                        <DpoFormTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>
                </div>

                {/* Tab: DO (Data Owner) - RESTORED ORIGINAL INLINE CODE */}
                {activeTab === "owner" && (
                    <div className="space-y-8 pb-32">
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
                                <div key={idx} className="flex flex-col gap-4">
                                    {/* Inline Feedback Box */}
                                    {openFeedbackSections.includes(sec.title) && (
                                        <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#ED393C] p-6 animate-in slide-in-from-top-4 duration-300">
                                            <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                                                <textarea
                                                    rows={1}
                                                    ref={(el) => {
                                                        if (el) {
                                                            el.style.height = "auto";
                                                            el.style.height = `${el.scrollHeight}px`;
                                                        }
                                                    }}
                                                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none overflow-hidden"
                                                    placeholder="ระบุข้อเสนอแนะสำหรับผู้รับผิดชอบข้อมูล"
                                                    value={sectionFeedbacks[sec.title] || ""}
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = "auto";
                                                        target.style.height = `${target.scrollHeight}px`;
                                                    }}
                                                    onChange={(e) => setSectionFeedbacks(prev => ({ ...prev, [sec.title]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <button
                                            onClick={() => toggleFeedback(sec.title)}
                                            className={cn(
                                                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                                                openFeedbackSections.includes(sec.title)
                                                    ? "bg-[#ED393C] text-white"
                                                    : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]"
                                            )}
                                            title={`ข้อเสนอแนะส่วน${sec.title}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
                                            </span>
                                        </button>
                                        <sec.component form={form} handleChange={emptyHandler} errors={{}} disabled={true} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: DP (Data Processor) - RESTORED ORIGINAL INLINE CODE */}
                {activeTab === "processor" && (
                    <div className="space-y-8 pb-32">
                        <div className="space-y-12">
                            {[
                                { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
                                { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
                                { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
                                { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
                                { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
                                { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
                            ].map((sec, idx) => (
                                <div key={idx} className="flex flex-col gap-4">
                                    {/* Inline Feedback Box for DP */}
                                    {openFeedbackSections.includes(sec.title) && (
                                        <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#00666E] p-6 animate-in slide-in-from-top-4 duration-300">
                                            <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                                                <textarea
                                                    rows={1}
                                                    ref={(el) => {
                                                        if (el) {
                                                            el.style.height = "auto";
                                                            el.style.height = `${el.scrollHeight}px`;
                                                        }
                                                    }}
                                                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none overflow-hidden"
                                                    placeholder="ระบุข้อเสนอแนะสำหรับส่วนผู้ประมวลผลข้อมูล"
                                                    value={sectionFeedbacks[sec.title] || ""}
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = "auto";
                                                        target.style.height = `${target.scrollHeight}px`;
                                                    }}
                                                    onChange={(e) => setSectionFeedbacks(prev => ({ ...prev, [sec.title]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <button
                                            onClick={() => toggleFeedback(sec.title)}
                                            className={cn(
                                                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                                                openFeedbackSections.includes(sec.title)
                                                    ? "bg-[#00666E] text-white"
                                                    : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]"
                                            )}
                                            title={`ข้อเสนอแนะส่วน${sec.title}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
                                            </span>
                                        </button>
                                        <sec.component form={processorForm} handleChange={emptyHandler} errors={{}} disabled={true} variant="processor" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Risk */}
                {activeTab === "risk" && (
                    <div className="mt-4 pb-32 space-y-8">
                        <DpoRiskAssessment
                            key={recordId}
                            doStatus={doStatus}
                            dpStatus={dpStatus}
                            existingRisk={form.riskAssessment}
                            activeView={riskDocView}
                            onViewDoSection={() => setRiskDocView(prev => prev === "owner" ? "none" : "owner")}
                            onViewDpSection={() => setRiskDocView(prev => prev === "processor" ? "none" : "processor")}
                            onSubmit={(p, i) => {
                                if (recordId) saveRiskAssessment(recordId, { probability: p, impact: i });
                            }}
                            onCancel={() => setActiveTab("owner")}
                            readOnly={true}
                            isFeedbackOpen={openFeedbackSections.includes("การประเมินความเสี่ยง")}
                            onToggleFeedback={() => toggleFeedback("การประเมินความเสี่ยง")}
                        />

                        {/* Risk Assessment Feedback Box */}
                        {openFeedbackSections.includes("การประเมินความเสี่ยง") && (
                            <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#ED393C] p-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                                    <textarea
                                        rows={1}
                                        ref={(el) => {
                                            if (el) {
                                                el.style.height = "auto";
                                                el.style.height = `${el.scrollHeight}px`;
                                            }
                                        }}
                                        className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none overflow-hidden"
                                        placeholder="ระบุข้อเสนอแนะสำหรับการประเมินความเสี่ยง"
                                        value={sectionFeedbacks["การประเมินความเสี่ยง"] || ""}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = "auto";
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                        onChange={(e) => setSectionFeedbacks(prev => ({ ...prev, i: e.target.value, ["การประเมินความเสี่ยง"]: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}

                        {riskDocView === "owner" && (
                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                                <hr className="border-[#E5E2E1] my-8" />
                                <h3 className="text-xl font-black text-[#1B1C1C]">ข้อมูลส่วนของผู้รับผิดชอบข้อมูล</h3>
                                {renderOwnerSections()}
                            </div>
                        )}

                        {riskDocView === "processor" && (
                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                                <hr className="border-[#E5E2E1] my-8" />
                                <h3 className="text-xl font-black text-[#1B1C1C]">ข้อมูลส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล</h3>
                                {renderProcessorSections()}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Destruction */}
                {activeTab === "destruction" && (
                    <div className="space-y-8 pb-32">
                        <div className="bg-white rounded-[20px] p-8 border border-[#E5E2E1] flex flex-col items-center justify-center text-secondary py-20">
                            <span className="material-symbols-outlined text-[64px] mb-4 opacity-20 text-[#5C403D]">delete_sweep</span>
                            <h3 className="text-xl font-black text-[#5C403D]">ยังไม่มีการขอยื่นทำลาย</h3>
                            <p className="font-bold opacity-60">เอกสารฉบับนี้ยังไม่มีการยื่นคำร้องขอยื่นทำลายข้อมูล</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar (Footer) */}
            <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] border-t border-[#E5E2E1] p-5 px-10 flex items-center justify-between z-40">
                {/* Left Side */}
                <button
                    onClick={handleCancel}
                    className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
                >
                    ยกเลิก
                </button>

                {/* Right Side */}
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
                onConfirm={() => {
                    router.push("/dpo/tables/in-progress");
                }}
                title="ยืนยันการตรวจสอบ"
                subtitle="ยืนยันว่าได้ดำเนินการตรวจสอบครบถ้วนเรียบร้อยแล้ว"
                buttonText="ยืนยันการตรวจสอบ"
            />
        </div>
    );
}

export default function DPOInProgressDetailPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลดฟอร์ม...</div>}>
            <DpoInProgressDetailContent />
        </Suspense>
    );
}
