"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

import { useRopa } from "@/context/RopaContext";

export default function RopaApprovedPage() {
    const { approvedRecords: contextApprovedRecords } = useRopa();
    const router = useRouter();

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

    const filteredRecords = contextApprovedRecords.filter(record => {
        // Status Filter
        let matchStatus = true;
        if (statusFilter !== "all") {
            // In Approved table, everything is already finished
            const isDoneFilter = ["done", "done_all", "done_owner", "done_processor"].includes(statusFilter);
            matchStatus = isDoneFilter;
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
                matchDate = approvedDate.toLocaleDateString() === new Date(customDate).toLocaleDateString();
            }
        } else if (dateFilter !== "all" && !record.last_approved_at) {
            matchDate = false; // If filtering by date but no date available, hide it
        }

        return matchStatus && matchDate;
    });

    const ITEMS_PER_PAGE = 3;
    const paginatedRecords = filteredRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
                        statusValue={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                        statusOptions={[
                            { label: "ทั้งหมด", value: "all" },
                            { label: "รอดำเนินการ", value: "pending" },
                            { label: "รอส่วนของผู้รับผิดชอบข้อมูล", value: "wait_owner" },
                            { label: "รอส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล", value: "wait_processor" },
                            { label: "ผู้รับผิดชอบข้อมูลดำเนินการเสร็จสิ้น", value: "done_owner" },
                            { label: "ผู้ประมวลผลข้อมูลส่วนบุคคลดำเนินการเสร็จสิ้น", value: "done_processor" },
                            { label: "ตรวจสอบเสร็จสิ้น", value: "done" }
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
                                    width="w-[14%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="ชื่อ DO"
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>}
                                />
                                <DocumentTableHeaderWithTooltip
                                    width="w-[16%]"
                                    className="whitespace-nowrap !text-[12px]"
                                    title="ชื่อ DPO"
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Protection Officer</span> หมายถึง<br />เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</p>}
                                />
                                <DocumentTableHeader width="w-[12%]" className="whitespace-nowrap !text-[12px]">วันที่อนุมัติ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[14%]" className="whitespace-nowrap !text-[12px]">วันครบกำหนดทำลาย</DocumentTableHeader>
                                <DocumentTableHeader width="w-[14%]" className="whitespace-nowrap !text-[12px]">ตรวจสอบรายปี</DocumentTableHeader>
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
                                                {record.last_approved_at ? new Date(record.last_approved_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell className="text-[#5C403D] font-medium">
                                                {record.destruction_date ? new Date(record.destruction_date).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <span className={`px-3 py-1 rounded-[4px] text-[10px] font-bold text-white whitespace-nowrap ${record.annual_review_status === "REVIEWED" ? "bg-[#2C8C00]" : "bg-[#FF9800]"}`}>
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
        </div>
    );
}


