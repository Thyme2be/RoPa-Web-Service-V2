"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface RiskAssessmentProps {
    doStatus: "pending" | "done";
    dpStatus: "pending" | "done";
    existingRisk?: {
        probability: number;
        impact: number;
        total: number;
        level: string;
    };
    activeView?: "none" | "owner" | "processor";
    onViewDoSection: () => void;
    onViewDpSection: () => void;
    onSubmit: (probability: number, impact: number) => void;
    onCancel: () => void;
    readOnly?: boolean;
    isFeedbackOpen?: boolean;
    onToggleFeedback?: () => void;
    showFeedback?: boolean;
    showViewSections?: boolean;
    feedbackData?: any[];
}

function ScaleSelector({
    label,
    value,
    onChange,
    disabled = false,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-6">
            <p className="text-[17px] font-bold text-[#1B1C1C]">{label}</p>
            <div className="relative flex items-center justify-between px-4 max-w-[450px]">
                {/* Connecting Line */}
                <div className="absolute left-[36px] right-[36px] h-[1px] bg-[#E5E2E1] top-[20px]" />

                {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex flex-col items-center gap-4 relative z-10">
                        <button
                            onClick={() => !disabled && onChange(n)}
                            disabled={disabled}
                            style={{
                                backgroundColor: value === n ? "#ED393C" : "#FFFFFF",
                                borderColor: value === n ? "#ED393C" : "#D1C8C6"
                            }}
                            className={cn(
                                "w-10 h-10 rounded-full border transition-all flex items-center justify-center",
                                value === n && "shadow-md"
                            )}
                        />
                        <span className={cn(
                            "text-sm font-bold",
                            value === n ? "text-[#ED393C]" : "text-[#5F5E5E]"
                        )}>
                            {n}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DpoRiskAssessment({
    doStatus,
    dpStatus,
    existingRisk,
    activeView = "none",
    onViewDoSection,
    onViewDpSection,
    onSubmit,
    onCancel,
    readOnly = false,
    onToggleFeedback,
    isFeedbackOpen: externalFeedbackOpen,
    showFeedback = true,
    showViewSections = true,
    feedbackData = [],
}: RiskAssessmentProps) {
    const [probability, setProbability] = useState(existingRisk?.probability ?? 0);
    const [impact, setImpact] = useState(existingRisk?.impact ?? 0);
    const [internalFeedbackOpen, setInternalFeedbackOpen] = useState(false);

    // Use external state if provided, otherwise fallback to internal state
    const isFeedbackOpen = externalFeedbackOpen !== undefined ? externalFeedbackOpen : internalFeedbackOpen;
    const handleToggleFeedback = () => {
        if (onToggleFeedback) {
            onToggleFeedback();
        } else {
            setInternalFeedbackOpen(!internalFeedbackOpen);
        }
    };

    const currentProb = readOnly ? (existingRisk?.probability ?? 0) : probability;
    const currentImpact = readOnly ? (existingRisk?.impact ?? 0) : impact;

    const total = currentProb * currentImpact;
    const level = total === 0 ? "-" : total <= 6 ? "ความเสี่ยงต่ำ" : total <= 14 ? "ความเสี่ยงปานกลาง" : "ความเสี่ยงสูง";

    return (
        <div className="space-y-8">
            <div className="bg-transparent space-y-12 relative group">
                {showFeedback && (
                    <div className="absolute top-5 right-5 z-20 flex flex-col items-end gap-3">
                        <button
                            onClick={handleToggleFeedback}
                            className={cn(
                                "w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm",
                                isFeedbackOpen
                                    ? "bg-[#ED393C] text-white"
                                    : "bg-white border border-[#E5E2E1] text-[#5C403D] hover:bg-[#F6F3F2]"
                            )}
                            title="ข้อเสนอแนะสำหรับการประเมินความเสี่ยง"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isFeedbackOpen ? "close" : "comment"}
                            </span>
                        </button>

                        {/* Feedback List Overlay */}
                        {isFeedbackOpen && feedbackData.length > 0 && (
                            <div className="w-[320px] bg-white rounded-2xl border border-[#E5E2E1] shadow-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="text-[15px] font-black text-[#1B1C1C] mb-4 border-b border-[#F1EDEC] pb-2">ความคิดเห็นจาก DPO</h4>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {feedbackData.map((fb, i) => (
                                        <div key={i} className="bg-[#F9F9F9] p-3 rounded-xl border-l-4 border-l-[#ED393C]">
                                            <p className="text-[13px] text-[#1B1C1C] font-medium leading-relaxed">{fb.content}</p>
                                            <p className="text-[11px] text-[#5F5E5E] mt-2 font-bold">
                                                {new Date(fb.created_at).toLocaleDateString("th-TH", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isFeedbackOpen && feedbackData.length === 0 && (
                            <div className="w-[320px] bg-white rounded-2xl border border-[#E5E2E1] shadow-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 text-center">
                                <p className="text-[13px] text-[#5F5E5E] font-medium italic">ไม่มีข้อเสนอแนะในขณะนี้</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="font-black text-xl text-[#1B1C1C] tracking-tight">
                        ความเสี่ยงที่ผู้รับผิดชอบข้อมูลจำเป็นต้องประเมิน
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                    <ScaleSelector
                        label="ประเมินโอกาสที่จะเกิดเหตุ"
                        value={currentProb}
                        onChange={setProbability}
                        disabled={readOnly}
                    />
                    <ScaleSelector
                        label="ความเสียหายที่อาจจะขึ้น"
                        value={currentImpact}
                        onChange={setImpact}
                        disabled={readOnly}
                    />
                </div>

                <div className="space-y-6 pt-10 border-t border-[#E5E2E1]/60">
                    <div className="flex items-center gap-6">
                        <label className="text-[17px] font-black text-[#1B1C1C] tracking-tight min-w-[240px]">
                            ความเสี่ยงโดยรวมจากการประเมิน
                        </label>
                        <div className="h-14 w-[220px] bg-white border border-[#E5E2E1] rounded-xl px-6 flex items-center justify-center shadow-sm">
                            <span className="text-[19px] font-black text-[#1B1C1C]">
                                {total > 0 ? total : ""}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="text-[17px] font-black text-[#1B1C1C] tracking-tight min-w-[150px]">
                            ระดับความเสี่ยง
                        </label>
                        <div className="h-14 min-w-[220px] bg-white border border-[#E5E2E1] rounded-xl px-6 flex items-center justify-center shadow-sm">
                            {total > 0 && (
                                <span className="text-[17px] font-black text-[#1B1C1C]">
                                    {level}
                                </span>
                            )}
                        </div>
                    </div>

                    {showViewSections && (
                        <div className="flex items-center gap-6 pt-6">
                            <p className="text-[17px] font-black text-[#1B1C1C] tracking-tight">
                                ดูข้อมูลในเอกสาร เพื่อประกอบการประเมินความเสี่ยง
                            </p>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onViewDoSection}
                                    className={cn(
                                        "px-8 h-12 rounded-xl font-bold text-[14px] transition-all border shadow-sm",
                                        activeView === "owner"
                                            ? "bg-white text-[#1B1C1C] border-[#ED393C] ring-1 ring-[#ED393C]"
                                            : "bg-[#F9F9F9] text-[#1B1C1C] border-[#E5E2E1] hover:bg-white cursor-pointer"
                                    )}
                                >
                                    ส่วนของผู้รับผิดชอบข้อมูล
                                </button>
                                <button
                                    onClick={onViewDpSection}
                                    className={cn(
                                        "px-8 h-12 rounded-xl font-bold text-[14px] transition-all border shadow-sm",
                                        activeView === "processor"
                                            ? "bg-white text-[#1B1C1C] border-[#ED393C] ring-1 ring-[#ED393C]"
                                            : "bg-[#F9F9F9] text-[#1B1C1C] border-[#E5E2E1] hover:bg-white cursor-pointer"
                                    )}
                                >
                                    ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
