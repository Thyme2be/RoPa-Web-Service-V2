"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { 
    SummaryCard, 
    AdvancedFilterBar, 
    StatusBadge, 
    Pagination, 
    ListCard, 
    ActionButton 
} from "@/components/ropa/ListComponents";
import { mockOwnerRecords } from "@/lib/mockRecords";
import { RopaStatus } from "@/types/enums";

export default function RopaListPage() {
    // Separate records for display
    const processingRecords = mockOwnerRecords.filter(r => r.status && r.status !== RopaStatus.Draft);
    const draftRecords = mockOwnerRecords.filter(r => r.status === RopaStatus.Draft);

    // Calculate Summary Stats from Mock Data
    const totalDocs = mockOwnerRecords.length;
    const completedDocs = mockOwnerRecords.filter(r => r.status === RopaStatus.Active).length;
    const currentDrafts = draftRecords.length;

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="รายการ RoPA ที่บันทึกไว้" />

                <div className="p-10 space-y-10">
                    {/* Dynamic Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard label="จำนวนเอกสารทั้งหมด" value={totalDocs.toString()} accentColor="red" />
                        <SummaryCard label="เอกสารฉบับสมบูรณ์" value={completedDocs.toString()} accentColor="teal" />
                        <SummaryCard label="บันทึกฉบับร่าง" value={currentDrafts.toString()} accentColor="gray" />
                    </div>

                    <AdvancedFilterBar />

                    {/* Processing Items Table using Reusable ListCard */}
                    <ListCard title="รายการที่ดำเนินการ" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[18%]">รหัสเอกสาร</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[32%]">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">วันที่รับข้อมูล</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">สถานะ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {processingRecords.map((record: any) => (
                                    <ProcessingRow 
                                        key={record.id}
                                        id={record.id.split('-')[0].toUpperCase()}
                                        title={record.documentName}
                                        date="25/03/2026, 14:30"
                                        status={record.status === RopaStatus.Active ? "อนุมัติ" : "รอตรวจสอบ"}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <Pagination current={processingRecords.length} total={processingRecords.length} />
                    </ListCard>

                    {/* Draft Items Table using Reusable ListCard */}
                    <ListCard title="ฉบับร่าง" icon="edit_note">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[18%]">รหัสฉบับร่าง</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[42%]">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">บันทึกล่าสุด</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {draftRecords.map((record: any) => (
                                    <DraftRow 
                                        key={record.id}
                                        id={record.id.split('-')[0].toUpperCase()}
                                        title={record.documentName}
                                        date="16/03/2026, 09:15"
                                    />
                                ))}
                            </tbody>
                        </table>
                        <Pagination current={draftRecords.length} total={draftRecords.length} />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}

function ProcessingRow({ id, title, date, status }: any) {
    const canExport = status === "อนุมัติ";
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-[13px] font-medium text-secondary">{id}</td>
            <td className="py-7 text-[14.5px] font-bold text-[#1B1C1C] tracking-tight leading-snug">{title}</td>
            <td className="py-7 text-[13px] font-medium text-secondary">{date}</td>
            <td className="py-7">
                <div className="flex justify-center">
                    <StatusBadge status={status} />
                </div>
            </td>
            <td className="py-7">
                <div className="flex items-center justify-center gap-5">
                    <button className="bg-[#E5E7EB]/70 text-[#4B5563] px-5 py-2.5 rounded-lg text-[12.5px] font-black hover:bg-[#E5E7EB] transition-all hover:shadow-sm">
                        ดูเอกสาร
                    </button>
                    {canExport ? (
                        <ActionButton icon="download" label="Excel" color="black" />
                    ) : (
                        <ActionButton icon="edit" label="แก้ไข" color="red" />
                    )}
                </div>
            </td>
        </tr>
    );
}

function DraftRow({ id, title, date }: any) {
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-[13px] font-medium text-secondary">{id}</td>
            <td className="py-7 text-[14.5px] font-bold text-[#1B1C1C] tracking-tight leading-snug">{title}</td>
            <td className="py-7 text-[13px] font-medium text-secondary">{date}</td>
            <td className="py-7">
                <div className="flex items-center justify-center gap-8">
                    <ActionButton icon="edit" label="แก้ไข" color="red" />
                    <ActionButton icon="delete" label="ลบ" color="black" />
                </div>
            </td>
        </tr>
    );
}
