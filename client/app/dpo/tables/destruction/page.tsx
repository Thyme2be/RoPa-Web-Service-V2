"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, StatusBadge, GenericFilterBar, Pagination } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";

function DestructionTableContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");
    const [customDate, setCustomDate] = useState("");

    const ITEMS_PER_PAGE = 5;

    const mockDocsBase = [
        { id: "RP-2026-06", name: "การบริหารจัดการข้อมูลการบริการ", owner: "นางสาวพรรษชล บุญมาก", receivedDate: "2026-04-01", displayReceivedDate: "01/04/2569", reviewDate: "-", status: "รอตรวจสอบทำลาย", statusType: "warning" },
        { id: "RP-2026-05", name: "การจัดเก็บข้อมูลผู้ใช้งานระบบ", owner: "นางสาวพรรษชล บุญมาก", receivedDate: "2026-03-31", displayReceivedDate: "31/03/2569", reviewDate: "01/04/2569", status: "ไม่อนุมัติการทำลาย", statusType: "edit" },
        { id: "RP-2026-04", name: "การดูแลข้อมูลธุรกรรมทางการเงิน", owner: "นางสาวพรรษชล บุญมาก", receivedDate: "2026-03-29", displayReceivedDate: "29/03/2569", reviewDate: "01/04/2569", status: "อนุมัติการทำลาย", statusType: "success" },
        { id: "RP-2026-07", name: "ข้อมูลการสำรวจตลาด", owner: "นายวิชาญ ดวงดี", receivedDate: "2026-04-05", displayReceivedDate: "05/04/2569", reviewDate: "-", status: "รอตรวจสอบทำลาย", statusType: "warning" },
        { id: "RP-2026-08", name: "การจัดการคุกกี้", owner: "นางสาวปิยะนาถ มั่นคง", receivedDate: "2026-04-08", displayReceivedDate: "08/04/2569", reviewDate: "-", status: "รอตรวจสอบทำลาย", statusType: "warning" },
        { id: "RP-2026-09", name: "ล็อกระบบเข้าถึงข้อมูล", owner: "นายสมชาย ใจดี", receivedDate: "2026-04-10", displayReceivedDate: "10/04/2569", reviewDate: "-", status: "รอตรวจสอบทำลาย", statusType: "warning" }
    ];

    const getStatusColor = (type: string) => {
        switch (type) {
            case "success": return "bg-[#228B15] text-white"; // Green
            case "warning": return "bg-[#FBBF24] text-[#5C403D]"; // Yellow
            case "edit": return "bg-[#ED393C] text-white"; // Red
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
            else if (selectedDateRange === "เกินกำหนด") matchesDate = diffDays > 30 && doc.reviewDate === "-";
            else if (selectedDateRange === "กำหนดเอง" && customDate) {
                matchesDate = doc.receivedDate === customDate;
            }
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
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ขอทำลาย</h2>
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
                                { label: "รอตรวจสอบทำลาย", value: "รอตรวจสอบทำลาย" },
                                { label: "อนุมัติการทำลาย", value: "อนุมัติการทำลาย" },
                                { label: "ไม่อนุมัติการทำลาย", value: "ไม่อนุมัติการทำลาย" }
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
                                    { label: "เกินกำหนด", value: "เกินกำหนด" },
                                    { label: "กำหนดเอง", value: "กำหนดเอง" }
                                ]}
                                containerClassName="!w-full"
                            />
                        </div>

                        {selectedDateRange === "กำหนดเอง" && (
                            <div className="w-[200px] animate-in fade-in slide-in-from-left-2 duration-300">
                                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight mb-2">เลือกวันที่</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => { setCustomDate(e.target.value); setCurrentPage(1); }}
                                        className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 py-2 text-sm font-medium outline-none hover:border-primary/20 transition-all text-[#6B7280]"
                                    />
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">calendar_month</span>
                                </div>
                            </div>
                        )}
                    </div>
                </GenericFilterBar>

                {/* Table Section */}
                <div className="relative z-10">
                    <ListCard title="เอกสารที่ขอทำลาย" icon="delete" iconColor="#ED393C">
                        <div className="overflow-visible">
                            <table className="w-full text-center border-collapse">
                                <thead className="relative z-20">
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อเอกสาร</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ตรวจสอบ</th>
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
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.reviewDate}</td>
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
                                                        href={`/dpo/tables/destruction/${doc.id}`} 
                                                        title="ดูรายละเอียดและทำลาย" 
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-secondary opacity-60 font-medium">ไม่พบข้อมูลที่ค้นหา</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Area */}
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {startIndex + 1} ถึง {Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)} จากทั้งหมด {filteredDocs.length} รายการ
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

export default function DestructionPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <DestructionTableContent />
        </Suspense>
    );
}
