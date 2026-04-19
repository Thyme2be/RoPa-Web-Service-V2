"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import {
    AdvancedFilterBar,
    StatusBadge,
    Pagination,
    ListCard
} from "@/components/ropa/ListComponents";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus } from "@/types/enums";
import { OwnerRecord } from "@/types/dataOwner";

export default function RopaReviewPage() {
    const { records, updateStatus, getByStatus, stats } = useRopa();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Partial<OwnerRecord> | null>(null);
    const [auditorName, setAuditorName] = useState("");
    const [modalPage, setModalPage] = useState(1);
    const [reviewPage, setReviewPage] = useState(1);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const activeRecords = getByStatus(RopaStatus.Active);
    const submittedRecords = getByStatus(RopaStatus.Submitted);
    const itemsPerPage = 3;
    const paginatedModalRecords = activeRecords.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);
    const totalModalPages = Math.ceil(activeRecords.length / itemsPerPage);
    const REVIEW_PER_PAGE = 5;
    const paginatedSubmitted = submittedRecords.slice(
        (reviewPage - 1) * REVIEW_PER_PAGE,
        reviewPage * REVIEW_PER_PAGE
    );
    const totalReviewPages = Math.ceil(submittedRecords.length / REVIEW_PER_PAGE);

    const handleSelect = (doc: Partial<OwnerRecord>) => {
        setSelectedDoc(doc);
        setIsModalOpen(false);
    };

    const handleSubmit = () => {
        if (selectedDoc?.id) {
            updateStatus(selectedDoc.id, RopaStatus.Submitted);
            setIsSuccessModalOpen(true);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar pageTitle="ตรวจสอบรายการ RoPA" hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-headline font-black text-[#1B1C1C] tracking-tight text-left">
                            รายการ RoPA ที่ส่งให้ผู้ตรวจสอบทั้งหมด
                        </h1>
                    </div>

                    <AdvancedFilterBar />

                    {/* Review Status Table — shows Submitted records */}
                    <ListCard title="รายการที่ส่งให้ผู้ตรวจสอบ" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[20%] uppercase">รหัสเอกสาร</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[40%]">ชื่อรายการ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D]">วันที่ส่งข้อมูล</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D]">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginatedSubmitted.map(r => (
                                    <ReviewRow
                                        key={r.id}
                                        id={r.id}
                                        title={r.documentName}
                                        date={r.submittedDate || r.updatedDate || r.dateCreated || "-"}
                                        status="กำลังตรวจสอบ"
                                    />
                                ))}
                                {paginatedSubmitted.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-[#5F5E5E] text-sm font-medium">
                                            ยังไม่มีรายการที่ส่งให้ผู้ตรวจสอบ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination current={reviewPage} total={totalReviewPages} onChange={setReviewPage} />
                    </ListCard>

                    {/* Submit to Reviewer Section */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-headline font-black text-[#5C403D] tracking-tight">
                            รายการ RoPA ที่ต้องการส่งให้ผู้ตรวจสอบ
                        </h2>

                        <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E2E1]/40 border-l-[8px] border-l-[#ED393C] p-10 flex items-center justify-between gap-10">
                            <div className="flex items-center gap-10 flex-1">
                                <label className="text-lg font-black text-[#1B1C1C] min-w-[140px]">เอกสาร RoPA</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <input
                                        type="text"
                                        value={auditorName || (selectedDoc ? `${selectedDoc.id} - ${selectedDoc.documentName}` : "")}
                                        onChange={(e) => setAuditorName(e.target.value)}
                                        placeholder="โปรดระบุชื่อ - นามสกุล ของผู้ตรวจสอบ"
                                        className="w-full h-16 bg-[#F6F3F2] rounded-xl px-7 text-base font-bold text-[#1B1C1C] outline-none border border-transparent focus:bg-white focus:border-[#ED393C]/20 focus:ring-4 focus:ring-[#ED393C]/5 transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#ED393C] text-white px-10 h-14 rounded-xl font-black text-base shadow-lg shadow-[#ED393C]/20 hover:brightness-110 hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
                            >
                                เลือกรายการ
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4">
                            <button
                                onClick={() => {
                                    setSelectedDoc(null);
                                    setAuditorName("");
                                }}
                                className="px-6 h-[52px] text-[#5C403D] font-bold hover:text-[#ED393C] transition-all text-base cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedDoc}
                                className={`px-10 h-[52px] rounded-xl font-black text-base leading-none transition-all shadow-xl shadow-red-900/20 active:scale-95 bg-logout-gradient text-white ${!selectedDoc ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                                    }`}
                            >
                                ส่ง RoPA ให้ผู้ตรวจสอบ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Selection Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-4xl rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-[#E5E2E1]/40">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 flex items-center justify-center">
                                        <span className="material-symbols-rounded text-[#0D9488] text-2xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-headline font-black text-[#1B1C1C] tracking-tight">
                                        รายการที่ต้องการส่งเฉพาะฉบับที่เสร็จสมบูรณ์
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <span className="material-symbols-rounded text-[#5F5E5E] text-2xl">close</span>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#E5E2E1]/20">
                                                <th className="pb-6 text-sm font-black text-[#5C403D]">รหัสเอกสาร</th>
                                                <th className="pb-6 text-sm font-black text-[#5C403D] text-left px-4">ชื่อรายการ</th>
                                                <th className="pb-6 text-sm font-black text-[#5C403D]">วันที่สร้าง</th>
                                                <th className="pb-6 text-sm font-black text-[#5C403D]">การดำเนินการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E2E1]/10">
                                            {paginatedModalRecords.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="py-6 text-sm font-medium text-secondary">{doc.id}</td>
                                                    <td className="py-6 text-base font-bold text-[#1B1C1C] text-left px-4 group-hover:text-[#ED393C] transition-colors">{doc.documentName}</td>
                                                    <td className="py-6 text-sm font-medium text-secondary">{doc.dateCreated}</td>
                                                    <td className="py-6">
                                                        <button
                                                            onClick={() => handleSelect(doc)}
                                                            className="bg-[#E5E2E1] text-[#1B1C1C] px-6 py-2.5 rounded-lg font-black text-sm hover:bg-[#D6D3D1] transition-all shadow-sm active:scale-95"
                                                        >
                                                            เลือกเอกสาร
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Modal Pagination */}
                                <div className="mt-10 flex items-center justify-between border-t border-[#E5E2E1]/20 pt-8 px-2">
                                    <div className="text-sm font-medium text-secondary">
                                        แสดง {(modalPage - 1) * itemsPerPage + 1} ถึง {Math.min(modalPage * itemsPerPage, activeRecords.length)} จากทั้งหมด {activeRecords.length} รายการ
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setModalPage(p => Math.max(1, p - 1))}
                                            className="w-9 h-9 flex items-center justify-center text-[#A8A29E] bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="material-symbols-rounded text-2xl">chevron_left</span>
                                        </button>
                                        {[...Array(totalModalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setModalPage(i + 1)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${modalPage === i + 1
                                                    ? "bg-[#ED393C] text-white shadow-lg shadow-[#ED393C]/20 hover:-translate-y-0.5"
                                                    : "border border-[#E5E2E1] hover:bg-gray-50 text-[#5F5E5E]"
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setModalPage(p => Math.min(totalModalPages, p + 1))}
                                            className="w-9 h-9 flex items-center justify-center text-[#5F5E5E] bg-gray-50 rounded-lg hover:bg-[#ED393C] hover:text-white transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-rounded text-2xl">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl p-16 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="absolute right-10 top-10 text-[#1B1C1C] hover:opacity-70 transition-opacity"
                            >
                                <span className="material-symbols-rounded text-4xl font-light">close</span>
                            </button>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-headline font-black text-[#1B1C1C] tracking-tight leading-tight">
                                    ส่งรายการ RoPA เสร็จสิ้น
                                </h2>
                                <p className="text-xl font-bold text-[#5F5E5E] leading-relaxed max-w-[440px] mx-auto">
                                    โปรดตรวจสอบรายการ RoPA ที่ส่งให้ผู้ตรวจสอบ ทั้งหมด เพื่อเช็คความถูกต้องอีกครั้ง
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function ReviewRow({ id, title, date, status }: any) {
    return (
        <tr className="hover:bg-gray-50/50 transition-all group border-b border-[#E5E2E1]/20">
            <td className="py-7 text-sm font-medium text-secondary uppercase">{id}</td>
            <td className="py-7 text-base font-extrabold text-[#1B1C1C] tracking-tight leading-snug group-hover:text-[#ED393C] transition-colors">{title}</td>
            <td className="py-7 text-sm font-medium text-secondary">{date}</td>
            <td className="py-7 flex justify-center">
                <div className="scale-110">
                    <StatusBadge status={status} />
                </div>
            </td>
        </tr>
    );
}

