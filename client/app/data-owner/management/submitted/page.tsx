"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import { StatusBadge } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";

import { useOwner } from "@/context/OwnerContext";
import ConfirmModal from "@/components/ropa/ConfirmModal";
import toast from "react-hot-toast";

export default function RopaSubmittedPage() {
    const { sentRecords, sentMeta, sendBackToDpo, deleteRecord, refresh, fetchSentTable } = useOwner();

    const router = useRouter();

    // Action State
    const [sendBackConfirm, setSendBackConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        fetchSentTable(page, 3);
    }, [page, fetchSentTable]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("all");
        setCustomDate("");
        setSearchQuery("");
        setDebouncedSearch("");
        setPage(1);
    };

    const WAITING_REVIEW = "รอตรวจสอบ" as const;
    const WAIT_DO = "รอส่วนของ Data Owner แก้ไข" as const;
    const WAIT_DP = "รอส่วนของ Data Processor แก้ไข" as const;
    const DONE_DO = "Data Owner ดำเนินการเสร็จสิ้น" as const;
    const DONE_DP = "Data Processor ดำเนินการเสร็จสิ้น" as const;

    const getParticipantStatuses = (record: any) => {
        const uiStatus = record.ui_status;
        const hasDoOpenComment = !!record.has_do_open_comment;
        const hasDpOpenComment = !!record.has_dp_open_comment;

        // Primary source: explicit per-party open feedback flags from backend
        if (hasDoOpenComment || hasDpOpenComment) {
            return {
                doStatus: hasDoOpenComment ? WAIT_DO : DONE_DO,
                dpStatus: hasDpOpenComment ? WAIT_DP : DONE_DP,
            };
        }

        // Backward-compatible fallback when flags are not available yet
        if (uiStatus === "WAITING_DO_FIX") {
            return { doStatus: WAIT_DO, dpStatus: DONE_DP };
        }
        if (uiStatus === "WAITING_DP_FIX") {
            return { doStatus: DONE_DO, dpStatus: WAIT_DP };
        }

        // WAITING_REVIEW / COMPLETED / DO_DONE / DP_DONE -> show as role completion pair
        return { doStatus: DONE_DO, dpStatus: DONE_DP };
    };

    // ─── Filter Logic ────────────────────────────────────────────────────────
    const filteredRecords = sentRecords.filter(record => {
        const statuses = getParticipantStatuses(record);
        const doWaiting = statuses.doStatus === WAIT_DO;
        const dpWaiting = statuses.dpStatus === WAIT_DP;
        const doDone = statuses.doStatus === DONE_DO;
        const dpDone = statuses.dpStatus === DONE_DP;

        // Status Filter
        let matchStatus = true;
        if (statusFilter !== "all") {
            switch (statusFilter) {
                case "waiting_review":
                    matchStatus =
                        record.ui_status === "WAITING_REVIEW" &&
                        !record.reviewed_at &&
                        !record.has_do_open_comment &&
                        !record.has_dp_open_comment;
                    break;
                case "wait_owner": matchStatus = doWaiting; break;
                case "wait_processor": matchStatus = dpWaiting; break;
                case "done_all": matchStatus = doDone && dpDone; break;
                case "done_owner": matchStatus = doDone; break;
                case "done_processor": matchStatus = dpDone; break;
                default: matchStatus = false;
            }
        }

        // Date Filter
        let matchDate = true;
        if (dateFilter !== "all" && record.sent_at) {
            const rowDate = new Date(record.sent_at);
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
        } else if (dateFilter !== "all" && !record.sent_at) {
            matchDate = false;
        }

        let matchSearch = true;
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase().trim();
            matchSearch =
                (record.document_number?.toLowerCase() || "").includes(q) ||
                (record.title?.toLowerCase() || "").includes(q) ||
                (record.dpo_name?.toLowerCase() || "").includes(q) ||
                (record.ui_status_label?.toLowerCase() || "").includes(q) ||
                (statuses.doStatus.toLowerCase()).includes(q) ||
                (statuses.dpStatus.toLowerCase()).includes(q);
        }

        return matchStatus && matchDate && matchSearch;
    });

    const ITEMS_PER_PAGE = 3;
    const paginatedRecords = filteredRecords.slice(0, ITEMS_PER_PAGE); // Using records directly from context (first 3 or current page)
    const totalPages = Math.ceil(sentMeta.total / ITEMS_PER_PAGE);

    const handleSendBackToDpo = async (id: string) => {
        setIsSubmitting(true);
        try {
            await sendBackToDpo(id);
            setSendBackConfirm({ open: false, id: "" });
        } catch (error) {
            console.error("Failed to send back to DPO:", error);
            toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar
                    showBack={false}
                    backUrl="/data-owner/management"
                    pageTitle=" "
                    hideSearch={false}
                    searchQuery={searchQuery}
                    onSearchChange={(e: any) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล
                        </h1>
                    </div>

                    <DocumentFilterBar
                        statusValue={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                        statusOptions={[
                            { label: "ทั้งหมด", value: "all" },
                            { label: "รอตรวจสอบ", value: "waiting_review" },
                            { label: "รอส่วนของ Data Owner แก้ไข", value: "wait_owner" },
                            { label: "รอส่วนของ Data Processor แก้ไข", value: "wait_processor" },
                            { label: "ตรวจสอบเสร็จสิ้น", value: "done_all" },
                            { label: "Data Owner ดำเนินการเสร็จสิ้น", value: "done_owner" },
                            { label: "Data Processor ดำเนินการเสร็จสิ้น", value: "done_processor" }
                        ]}
                        dateValue={dateFilter}
                        onDateChange={(val) => { setDateFilter(val); setPage(1); }}
                        customDate={customDate}
                        onCustomDateChange={(val) => { setCustomDate(val); setPage(1); }}
                        onClear={handleClearFilters}
                    />

                    <DocumentListCard title="เอกสารที่ส่งให้กับเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" icon="assignment" iconColor="#FF9800" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[18%]" align="left" className="whitespace-nowrap !text-[12px]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[27%]" className="whitespace-nowrap !text-[12px]">ชื่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]" className="whitespace-nowrap !text-[12px]">วันที่ส่งข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]" className="whitespace-nowrap !text-[12px]">วันที่ตรวจสอบ</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip
                                    width="w-[15%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="สถานะ"
                                    tooltipText={
                                        <>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Processor</span> หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                                        </>
                                    }
                                />
                                <DocumentTableHeader width="w-[10%]" className="whitespace-nowrap !text-[12px]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedRecords.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={6} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารที่ส่งตรวจสอบ</span>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ) : (
                                    paginatedRecords.map((record) => (
                                        <DocumentTableRow key={record.document_id}>
                                            <DocumentTableCell align="left" className="pl-6">
                                                <div className="font-medium text-[#5F5E5E]">
                                                    {record.document_number} {record.title}
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">{record.dpo_name || "—"}</DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.sent_at ? new Date(record.sent_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.reviewed_at ? new Date(record.reviewed_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                {record.ui_status === "WAITING_REVIEW" &&
                                                !record.reviewed_at &&
                                                !record.has_do_open_comment &&
                                                !record.has_dp_open_comment ? (
                                                    <div className="flex justify-center">
                                                        <StatusBadge status={WAITING_REVIEW} />
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const statuses = getParticipantStatuses(record);
                                                        return (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <StatusBadge status={statuses.doStatus} />
                                                                <StatusBadge status={statuses.dpStatus} />
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    {(() => {
                                                        const statuses = getParticipantStatuses(record);
                                                        const bothDone = statuses.doStatus === DONE_DO && statuses.dpStatus === DONE_DP;
                                                        const hasBeenReviewedByDpo = !!record.reviewed_at;
                                                        const canSendBackToDpo = bothDone && hasBeenReviewedByDpo;

                                                        const sendTooltip = canSendBackToDpo
                                                            ? "ส่งการแก้ไขคืน DPO"
                                                            : !hasBeenReviewedByDpo
                                                                ? "ต้องรอ DPO ตรวจและส่งกลับมาก่อน"
                                                                : statuses.doStatus !== DONE_DO
                                                                    ? "กรุณาแก้ไขส่วนของ Data Owner ให้เสร็จก่อน"
                                                                    : "ต้องรอ Data Processor แก้ไขให้เสร็จก่อน";

                                                        return (
                                                            <>
                                                    <ActionIconWithTooltip
                                                        icon={record.ui_status === "WAITING_DO_FIX" ? "edit_square" : "visibility"}
                                                        tooltipText={record.ui_status === "WAITING_DO_FIX" ? "แก้ไขข้อมูลเอกสาร" : "ดูเอกสาร"}
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                        onClick={() => router.push(`/data-owner/management/form?id=${record.document_id}&mode=${record.ui_status === "WAITING_DO_FIX" ? "edit" : "view"}`)}
                                                    />
                                                        <ActionIconWithTooltip
                                                            icon="send"
                                                        disabled={!canSendBackToDpo}
                                                        tooltipText={sendTooltip}
                                                        buttonClassName={
                                                            canSendBackToDpo
                                                                ? "text-[#5F5E5E] hover:text-[#2C8C00]"
                                                                : "text-[#9CA3AF] cursor-not-allowed"
                                                        }
                                                        onClick={() => canSendBackToDpo && setSendBackConfirm({ open: true, id: record.document_id })}
                                                    />

                                                    {/* ปุ่มขอลบ: นำทางไปยังแถบทำลายในหน้าฟอร์ม */}
                                                    <ActionIconWithTooltip 
                                                        icon="cancel_schedule_send" 
                                                        tooltipText="ยื่นคำร้องขอทำลายเอกสารให้ DPO" 
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                                                        onClick={() => router.push(`/data-owner/management/form?id=${record.document_id}&mode=deletion`)}
                                                    />
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </DocumentTableCell>
                                        </DocumentTableRow>
                                    ))
                                )}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination
                            current={page}
                            totalPages={totalPages}
                            totalItems={sentMeta.total}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </DocumentListCard>
                </div>
            </main>

            <ConfirmModal
                isOpen={sendBackConfirm.open}
                isLoading={isSubmitting}
                title="ส่งการแก้ไขคืนให้ DPO"
                description="เอกสารนี้จะถูกส่งคืนให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบอีกครั้ง"
                confirmText="ยืนยันการส่ง"
                onConfirm={() => handleSendBackToDpo(sendBackConfirm.id)}
                onCancel={() => setSendBackConfirm({ open: false, id: "" })}
            />
        </div>
    );
}


