"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, Pagination, GenericFilterBar, StatusBadge } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

function InProgressTableContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");

    const ITEMS_PER_PAGE = 5;

    // Mock data for DPO In-Progress
    const mockDocs = [
        {
            id: "RP-2026-03",
            name: "ข้อมูลลูกค้า",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "20/03/2569",
            reviewDate: "25/03/2569",
            status: "Data owner ดำเนินการเสร็จสิ้น",
            statusType: "success",
            secondaryStatus: "Data processor ดำเนินการเสร็จสิ้น",
            secondaryStatusType: "success"
        },
        {
            id: "RP-2026-02",
            name: "การกำกับดูแลข้อมูลธุรกรรม",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "18/03/2569",
            reviewDate: "-",
            status: "รอตรวจสอบ",
            statusType: "warning"
        },
        {
            id: "RP-2026-01",
            name: "การจัดการข้อมูลโครงข่าย",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "15/03/2569",
            reviewDate: "29/03/2569",
            status: "ตรวจสอบเสร็จสิ้น",
            statusType: "success_dark"
        }
    ];

    const totalPages = Math.ceil(mockDocs.length / ITEMS_PER_PAGE);

    const getStatusColor = (type: string) => {
        switch (type) {
            case "success": return "bg-[#2C8C00] text-white";
            case "success_dark": return "bg-[#1B7433] text-white";
            case "warning": return "bg-[#FFCC00] text-[#5C403D]";
            default: return "bg-gray-200 text-gray-700";
        }
    };

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Page Header */}
                <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ดำเนินการ</h2>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedDateRange("ทั้งหมด"); setCurrentPage(1); }}>
                    <div className="w-[200px]">
                        <Select
                            label="สถานะ"
                            name="status"
                            rounding="xl"
                            bgColor="white"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "รอเจ้าของข้อมูล", value: "รอเจ้าของข้อมูล" },
                                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                                { label: "เสร็จสมบูรณ์", value: "เสร็จสมบูรณ์" }
                            ]}
                        />
                    </div>
                    <div className="w-[280px]">
                        <Select
                            label="ช่วงวันที่"
                            name="dateRange"
                            rounding="xl"
                            bgColor="white"
                            value={selectedDateRange}
                            onChange={(e) => { setSelectedDateRange(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "ภายใน 7 วัน", value: "ภายใน 7 วัน" },
                                { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" }
                            ]}
                        />
                    </div>
                </GenericFilterBar>

                {/* Table Section */}
                <ListCard title="เอกสารที่ดำเนินการ" icon="check_circle" iconColor="#00818B" filled={true}>
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E2E1]/40">
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-left pl-4">ชื่อเอกสาร</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ตรวจสอบ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ <span className="text-secondary opacity-50 material-symbols-outlined text-xs align-middle">info</span></th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E2E1]/10">
                            {mockDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-7 text-[13.5px] font-medium text-left pl-4">
                                        <div className="flex flex-col">
                                            <span className="text-secondary text-[11px] opacity-60 font-bold mb-0.5">{doc.id}</span>
                                            <span className="text-[#1B1C1C] font-extrabold tracking-tight">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-7 text-[13.5px] font-bold text-secondary">{doc.owner}</td>
                                    <td className="py-7 text-[13.5px] font-bold text-secondary">{doc.receivedDate}</td>
                                    <td className="py-7 text-[13.5px] font-bold text-secondary">{doc.reviewDate}</td>
                                    <td className="py-7">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className={`px-3 py-1 rounded-md text-[10px] font-black min-w-[140px] ${getStatusColor(doc.statusType)} shadow-sm`}>
                                                {doc.status}
                                            </span>
                                            {doc.secondaryStatus && (
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black min-w-[140px] ${getStatusColor(doc.secondaryStatusType)} shadow-sm`}>
                                                    {doc.secondaryStatus}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-7">
                                        <div className="flex justify-center gap-3">
                                            <Link href={`/dpo/tables/in-progress/${doc.id}`} title="ดูรายละเอียดและส่ง Feedback" className="text-secondary opacity-60 hover:opacity-100 hover:text-primary transition-all">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>comment</span>
                                            </Link>
                                            <Link href={`/dpo/tables/in-progress/${doc.id}?action=send`} title="ส่งให้ผู้ตรวจสอบ" className="text-secondary opacity-60 hover:opacity-100 hover:text-[#ED393C] transition-all">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>send</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                        <div className="px-6 flex items-center justify-between">
                            <p className="text-[12px] font-bold text-secondary opacity-60">
                                แสดง 1 ถึง {mockDocs.length} จากทั้งหมด 10 รายการ
                            </p>
                            <Pagination current={currentPage} total={3} onChange={setCurrentPage} />
                        </div>
                    </div>
                </ListCard>
            </div>
        </div>
    );
}

export default function InProgressPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <InProgressTableContent />
        </Suspense>
    );
}
