"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

export default function RopaDestroyedPage() {
    const [page, setPage] = useState(1);
    const mockDestroyed = [
        { id: "RP-2026-03", name: "RP-2026-03 ข้อมูลลูกค้า", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", destroyDate: "20/03/2571" },
        { id: "RP-2026-02", name: "RP-2026-02 การกำกับดูแลข้อมูลธุรกรรม", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", destroyDate: "18/03/2571" },
        { id: "RP-2026-01", name: "RP-2026-01 การจัดการข้อมูลโดรงข่าย", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", destroyDate: "15/03/2571" },
    ];

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
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
                                {mockDestroyed.map((record) => (
                                    <DocumentTableRow key={record.id}>
                                        <DocumentTableCell align="left">{record.name}</DocumentTableCell>
                                        <DocumentTableCell>{record.doName}</DocumentTableCell>
                                        <DocumentTableCell>{record.dpoName}</DocumentTableCell>
                                        <DocumentTableCell align="left">{record.destroyDate}</DocumentTableCell>
                                        <DocumentTableCell>
                                            <div className="flex items-center justify-center gap-3">
                                                <ActionIconWithTooltip icon="visibility" tooltipText="ดูเอกสาร" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
                                            </div>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ))}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination 
                            current={page} 
                            totalPages={4} 
                            totalItems={10} 
                            itemsPerPage={3} 
                            onChange={setPage} 
                        />
                    </ListCard>
                </div>
            </main>
        </div>
    );
}


