"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommentSuggestion {
  text: string;
  date?: string;
  reviewer?: string;
}

export type CommentVariant = "do" | "dp" | "dpo" | "risk";

const VARIANT_CONFIG: Record<
  CommentVariant,
  {
    accentColor: string;   // Tailwind bg class
    buttonActive: string;  // Active toggle bg class
    placeholder: string;
    label: string;
  }
> = {
  do: {
    accentColor: "bg-[#ED393C]",
    buttonActive: "bg-[#ED393C] text-white",
    placeholder: "ระบุข้อเสนอแนะสำหรับผู้รับผิดชอบข้อมูล",
    label: "ข้อเสนอแนะจาก",
  },
  dp: {
    accentColor: "bg-[#00666E]",
    buttonActive: "bg-[#00666E] text-white",
    placeholder: "ระบุข้อเสนอแนะสำหรับผู้ประมวลผลข้อมูลส่วนบุคคล",
    label: "ข้อเสนอแนะจาก",
  },
  dpo: {
    accentColor: "bg-[#ED393C]",
    buttonActive: "bg-[#ED393C] text-white",
    placeholder: "ระบุข้อเสนอแนะ (DPO)",
    label: "ข้อเสนอแนะจาก",
  },
  risk: {
    accentColor: "bg-[#ED393C]",
    buttonActive: "bg-[#ED393C] text-white",
    placeholder: "ระบุข้อเสนอแนะสำหรับการประเมินความเสี่ยง",
    label: "ข้อเสนอแนะจาก",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SectionCommentBoxProps {
  /** The form card/section this wraps */
  children: React.ReactNode;
  /** Controls the open/closed state of the comment input */
  isOpen: boolean;
  /** Called when the toggle button is clicked */
  onToggle: () => void;
  /** Current draft text inside the textarea */
  value: string;
  /** Called when user types in the textarea */
  onChange: (text: string) => void;
  /** Existing suggestions to display (read-only bubbles above the section) */
  suggestions?: CommentSuggestion[];
  /** Whether this component is in read-only mode (hides toggle button) */
  readOnly?: boolean;
  /** Visual style variant */
  variant?: CommentVariant;
  /** Override placeholder */
  placeholder?: string;
  /** Optional title for the section header */
  title?: string;
  /** Optional Material Icon name */
  icon?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SectionCommentBox({
  children,
  isOpen,
  onToggle,
  value,
  onChange,
  suggestions = [],
  readOnly = false,
  variant = "do",
  placeholder,
  title,
  icon,
}: SectionCommentBoxProps) {
  const config = VARIANT_CONFIG[variant];
  const resolvedPlaceholder = placeholder ?? config.placeholder;
  const lightBg = variant === "dp" ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
  const primaryColor = variant === "dp" ? "#00666E" : "#ED393C";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Existing suggestions (read-only bubbles, shown above the section) ── */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-[20px] shadow-sm relative overflow-hidden ring-1 ring-black/[0.02] p-6 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-[6px]",
                  config.accentColor,
                )}
              />
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-[13px] font-black text-[#ED393C] tracking-tight">
                  {config.label}: {s.reviewer ?? "DPO"}
                </span>
                {s.date && (
                  <span className="text-[12px] font-bold text-[#9CA3AF]">
                    {new Date(s.date).toLocaleDateString("th-TH")}
                  </span>
                )}
              </div>
              <p className="text-[15px] font-bold text-[#1B1C1C] leading-relaxed px-4">
                &ldquo;{s.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Comment input (slides in when isOpen) ── */}
      {isOpen && !readOnly && (
        <div
          className={cn(
            "bg-white rounded-[20px] shadow-sm border-l-[6px] p-6 animate-in slide-in-from-top-4 duration-300",
            config.accentColor.replace("bg-", "border-l-"),
          )}
        >
          <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
            <textarea
              autoFocus
              className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none min-h-[60px] text-[14px]"
              placeholder={resolvedPlaceholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Section card with toggle button ── */}
      <div className="relative group">
        {/* Toggle button (top-right corner of the section card) */}
        {!readOnly && (
          <button
            type="button"
            onClick={onToggle}
            title={isOpen ? "ปิดข้อเสนอแนะ" : "เพิ่มข้อเสนอแนะ"}
            className={cn(
              "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm",
              isOpen
                ? config.buttonActive
                : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]",
            )}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isOpen ? "close" : "comment"}
            </span>
          </button>
        )}

        <div
          className={cn(
            "bg-white rounded-[24px] shadow-sm relative overflow-hidden ring-1 ring-black/[0.02] p-8 transition-all",
            config.accentColor.replace("bg-", "border-l-[6px] border-l-")
          )}
        >
          {title && (
            <div className="flex items-center gap-4 mb-8">
              {icon && (
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                    lightBg
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ color: primaryColor }}
                  >
                    {icon}
                  </span>
                </div>
              )}
              <h3 className="text-[18px] font-black text-[#1B1C1C] tracking-tight">
                {title}
              </h3>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
