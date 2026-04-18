"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Suggestion {
    text: string;
    date?: string;
}

interface InlineFeedbackWrapperProps {
    children: React.ReactNode;
    title: string;
    isDraftingFeedback: boolean;
    onFeedbackChange: (text: string) => void;
    feedbackText: string;
    existingSuggestion?: Suggestion;
    isProcessor?: boolean;
    canReview?: boolean;
    onReviewClick?: () => void;
}

export default function InlineFeedbackWrapper({
    children,
    title,
    isDraftingFeedback,
    onFeedbackChange,
    feedbackText,
    existingSuggestion,
    isProcessor = false,
    canReview = false,
    onReviewClick
}: InlineFeedbackWrapperProps) {
    const primaryColorClass = isProcessor ? "bg-[#00666E]" : "bg-[#ED393C]";
    const borderFocusClass = isProcessor ? "focus:border-[#00666E]" : "focus:border-[#ED393C]";

    return (
        <div className="space-y-4">
            {/* Feedback Input Mode */}
            {isDraftingFeedback && (
                <div className="bg-[#F6F3F2] rounded-2xl p-4 flex pl-6 relative overflow-hidden">
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", primaryColorClass)} />
                    <textarea
                        className={cn(
                            "w-full bg-[#F6F3F2] border-none px-4 py-3 min-h-[60px] text-sm font-bold text-[#1B1C1C] placeholder:text-[#9CA3AF] outline-none transition-all resize-none",
                            "hover:bg-[#E5E2E1]/30",
                            borderFocusClass
                        )}
                        placeholder={`ระบุข้อเสนอแนะสำหรับ${isProcessor ? "ผู้ประมวลผลข้อมูลส่วนบุคคล" : "ผู้รับผิดชอบข้อมูล"}`}
                        value={feedbackText}
                        onChange={(e) => onFeedbackChange(e.target.value)}
                    />
                </div>
            )}

            {/* Submitted Feedback Display */}
            {existingSuggestion && !isDraftingFeedback && (
                <div className="bg-white rounded-2xl p-4 pl-6 flex flex-col gap-2 relative overflow-hidden shadow-sm">
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", primaryColorClass)} />
                    <div className="flex items-center gap-2">
                        <span className={cn("material-symbols-outlined text-[18px]", isProcessor ? "text-[#00666E]" : "text-[#ED393C]")}>
                            edit_note
                        </span>
                        <span className="text-sm font-black text-[#1B1C1C]">{title}</span>
                    </div>
                    <p className="text-sm font-bold text-[#5F5E5E] leading-relaxed ml-7">
                        "{existingSuggestion.text}"
                    </p>
                </div>
            )}

            <div className="relative group">
                {canReview && !isDraftingFeedback && (
                    <button
                        onClick={onReviewClick}
                        className="absolute top-6 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 bg-[#F6F3F2] hover:bg-[#E5E2E1]/80"
                        title="เพิ่มข้อเสนอแนะ"
                    >
                        <span className="material-symbols-outlined text-[20px] text-[#5C403D]">
                            chat
                        </span>
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
