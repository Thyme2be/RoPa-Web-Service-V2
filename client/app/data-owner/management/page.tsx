"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Link from "next/link";

export default function RopaSelectionPage() {
    const menus = [
        { title: "ตารางแสดงเอกสารที่ดำเนินการ", href: "/data-owner/management/processing" },
        { title: "ตารางแสดงเอกสารที่ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", href: "/data-owner/management/submitted" },
        { title: "ตารางแสดงเอกสารที่ได้รับการอนุมัติจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", href: "/data-owner/management/approved" },
        { title: "ตารางแสดงเอกสารที่ถูกทำลายเสร็จสิ้น", href: "/data-owner/management/destroyed" },
    ];

    return (
        <div className="flex min-h-screen bg-[#F6F3F2] font-sans">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar hideSearch={true} minimal={true} />

                <div className="flex-1 flex flex-col p-10">
                    <div className="w-full max-w-5xl space-y-10">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-[#1B1C1C] tracking-tight">
                                ตารางเอกสาร
                            </h1>
                            <p className="text-[#5F5E5E] text-base font-medium">
                                ตารางแสดงรายละเอียดเอกสารและสถานะการดำเนินการปัจจุบัน
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {menus.map((menu, idx) => (
                                <Link href={menu.href} key={idx} className="block group">
                                    <div className="flex items-center justify-between p-4 bg-white border border-[#BA1A1A] rounded-xl hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-[#ED393C] rounded-lg flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-rounded text-white text-3xl">list</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-[#1B1C1C] tracking-tight">{menu.title}</h2>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-[#ED393C] flex items-center justify-center group-hover:bg-[#ED393C] transition-colors">
                                            <span className="material-symbols-rounded text-[#ED393C] group-hover:text-white text-2xl">arrow_forward</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}



