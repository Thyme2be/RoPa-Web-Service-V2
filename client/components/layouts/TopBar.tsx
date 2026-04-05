"use client";

import React from "react";

export default function TopBar() {
    return (
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
            <div className="flex items-center gap-4 group">
                <div className="flex items-center gap-1 group/edit cursor-pointer bg-white border border-[#E5E2E1] rounded-xl px-3 py-1.5 shadow-sm hover:border-primary/30 transition-all">
                    <input
                        className="font-headline font-bold tracking-tight text-neutral-900 text-[15px] bg-transparent border-none outline-none w-auto min-w-[220px]"
                        defaultValue="สร้างรายการ RoPA ใหม่"
                        placeholder="ตั้งชื่อเอกสาร..."
                        type="text"
                    />
                    <span className="material-symbols-outlined text-neutral-400 group-hover/edit:text-primary transition-colors text-[18px]">
                        edit
                    </span>
                </div>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                    โหมดฉบับร่าง
                </span>
            </div>

            {/* Search, Notifications, Account */}
            <div className="flex items-center gap-6">
                {/* Search Bar */}
                <div className="relative group hidden lg:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                        search
                    </span>
                    <input
                        className="bg-[#F6F3F2] border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary/40 transition-all outline-none"
                        placeholder="ค้นหา..."
                        type="text"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="p-2 text-neutral-500 hover:bg-[#F0EDED] rounded-full transition-colors active:scale-95 duration-200">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>

                    {/* Divider */}
                    <div className="h-8 w-[1px] bg-neutral-300 mx-2"></div>

                    {/* User Profile */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-neutral-900">
                            พรรษชล บุญมาก
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">
                            ผู้รับผิดชอบข้อมูล
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
