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
        <div className="space-y-12">
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
                            <span className={cn(
                                "text-[17px] font-black",
                                total <= 6 ? "text-green-600" : total <= 14 ? "text-amber-600" : "text-red-600"
                            )}>
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
                                        ? "bg-[#ED393C] text-white border-[#ED393C]"
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
                                        ? "bg-[#ED393C] text-white border-[#ED393C]"
                                        : "bg-[#F9F9F9] text-[#1B1C1C] border-[#E5E2E1] hover:bg-white cursor-pointer"
                                )}
                            >
                                ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                            </button>
                        </div>
                    </div>
                )}
                {showFeedback && (
                    <div className="pt-6">
                        <button
                            type="button"
                            onClick={handleToggleFeedback}
                            className={cn(
                                "h-11 px-5 rounded-xl border font-bold text-[14px] transition-all inline-flex items-center gap-2",
                                isFeedbackOpen
                                    ? "bg-[#ED393C] text-white border-[#ED393C]"
                                    : "bg-white text-[#1B1C1C] border-[#E5E2E1] hover:bg-[#F9F9F9] cursor-pointer",
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isFeedbackOpen ? "close" : "chat"}
                            </span>
                            {isFeedbackOpen ? "ปิดข้อเสนอแนะ" : "เพิ่มข้อเสนอแนะ"}
                        </button>
                    </div>
                )}

                <div className={cn("transition-all duration-500 overflow-hidden", activeView !== "none" ? "mt-8 opacity-100" : "max-h-0 opacity-0")}>
                    {activeView === "owner" && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Parent Page will render the actual content here or below this component */}
                        </div>
                    )}
                    {activeView === "processor" && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Parent Page will render the actual content here or below this component */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
