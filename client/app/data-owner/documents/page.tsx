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

export default function ProcessorDocumentsPage() {
    // Dynamic Stats from REAL Mock Data
    const totalDocs = mockOwnerRecords.length;
    const completedDocs = mockOwnerRecords.filter(r => r.status === RopaStatus.Active).length;

    // Table data
    const assignedRecords = mockOwnerRecords.slice(0, 3);

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="เอกสารของผู้ประมวลผลข้อมูลส่วนบุคคล" />

                <div className="p-10 space-y-10">
                    {/* Summary Stats connected to Mock Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryCard label="จำนวนเอกสารทั้งหมด" value={totalDocs.toString()} accentColor="red" />
                        <SummaryCard label="เอกสารฉบับสมบูรณ์" value={completedDocs.toString()} accentColor="teal" />
                    </div>

                    <AdvancedFilterBar initialTimeframe="30" />

                    {/* Assigned Work Table */}
                    <ListCard title="รายการที่มอบหมายงานให้กับผู้ประมวลผลข้อมูลส่วนบุคคล" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[15%]">รหัสเอกสาร</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[30%]">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">วันที่มอบหมาย</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">วันที่ได้รับ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">สถานะ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {assignedRecords.map((record, index) => (
                                    <ProcessorRow 
                                        key={record.id}
                                        id={record.id?.split('-')[0].toUpperCase() || "RP-2026"}
                                        title={record.documentName || "-"}
                                        assignedDate={index === 0 ? "26/03/2026, 16:30" : index === 1 ? "12/03/2026, 15:30" : "5/03/2026, 15:30"}
                                        receivedDate={index === 0 ? "30/03/2026, 14:30" : index === 1 ? "-" : "15/03/2026, 16:45"}
                                        status={index === 1 ? "ไม่เสร็จสมบูรณ์" : "เสร็จสมบูรณ์"}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <Pagination current={3} total={totalDocs} />
                    </ListCard>

                    {/* Assign New Work Form Section */}
                    <div className="space-y-6">
                        <h2 className="text-[22px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการ RoPA ที่ต้องการส่งให้ผู้ประมวลผลข้อมูลส่วนบุคคล
                        </h2>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40 border-l-[6px] border-l-[#ED393C] p-8 space-y-6">
                            <h3 className="text-[17px] font-black text-[#1B1C1C]">เอกสาร RoPA</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-8">
                                    <label className="text-[15px] font-bold text-[#1B1C1C] min-w-[120px]">ชื่อ-นามสกุล</label>
                                    <div className="flex-1">
                                        <input 
                                            type="text" 
                                            placeholder="โปรดระบุชื่อ - นามสกุล ของผู้ประมวลผลข้อมูลส่วนบุคคล"
                                            className="w-full h-12 bg-[#F6F3F2] rounded-xl px-6 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#ED393C]/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <label className="text-[15px] font-bold text-[#1B1C1C] min-w-[120px]">ชื่อเอกสาร</label>
                                    <div className="flex-1 flex gap-4">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                placeholder="โปรดระบุชื่อเอกสาร เช่น ข้อมูลลูกค้าและประวัติการสั่งซื้อ(ส่วนประมวลผลข้อมูล)"
                                                className="w-full h-12 bg-[#F6F3F2] rounded-xl px-6 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#ED393C]/10 transition-all"
                                            />
                                        </div>
                                        <button className="bg-logout-gradient text-white px-8 h-12 rounded-xl font-black text-[14px] shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95 whitespace-nowrap">
                                            เลือกรายการ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-10 pt-4">
                            <button className="text-[15px] font-bold text-[#5C403D] hover:text-[#DC2626] transition-colors">ยกเลิก</button>
                            <button className="bg-logout-gradient text-white px-10 py-4 rounded-xl font-black text-[15px] shadow-xl shadow-red-900/20 hover:brightness-110 transition-all active:scale-95">
                                มอบหมายงาน RoPA
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ProcessorRow({ id, title, assignedDate, receivedDate, status }: any) {
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-[13px] font-medium text-secondary">{id}</td>
            <td className="py-7 text-[14px] font-bold text-[#1B1C1C] tracking-tight leading-snug">{title}</td>
            <td className="py-7 text-[13px] font-medium text-secondary">{assignedDate}</td>
            <td className="py-7 text-[13px] font-medium text-secondary">{receivedDate}</td>
            <td className="py-7">
                <div className="flex justify-center">
                    <StatusBadge status={status} />
                </div>
            </td>
            <td className="py-7">
                <div className="flex items-center justify-center">
                    <button className="bg-[#E5E7EB]/70 text-[#4B5563] px-6 py-2 rounded-lg text-[12px] font-black hover:bg-[#E5E7EB] transition-all hover:shadow-sm">
                        ดูเอกสาร
                    </button>
                </div>
            </td>
        </tr>
    );
}
