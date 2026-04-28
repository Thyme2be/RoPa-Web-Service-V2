"use client";

/**
 * InlineFeedbackWrapper — wrapper สำหรับ DO/DP form sections
 * ใช้ SectionCommentBox เป็น UI engine ด้านใน
 */

import React from "react";
import SectionCommentBox, { CommentSuggestion } from "./SectionCommentBox";

interface Suggestion {
    text: string;
    date?: string;
    reviewer?: string;
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
    onReviewClick,
}: InlineFeedbackWrapperProps) {
    const mappedSuggestions: CommentSuggestion[] = (existingSuggestions ?? []).map((s) => ({
        text: s.text,
        date: s.date,
        reviewer: s.reviewer,
    }));

    return (
        <SectionCommentBox
            title={title}
            isOpen={isDraftingFeedback}
            onToggle={onReviewClick ?? (() => {})}
            value={feedbackText}
            onChange={onFeedbackChange}
            suggestions={isDraftingFeedback ? [] : mappedSuggestions}
            readOnly={!canReview}
            variant={isProcessor ? "dp" : "do"}
        >
            {children}
        </SectionCommentBox>
    );
}
