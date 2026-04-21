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
    existingSuggestions?: Suggestion[];
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
    existingSuggestions,
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
                <div className="bg-[#FFFFFF] rounded-2xl p-6 flex relative overflow-hidden ring-1 ring-black/[0.02] shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className={cn("absolute left-0 top-0 bottom-0 w-[6px]", isProcessor ? "bg-[#00666E]" : "bg-[#ED393C]")} />
                    <textarea
                        className={cn(
                            "w-full bg-transparent border-none px-4 py-2 min-h-[80px] text-[15px] font-bold text-[#1B1C1C] placeholder:text-[#9CA3AF] outline-none transition-all resize-none",
                            "placeholder:font-medium"
                        )}
                        autoFocus
                        placeholder={`ระบุข้อเสนอแนะสำหรับ${isProcessor ? "ผู้ประมวลผลข้อมูลส่วนบุคคล" : "ผู้รับผิดชอบข้อมูล"}`}
                        value={feedbackText}
                        onChange={(e) => onFeedbackChange(e.target.value)}
                    />
                </div>
            )}

            {/* Submitted Feedback Display (For Data Processors/Owners) - Stacks if multiple */}
            {existingSuggestions && existingSuggestions.length > 0 && !isDraftingFeedback && (
                <div className="space-y-4">
                    {existingSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 flex flex-col gap-1.5 relative overflow-hidden ring-1 ring-black/[0.01] shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className={cn("absolute left-0 top-0 bottom-0 w-[6px]", isProcessor ? "bg-[#00666E]" : "bg-[#ED393C]")} />
                            <span className="text-[14px] font-bold text-[#9CA3AF] px-4 tracking-tight">
                                {title} {existingSuggestions.length > 1 ? `#${index + 1}` : ""}
                            </span>
                            <p className="text-[15px] font-bold text-[#1B1C1C] leading-relaxed px-4">
                                "{suggestion.text}"
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative group">
                {canReview && !isDraftingFeedback && (
                    <button
                        onClick={onReviewClick}
                        className="absolute top-6 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 bg-[#F6F3F2] hover:bg-[#E5E2E1] active:scale-95 shadow-sm group-hover:shadow"
                        title="เพิ่มข้อเสนอแนะ"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16ZM7 9H17V11H7V9ZM7 12H14V14H7V12ZM7 6H17V8H7V6Z" fill="#5C403D" />
                        </svg>
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
