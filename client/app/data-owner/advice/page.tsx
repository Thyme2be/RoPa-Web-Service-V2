"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { 
    SummaryCard, 
    AdvancedFilterBar, 
    Pagination, 
    ListCard 
} from "@/components/ropa/ListComponents";
import { mockOwnerRecords } from "@/lib/mockRecords";

import Link from "next/link";

export default function RopaAdvicePage() {
    // Correct mapping for the feedback list
    const feedbackRecords = mockOwnerRecords.filter(r => r.suggestions && r.suggestions.length > 0);

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="ข้อเสนอแนะ" />

                <div className="p-10 space-y-10">
                    <div className="space-y-2">
                        <h1 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการแจ้งเตือนข้อเสนอแนะจากผู้ตรวจสอบ
                        </h1>
                        <p className="text-[#5C403D] text-[15px] font-medium opacity-80">
                            ตรวจสอบและตอบกลับข้อเสนอแนะที่ได้รับจากผู้ตรวจสอบ
                        </p>
                    </div>

                    {/* Summary Stats with Footers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryCard 
                            label="รายการที่รอการตอบกลับทั้งหมด" 
                            value="12" 
                            accentColor="red" 
                            footer={(
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#DC2626]">
                                    <span className="material-symbols-outlined text-[16px]">show_chart</span>
                                    เพิ่มขึ้น 4 รายการจากเมื่อวาน
                                </div>
                            )}
                        />
                        <SummaryCard 
                            label="รายการที่รอการดำเนินการจากผู้ประมวลผลข้อมูลส่วนบุคคล" 
                            value="08" 
                            accentColor="teal" 
                            footer={(
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0D9488]">
                                    <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
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
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] w-[20%] uppercase">รหัสเอกสาร</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] w-[45%] uppercase">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {feedbackRecords.map((record) => (
                                    <FeedbackRow 
                                        key={record.id}
                                        id={record.id}
                                        displayId={record.id || "RP-2026"}
                                        title={record.documentName || "-"}
                                        receivedDate={record.suggestions?.[0]?.date || "30/03/2026, 14:30"}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <Pagination current={feedbackRecords.length} total={feedbackRecords.length} />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}

function FeedbackRow({ id, displayId, title, receivedDate }: any) {
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-8 text-[13px] font-medium text-secondary">{displayId}</td>
            <td className="py-8 text-[14.5px] font-bold text-[#1B1C1C] tracking-tight leading-snug">{title}</td>
            <td className="py-8 text-[13px] font-medium text-secondary">{receivedDate}</td>
            <td className="py-8">
                <div className="flex items-center justify-center">
                    <Link href={`/data-owner/advice/${id}`}>
                        <button className="bg-[#E5E7EB]/70 text-[#4B5563] px-6 py-2.5 rounded-lg text-[12.5px] font-black hover:bg-[#E5E7EB] transition-all hover:shadow-sm cursor-pointer">
                            ดูข้อเสนอแนะ
                        </button>
                    </Link>
                </div>
            </td>
        </tr>
    );
}
