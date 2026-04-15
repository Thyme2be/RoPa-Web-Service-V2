"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import {
    SummaryCard,
    AdvancedFilterBar,
    StatusBadge,
    Pagination,
    ListCard,
} from "@/components/ropa/ListComponents";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus } from "@/types/enums";

const ITEMS_PER_PAGE = 5;

export default function ProcessorDocumentsPage() {
    const { records, stats, assignProcessor } = useRopa();
    const [processorName, setProcessorName] = useState("");
    const [documentTitle, setDocumentTitle] = useState("");
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [page, setPage] = useState(1);

    // Records that have been assigned to a processor
    const assignedRecords = records.filter(r => r.assignedProcessor);
    const paginated = assignedRecords.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    const totalPages = Math.ceil(assignedRecords.length / ITEMS_PER_PAGE);

    // Active records available to assign
    const activeRecords = records.filter(r => r.status === RopaStatus.Active && !r.assignedProcessor);

    const handleSubmit = () => {
        if (processorName && documentTitle) {
            // Find matching active record by document title or create a generic assignment
            const matchedRecord = activeRecords.find(r =>
                r.documentName.toLowerCase().includes(documentTitle.toLowerCase())
            ) || activeRecords[0];

            if (matchedRecord) {
                assignProcessor(matchedRecord.id, processorName, documentTitle);
            }
            setIsSuccessModalOpen(true);
        }
    };

    const handleClear = () => {
        setProcessorName("");
        setDocumentTitle("");
    };

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="เอกสารของผู้ประมวลผลข้อมูลส่วนบุคคล" hideSearch={true} />

                <div className="p-10 space-y-10">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryCard label="จำนวนเอกสารทั้งหมด" value={stats.total.toString()} accentColor="red" />
                        <SummaryCard label="มอบหมายงานแล้ว" value={stats.withProcessor.toString()} accentColor="teal" />
                    </div>

                    <AdvancedFilterBar initialTimeframe="30" />

                    {/* Assigned Work Table */}
                    <ListCard title="รายการที่มอบหมายงานให้กับผู้ประมวลผลข้อมูลส่วนบุคคล" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] w-[15%] uppercase">รหัสเอกสาร</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] w-[25%] uppercase">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">ผู้ประมวลผล</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">วันที่มอบหมาย</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginated.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{record.id}</td>
                                        <td className="py-7 text-[15.5px] font-extrabold text-[#1B1C1C] tracking-tight leading-snug">
                                            {record.documentName}
                                        </td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">
                                            {record.assignedProcessor?.name || "-"}
                                        </td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">
                                            {record.assignedProcessor?.assignedDate || "-"}
                                        </td>
                                        <td className="py-7">
                                            <div className="flex justify-center scale-110">
                                                <StatusBadge status={(record.assignedProcessor?.processorStatus || "รอดำเนินการ") as any} />
                                            </div>
                                        </td>
                                        <td className="py-7">
                                            <div className="flex items-center justify-center">
                                                <button className="bg-[#E5E2E1] text-[#1B1C1C] px-7 py-2.5 rounded-lg text-[13px] font-black hover:bg-[#D6D3D1] transition-all shadow-sm active:scale-95">
                                                    ดูเอกสาร
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-[#5F5E5E] text-[14px] font-medium">
                                            ยังไม่มีการมอบหมายงาน
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination current={page} total={totalPages} onChange={setPage} />
                    </ListCard>

                    {/* Assign New Work Form Section */}
                    <div className="space-y-6">
                        <h2 className="text-[22px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการ RoPA ที่ต้องการส่งให้ผู้ประมวลผลข้อมูลส่วนบุคคล
                        </h2>

                        <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E2E1]/40 border-l-[8px] border-l-[#ED393C] p-10 space-y-8">
                            <h3 className="text-[17.5px] font-black text-[#1B1C1C]">เอกสาร RoPA</h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-10">
                                    <label className="text-[15.5px] font-bold text-[#1B1C1C] min-w-[140px]">
                                        ชื่อ-นามสกุล
                                        <span className="text-[#ED393C] ml-1">*</span>
                                    </label>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={processorName}
                                            onChange={(e) => setProcessorName(e.target.value)}
                                            placeholder="โปรดระบุชื่อ - นามสกุล ของผู้ประมวลผลข้อมูลส่วนบุคคล"
                                            className="w-full h-14 bg-[#F6F3F2] rounded-xl px-7 text-[15px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-[#ED393C]/5 border border-transparent focus:border-[#ED393C]/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <label className="text-[15.5px] font-bold text-[#1B1C1C] min-w-[140px]">
                                        ชื่อเอกสาร
                                        <span className="text-[#ED393C] ml-1">*</span>
                                    </label>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={documentTitle}
                                            onChange={(e) => setDocumentTitle(e.target.value)}
                                            placeholder="โปรดระบุชื่อเอกสาร เช่น ข้อมูลลูกค้าและประวัติการสั่งซื้อ (ส่วนประมวลผลข้อมูล)"
                                            className="w-full h-14 bg-[#F6F3F2] rounded-xl px-7 text-[15px] font-medium outline-none focus:bg-white focus:ring-4 focus:ring-[#ED393C]/5 border border-transparent focus:border-[#ED393C]/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <button
                                onClick={handleClear}
                                className="px-6 h-[52px] text-[#5C403D] font-bold hover:text-[#ED393C] transition-all text-[16px] cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!processorName || !documentTitle}
                                className={`px-10 h-[52px] rounded-xl font-black text-[16px] leading-none transition-all shadow-xl shadow-red-900/20 active:scale-95 bg-logout-gradient text-white ${(!processorName || !documentTitle) ? "opacity-70 cursor-not-allowed shadow-none" : "hover:brightness-110"}`}
                            >
                                มอบหมายงาน RoPA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Assignment Success Modal */}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-[560px] rounded-[48px] shadow-2xl p-16 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <button
                                onClick={() => {
                                    setIsSuccessModalOpen(false);
                                    handleClear();
                                }}
                                className="absolute right-10 top-10 text-[#1B1C1C] hover:opacity-70 transition-opacity"
                            >
                                <span className="material-symbols-rounded text-[32px] font-light">close</span>
                            </button>

                            <div className="space-y-5 w-full">
                                <h2 className="text-[34px] font-headline font-black text-[#1B1C1C] tracking-tight leading-tight whitespace-nowrap">
                                    มอบหมายงาน RoPA เสร็จสิ้น
                                </h2>
                                <p className="text-[17px] font-bold text-[#5F5E5E] leading-relaxed max-w-[420px] mx-auto pb-4">
                                    โปรดตรวจสอบรายการ RoPA ที่ส่งให้ผู้ประมวลผลข้อมูลส่วนบุคคลทั้งหมด เพื่อเช็คความถูกต้องอีกครั้ง
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
