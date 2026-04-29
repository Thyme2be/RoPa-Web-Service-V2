"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { DocumentListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import { StatusBadge } from "@/components/ropa/RopaListComponents";

import { useOwner } from "@/context/OwnerContext";

export default function RopaDestroyedPage() {
    const { destroyedRecords: contextDestroyedRecords, destroyedMeta, fetchDestroyedTable, refresh } = useOwner();

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");
    const router = useRouter();

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        fetchDestroyedTable(page, 3, statusFilter, dateFilter, customDate);
    }, [page, statusFilter, dateFilter, customDate, fetchDestroyedTable]);

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("all");
        setCustomDate("");
        setPage(1);
    };

    const ITEMS_PER_PAGE = 3;
    const paginatedRecords = contextDestroyedRecords;
    const totalPages = Math.ceil(destroyedMeta.total / ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ถูกทำลาย
                        </h1>
                    </div>

                    <DocumentFilterBar
                        statusValue={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
                        statusOptions={[
                            { label: "ทั้งหมด", value: "all" },
                            { label: "รอตรวจสอบการทำลาย", value: "pending_destruction" },
                            { label: "ทำลายเสร็จสิ้น", value: "destroyed" }
                        ]}
                        dateValue={dateFilter}
                        onDateChange={(val) => { setDateFilter(val); setPage(1); }}
                        customDate={customDate}
                        onCustomDateChange={(val) => { setCustomDate(val); setPage(1); }}
                        onClear={handleClearFilters}
                    />

                    <DocumentListCard title="เอกสารในกระบวนการทำลาย" icon="delete_outline" iconColor="#ED393C" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[30%]" align="left" className="whitespace-nowrap !text-[12px] pl-6">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[18%]" className="whitespace-nowrap !text-[12px]">ชื่อผู้รับผิดชอบข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[18%]" className="whitespace-nowrap !text-[12px]">ชื่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[14%]" className="whitespace-nowrap !text-[12px]">วันที่ดำเนินการล่าสุด</DocumentTableHeader>
                                <DocumentTableHeader width="w-[12%]" className="whitespace-nowrap !text-[12px]">สถานะ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[8%]" className="whitespace-nowrap !text-[12px]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedRecords.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={6} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารในรายการทำลาย</span>
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
                                                {record.deletion_approved_at ? new Date(record.deletion_approved_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center">
                                                    <StatusBadge
                                                        status={
                                                            record.deletion_status === "DELETE_PENDING"
                                                                ? "รอตรวจสอบทำลาย"
                                                                : "อนุมัติการทำลาย"
                                                        }
                                                    />
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center">
                                                    <ActionIconWithTooltip
                                                        icon="visibility"
                                                        tooltipText="ดูสถานะคำร้องขอทำลาย"
                                                        buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                                        onClick={() => router.push(`/data-owner/management/form?id=${record.document_id}&mode=deletion`)}
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
                            totalItems={destroyedMeta.total}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage}
                        />
                    </DocumentListCard>
                </div>
            </main>
        </div>
    );
}


