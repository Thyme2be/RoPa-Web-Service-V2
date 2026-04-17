"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, Pagination, GenericFilterBar } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

function DestructionTableContent() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");

    const ITEMS_PER_PAGE = 5;

    // Mock data for Destruction
    const mockDocs = [
        {
            id: "RP-2026-06",
            name: "การบริหารจัดการข้อมูลการบริการ",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "01/04/2569",
            reviewDate: "-",
            status: "รอตรวจสอบทำลาย",
            statusColor: "bg-[#FFCC00] text-[#5C403D]"
        },
        {
            id: "RP-2026-05",
            name: "การจัดเก็บข้อมูลผู้ใช้งานระบบ",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "31/03/2569",
            reviewDate: "01/04/2569",
            status: "ไม่อนุมัติการทำลาย",
            statusColor: "bg-[#ED393C] text-white"
        },
        {
            id: "RP-2026-04",
            name: "การดูแลข้อมูลธุรกรรมทางการเงิน",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "29/03/2569",
            reviewDate: "01/04/2569",
            status: "อนุมัติการทำลาย",
            statusColor: "bg-[#2C8C00] text-white"
        }
    ];

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ขอทำลาย</h2>

                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setCurrentPage(1); }}>
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
                                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                                { label: "อนุมัติแล้ว", value: "อนุมัติแล้ว" },
                                { label: "ปฏิเสธการทำลาย", value: "ปฏิเสธ" }
                            ]}
                        />
                    </div>
                    <div className="w-[280px]">
                        <Select
                            label="ช่วงวันที่"
                            name="dateRange"
                            rounding="xl"
                            bgColor="white"
                            options={[{ label: "ทั้งหมด", value: "ทั้งหมด" }, { label: "ภายใน 7 วัน", value: "7" }]}
                        />
                    </div>
                </GenericFilterBar>

                <ListCard title="เอกสารที่ขอทำลาย" icon="delete" iconColor="#ED393C" filled={true}>
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E2E1]/40">
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-left pl-4">ชื่อเอกสาร</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ตรวจสอบ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
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
                                        <span className={`px-4 py-1 rounded-md text-[10px] font-black min-w-[130px] inline-block shadow-sm ${doc.statusColor}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="py-7">
                                        <div className="flex justify-center">
                                            <Link href={`/dpo/tables/destruction/${doc.id}`} title="ดูรายละเอียดและทำลาย" className="text-secondary opacity-60 hover:opacity-100 transition-all">
                                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                        <div className="px-6 flex items-center justify-between">
                            <p className="text-[12px] font-bold text-secondary opacity-60">แสดง 1 ถึง {mockDocs.length} จากทั้งหมด 10 รายการ</p>
                            <Pagination current={currentPage} total={3} onChange={setCurrentPage} />
                        </div>
                    </div>
                </ListCard>
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
