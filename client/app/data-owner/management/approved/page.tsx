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
    
    const ITEMS_PER_PAGE = 5;
    const paginatedRecords = contextApprovedRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
                        statusOptions={[{ label: "ตรวจสอบเสร็จสิ้น", value: "done" }]} 
                    />

                    <DocumentListCard title="เอกสารที่อนุมัติ" icon="task_alt" iconColor="#0D9488" bodyClassName="p-0">

                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[20%]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip 
                                    width="w-[14%]" 
                                    title="ชื่อ DO" 
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>}
                                />
                                <DocumentTableHeaderWithTooltip 
                                    width="w-[16%]" 
                                    title="ชื่อ DPO" 
                                    tooltipText={<p><span className="font-bold text-[#1B1C1C]">Data Protection Officer</span> หมายถึง<br/>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</p>}
                                />
                                <DocumentTableHeader width="w-[12%]">วันที่อนุมัติ</DocumentTableHeader>
                                <DocumentTableHeader width="w-[14%]">วันครบกำหนดทำลาย</DocumentTableHeader>
                                <DocumentTableHeader width="w-[14%]">ตรวจสอบรายปี</DocumentTableHeader>
                                <DocumentTableHeader width="w-[10%]">การดำเนินการ</DocumentTableHeader>
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
                                                <div className="font-medium text-[#1B1C1C]">{record.title}</div>
                                                <div className="text-xs text-gray-400">ID: {record.document_number}</div>
                                            </DocumentTableCell>
                                            <DocumentTableCell>{record.do_name || "—"}</DocumentTableCell>
                                            <DocumentTableCell>{record.dpo_name || "—"}</DocumentTableCell>
                                            <DocumentTableCell align="left">
                                                {record.last_approved_at ? new Date(record.last_approved_at).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell align="left">
                                                {record.destruction_date ? new Date(record.destruction_date).toLocaleDateString("th-TH") : "—"}
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <span className={`px-3 py-1 rounded-[4px] text-[10px] font-bold text-white ${record.annual_review_status === "REVIEWED" ? "bg-[#2C8C00]" : "bg-[#FF9800]"}`}>
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
                            totalPages={Math.max(1, Math.ceil(contextApprovedRecords.length / ITEMS_PER_PAGE))}
                            totalItems={contextApprovedRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage} 
                        />
                    </DocumentListCard>
                </div>
            </main>
        </div>
    );
}


