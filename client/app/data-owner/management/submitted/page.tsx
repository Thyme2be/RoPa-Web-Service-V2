"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

import { useRopa } from "@/context/RopaContext";

export default function RopaSubmittedPage() {
    const { records } = useRopa();
    const [page, setPage] = useState(1);
    
    // Filter records sent to DPO
    const submittedRecords = records.filter(r => r.workflow === "sent_dpo");

    const ITEMS_PER_PAGE = 5;
    const paginatedRecords = submittedRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล
                        </h1>
                    </div>

                    <DocumentFilterBar 
                        statusOptions={[{ label: "รอส่วนของ Data Owner", value: "wait_owner" }]} 
                    />

                    <ListCard title="เอกสารที่ส่งให้กับเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" icon="assignment" iconColor="#FF9800" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[25%]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]">วันที่ส่งข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]">วันที่ตรวจสอบ</DocumentTableHeader>
                                <DocumentTableHeaderWithTooltip 
                                    width="w-[15%]" 
                                    title="สถานะ" 
                                    tooltipText={
                                        <>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Owner</span> หมายถึง ผู้รับผิดชอบข้อมูล</p>
                                            <p><span className="w-24 inline-block font-bold text-[#1B1C1C]">Data Processor</span> หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                                        </>
                                    } 
                                />
                                <DocumentTableHeader width="w-[10%]">การดำเนินการ</DocumentTableHeader>
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
                                        <DocumentTableRow key={record.id}>
                                            <DocumentTableCell align="left">{record.id} {record.documentName}</DocumentTableCell>
                                            <DocumentTableCell>นายกิตติพงศ์ ศรีวัฒนากุล</DocumentTableCell>
                                            <DocumentTableCell align="left">{record.submittedDate || record.updatedDate || "—"}</DocumentTableCell>
                                            <DocumentTableCell align="left">—</DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-3 py-1 rounded-[4px] text-[10px] font-bold bg-[#FFC107] text-[#1B1C1C]">
                                                        {record.status === "review_pending" ? "รอตรวจสอบ" : "รอตรวจสอบเพื่อทำลาย"}
                                                    </span>
                                                </div>
                                            </DocumentTableCell>
                                            <DocumentTableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <ActionIconWithTooltip icon="visibility" tooltipText="ดูเอกสาร" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
                                                </div>
                                            </DocumentTableCell>
                                        </DocumentTableRow>
                                    ))
                                )}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination 
                            current={page} 
                            totalPages={Math.max(1, Math.ceil(submittedRecords.length / ITEMS_PER_PAGE))}
                            totalItems={submittedRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage} 
                        />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}


