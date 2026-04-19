"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

import { useRopa } from "@/context/RopaContext";

export default function RopaDestroyedPage() {
    const { destroyedRecords: contextDestroyedRecords } = useRopa();
    const [page, setPage] = useState(1);
    
    const ITEMS_PER_PAGE = 5;
    const paginatedRecords = contextDestroyedRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const ITEMS_PER_PAGE = 5;
    const paginatedRecords = destroyedRecords.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] text-foreground">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ถูกทำลายเสร็จสิ้น
                        </h1>
                    </div>

                    <DocumentFilterBar 
                        statusOptions={[{ label: "ถูกทำลายเสร็จสิ้น", value: "destroyed" }]} 
                    />

                    <ListCard title="เอกสารที่ถูกทำลาย" icon="delete_outline" iconColor="#ED393C" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[30%]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อผู้รับผิดชอบข้อมูล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">วันที่อนุมัติทำลาย</DocumentTableHeader>
                                <DocumentTableHeader width="w-[10%]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {paginatedRecords.length === 0 ? (
                                    <DocumentTableRow>
                                        <DocumentTableCell colSpan={6} align="center">
                                            <span className="text-[#9CA3AF] font-bold py-10 block">ไม่พบเอกสารที่ถูกทำลายแล้ว</span>
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
                                                {record.deletion_approved_at ? new Date(record.deletion_approved_at).toLocaleDateString("th-TH") : "—"}
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
                            totalPages={Math.max(1, Math.ceil(contextDestroyedRecords.length / ITEMS_PER_PAGE))}
                            totalItems={contextDestroyedRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onChange={setPage} 
                        />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}


