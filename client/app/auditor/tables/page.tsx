"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, Pagination, GenericFilterBar } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";

function AuditorTableContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ภายใน 7 วัน");
    const [customDate, setCustomDate] = useState("");

    const ITEMS_PER_PAGE = 5;

    // Mock data for Auditor
    const mockDocsBase = [
        {
            id: "RP-2026-03",
            name: "ข้อมูลลูกค้า",
            owner: "นายธนกร จิตต์สุวรรณ",
            receivedDate: "2026-03-20",
            displayReceivedDate: "20/03/2569",
            auditDate: "25/03/2569",
            deadline: "25/03/2569",
            status: "รอตรวจสอบ",
            statusType: "warning"
        },
        {
            id: "RP-2026-02",
            name: "การกำกับดูแลข้อมูลธุรกรรม",
            owner: "นายธนกร จิตต์สุวรรณ",
            receivedDate: "2026-03-18",
            displayReceivedDate: "18/03/2569",
            auditDate: "28/03/2569",
            deadline: "25/03/2569",
            status: "รอตรวจสอบ",
            statusType: "warning",
            isOverdue: true
        },
        {
            id: "RP-2026-01",
            name: "การจัดการข้อมูลโครงข่าย",
            owner: "นายธนกร จิตต์สุวรรณ",
            receivedDate: "2026-03-15",
            displayReceivedDate: "15/03/2569",
            auditDate: "29/03/2569",
            deadline: "29/03/2569",
            status: "ตรวจสอบเสร็จสิ้น",
            statusType: "success"
        }
    ];

    const getStatusColor = (type: string) => {
        switch (type) {
            case "success": return "bg-[#228B15] text-white"; // Green
            case "warning": return "bg-[#FBBF24] text-[#5C403D]"; // Yellow
            case "danger": return "bg-[#ED393C] text-white"; // Red
            default: return "bg-gray-200 text-gray-700";
        }
    };

    // Filtering logic
    const filteredDocs = mockDocsBase.filter(doc => {
        const matchesSearch = globalSearchQuery === "" ||
            doc.id.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            doc.owner.toLowerCase().includes(globalSearchQuery.toLowerCase());

        const matchesStatus = selectedStatus === "ทั้งหมด" || doc.status === selectedStatus;

        let matchesDate = true;
        if (selectedDateRange !== "ทั้งหมด") {
            const docDate = new Date(doc.receivedDate);
            const now = new Date("2026-04-18");
            const diffDays = (now.getTime() - docDate.getTime()) / (1000 * 3600 * 24);

            if (selectedDateRange === "ภายใน 7 วัน") matchesDate = diffDays <= 7;
            else if (selectedDateRange === "ภายใน 30 วัน") matchesDate = diffDays <= 30;
            else if (selectedDateRange === "เลยกำหนด") matchesDate = !!doc.isOverdue;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 p-8 space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ได้รับจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</h2>
                </div>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedDateRange("ทั้งหมด"); setCustomDate(""); setCurrentPage(1); }}>
                    <div className="w-[280px]">
                        <Select
                            label="สถานะ"
                            name="status"
                            rounding="xl"
                            bgColor="white"
                            error=""
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                                { label: "ตรวจสอบเสร็จสิ้น", value: "ตรวจสอบเสร็จสิ้น" }
                            ]}
                            containerClassName="!w-full"
                        />
                    </div>
                    <div className="flex gap-6 items-end">
                        <div className="w-[280px]">
                            <Select
                                label="ช่วงวันที่"
                                name="dateRange"
                                rounding="xl"
                                bgColor="white"
                                error=""
                                value={selectedDateRange}
                                onChange={(e) => { setSelectedDateRange(e.target.value); setCurrentPage(1); }}
                                options={[
                                    { label: "ทั้งหมด", value: "ทั้งหมด" },
                                    { label: "ภายใน 7 วัน", value: "ภายใน 7 วัน" },
                                    { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" },
                                    { label: "เลยกำหนด", value: "เลยกำหนด" },
                                    { label: "กำหนดเอง", value: "กำหนดเอง" }
                                ]}
                                containerClassName="!w-full"
                            />
                        </div>
                    </div>
                </GenericFilterBar>

                {/* Table Section */}
                <div className="relative z-10">
                    <ListCard title="เอกสารที่ได้รับจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" icon="assignment_turned_in" iconColor="#FFB800">
                        <div className="overflow-visible">
                            <table className="w-full text-center border-collapse">
                                <thead className="relative z-20">
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อเอกสาร</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้ตรวจสอบข้อมูล</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ตรวจสอบ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่กำหนดส่ง</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {currentDocs.length > 0 ? currentDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 text-[13.5px] font-medium text-left pl-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-secondary text-[13.5px] font-medium">{doc.id}</span>
                                                    <span className="text-[#1B1C1C] font-medium tracking-tight">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.owner}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.displayReceivedDate}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.auditDate}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center flex items-center justify-center gap-2 min-h-[64px]">
                                                {doc.isOverdue && (
                                                    <span className="px-2 py-0.5 bg-[#ED393C] text-white text-[10px] font-black rounded-md shadow-sm">
                                                        {doc.deadline}
                                                    </span>
                                                )}
                                                {!doc.isOverdue && doc.deadline}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center py-1">
                                                    <span className={`px-4 py-1 rounded-lg text-[11px] font-black inline-block text-center shadow-sm ${getStatusColor(doc.statusType)}`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/auditor/tables/${doc.id}`}
                                                        title="ตรวจสอบ"
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>assignment_turned_in</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-secondary opacity-60 font-medium">ไม่พบข้อมูลที่ค้นหา</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Area */}
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {startIndex + 1} ถึง {Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)} จากทั้งหมด 10 รายการ
                                    </p>
                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                        <Pagination
                                            current={currentPage}
                                            total={totalPages}
                                            onChange={setCurrentPage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ListCard>
                </div>
            </div>
        </div>
    );
}

export default function AuditorPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <AuditorTableContent />
        </Suspense>
    );
}
