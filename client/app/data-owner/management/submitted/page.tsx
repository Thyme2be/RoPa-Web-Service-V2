"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

export default function RopaSubmittedPage() {
    const [page, setPage] = useState(1);
    const mockSubmitted = [
        { id: "RP-2026-03", name: "RP-2026-03 ข้อมูลลูกค้า", dpo: "นายกิตติพงศ์ ศรีวัฒนากุล", sendDate: "20/03/2569", checkDate: "25/03/2569", statusDO: "รอส่วนของ Data Owner แก้ไข", statusDP: "รอส่วนของ Data Processor แก้ไข", multiStatus: true },
        { id: "RP-2026-02", name: "RP-2026-02 การกำกับดูแลข้อมูลธุรกรรม", dpo: "นายกิตติพงศ์ ศรีวัฒนากุล", sendDate: "18/03/2569", checkDate: "-", status: "รอตรวจสอบ", multiStatus: false },
        { id: "RP-2026-01", name: "RP-2026-01 การจัดการข้อมูลโดรงข่าย", dpo: "นายกิตติพงศ์ ศรีวัฒนากุล", sendDate: "15/03/2569", checkDate: "-", status: "รอตรวจสอบเพื่อทำลาย", multiStatus: false },
    ];

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
                                {mockSubmitted.map((record) => (
                                    <DocumentTableRow key={record.id}>
                                        <DocumentTableCell align="left">{record.name}</DocumentTableCell>
                                        <DocumentTableCell>{record.dpo}</DocumentTableCell>
                                        <DocumentTableCell align="left">{record.sendDate}</DocumentTableCell>
                                        <DocumentTableCell align="left">{record.checkDate}</DocumentTableCell>
                                        <DocumentTableCell>
                                            <div className="flex flex-col items-center gap-1">
                                                {record.multiStatus ? (
                                                    <>
                                                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FFC107] text-[#1B1C1C]">
                                                            {record.statusDO}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FFC107] text-[#1B1C1C]">
                                                            {record.statusDP}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-[4px] text-[10px] font-bold bg-[#FFC107] text-[#1B1C1C]">
                                                        {record.status}
                                                    </span>
                                                )}
                                            </div>
                                        </DocumentTableCell>
                                        <DocumentTableCell>
                                            <div className="flex items-center justify-center gap-3">
                                                <ActionIconWithTooltip icon="visibility" tooltipText="ดูเอกสาร" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
                                                <ActionIconWithTooltip icon="send" tooltipText="ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
                                                <ActionIconWithTooltip icon="cancel_schedule_send" tooltipText="ส่งคำขอลบให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
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


