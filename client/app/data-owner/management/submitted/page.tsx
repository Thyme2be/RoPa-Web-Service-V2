"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

import { useRopa } from "@/context/RopaContext";
import ConfirmModal from "@/components/ropa/ConfirmModal";

export default function RopaSubmittedPage() {
    const { sentRecords, sendBackToDpo, refresh } = useRopa();

    useEffect(() => {
        refresh();
    }, [refresh]);
    const router = useRouter();
    
    // Action State
    const [sendBackConfirm, setSendBackConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("all");
        setCustomDate("");
        setPage(1);
    };

    // ─── Filter Logic ────────────────────────────────────────────────────────
    const filteredRecords = sentRecords.filter(record => {
        // Status Filter
        let matchStatus = true;
        if (statusFilter !== "all") {
            switch (statusFilter) {
                case "wait_all": matchStatus = record.ui_status === "WAITING_REVIEW"; break;
                case "wait_owner": matchStatus = record.ui_status === "WAITING_DO_FIX"; break;
                case "wait_processor": matchStatus = record.ui_status === "WAITING_DP_FIX"; break;
                case "done_all": matchStatus = record.ui_status === "COMPLETED"; break;
                case "done_owner": matchStatus = record.ui_status === "DO_DONE"; break;
                case "done_processor": matchStatus = record.ui_status === "DP_DONE"; break;
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

        return matchStatus && matchDate;
    });

    const ITEMS_PER_PAGE = 3;
    const paginatedRecords = filteredRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSendBackToDpo = async (id: string) => {
        setIsSubmitting(true);
        try {
            await sendBackToDpo(id);
            setSendBackConfirm({ open: false, id: "" });
        } catch (error) {
            console.error("Failed to send back to DPO:", error);
            alert("เกิดข้อผิดพลาดในการส่งคืน DPO");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "WAITING_REVIEW": return "bg-[#6B7280] text-white"; // Gray
            case "WAITING_DO_FIX": return "bg-[#FFC107] text-[#1B1C1C]"; // Yellow
            case "WAITING_DP_FIX": return "bg-[#FFC107] text-[#1B1C1C]"; // Yellow
            case "DO_DONE": return "bg-[#107C41] text-white"; // Green
            case "DP_DONE": return "bg-[#107C41] text-white"; // Green
            default: return "bg-[#E5E7EB] text-[#6B7280]";
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

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
                            { label: "รอดำเนินการ(รอทั้งหมด)", value: "wait_all" },
                            { label: "เสร็จสิ้นทั้งหมด(เสร็จสิ้นทั้งหมด)", value: "done_all" },
                            { label: "รอส่วนของผู้รับผิดชอบข้อมูล", value: "wait_owner" },
                            { label: "รอส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล", value: "wait_processor" },
                            { label: "ผู้รับผิดชอบข้อมูลดำเนินการเสร็จสิ้น", value: "done_owner" },
                            { label: "ผู้ประมวลผลข้อมูลส่วนบุคคลดำเนินการเสร็จสิ้น", value: "done_processor" }
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
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-3 py-1 rounded-[4px] text-[10px] font-bold min-w-[150px] text-center whitespace-nowrap ${getStatusColor(record.ui_status)}`}>
                                                        {record.ui_status_label}
                                                    </span>
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
                                                    {record.ui_status === "WAITING_DO_FIX" && (
                                                        <ActionIconWithTooltip 
                                                            icon="send" 
                                                            tooltipText="ส่งแก้ไขคืน DPO" 
                                                            buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                            onClick={() => setSendBackConfirm({ open: true, id: record.document_id })}
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
                            totalPages={Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE))}
                            totalItems={filteredRecords.length}
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


