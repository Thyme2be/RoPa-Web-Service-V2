"use client";
import React from "react";
import Link from "next/link";

const tableMenus = [
    {
        title: "ตารางแสดงรายชื่อผู้ใช้ในระบบ",
        path: "/admin/tables/users"
    },
    {
        title: "ตารางแสดงเอกสารในระบบ",
        path: "/admin/tables/documents"
    },
    {
        title: "ตารางการจัดการแผนก บทบาท และบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล",
        path: "/admin/tables/departments"
    }
];

export default function TablesMenuPage() {
    return (
        <div className="max-w-[1440px] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางเอกสาร</h1>
                <p className="text-[#5C403D] text-[18px] font-medium">ตารางแสดงรายชื่อผู้ใช้และเอกสารในระบบ</p>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-4 w-full">
                {tableMenus.map((menu, index) => (
                    <Link
                        key={index}
                        href={menu.path}
                        className="flex items-center justify-between p-4 bg-white border border-[#B90A1E]/80 rounded-xl hover:shadow-[0_4px_12px_rgba(185,10,30,0.1)] hover:-translate-y-0.5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#E54545] shrink-0" style={{ fontSize: '44px', fontVariationSettings: "'FILL' 1" }}>
                                list_alt
                            </span>
                            <span className="text-xl font-bold text-neutral-900 tracking-tight">
                                {menu.title}
                            </span>
                        </div>
                        {/* Right Arrow Icon */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#E54545] mr-2">
                            <span className="material-symbols-outlined text-[#E54545] text-lg font-bold">
                                arrow_forward
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
