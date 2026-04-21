"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import { useRouter } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { OwnerRecord } from "@/types/dataOwner";
import { cn } from "@/lib/utils";
import SendToOwnerModal from "@/components/ui/SendToOwnerModal";


// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
    isOpen, title, description, confirmText, onConfirm, onCancel, isLoading = false
}: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <h2 className="text-[22px] font-black text-[#1B1C1C] mb-3">{title}</h2>
                <p className="text-sm font-bold text-[#5F5E5E] mb-8">{description}</p>
                <div className="flex gap-4 w-full">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl border border-[#E5E2E1] font-bold text-[#5C403D] hover:bg-[#F6F3F2] transition-all disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl bg-[#B51E22] text-white font-black shadow-lg shadow-[#B51E22]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function LocalStatusBadge({ code, label }: { code: string; label: string }) {
    const styles: Record<string, string> = {
        "CHECK_DONE": "bg-[#107C41] text-white",         // Green
        "WAITING_CHECK": "bg-[#FFC107] text-[#5C403D]",  // Yellow
        "DP_NEED_FIX": "bg-[#ED393C] text-white",       // Red
        "WAITING_DP": "bg-[#FFC107] text-[#5C403D]",    // Yellow
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm",
            styles[code] || "bg-[#9CA3AF] text-white"
        )}>
            {label}
        </span>
    );
}

export default function ManagementProcessingPage() {
    const router = useRouter();
    const { records, processorRecords, processorSnapshots, deleteProcessorRecord, dispatchDpSection } = useRopa();
    const [page, setPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);

    const [submitConfirm, setSubmitConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
    const [deleteDraftConfirm, setDeleteDraftConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitToDO = async (id: string) => {
        setIsSubmitting(true);
        try {
            await dispatchDpSection(id);
            setSubmitConfirm({ open: false, id: "" });
        } catch (error) {
            console.error("Failed to submit to DO:", error);
            alert("เกิดข้อผิดพลาดในการส่งให้เจ้าของข้อมูล");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("7days");
    const [customDate, setCustomDate] = useState("");

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("7days");
        setCustomDate("");
    };

    const assignedRecords = records.filter(r => r.assigned_processor);
    const draftRecords = processorSnapshots;

    const filteredAssigned = assignedRecords.filter(record => {
        // Status Filter
        if (statusFilter !== "all" && record.processor_status?.code !== statusFilter) {
            return false;
        }

        // Date Filter (Due Date)
        if (dateFilter !== "all" && record.due_date) {
            const dueDate = new Date(record.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (dateFilter === "7days") {
                if (diffDays > 7) return false;
            } else if (dateFilter === "30days") {
                if (diffDays > 30) return false;
            } else if (dateFilter === "overdue") {
                if (dueDate >= today) return false;
            } else if (dateFilter === "custom" && customDate) {
                const cDate = new Date(customDate);
                cDate.setHours(0, 0, 0, 0);
                const dDate = new Date(record.due_date);
                dDate.setHours(0, 0, 0, 0);
                if (cDate.getTime() !== dDate.getTime()) return false;
            }
        }

        return true;
    }).sort((a, b) => {
        // 1. Status Priority
        const statusPriority: Record<string, number> = {
            "DP_NEED_FIX": 1,
            "WAITING_DP": 2,
            "WAITING_CHECK": 3,
            "CHECK_DONE": 4
        };
        const pA = statusPriority[a.processor_status?.code || ""] || 99;
        const pB = statusPriority[b.processor_status?.code || ""] || 99;
        if (pA !== pB) return pA - pB;

        // 3. Due Date Urgency (Ascending - soonest first)
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (dateA !== dateB) return dateA - dateB;

        // 4. Recency (Descending - newest assignment first)
        const recA = a.assigned_processor?.assigned_date ? new Date(a.assigned_processor.assigned_date).getTime() : 0;
        const recB = b.assigned_processor?.assigned_date ? new Date(b.assigned_processor.assigned_date).getTime() : 0;
        return recB - recA;
    });

    const PROCESSING_ITEMS_PER_PAGE = 3;
    const DRAFT_ITEMS_PER_PAGE = 2;
    const paginatedProcessing = filteredAssigned.slice((page - 1) * PROCESSING_ITEMS_PER_PAGE, page * PROCESSING_ITEMS_PER_PAGE);
    const paginatedDrafts = draftRecords.slice((draftPage - 1) * DRAFT_ITEMS_PER_PAGE, draftPage * DRAFT_ITEMS_PER_PAGE);

    const statusOptions = [
        { label: "ทั้งหมด", value: "all" },
        { label: "รอ Data Processor", value: "WAITING_DP" },
        { label: "รอตรวจสอบ", value: "WAITING_CHECK" },
        { label: "รอ Data Processor แก้ไข", value: "DP_NEED_FIX" },
        { label: "ตรวจสอบเสร็จสิ้น", value: "CHECK_DONE" }
    ];

    return (
        <div className="flex min-h-screen bg-[#F6F3F2]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar showBack={false} backUrl="/data-processor/management" pageTitle=" " hideSearch={true} isProcessor={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ได้รับมอบหมายจากผู้รับผิดชอบข้อมูล
                        </h1>
                    </div>

                    <DocumentFilterBar
                        statusOptions={statusOptions}
                        statusValue={statusFilter}
                        onStatusChange={setStatusFilter}
                        dateValue={dateFilter}
                        onDateChange={setDateFilter}
                        customDate={customDate}
                        onCustomDateChange={setCustomDate}
                        onClear={handleClearFilters}
                    />

                    <DocumentListCard title="เอกสารที่ได้รับมอบหมาย" icon="assignment" iconColor="#00666E" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[25%]" align="left" className="pl-6">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อผู้รับผิดชอบข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[12%]">วันที่ได้รับ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[13%]">วันที่กำหนดส่ง</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip
                                    width="w-[18%]"
                                    title="สถานะ"
                                    tooltipText={
                                        <div className="space-y-1">
                                            <p><span className="w-28 inline-block font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>
                                            <p><span className="w-28 inline-block font-bold text-[#1B1C1C]">Data Processor</span> หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                                        </div>
                                    }
                                />
                                <DocumentTableHeader width="w-[12%]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedProcessing.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={6} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารที่มอบหมาย</span>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ) : (
                                    paginatedProcessing.map((record) => (
                                        <DocumentTableRow key={record.id}>
                                            <DocumentTableCell align="left" className="pl-6">
                                                <div className="font-medium text-[#1B1C1C]">
                                                    {record.document_number} {record.title}
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.full_name || `${record.title_prefix}${record.first_name} ${record.last_name}`}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.assigned_processor?.assigned_date ? new Date(record.assigned_processor.assigned_date).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.due_date ? new Date(record.due_date).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex flex-col items-center gap-1 py-1">
                                                    <LocalStatusBadge 
                                                        code={record.processor_status?.code || "WAITING_DP"} 
                                                        label={record.processor_status?.label || "รอส่วนของ Data Processor"} 
                                                    />
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <ActionIconWithTooltip
                                                        icon="visibility"
                                                        tooltipText="ดูเอกสาร"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                                                        onClick={() => router.push(`/data-processor/management/form?id=${record.id}&mode=view`)}
                                                    />
                                                     {record.is_sent ? (
                                                        <div className="text-[#107C41] p-2">
                                                            <span className="material-icons text-[20px]">check_circle</span>
                                                        </div>
                                                    ) : (
                                                        <ActionIconWithTooltip
                                                            icon="send"
                                                            disabled={record.processor_status?.code === "WAITING_DP"}
                                                            tooltipText={record.processor_status?.code === "WAITING_DP" ? "ต้องไปกรอกเอกสารแล้วกดบันทึกก่อน" : "ส่งให้ผู้รับผิดชอบข้อมูลตรวจสอบ"}
                                                            buttonClassName={record.processor_status?.code === "WAITING_DP" ? "text-[#9CA3AF]" : "text-[#5F5E5E] hover:text-[#00666E]"}
                                                            onClick={() => setSubmitConfirm({ open: true, id: record.id })}
                                                        />
                                                    )}
                                                </div>
                                            </DocumentTableCell>
                                        </DocumentTableRow>
                                    ))
                                )}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination
                            current={page}
                            totalPages={Math.max(1, Math.ceil(filteredAssigned.length / PROCESSING_ITEMS_PER_PAGE))}
                            totalItems={filteredAssigned.length}
                            itemsPerPage={PROCESSING_ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </DocumentListCard>

                    <DocumentListCard title="ฉบับร่าง" icon="edit_note" iconColor="#5C403D" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[50%]" align="left" className="pl-6">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[25%]">บันทึกล่าสุด</DocumentTableHeader>
                                <DocumentTableHeader width="w-[25%]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedDrafts.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={3} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่มีฉบับร่าง</span>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ) : (
                                    paginatedDrafts.map((record) => (
                                        <DocumentTableRow key={record.id}>
                                            <DocumentTableCell align="left" className="pl-6">
                                                <div className="font-medium text-[#5F5E5E]">
                                                    {record.document_number || record.document_id} {record.title}
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.created_at ? new Date(record.created_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-4">
                                                    <ActionIconWithTooltip
                                                        icon="edit"
                                                        tooltipText="แก้ไขฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                                                        onClick={() => router.push(`/data-processor/management/form?id=${record.document_id}&snapshot_id=${record.id}`)}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="delete"
                                                        tooltipText="ลบฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                                                        onClick={() => {
                                                            setDeleteDraftConfirm({ open: true, id: record.id });
                                                        }}
                                                    />
                                                </div>
                                            </DocumentTableCell>
                                        </DocumentTableRow>
                                    ))
                                )}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination
                            current={draftPage}
                            totalPages={Math.max(1, Math.ceil(draftRecords.length / DRAFT_ITEMS_PER_PAGE))}
                            totalItems={draftRecords.length}
                            itemsPerPage={DRAFT_ITEMS_PER_PAGE}
                            onChange={setDraftPage}
                        />
                    </DocumentListCard>
                </div>
            </main>

            <SendToOwnerModal
                isOpen={submitConfirm.open}
                isLoading={isSubmitting}
                onConfirm={() => handleSubmitToDO(submitConfirm.id)}
                onClose={() => setSubmitConfirm({ open: false, id: "" })}
            />


            <ConfirmModal
                isOpen={deleteDraftConfirm.open}
                title="ลบฉบับร่าง"
                description="ต้องการลบฉบับร่างนี้ใช่หรือไม่? การลบจะไม่กระทบข้อมูลปัจจุบันในตารางหลัก"
                confirmText="ลบ"
                onConfirm={() => {
                    deleteProcessorRecord(deleteDraftConfirm.id);
                    setDeleteDraftConfirm({ open: false, id: "" });
                }}
                onCancel={() => setDeleteDraftConfirm({ open: false, id: "" })}
            />
        </div>
    );
}
