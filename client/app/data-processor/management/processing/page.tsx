"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import { useRouter } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus } from "@/types/enums";
import { OwnerRecord } from "@/types/dataOwner";
import { cn } from "@/lib/utils";

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
    isOpen, title, description, confirmText, onConfirm, onCancel
}: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
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
                        className="flex-1 h-12 rounded-xl border border-[#E5E2E1] font-bold text-[#5C403D] hover:bg-[#F6F3F2] transition-all"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-[#00666E] text-white font-black shadow-lg shadow-[#00666E]/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ done, label }: { done: boolean; label: string }) {
    return (
        <span className={cn(
            "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm",
            done
                ? "bg-[#107C41] text-white"
                : "bg-[#FFC107] text-[#5C403D]"
        )}>
            {label}
        </span>
    );
}

export default function ManagementProcessingPage() {
    const router = useRouter();
    const { records, processorRecords, submitDpSection } = useRopa();
    const [page, setPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);

    const [submitConfirm, setSubmitConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("7days");
    const [customDate, setCustomDate] = useState("");

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("7days");
        setCustomDate("");
    };

    const assignedRecords = records.filter(r => r.assignedProcessor);
    const draftRecords = processorRecords.filter(r => r.status === RopaStatus.Draft);

    const filteredAssigned = assignedRecords.filter(record => {
        let matchStatus = true;
        const dpStatus = record.processingStatus?.dpStatus;
        if (statusFilter === "wait_processor") matchStatus = dpStatus !== "done";
        if (statusFilter === "done_processor") matchStatus = dpStatus === "done";
        return matchStatus;
    });

    const handleSubmitToDO = (id: string) => {
        submitDpSection(id);
        setSubmitConfirm({ open: false, id: "" });
    };

    const getDoLabel = (r: OwnerRecord) =>
        r.processingStatus?.doStatus === "done" ? "Data Owner ดำเนินการเสร็จสิ้น" : "รอส่วนของ Data Owner";

    const getDpLabel = (r: OwnerRecord) =>
        r.processingStatus?.dpStatus === "done" ? "Data Processor ดำเนินการเสร็จสิ้น" : "รอส่วนของ Data Processor";

    const ITEMS_PER_PAGE = 3;
    const paginatedProcessing = filteredAssigned.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const paginatedDrafts = draftRecords.slice((draftPage - 1) * ITEMS_PER_PAGE, draftPage * ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar showBack={false} backUrl="/data-processor/management" pageTitle=" " hideSearch={true} isProcessor={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ได้รับมอบหมายจากผู้รับผิดชอบข้อมูล
                        </h1>
                    </div>

                    <DocumentFilterBar
                        statusValue={statusFilter}
                        onStatusChange={setStatusFilter}
                        dateValue={dateFilter}
                        onDateChange={setDateFilter}
                        customDate={customDate}
                        onCustomDateChange={setCustomDate}
                        onClear={handleClearFilters}
                    />

                    <ListCard title="เอกสารที่ได้รับมอบหมาย" icon="assignment" iconColor="#00666E" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[25%] text-center">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อผู้รับผิดชอบข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[12%]">วันที่ได้รับ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[13%]">วันที่กำหนดส่ง</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip
                                    width="w-[18%]"
                                    title="สถานะ"
                                    tooltipText={
                                        <div className="space-y-1">
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Processor</span> หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
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
                                            <DocumentTableCell align="left" className="pl-6 font-medium">
                                                {record.id} {record.documentName}
                                            </DocumentTableCell>
                                            <DocumentTableCell>{record.title}{record.firstName} {record.lastName}</DocumentTableCell>
                                            <DocumentTableCell className="text-[#1B1C1C]">{record.assignedProcessor?.assignedDate || "—"}</DocumentTableCell>
                                            <DocumentTableCell className="text-[#1B1C1C]">{record.dueDate || "—"}</DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex flex-col items-center gap-1 py-1">
                                                    <StatusBadge done={record.processingStatus?.doStatus === "done"} label={getDoLabel(record)} />
                                                    <StatusBadge done={record.processingStatus?.dpStatus === "done"} label={getDpLabel(record)} />
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
                                                    <ActionIconWithTooltip
                                                        icon="send"
                                                        tooltipText="ส่งให้ผู้รับผิดชอบข้อมูลตรวจสอบ"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                                                        onClick={() => setSubmitConfirm({ open: true, id: record.id })}
                                                    />
                                                </div>
                                            </DocumentTableCell>
                                        </DocumentTableRow>
                                    ))
                                )}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination
                            current={page}
                            totalPages={Math.max(1, Math.ceil(filteredAssigned.length / ITEMS_PER_PAGE))}
                            totalItems={filteredAssigned.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </ListCard>

                    <ListCard title="ฉบับร่าง" icon="edit_note" iconColor="#5C403D" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[50%] text-center">ชื่อเอกสาร</DocumentTableHeader>
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
                                            <DocumentTableCell align="left" className="pl-6 font-medium">
                                                {record.id} {record.documentName}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5F5E5E] font-medium">
                                                {record.lastUpdated || "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-4">
                                                    <ActionIconWithTooltip
                                                        icon="edit"
                                                        tooltipText="แก้ไขฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                                                        onClick={() => router.push(`/data-processor/management/form?id=${record.ropaId}`)}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="delete"
                                                        tooltipText="ลบฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                                                        onClick={() => { }}
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
                            totalPages={Math.max(1, Math.ceil(draftRecords.length / ITEMS_PER_PAGE))}
                            totalItems={draftRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setDraftPage}
                        />
                    </ListCard>
                </div>
            </main>

            <ConfirmModal
                isOpen={submitConfirm.open}
                title="ส่งให้ผู้รับผิดชอบข้อมูลตรวจสอบ"
                description="เอกสารนี้จะถูกส่งคืนให้ Data Owner เพื่อตรวจสอบความถูกต้องของข้อมูล"
                confirmText="ยืนยันการส่ง"
                onConfirm={() => handleSubmitToDO(submitConfirm.id)}
                onCancel={() => setSubmitConfirm({ open: false, id: "" })}
            />
        </div>
    );
}
