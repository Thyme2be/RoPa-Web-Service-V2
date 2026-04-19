"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import CreateDocumentModal from "@/components/ropa/CreateDocumentModal";
import { useRouter } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { OwnerRecord, ActiveTableItem } from "@/types/dataOwner";
import { cn } from "@/lib/utils";
import { ropaService } from "@/services/ropaService";

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
                        className="flex-1 h-12 rounded-xl bg-logout-gradient text-white font-black shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all"
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
                ? "bg-[#107C41] text-white" // Vibrant Green matching the image
                : "bg-[#FFC107] text-[#5C403D]" // Solid Yellow matching the image
        )}>
            {label}
        </span>
    );
}

export default function ManagementProcessingPage() {
    const router = useRouter();
    const { activeRecords, ownerSnapshots, sendToDpo, requestDelete, refresh } = useRopa();
    const [page, setPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Confirm modals
    const [dpoConfirm, setDpoConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

    // Filter State
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("7days");
    const [customDate, setCustomDate] = useState("");

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("7days");
        setCustomDate("");
    };

    const handleCreateDocument = async (data: { name: string; company: string; dueDate: string }) => {
        setIsCreateModalOpen(false);
        try {
            const result = await ropaService.createDocument({
                title: data.name,
                processor_company: data.company,
                due_date: data.dueDate
            });

            if (result.document_id) {
                await refresh(); // Refresh dashboards and tables for all roles
                router.push(`/data-owner/management/form?id=${result.document_id}&mode=edit`);
            }
        } catch (error) {
            console.error("Failed to create document:", error);
            alert("เกิดข้อผิดพลาดในการสร้างเอกสาร กรุณาลองใหม่อีกครั้ง");
        }
    };

    // ─── Filter processing records ─────────────────────────────────────────────
    // Records in "processing" table are all active records (track status within table)
    const processingRecords = activeRecords;
    const draftRecords = ownerSnapshots;

    const filteredProcessing = processingRecords.filter(record => {
        let matchStatus = true;
        const do_code = record.owner_status?.code;
        const dp_code = record.processor_status?.code;

        if (statusFilter !== "all") {
            switch (statusFilter) {
                case "wait_owner": matchStatus = do_code !== "DO_DONE"; break;
                case "wait_processor": matchStatus = dp_code !== "DP_DONE"; break;
                case "done_owner": matchStatus = do_code === "DO_DONE"; break;
                case "done_processor": matchStatus = dp_code === "DP_DONE"; break;
                case "wait_all": matchStatus = do_code !== "DO_DONE" && dp_code !== "DP_DONE"; break;
                case "done_all": matchStatus = do_code === "DO_DONE" && dp_code === "DP_DONE"; break;
                default: matchStatus = true;
            }
        }

        // Date Filter
        let matchDate = true;
        if (dateFilter !== "all" && record.created_at) {
            const rowDate = new Date(record.created_at);
            const now = new Date();
            if (dateFilter === "7days") {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchDate = rowDate >= sevenDaysAgo;
            } else if (dateFilter === "30days") {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchDate = rowDate >= thirtyDaysAgo;
            } else if (dateFilter === "custom" && customDate) {
                matchDate = rowDate.toLocaleDateString() === new Date(customDate).toLocaleDateString();
            }
        }

        return matchStatus && matchDate;
    });

    // ─── Action Handlers ────────────────────────────────────────────────────────
    const handleSendToDpo = (id: string) => {
        sendToDpo(id);
        setDpoConfirm({ open: false, id: "" });
    };

    const handleRequestDelete = (id: string) => {
        requestDelete(id, "ยื่นคำร้องขอทำลายเอกสารจากหน้าตารางรายการ");
        setDeleteConfirm({ open: false, id: "" });
    };

    const getDoLabel = (r: ActiveTableItem) =>
        r.owner_status?.code === "DO_DONE" ? "ผู้รับผิดชอบข้อมูลดำเนินการเสร็จสิ้น" : "รอส่วนของผู้รับผิดชอบข้อมูล";

    const getDpLabel = (r: ActiveTableItem) =>
        r.processor_status?.code === "DP_DONE" ? "ผู้ประมวลผลข้อมูลส่วนบุคคลดำเนินการเสร็จสิ้น" : "รอส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล";

    const ITEMS_PER_PAGE = 5;
    const paginatedProcessing = filteredProcessing.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const paginatedDrafts = draftRecords.slice((draftPage - 1) * ITEMS_PER_PAGE, draftPage * ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ดำเนินการ
                        </h1>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-[#ED393C] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:brightness-110 transition-all shadow-md shadow-red-900/10"
                        >
                            <span className="material-symbols-rounded">add</span>
                            สร้างเอกสาร
                        </button>
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

                    {/* ─── Processing Table ─────────────────────────────────── */}
                    <DocumentListCard title="เอกสารที่ดำเนินการ" icon="check_circle" iconColor="#0D9488" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[16%]" className="whitespace-nowrap !text-[12px]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[16%]" className="whitespace-nowrap !text-[12px]">ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[16%]" className="whitespace-nowrap !text-[12px]">ชื่อบริษัท</DocumentTableHeader>
                                <DocumentTableHeader width="w-[12%]" className="whitespace-nowrap !text-[12px]">วันที่กำหนดส่ง</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip
                                    width="w-[28%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="สถานะ"
                                    tooltipText={
                                        <div className="space-y-1">
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Processor</span> หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                                        </div>
                                    }
                                />
                                <DocumentTableHeader width="w-[12%]" className="whitespace-nowrap !text-[12px]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedProcessing.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={6} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารที่ดำเนินการ</span>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ) : (
                                    paginatedProcessing.map((record) => (
                                        <DocumentTableRow key={record.document_id}>
                                            <DocumentTableCell align="left" className="pl-6">
                                                <div className="font-medium text-[#1B1C1C]">{record.title}</div>
                                                <div className="text-xs text-gray-400">ID: {record.document_number}</div>
                                            </DocumentTableCell>
                                            <DocumentTableCell align="left">
                                                <div className="text-[#1B1C1C]">{record.dp_name || "—"}</div>
                                            </DocumentTableCell>
                                            <DocumentTableCell align="left" className="text-[#1B1C1C]">{record.dp_company || "—"}</DocumentTableCell>
                                            <DocumentTableCell align="left" className="text-[#1B1C1C]">
                                                {record.due_date ? new Date(record.due_date).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex flex-col items-center gap-1 py-1">
                                                    <StatusBadge done={record.owner_status?.code === "DO_DONE"} label={getDoLabel(record)} />
                                                    <StatusBadge done={record.processor_status?.code === "DP_DONE"} label={getDpLabel(record)} />
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <ActionIconWithTooltip
                                                        icon="visibility"
                                                        tooltipText="ดูเอกสาร"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                        onClick={() => router.push(`/data-owner/management/form?id=${record.document_id}&mode=view`)}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="send"
                                                        tooltipText="ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                        onClick={() => setDpoConfirm({ open: true, id: record.document_id })}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="cancel_schedule_send"
                                                        tooltipText="ส่งคำขอลบให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                                                        onClick={() => setDeleteConfirm({ open: true, id: record.document_id })}
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
                            totalPages={Math.max(1, Math.ceil(filteredProcessing.length / ITEMS_PER_PAGE))}
                            totalItems={filteredProcessing.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </DocumentListCard>

                    {/* ─── Draft Table ──────────────────────────────────────── */}
                    <DocumentListCard title="ฉบับร่าง" icon="edit_note" iconColor="#5C403D" bodyClassName="p-0">
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
                                                <div className="text-[#1B1C1C]">{record.title}</div>
                                                <div className="text-xs text-gray-400">ID: {record.document_number}</div>
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5F5E5E] font-medium text-center">
                                                {record.created_at ? new Date(record.created_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-4">
                                                    <ActionIconWithTooltip
                                                        icon="edit"
                                                        tooltipText="แก้ไขฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                        onClick={() => router.push(`/data-owner/management/form?id=${record.document_id}&snapshot_id=${record.id}`)}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="delete"
                                                        tooltipText="ลบฉบับร่าง"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                                                        onClick={() => {
                                                            if (confirm("ต้องการลบฉบับร่างนี้ใช่หรือไม่?")) {
                                                                ropaService.deleteOwnerSnapshot(record.id).then(() => refresh());
                                                            }
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
                            totalPages={Math.max(1, Math.ceil(draftRecords.length / ITEMS_PER_PAGE))}
                            totalItems={draftRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setDraftPage}
                        />
                    </DocumentListCard>
                </div>

                <CreateDocumentModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateDocument}
                />
            </main>

            {/* ─── Confirm: ส่ง DPO ─────────────────────────────────────────── */}
            <ConfirmModal
                isOpen={dpoConfirm.open}
                title="ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                description="เอกสารนี้จะถูกส่งให้ DPO ตรวจสอบ และจะย้ายออกจากตารางเอกสารที่ดำเนินการ"
                confirmText="ยืนยันการส่ง"
                onConfirm={() => handleSendToDpo(dpoConfirm.id)}
                onCancel={() => setDpoConfirm({ open: false, id: "" })}
            />

            {/* ─── Confirm: ขอลบ ────────────────────────────────────────────── */}
            <ConfirmModal
                isOpen={deleteConfirm.open}
                title="ส่งคำขอลบให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                description="คำขอลบจะถูกส่งให้ DPO พิจารณา เอกสารจะย้ายไปอยู่ในตารางเอกสารที่ส่งให้ DPO แล้ว"
                confirmText="ยืนยันการขอลบ"
                onConfirm={() => handleRequestDelete(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm({ open: false, id: "" })}
            />
        </div>
    );
}
