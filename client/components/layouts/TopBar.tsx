"use client";

import React from "react";

export default function TopBar({ documentName, handleChange, status, isProcessor, pageTitle, showBack, backUrl }: any) {
    const displayStatus = status === "submitted" ? "ส่งแล้ว" : status === "active" ? "ใช้งาน" : "ฉบับร่าง";

    const handleBack = () => {
        if (backUrl) {
            window.location.href = backUrl;
        } else {
            window.history.back();
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 w-full border-b border-[#F6F3F2]">
            <div className="flex items-center gap-4 group">
                {showBack && (
                    <button 
                        onClick={handleBack}
                        className="p-1.5 hover:bg-[#F0EDED] rounded-full transition-colors cursor-pointer mr-[-8px]"
                    >
                        <span className="material-symbols-outlined text-secondary text-[22px]">chevron_left</span>
                    </button>
                )}
                {pageTitle ? (
                    <h2 className="text-[17px] font-bold text-[#1B1C1C] tracking-tight">{pageTitle}</h2>
                ) : (
                    <>
                        <div className={`flex items-center gap-1 bg-white border border-[#E5E2E1] rounded-lg px-3 py-1.5 shadow-sm transition-all ${!isProcessor ? "hover:border-primary/30" : "opacity-80"}`}>
                            <input
                                className={`font-headline font-bold tracking-tight text-neutral-900 text-[15px] bg-transparent border-none outline-none w-auto min-w-[220px] ${isProcessor ? "cursor-default" : ""}`}
                                value={documentName || ""}
                                name="documentName"
                                placeholder="ตั้งชื่อเอกสาร..."
                                type="text"
                                onChange={handleChange}
                                readOnly={isProcessor}
                            />
                            {!isProcessor && (
                                <span className="material-symbols-outlined text-neutral-400 text-primary transition-colors text-[18px]">
                                    edit
                                </span>
                            )}
                        </div>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                            โหมด{displayStatus}
                        </span>
                    </>
                )}
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
                            {isProcessor ? "ผู้ประมวลผลข้อมูล" : "ผู้รับผิดชอบข้อมูล"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
