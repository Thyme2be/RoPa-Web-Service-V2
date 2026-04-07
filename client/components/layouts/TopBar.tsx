"use client";

import React from "react";

export default function TopBar({ documentName, handleChange, status, isProcessor, pageTitle, showBack, backUrl, hideSearch, hasError }: any) {
    const [isNotifyOpen, setIsNotifyOpen] = React.useState(false);

    const displayStatus = status === "submitted" ? "ส่งแล้ว" : status === "active" ? "ใช้งาน" : "ฉบับร่าง";

    const handleBack = () => {
        if (backUrl) {
            window.location.href = backUrl;
        } else {
            window.history.back();
        }
    };

    const notifications = [
        { id: 1, title: "บันทึกรายการ RoPA เสร็จสิ้น", subtext: "สำหรับผู้รับผิดชอบข้อมูล", time: "ตอนนี้" },
        { id: 2, title: "ผู้ประมวลผลข้อมูลส่วนบุคคลส่งเอกสารฉบับสมบูรณ์", subtext: "โปรดตรวจสอบก่อนจะนำส่งให้ทางผู้ตรวจสอบ", time: "8 ชั่วโมงที่ผ่านมา" }
    ];

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
                        <div className={`flex items-center gap-1 bg-white border ${hasError ? 'border-[#ED393C] shadow-[0_0_0_3px_rgba(237,57,60,0.15)] ring-1 ring-[#ED393C]' : 'border-[#E5E2E1]'} rounded-lg px-3 py-1.5 shadow-sm transition-all ${!isProcessor && !hasError ? "hover:border-primary/30" : ""} ${isProcessor ? "opacity-80" : ""}`}>
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

            {/* Notifications & Account */}
            <div className="flex items-center gap-6 relative">
                {/* Search Bar - Hidden conditionally */}
                {!hideSearch && (
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
                )}

                <div className="flex items-center gap-2">
                    {/* Notifications Bell */}
                    <button
                        onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                        className={`p-2 text-neutral-500 hover:bg-[#F0EDED] rounded-full transition-colors active:scale-95 duration-200 ${isNotifyOpen ? 'bg-[#F0EDED] text-primary' : ''}`}
                    >
                        <span className="material-symbols-outlined">notifications</span>
                    </button>

                    {/* Notification Popover - Pixel Perfect from screenshot */}
                    {isNotifyOpen && (
                        <div className="absolute top-14 right-24 w-[420px] bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.1)] border border-[#F6F3F2] z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-[#F6F3F2]">
                                <h3 className="text-[20px] font-black text-[#1B1C1C]">การแจ้งเตือน</h3>
                                <button
                                    onClick={() => setIsNotifyOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[24px] text-[#1B1C1C]">close</span>
                                </button>
                            </div>

                            {/* List */}
                            <div className="divide-y divide-[#F6F3F2] max-h-[400px] overflow-y-auto">
                                {notifications.map((n) => (
                                    <div key={n.id} className="px-8 py-6 hover:bg-[#FCF9F8] transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[15.5px] font-bold text-[#1B1C1C] leading-snug group-hover:text-primary transition-colors">
                                                    {n.title}
                                                </p>
                                                <p className="text-[13.5px] font-medium text-secondary opacity-80">
                                                    {n.subtext}
                                                </p>
                                            </div>
                                            <span className="text-[13px] font-bold text-secondary opacity-60 whitespace-nowrap pt-0.5">
                                                {n.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-6 flex justify-end bg-white">
                                <button
                                    onClick={() => setIsNotifyOpen(false)}
                                    className="bg-[#ED393C] text-white px-8 py-3 rounded-xl font-black text-[14.5px] shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all"
                                >
                                    ลบทั้งหมด
                                </button>
                            </div>
                        </div>
                    )}

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
