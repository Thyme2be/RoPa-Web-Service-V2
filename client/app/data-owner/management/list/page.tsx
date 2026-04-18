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
    ActionButton,
    RoPaStatusType
} from "@/components/ropa/ListComponents";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus } from "@/types/enums";
import { OwnerRecord } from "@/types/dataOwner";
import { useRouter } from "next/navigation";

const PROCESSING_SIZE = 3;
const DRAFT_SIZE = 2;

const parseDateStr = (dateStr: string | undefined | null) => {
    if (!dateStr || dateStr === "-") return 0;
    try {
        const [datePart, timePart] = dateStr.split(", ");
        const [d, m, y] = datePart.split("/").map(Number);
        if (timePart) {
            const [h, min] = timePart.split(":").map(Number);
            return new Date(y, m - 1, d, h, min).getTime();
        }
        return new Date(y, m - 1, d).getTime();
    } catch (e) {
        return 0;
    }
};

export default function RopaListPage() {
    const { records, deleteRecord, stats } = useRopa();
    const router = useRouter();
    const [processingPage, setProcessingPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Sort by latest date first
    const sortedRecords = [...records].sort((a, b) => {
        const dateA = Math.max(parseDateStr(a.updatedDate), parseDateStr(a.dateCreated));
        const dateB = Math.max(parseDateStr(b.updatedDate), parseDateStr(b.dateCreated));
        return dateB - dateA;
    });

    const processingRecords = sortedRecords.filter(r => r.status && r.status !== RopaStatus.Draft);
    const draftRecords = sortedRecords.filter(r => r.status === RopaStatus.Draft);

    // Paginated slices
    const paginatedProcessing = processingRecords.slice(
        (processingPage - 1) * PROCESSING_SIZE,
        processingPage * PROCESSING_SIZE
    );
    const paginatedDrafts = draftRecords.slice(
        (draftPage - 1) * DRAFT_SIZE,
        draftPage * DRAFT_SIZE
    );

    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteRecord(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar pageTitle="รายการ RoPA ที่บันทึกไว้" hideSearch={true} />

                <div className="p-10 space-y-10">
                    {/* Dynamic Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard label="จำนวนเอกสารทั้งหมด" value={stats.total.toString()} accentColor="red" />
                        <SummaryCard label="เอกสารฉบับสมบูรณ์" value={stats.active.toString()} accentColor="teal" />
                        <SummaryCard label="บันทึกฉบับร่าง" value={stats.draft.toString()} accentColor="gray" />
                    </div>

                    <AdvancedFilterBar />

                    {/* Processing Items Table */}
                    <ListCard title="รายการที่ดำเนินการ" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[18%] uppercase">รหัสเอกสาร</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[32%] uppercase">ชื่อรายการ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">วันที่รับข้อมูล</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginatedProcessing.map((record) => (
                                    <ProcessingRow
                                        key={record.id}
                                        record={record}
                                        onView={() => router.push(`/data-owner/management/form?id=${record.id}&mode=view`)}
                                        onEdit={() => router.push(`/data-owner/management/form?id=${record.id}`)}
                                    />
                                ))}
                                {paginatedProcessing.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-[#5F5E5E] text-sm font-medium">
                                            ไม่มีรายการที่ดำเนินการ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            current={processingPage}
                            total={Math.ceil(processingRecords.length / PROCESSING_SIZE)}
                            onChange={setProcessingPage}
                        />
                    </ListCard>

                    {/* Draft Items Table */}
                    <ListCard title="ฉบับร่าง" icon="edit_note">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[18%] uppercase">รหัสฉบับร่าง</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] w-[42%] uppercase">ชื่อรายการ</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">บันทึกล่าสุด</th>
                                    <th className="py-5 text-xs font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginatedDrafts.map((record) => (
                                    <DraftRow
                                        key={record.id}
                                        record={record}
                                        onEdit={() => router.push(`/data-owner/management/form?id=${record.id}`)}
                                        onDelete={() => handleDelete(record.id)}
                                    />
                                ))}
                                {paginatedDrafts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-[#5F5E5E] text-sm font-medium">
                                            ไม่มีฉบับร่าง
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            current={draftPage}
                            total={Math.ceil(draftRecords.length / DRAFT_SIZE)}
                            onChange={setDraftPage}
                        />
                    </ListCard>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-rounded text-[#ED393C] text-4xl">delete</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-headline font-black text-[#1B1C1C]">ลบฉบับร่าง?</h3>
                            <p className="text-base font-medium text-[#5F5E5E]">
                                ข้อมูลที่บันทึกไว้จะถูกลบออกอย่างถาวร และไม่สามารถกู้คืนได้
                            </p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 h-[48px] rounded-xl font-bold text-base text-[#5C403D] border-2 border-[#E5E2E1] hover:bg-[#F6F3F2] transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 h-[48px] rounded-xl font-black text-base text-white bg-[#ED393C] hover:brightness-110 transition-all shadow-lg shadow-red-900/20"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function statusLabel(status: RopaStatus | undefined): RoPaStatusType {
    switch (status) {
        case RopaStatus.Active: return "อนุมัติ";
        case RopaStatus.Submitted: return "รอตรวจสอบ";
        case RopaStatus.Rejected: return "ต้องแก้ไข";
        default: return "ฉบับร่าง";
    }
}

function ProcessingRow({ record, onView, onEdit }: { record: OwnerRecord; onView: () => void; onEdit: () => void }) {
    const isActive = record.status === RopaStatus.Active;
    const label = statusLabel(record.status);
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-sm font-medium text-secondary">{record.id}</td>
            <td className="py-7 text-base font-bold text-[#1B1C1C] tracking-tight leading-snug">{record.documentName}</td>
            <td className="py-7 text-sm font-medium text-secondary">{record.dateCreated || "-"}</td>
            <td className="py-7">
                <div className="flex justify-center">
                    <StatusBadge status={label} />
                </div>
            </td>
            <td className="py-7">
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={onView}
                        className="bg-[#E5E7EB]/50 text-[#5F5E5E] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E5E7EB] transition-all"
                    >
                        ดูเอกสาร
                    </button>
                    {isActive ? (
                        <ActionButton icon="download" label="Excel" color="gray" disabled />
                    ) : (
                        <ActionButton icon="edit" label="แก้ไข" color="red" onClick={onEdit} />
                    )}
                </div>
            </td>
        </tr>
    );
}

function DraftRow({ record, onEdit, onDelete }: { record: OwnerRecord; onEdit: () => void; onDelete: () => void }) {
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-sm font-medium text-secondary">{record.id}</td>
            <td className="py-7 text-base font-bold text-[#1B1C1C] tracking-tight leading-snug">{record.documentName}</td>
            <td className="py-7 text-sm font-medium text-secondary">{record.updatedDate || record.dateCreated || "-"}</td>
            <td className="py-7">
                <div className="flex items-center justify-center gap-6">
                    <ActionButton icon="edit" label="แก้ไข" color="red" onClick={onEdit} />
                    <ActionButton icon="delete" label="ลบ" color="black" onClick={onDelete} />
                </div>
            </td>
        </tr>
    );
}


