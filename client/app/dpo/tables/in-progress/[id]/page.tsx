"use client";

import Stepper from "@/components/layouts/Stepper";
import GeneralInfo from "@/components/formSections/GeneralInfo";
import ActivityDetails from "@/components/formSections/ActivityDetails";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import RightsChannel from "@/components/formSections/RightsChannel";
import RiskAssessment from "@/components/ropa/RiskAssessment";
import { cn } from "@/lib/utils";

/** Local Tabs Component for DPO (No status dots to avoid conflict) */
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
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";

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
                setForm(existing);
            }

            // Load Processor Part
            const procData = getProcessorById(recordId);
            if (procData) {
                setProcessorForm(procData);
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
    const tabs = ["owner", "processor", "risk", "destruction"];

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

        alert("ส่งเอกสารกลับคืนให้ผู้รับผิดชอบข้อมูลแก้ไขเรียบร้อยแล้ว");
        router.push("/dpo/tables/in-progress");
    };

    const isLastTab = activeTab === tabs[tabs.length - 1];
    const isFirstTab = activeTab === tabs[0];

    const emptyHandler = () => { };

    return (
        <div className="flex-1 space-y-6 animate-in fade-in duration-700">
            <div className="space-y-6">
                <DpoFormTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Tab: DO (Data Owner) */}
                {activeTab === "owner" && (
                    <div className="space-y-8 pb-32">
                        <div className="space-y-12">
                            {[
                                { title: "ข้อมูลทั่วไป", component: GeneralInfo },
                                { title: "ช่องทางใช้สิทธิ", component: RightsChannel },
                                { title: "กิจกรรมประมวลผล", component: ActivityDetails },
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

                {/* Tab: DP (Data Processor) */}
                {activeTab === "processor" && (
                    <div className="space-y-8 pb-32">
                        <div className="space-y-12">
                            {[
                                { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
                                { title: "กิจกรรมประมวลผล (DP)", component: ActivityDetails },
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
                    <div className="mt-4 pb-32">
                        <RiskAssessment
                            doStatus={doStatus}
                            dpStatus={dpStatus}
                            existingRisk={form.riskAssessment}
                            onViewDoSection={() => setActiveTab("owner")}
                            onViewDpSection={() => setActiveTab("processor")}
                            onSubmit={(p, i) => {
                                if (recordId) saveRiskAssessment(recordId, { probability: p, impact: i });
                                alert("บันทึกการประเมินความเสี่ยงสำเร็จ");
                            }}
                            onCancel={() => setActiveTab("owner")}
                        />
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
                            onClick={handleReturnForEdit}
                            className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                            ส่งกลับไปแก้ไข
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
