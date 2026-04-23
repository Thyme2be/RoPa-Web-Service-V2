"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip, StatusBadge } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/utils";

import { useRopa } from "@/context/RopaContext";
import ConfirmModal from "@/components/ropa/ConfirmModal";

// ─── Formatting ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | undefined | null) {
    if (!dateStr || dateStr === "—") return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear(); // Use AD (2026) as per sketch yyyy
    return `${day}/${month}/${year}`;
}


export default function RopaApprovedPage() {
    const { approvedRecords: contextApprovedRecords, approvedMeta, fetchApprovedTable, requestDelete, annualReview, refresh } = useRopa();

    const [page, setPage] = useState(1);
    const router = useRouter();

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        fetchApprovedTable(page, 3);
    }, [page, fetchApprovedTable]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [annualFilter, setAnnualFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

    const handleRequestDelete = (id: string) => {
        router.push(`/data-owner/management/form?id=${id}&mode=deletion`);
    };

    const handleAnnualReview = async (id: string) => {
        if (confirm("ต้องการส่งเอกสารนี้ให้ DPO ตรวจสอบรอบปีใช่หรือไม่?")) {
            setIsSubmitting(true);
            try {
                await annualReview(id);
                alert("ส่งตรวจสอบรายปีสำเร็จ เอกสารถูกย้ายไปที่ตารางรอดำเนินการ (Submitted)");
            } catch (error) {
                console.error("Failed to submit annual review:", error);
                alert("เกิดข้อผิดพลาดในการส่งตรวจสอบรายปี");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleClearFilters = () => {
        setStatusFilter("all");
        setAnnualFilter("all");
        setDateFilter("all");
        setCustomDate("");
        setPage(1);
    };

    const filteredRecords = contextApprovedRecords.filter(record => {
        // Status Filter
        let matchStatus = true;
        if (statusFilter !== "all") {
            const isDoneFilter = ["done", "done_all", "done_owner", "done_processor"].includes(statusFilter);
            matchStatus = isDoneFilter;
        }

        // Annual Review Filter
        let matchAnnual = true;
        if (annualFilter !== "all") {
            matchAnnual = record.annual_review_status === annualFilter;
        }

        // Date Filter
        let matchDate = true;
        if (dateFilter !== "all" && record.last_approved_at) {
            const approvedDate = new Date(record.last_approved_at);
            const now = new Date();
            if (dateFilter === "7days") {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchDate = approvedDate >= sevenDaysAgo;
            } else if (dateFilter === "30days") {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchDate = approvedDate >= thirtyDaysAgo;
            } else if (dateFilter === "custom" && customDate) {
                const cDate = new Date(customDate);
                cDate.setHours(0, 0, 0, 0);
                const aDate = new Date(record.last_approved_at);
                aDate.setHours(0, 0, 0, 0);
                matchDate = cDate.getTime() === aDate.getTime();
            }
        } else if (dateFilter !== "all" && !record.last_approved_at) {
            matchDate = false;
        }

        return matchStatus && matchAnnual && matchDate;
    });

    const ITEMS_PER_PAGE = 3;
    const paginatedRecords = filteredRecords.slice(0, ITEMS_PER_PAGE);
    const totalPages = Math.ceil(approvedMeta.total / ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ได้รับการอนุมัติจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล
                        </h1>
                    </div>

                    <DocumentFilterBar
                        statusLabel="ตรวจสอบรายปี"
                        statusValue={annualFilter}
                        onStatusChange={(val) => { setAnnualFilter(val); setPage(1); }}
                        statusOptions={[
                            { label: "ทั้งหมด", value: "all" },
                            { label: "ตรวจสอบแล้ว", value: "REVIEWED" },
                            { label: "ยังไม่ได้ตรวจสอบ", value: "NOT_REVIEWED" },
                            { label: "อยู่ระหว่างตรวจสอบ", value: "PENDING" },
                        ]}
                        dateValue={dateFilter}
                        onDateChange={(val) => { setDateFilter(val); setPage(1); }}
                        customDate={customDate}
                        onCustomDateChange={(val) => { setCustomDate(val); setPage(1); }}
                        onClear={handleClearFilters}
                    />

                    <DocumentListCard title="เอกสารที่อนุมัติ" icon="task_alt" iconColor="#0D9488" bodyClassName="p-0">

                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[20%]" align="left" className="whitespace-nowrap !text-[12px] pl-6">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip
                                    width="w-[15%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="ชื่อ DO"
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>}
                                />
                                <DocumentTableHeaderWithTooltip
                                    width="w-[15%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="ชื่อ DPO"
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Protection Officer</span> หมายถึง<br />เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</p>}
                                />
                                <DocumentTableHeader width="w-[12%]" className="whitespace-nowrap !text-[12px]">วันที่อนุมัติ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]" className="whitespace-nowrap !text-[12px]">วันครบกำหนดทำลาย</DocumentTableHeader>
                                <DocumentTableHeader width="w-[13%]" className="whitespace-nowrap !text-[12px]">ตรวจสอบรายปี</DocumentTableHeader>
                                <DocumentTableHeader width="w-[10%]" className="whitespace-nowrap !text-[12px]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedRecords.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={7} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารที่ได้รับการอนุมัติ</span>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ) : (
                                    paginatedRecords.map((record) => (
                                        <DocumentTableRow key={record.document_id}>
                                            <DocumentTableCell align="left">
                                                <div className="font-medium text-[#5F5E5E]">
                                                    {record.document_number} {record.title}
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium whitespace-nowrap">{record.do_name || "—"}</DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium whitespace-nowrap">{record.dpo_name || "—"}</DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {formatDate(record.last_approved_at)}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {formatDate(record.destruction_date)}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <span className={`px-3 py-1 rounded-[4px] text-[10px] font-bold text-white whitespace-nowrap ${record.annual_review_status === "REVIEWED" ? "bg-[#2C8C00]" : (record.annual_review_status === "NOT_REVIEWED" ? "bg-[#ED393C]" : "bg-[#FF9800]")}`}>
                                                    {record.annual_review_status_label}
                                                </span>
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
                                                        icon="published_with_changes"
                                                        disabled={record.annual_review_status !== "NOT_REVIEWED" || isSubmitting}
                                                        tooltipText={record.annual_review_status === "NOT_REVIEWED" ? "ส่งทบทวนรายปี" : "ตรวจสอบรายปีแล้ว"}
                                                        buttonClassName={record.annual_review_status === "NOT_REVIEWED" ? "text-blue-600 hover:text-blue-800" : "text-gray-300 cursor-not-allowed"}
                                                        onClick={() => record.annual_review_status === "NOT_REVIEWED" && handleAnnualReview(record.document_id)}
                                                    />
                                                    <ActionIconWithTooltip
                                                        icon="cancel_schedule_send"
                                                        disabled={record.deletion_status === "DELETE_PENDING" || isSubmitting}
                                                        tooltipText={record.deletion_status === "DELETE_PENDING" ? "รอยื่นคำร้องขอทำลาย" : "ส่งคำขอลบให้ DPO"}
                                                        buttonClassName={record.deletion_status === "DELETE_PENDING" ? "text-amber-500 cursor-not-allowed" : "text-[#5F5E5E] hover:text-[#ED393C]"}
                                                        onClick={() => record.deletion_status !== "DELETE_PENDING" && handleRequestDelete(record.document_id)}
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
                            totalPages={Math.max(1, totalPages)}
                            totalItems={approvedMeta.total}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </DocumentListCard>
                </div>
            </main>
        </div>
    );
}
