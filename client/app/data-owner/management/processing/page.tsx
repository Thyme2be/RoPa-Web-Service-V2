"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { ListCard, DocumentFilterBar, DocumentPagination, DocumentTable, DocumentTableHead, DocumentTableHeader, DocumentTableHeaderWithTooltip, DocumentTableBody, DocumentTableRow, DocumentTableCell, ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import CreateDocumentModal from "@/components/ropa/CreateDocumentModal";
import { useRouter } from "next/navigation";

export default function ManagementProcessingPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Filter State
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("7days");
    const [customDate, setCustomDate] = useState("");

    const mockProcessing = [
        { id: "RP-2026-03", name: "RP-2026-03 ข้อมูลลูกค้า", processor: "นายกิตติพงศ์ สุวรรณชัย", company: "บริษัท A", dueDate: "20/03/2569", statusDO: "รอส่วนของ Data Owner", statusDP: "รอส่วนของ Data Processor" },
        { id: "RP-2026-02", name: "RP-2026-02 การกำกับดูแลข้อมูลธุรกรรม", processor: "นางสาวพิมพ์ชนก วัฒนากุล", company: "บริษัท B", dueDate: "18/03/2569", statusDO: "Data Owner ดำเนินการเสร็จสิ้น", statusDP: "Data Processor ดำเนินการเสร็จสิ้น", doneDO: true, doneDP: true },
        { id: "RP-2026-01", name: "RP-2026-01 การจัดการข้อมูลโดรงข่าย", processor: "นายณัฐวุฒิ ศรีสวัสดิ์", company: "บริษัท C", dueDate: "15/03/2569", statusDO: "Data Owner ดำเนินการเสร็จสิ้น", statusDP: "รอส่วนของ Data Processor", doneDO: true, doneDP: false },
    ];

    const mockDrafts = [
        { id: "DFT-2026-02", name: "DFT-2026-02 บันทึกการส่งออกข้อมูลลระหว่างประเทศ", lastSaved: "16/03/2026" },
        { id: "DFT-2026-01", name: "DFT-2026-01 สัญญาจ้างหน่วยงานภายนอก", lastSaved: "15/03/2569" },
    ];

    const handleClearFilters = () => {
        setStatusFilter("all");
        setDateFilter("7days");
        setCustomDate("");
    };

    const handleCreateDocument = (data: { name: string; company: string; dueDate: string }) => {
        // In a real app, we would save the metadata to context or state
        console.log("Creating document:", data);
        setIsCreateModalOpen(false);
        router.push(`/data-owner/management/form?name=${encodeURIComponent(data.name)}&company=${encodeURIComponent(data.company)}&dueDate=${encodeURIComponent(data.dueDate)}`);
    };

    // Apply Filters
    const filteredProcessing = mockProcessing.filter(record => {
        // Status Match
        let matchStatus = true;
        if (statusFilter === "wait_owner") matchStatus = record.statusDO === "รอส่วนของ Data Owner";
        if (statusFilter === "wait_processor") matchStatus = record.statusDP === "รอส่วนของ Data Processor";
        if (statusFilter === "done_owner") matchStatus = record.statusDO === "Data Owner ดำเนินการเสร็จสิ้น";
        if (statusFilter === "done_processor") matchStatus = record.statusDP === "Data Processor ดำเนินการเสร็จสิ้น";

        // Date Match (mock behavior, allowing to show all for demonstration)
        // Since dates are mocked as strings, we just pass true for simplicity unless they typed precisely
        let matchDate = true;
        if (dateFilter === "custom" && customDate) {
            // Very naive date check for demo purposes
            // Example customDate: "2026-03-20" -> "20/03/2569"
            const [y, m, d] = customDate.split("-");
            if (y && m && d) {
                const thaiYear = parseInt(y) + 543;
                const formatted = `${d}/${m}/${thaiYear}`;
                matchDate = record.dueDate === formatted;
            }
        }

        return matchStatus && matchDate;
    });

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                <TopBar showBack={false} backUrl="/data-owner/management" pageTitle=" " hideSearch={true} />

                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
                            ตารางแสดงเอกสารที่ดำเนินการ
                        </h1>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-[#ED393C] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:brightness-110 transition-all shadow-md shadow-red-900/10"
                        >
                            <span className="material-symbols-rounded">add</span>
                            สร้างเอกสาร
                        </button>
                    </div>

                    <DocumentFilterBar 
                        statusValue={statusFilter}
                        onStatusChange={setStatusFilter}
                        dateValue={dateFilter}
                        onDateChange={setDateFilter}
                        customDate={customDate}
                        onCustomDateChange={setCustomDate}
                        onClear={handleClearFilters}
                    />

                    <ListCard title="เอกสารที่ดำเนินการ" icon="check_circle" iconColor="#0D9488" bodyClassName="p-0">

                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[25%]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[20%]">ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]">ชื่อบริษัท</DocumentTableHeader>
                                <DocumentTableHeader width="w-[15%]">วันที่กำหนดส่ง</DocumentTableHeader>
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
                                {filteredProcessing.map((record) => (
                                    <DocumentTableRow key={record.id}>
                                        <DocumentTableCell align="left">{record.name}</DocumentTableCell>
                                        <DocumentTableCell>{record.processor}</DocumentTableCell>
                                        <DocumentTableCell>{record.company}</DocumentTableCell>
                                        <DocumentTableCell>{record.dueDate}</DocumentTableCell>
                                        <DocumentTableCell>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${record.doneDO ? 'bg-[#2C8C00] text-white' : 'bg-[#FFCC00] text-[#5C403D]'}`}>
                                                    {record.statusDO}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${record.doneDP ? 'bg-[#2C8C00] text-white' : 'bg-[#FFCC00] text-[#5C403D]'}`}>
                                                    {record.statusDP}
                                                </span>
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

                    <ListCard title="ฉบับร่าง" icon="edit_note" iconColor="#5C403D" bodyClassName="p-0">
                        <DocumentTable>
                            <DocumentTableHead>
                                <DocumentTableHeader width="w-[50%]">ชื่อเอกสาร</DocumentTableHeader>
                                <DocumentTableHeader width="w-[25%]">บันทึกล่าสุด</DocumentTableHeader>
                                <DocumentTableHeader width="w-[25%]">การดำเนินการ</DocumentTableHeader>
                            </DocumentTableHead>
                            <DocumentTableBody>
                                {mockDrafts.map((record) => (
                                    <DocumentTableRow key={record.id}>
                                        <DocumentTableCell align="left">{record.name}</DocumentTableCell>
                                        <DocumentTableCell>{record.lastSaved}</DocumentTableCell>
                                        <DocumentTableCell>
                                            <div className="flex items-center justify-center gap-4">
                                                <ActionIconWithTooltip icon="edit" tooltipText="แก้ไขฉบับร่าง" buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]" />
                                                <ActionIconWithTooltip icon="delete" tooltipText="ลบฉบับร่าง" buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]" />
                                            </div>
                                        </DocumentTableCell>
                                    </DocumentTableRow>
                                ))}
                            </DocumentTableBody>
                        </DocumentTable>
                        <DocumentPagination 
                            current={draftPage} 
                            totalPages={2} 
                            totalItems={4} 
                            itemsPerPage={2} 
                            onChange={setDraftPage} 
                        />
                    </ListCard>
                </div>

                <CreateDocumentModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onCreate={handleCreateDocument}
                />
            </main>
        </div>
    );
}

