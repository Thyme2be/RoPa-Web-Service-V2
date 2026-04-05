"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { 
    AdvancedFilterBar, 
    StatusBadge, 
    Pagination, 
    ListCard 
} from "@/components/ropa/ListComponents";

export default function RopaReviewPage() {
    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="ตรวจสอบรายการ RoPA" />

                <div className="p-10 space-y-10">
                    <div className="space-y-1">
                        <h1 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการ RoPA ที่ส่งให้ผู้ตรวจสอบทั้งหมด
                        </h1>
                    </div>

                    <AdvancedFilterBar />

                    {/* Review Status Table */}
                    <ListCard title="รายการที่ส่งให้ผู้ตรวจสอบ" icon="check_circle" iconColor="#0D9488">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[20%]">รหัสเอกสาร</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C] w-[40%]">ชื่อรายการ</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">วันที่ส่งข้อมูล</th>
                                    <th className="py-5 text-[12px] font-black tracking-tight text-[#1B1C1C]">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                <ReviewRow id="RP-2026-0891" title="ข้อมูลลูกค้าและประวัติการสั่งซื้อ" date="29/03/2026, 14:30" status="กำลังตรวจสอบ" />
                                <ReviewRow id="RP-2026-0885" title="การจัดเก็บข้อมูลบุคลากร HR" date="20/03/2026, 09:15" status="ตรวจสอบเสร็จสิ้น" />
                                <ReviewRow id="RP-2026-0875" title="ระบบคุกกี้และการตลาดออนไลน์" date="15/03/2026, 16:45" status="กำลังตรวจสอบ" />
                            </tbody>
                        </table>
                        <Pagination current={3} total={24} />
                    </ListCard>

                    {/* Submit to Reviewer Section */}
                    <div className="space-y-6">
                        <h2 className="text-[22px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            รายการ RoPA ที่ต้องการส่งให้ผู้ตรวจสอบ
                        </h2>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40 border-l-[6px] border-l-[#ED393C] p-8 flex items-center justify-between">
                            <div className="flex items-center gap-8 flex-1">
                                <label className="text-[17px] font-black text-[#1B1C1C] min-w-[120px]">เอกสาร RoPA</label>
                                <div className="flex-1 max-w-2xl">
                                    <input 
                                        type="text" 
                                        placeholder="โปรดระบุชื่อ - นามสกุล ของผู้ตรวจสอบ"
                                        className="w-full h-14 bg-[#F6F3F2] rounded-xl px-6 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#ED393C]/10 transition-all"
                                    />
                                </div>
                            </div>
                            <button className="bg-logout-gradient text-white px-8 py-3.5 rounded-xl font-black text-[15px] shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95">
                                เลือกรายการ
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-10 pt-4">
                            <button className="text-[15px] font-bold text-[#5C403D] hover:text-[#DC2626] transition-colors">ยกเลิก</button>
                            <button className="bg-logout-gradient text-white px-10 py-4 rounded-xl font-black text-[15px] shadow-xl shadow-red-900/20 hover:brightness-110 transition-all active:scale-95">
                                ส่ง RoPA ให้ผู้ตรวจสอบ
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ReviewRow({ id, title, date, status }: any) {
    return (
        <tr className="hover:bg-[#F9FAFB] transition-colors group">
            <td className="py-7 text-[13px] font-medium text-secondary">{id}</td>
            <td className="py-7 text-[14.5px] font-bold text-[#1B1C1C] tracking-tight leading-snug">{title}</td>
            <td className="py-7 text-[13px] font-medium text-secondary">{date}</td>
            <td className="py-7 flex justify-center">
                <StatusBadge status={status} />
            </td>
        </tr>
    );
}
