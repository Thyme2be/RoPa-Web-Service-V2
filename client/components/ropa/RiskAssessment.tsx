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
    onViewDoSection: () => void;
    onViewDpSection: () => void;
    onSubmit: (probability: number, impact: number) => void;
    onCancel: () => void;
}

function ScaleSelector({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-[15px] font-bold text-[#1B1C1C]">{label}</p>
            <div className="flex items-end gap-6">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div
                            className={cn(
                                "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                                value === n
                                    ? "border-primary bg-primary text-white scale-110 shadow-lg shadow-primary/30"
                                    : "border-[#D1C8C6] bg-white text-[#5F5E5E] hover:border-primary/50 hover:scale-105"
                            )}
                        >
                            <span className="text-sm font-black">{n}</span>
                        </div>
                        <span className={cn(
                            "text-xs font-bold transition-colors",
                            value === n ? "text-primary" : "text-[#9CA3AF]"
                        )}>
                            {n}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function getRiskColor(level: string) {
    if (level === "ต่ำ") return "text-green-600 bg-green-50";
    if (level === "ปานกลาง") return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
}

export default function RiskAssessment({
    doStatus,
    dpStatus,
    existingRisk,
    onViewDoSection,
    onViewDpSection,
    onSubmit,
    onCancel,
}: RiskAssessmentProps) {
    const [probability, setProbability] = useState(existingRisk?.probability ?? 0);
    const [impact, setImpact] = useState(existingRisk?.impact ?? 0);

    const total = probability * impact;
    const level = total === 0 ? "-" : total <= 6 ? "ต่ำ" : total <= 14 ? "ปานกลาง" : "สูง";

    // ─── Blocked: DP not done ─────────────────────────────────────────────────
    if (dpStatus !== "done") {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-[64px] text-[#D1C8C6] mb-6">lock</span>
                <p className="text-[22px] font-black text-[#5F5E5E] leading-relaxed max-w-[500px]">
                    &ldquo;ไม่สามารถประเมินความเสี่ยงได้<br />
                    เนื่องจากในส่วนของผู้ประมวลผลข้อมูลส่วนบุคคลยังไม่ดำเนินการ&rdquo;
                </p>
            </div>
        );
    }

    // ─── Blocked: DO not done ─────────────────────────────────────────────────
    if (doStatus !== "done") {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-[64px] text-[#D1C8C6] mb-6">hourglass_empty</span>
                <p className="text-[22px] font-black text-[#5F5E5E] leading-relaxed max-w-[500px]">
                    &ldquo;รอส่วนของผู้รับผิดชอบข้อมูลดำเนินการให้เสร็จสิ้นก่อน<br />
                    จึงจะสามารถประเมินความเสี่ยงได้&rdquo;
                </p>
            </div>
        );
    }

    // ─── Ready: Both done ─────────────────────────────────────────────────────
    return (
        <div className="space-y-8 pb-32">
            <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/5 p-2.5 rounded-xl">
                        <span className="material-symbols-outlined text-primary text-2xl">assessment</span>
                    </div>
                    <h2 className="font-black text-xl text-[#1B1C1C] tracking-tight">
                        ความเสี่ยงที่ผู้รับผิดชอบข้อมูลจำเป็นต้องประเมิน
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                    <ScaleSelector
                        label="ประเมินโอกาสที่จะเกิดเหตุ"
                        value={probability}
                        onChange={setProbability}
                    />
                    <ScaleSelector
                        label="ความเสียหายที่อาจจะขึ้น"
                        value={impact}
                        onChange={setImpact}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F6F3F2]">
                    <div className="space-y-2">
                        <label className="text-sm font-extrabold text-[#5C403D] tracking-tight">
                            ความเสี่ยงโดยรวมจากการประเมิน
                        </label>
                        <div className="h-11 bg-[#F6F3F2] rounded-xl px-4 flex items-center">
                            <span className="text-sm font-bold text-[#1B1C1C]">
                                {total > 0 ? total : "—"}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-extrabold text-[#5C403D] tracking-tight">
                            ระดับความเสี่ยง
                        </label>
                        <div className="h-11 bg-[#F6F3F2] rounded-xl px-4 flex items-center">
                            {total > 0 ? (
                                <span className={cn(
                                    "text-sm font-black px-3 py-1 rounded-lg",
                                    getRiskColor(level)
                                )}>
                                    {level}
                                </span>
                            ) : (
                                <span className="text-sm font-bold text-[#9CA3AF]">—</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* View document buttons */}
                <div className="space-y-3 pt-2">
                    <p className="text-sm font-extrabold text-[#5C403D] tracking-tight">
                        ดูข้อมูลในเอกสาร เพื่อประกอบการประเมินความเสี่ยง
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button
                            onClick={onViewDoSection}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#F6F3F2] hover:bg-white border border-[#E5E2E1] rounded-xl font-bold text-sm text-[#1B1C1C] transition-all hover:border-primary/30"
                        >
                            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                            ส่วนของผู้รับผิดชอบข้อมูล
                        </button>
                        <button
                            onClick={onViewDpSection}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#F6F3F2] hover:bg-white border border-[#E5E2E1] rounded-xl font-bold text-sm text-[#1B1C1C] transition-all hover:border-primary/30"
                        >
                            <span className="material-symbols-outlined text-[18px] text-primary">business</span>
                            ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] border-t border-[#E5E2E1]/60 p-4 px-10 flex items-center justify-between z-40">
                <button
                    onClick={onCancel}
                    className="text-base font-bold text-[#5C403D] hover:text-[#ED393C] transition-all px-6 py-2"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={() => {
                        if (probability === 0 || impact === 0) {
                            alert("กรุณาเลือกระดับโอกาสและความเสียหายก่อน");
                            return;
                        }
                        onSubmit(probability, impact);
                    }}
                    className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-xl font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    ยืนยันการส่งการประเมิน
                </button>
            </div>
        </div>
    );
}
