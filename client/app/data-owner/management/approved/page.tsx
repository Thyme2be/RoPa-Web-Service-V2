"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

export default function RopaApprovedPage() {
    const [page, setPage] = useState(1);
    const mockApproved = [
        { id: "RP-2026-03", name: "RP-2026-03 ข้อมูลลูกค้า", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", verifyDate: "20/03/2569", destroyDate: "25/03/2571", status: "ตรวจสอบเสร็จสิ้น", isDone: true },
        { id: "RP-2026-02", name: "RP-2026-02 การกำกับดูแลข้อมูลธุรกรรม", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", verifyDate: "18/03/2569", destroyDate: "18/03/2571", status: "ยังไม่ได้ตรวจสอบ", isDone: false },
        { id: "RP-2026-01", name: "RP-2026-01 การจัดการข้อมูลโดรงข่าย", doName: "นางสาวพรรษชล บุญมาก", dpoName: "นายกิตติพงศ์ ศรีวัฒนากุล", verifyDate: "15/03/2569", destroyDate: "15/03/2571", status: "ตรวจสอบเสร็จสิ้น", isDone: true },
    ];

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
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

                    <ListCard title="เอกสารที่อนุมัติ" icon="task_alt" iconColor="#0D9488" bodyClassName="p-0">

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
                                {mockApproved.map((record) => (
                                    <DocumentTableRow key={record.id}>
                                        <DocumentTableCell align="left">{record.name}</DocumentTableCell>
                                        <DocumentTableCell>{record.doName}</DocumentTableCell>
                                        <DocumentTableCell>{record.dpoName}</DocumentTableCell>
                                        <DocumentTableCell align="left">{record.verifyDate}</DocumentTableCell>
                                        <DocumentTableCell align="left">{record.destroyDate}</DocumentTableCell>
                                        <DocumentTableCell>
                                            <span className={`px-3 py-1 rounded-[4px] text-[10px] font-bold text-white ${record.isDone ? 'bg-[#2C8C00]' : 'bg-[#ED393C]'}`}>
                                                {record.status}
                                            </span>
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


