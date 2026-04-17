"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListCard, Pagination, GenericFilterBar } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

function AuditorSubmissionTableContent() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);

    const mockDocs = [
        {
            id: "RP-2026-07",
            name: "ข้อมูลประสิทธิภาพเครือข่าย",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "05/04/2569",
            auditor: "Internal Audit - Legal Team",
            status: "อยู่ระหว่างตรวจสอบ",
            statusColor: "bg-[#E5E7EB] text-[#6B7280]"
        },
        {
            id: "RP-2026-08",
            name: "ข้อมูลนโยบายรักษาความปลอดภัย",
            owner: "นางสาวพรรษชล บุญมาก",
            receivedDate: "06/04/2569",
            auditor: "External Audit - ABC Consulting",
            status: "ตรวจสอบเสร็จสิ้น",
            statusColor: "bg-[#2C8C00] text-white"
        }
    ];

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ส่งให้ผู้ตรวจสอบ</h2>

                <GenericFilterBar onClear={() => setCurrentPage(1)}>
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

                <ListCard title="เอกสารที่ส่งให้ผู้ตรวจสอบ" icon="policy" iconColor="#1F4E79" filled={true}>
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E2E1]/40">
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-left pl-4">ชื่อเอกสาร</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ผู้ตรวจสอบ</th>
                                <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
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
                                    <td className="py-7 text-[13.5px] font-bold text-secondary">{doc.auditor}</td>
                                    <td className="py-7">
                                        <span className={`px-4 py-1 rounded-md text-[10px] font-black min-w-[130px] inline-block shadow-sm ${doc.statusColor}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                        <div className="px-6 flex items-center justify-between">
                            <p className="text-[12px] font-bold text-secondary opacity-60">แสดง 1 ถึง {mockDocs.length} จากทั้งหมด 2 รายการ</p>
                            <Pagination current={currentPage} total={1} onChange={setCurrentPage} />
                        </div>
                    </div>
                </ListCard>
            </div>
        </div>
    );
}

export default function AuditorSubmissionPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <AuditorSubmissionTableContent />
        </Suspense>
    );
}
