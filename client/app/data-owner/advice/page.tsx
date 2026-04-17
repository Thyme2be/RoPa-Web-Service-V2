"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import {
    SummaryCard,
    AdvancedFilterBar,
    Pagination,
    ListCard
} from "@/components/ropa/ListComponents";
import { useRopa } from "@/context/RopaContext";
import Link from "next/link";

const ITEMS_PER_PAGE = 5;

export default function RopaAdvicePage() {
    const { records, stats } = useRopa();
    const [page, setPage] = useState(1);

    // Records with suggestions (rejected or with feedback)
    const feedbackRecords = records.filter(r => r.suggestions && r.suggestions.length > 0);
    const pendingCount = feedbackRecords.filter(r =>
        r.suggestions?.some(s => s.status === "pending")
    ).length;
    const processorPendingCount = feedbackRecords.filter(r =>
        r.suggestions?.some(s => s.role === "processor" && s.status === "pending")
    ).length;

    const paginated = feedbackRecords.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    const totalPages = Math.ceil(feedbackRecords.length / ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar pageTitle="ข้อเสนอแนะ" />

                <div className="p-10 space-y-10">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการแจ้งเตือนข้อเสนอแนะจากผู้ตรวจสอบ
                        </h1>
                        <p className="text-[#5C403D] text-base font-medium opacity-80">
                            ตรวจสอบและตอบกลับข้อเสนอแนะที่ได้รับจากผู้ตรวจสอบ
                        </p>
                    </div>

                    {/* Summary Stats — live from Context */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryCard
                            label="รายการที่รอการตอบกลับทั้งหมด"
                            value={pendingCount.toString()}
                            accentColor="red"
                            footer={(
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#DC2626]">
                                    <span className="material-symbols-outlined text-base">show_chart</span>
                                    {feedbackRecords.length} รายการที่มีข้อเสนอแนะ
                                </div>
                            )}
                        />
                        <SummaryCard
                            label="รายการที่รอการดำเนินการจากผู้ประมวลผลข้อมูลส่วนบุคคล"
                            value={processorPendingCount.toString()}
                            accentColor="teal"
                            footer={(
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                                    <span className="material-symbols-outlined text-base">hourglass_empty</span>
                                    รอการดำเนินการจากผู้ประมวลผล
                                </div>
                            )}
                        />
                    </div>

                    <AdvancedFilterBar initialTimeframe="30" />

                    {/* Feedback Table */}
                    <ListCard title="รายการที่ตอบกลับจากผู้ตรวจสอบ" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[20%] uppercase">รหัสเอกสาร</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[45%] uppercase">ชื่อรายการ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginated.map((record) => (
                                    <tr key={record.id} className="hover:bg-[#F9FAFB] transition-colors group">
                                        <td className="py-8 text-sm font-medium text-secondary">{record.id}</td>
                                        <td className="py-8 text-base font-bold text-[#1B1C1C] tracking-tight leading-snug">{record.documentName}</td>
                                        <td className="py-8 text-sm font-medium text-secondary">
                                            {record.suggestions?.[0]?.date || record.dateCreated || "-"}
                                        </td>
                                        <td className="py-8">
                                            <div className="flex items-center justify-center">
                                                <Link href={`/data-owner/advice/${record.id}`}>
                                                    <button className="bg-[#E5E7EB]/70 text-[#4B5563] px-6 py-2.5 rounded-lg text-xs font-black hover:bg-[#E5E7EB] transition-all hover:shadow-sm cursor-pointer">
                                                        ดูข้อเสนอแนะ
                                                    </button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-[#5F5E5E] text-sm font-medium">
                                            ไม่มีข้อเสนอแนะในขณะนี้
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination current={page} total={totalPages} onChange={setPage} />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}

