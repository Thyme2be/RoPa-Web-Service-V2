"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { useRopa } from "@/context/RopaContext";
import Link from "next/link";

export default function SuggestionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { getById } = useRopa();

    const record = getById(id);

    if (!record) {
        return (
            <div className="flex min-h-screen bg-[#FCF9F8]">
                <Sidebar />
                <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-black text-secondary">ไม่พบข้อมูลเอกสาร</h1>
                    <Link href="/data-owner/advice" className="mt-4 text-primary font-bold hover:underline">กลับไปหน้ารายการ</Link>
                </main>
            </div>
        );
    }

    const suggestions = record.suggestions || [];
    const pageRole = suggestions[0]?.role || "owner";
    const isOwnerView = pageRole === "owner";

    const themeColor = isOwnerView ? "#ED393C" : "#0D9488";
    const sectionTitle = isOwnerView
        ? "ข้อเสนอแนะสำหรับผู้รับผิดชอบข้อมูล"
        : "ข้อเสนอแนะสำหรับผู้ประมวลผลข้อมูลส่วนบุคคล";

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low min-w-0">
                <TopBar
                    pageTitle="ข้อเสนอแนะ"
                    showBack={true}
                    backUrl="/data-owner/advice"
                />

                <div className="p-8 space-y-6 max-w-[1400px] mx-auto w-full">

                    {/* Header Info Grid */}
                    <div className="flex justify-between items-start pt-2">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-24 gap-y-1">
                                <div className="text-lg font-bold text-[#1B1C1C] flex items-center gap-2">
                                    <span className="text-[#5C403D] font-medium">รหัสเอกสาร :</span>
                                    <span>{record.id}</span>
                                </div>
                                <div className="text-lg font-bold text-[#1B1C1C] flex items-center gap-2">
                                    <span className="text-[#5C403D] font-medium">วันที่แก้ไขล่าสุด :</span>
                                    <span>{record.updatedDate || record.dateCreated || "-"}</span>
                                </div>
                            </div>
                            <div className="text-lg font-bold text-[#1B1C1C] flex items-center gap-2 pt-1">
                                <span className="text-[#5C403D] font-medium">ผู้ตรวจสอบ :</span>
                                <span>{suggestions[0]?.reviewer || "-"}</span>
                            </div>
                            <div className="text-lg font-bold text-[#1B1C1C] flex items-center gap-2">
                                <span className="text-[#5C403D] font-medium">ชื่อเอกสาร :</span>
                                <span>{record.documentName}</span>
                            </div>
                        </div>

                        <button
                            className="flex items-center gap-2 bg-[#E5E7EB] px-6 py-2.5 rounded-lg text-base font-black text-[#1B1C1C] hover:bg-[#D1D5DB] transition-all cursor-pointer shadow-sm"
                        >
                            <span className="material-symbols-outlined text-xl">history</span>
                            ประวัติการแก้ไข
                        </button>
                    </div>

                    {/* Feedback Section */}
                    <div className="space-y-6 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-[5px] h-[24px] rounded-sm"
                                    style={{ backgroundColor: themeColor }}
                                ></div>
                                <h2 className="text-xl font-bold text-[#1B1C1C] tracking-tight">
                                    {sectionTitle}
                                </h2>
                            </div>

                            {isOwnerView && (
                                <Link
                                    href={`/data-owner/ropa/form?id=${id}`}
                                    className="flex items-center gap-1.5 text-[#ED393C] text-base font-black hover:underline cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    แก้ไขเอกสาร
                                </Link>
                            )}
                        </div>

                        <div className="space-y-4">
                            {suggestions.map((s) => (
                                <div
                                    key={s.id}
                                    className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/20 overflow-hidden flex min-h-[120px]"
                                    style={{ borderLeft: `5px solid ${themeColor}` }}
                                >
                                    <div className="p-6 flex flex-col justify-center flex-1 space-y-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-bold text-[#5C403D] uppercase tracking-tight">
                                                {s.section}
                                            </p>
                                            {!isOwnerView && s.statusLabel && (
                                                <div className={`px-2.5 py-1 rounded text-xs font-black tracking-wider text-white shadow-sm ${s.statusLabel === "เสร็จสมบูรณ์" ? "bg-[#228B15]" : "bg-[#ED393C]"}`}>
                                                    {s.statusLabel}
                                                </div>
                                            )}
                                            {isOwnerView && (
                                                <div className={`px-2.5 py-1 rounded text-xs font-black tracking-wider text-white shadow-sm ${s.status === "fixed" ? "bg-[#228B15]" : "bg-[#FBBF24]"}`}>
                                                    {s.status === "fixed" ? "แก้ไขแล้ว" : "รอดำเนินการ"}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-base font-bold text-[#1B1C1C] leading-snug">
                                            "{s.comment}"
                                        </p>
                                        <p className="text-sm font-medium text-secondary opacity-70">
                                            {s.reviewer} · {s.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Footer */}
                        {isOwnerView && (
                            <div className="flex justify-end pt-4">
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
