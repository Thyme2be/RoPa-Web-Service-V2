"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TopBar({
    isExecutive,
    pageTitle,
    showBack,
    backUrl,
    hideSearch,
    minimal,
    formMode,
    searchQuery,
    onSearchChange
}: any) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isNotifyOpen, setIsNotifyOpen] = React.useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = React.useState(searchParams.get("search") || "");

    const isFormRoute = pathname.includes("/management/form");
    const isTableMenuPage = pathname === "/admin/tables" || pathname === "/dpo/tables";
    const isDocumentTableRoute =
        pathname.includes("/tables/") ||
        pathname === "/auditor/tables" ||
        pathname.includes("/management/processing") ||
        pathname.includes("/management/submitted") ||
        pathname.includes("/management/approved") ||
        pathname.includes("/management/destroyed");

    const effectiveFormMode = formMode || isFormRoute;
    const shouldShowSearch = !effectiveFormMode && !isTableMenuPage && (isDocumentTableRoute || !hideSearch);
    const effectiveSearchQuery = searchQuery ?? internalSearchQuery;

    React.useEffect(() => {
        setInternalSearchQuery(searchParams.get("search") || "");
    }, [searchParams]);

    const handleInternalSearchChange = (e: any) => {
        const value = e?.target?.value ?? "";
        setInternalSearchQuery(value);

        if (onSearchChange) {
            onSearchChange(e);
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set("search", value);
        else params.delete("search");
        router.push(`${pathname}?${params.toString()}`);
    };

    // Standardized role display based on real user data
    const userRole = user?.role === "EXECUTIVE" ? "ผู้บริหารระดับสูง" :
        user?.role === "PROCESSOR" ? "ผู้ประมวลผลข้อมูลส่วนบุคคล" :
            user?.role === "AUDITOR" ? "ผู้ตรวจสอบ" :
                user?.role === "DPO" ? "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" :
                    user?.role === "ADMIN" ? "ผู้ดูแลระบบ" :
                        "ผู้รับผิดชอบข้อมูล";
    const userName = user ? (user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username) : "Unknown User";

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
        <header className="sticky top-0 z-40 bg-[#FCF9F8] flex justify-between items-center px-8 h-16 border-b border-[#F6F3F2]">
            <div className="flex items-center gap-4 group h-full">
                {(!minimal && !effectiveFormMode) || (effectiveFormMode && showBack) ? (
                    <>
                        {showBack && (
                            <button
                                onClick={handleBack}
                                className="p-1.5 hover:bg-[#F0EDED] rounded-full transition-colors cursor-pointer mr-[-8px]"
                            >
                                <span className="material-symbols-outlined text-secondary text-[22px]">chevron_left</span>
                            </button>
                        )}
                        {!effectiveFormMode && pageTitle && (
                            <h2 className="text-[17px] font-bold text-[#1B1C1C] tracking-tight">{pageTitle}</h2>
                        )}
                        {!effectiveFormMode && !pageTitle && (
                            <>
                            </>
                        )}
                    </>
                ) : null}
                {effectiveFormMode && (
                    <div className="flex items-center gap-4">
                        <h2 className="text-[17px] font-bold text-[#1B1C1C] tracking-tight">ข้อมูลลูกค้า</h2>
                    </div>
                )}
            </div>

            {/* Notifications & Account */}
            <div className="flex items-center gap-6 relative h-full">
                {shouldShowSearch && (
                    <div className="relative group hidden lg:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            search
                        </span>
                        <input
                            className="bg-[#F6F3F2] border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary/40 transition-all outline-none"
                            placeholder="ค้นหา..."
                            type="text"
                            value={effectiveSearchQuery}
                            onChange={handleInternalSearchChange}
                        />
                    </div>
                )}

                <div className="flex items-center gap-4 h-full">
                    {!minimal && !effectiveFormMode && (
                        <>
                            <button
                                onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                                className={`p-2 text-neutral-500 hover:bg-[#F0EDED] rounded-full transition-colors active:scale-95 duration-200 ${isNotifyOpen ? 'bg-[#F0EDED] text-primary' : ''}`}
                            >
                                <span className="material-symbols-outlined">notifications</span>
                            </button>

                            {isNotifyOpen && (
                                <div className="absolute top-14 right-24 w-[420px] bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.1)] border border-[#F6F3F2] z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center justify-between px-8 py-6 border-b border-[#F6F3F2]">
                                        <h3 className="text-[20px] font-black text-[#1B1C1C]">การแจ้งเตือน</h3>
                                        <button
                                            onClick={() => setIsNotifyOpen(false)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[24px] text-[#1B1C1C]">close</span>
                                        </button>
                                    </div>
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
                            <div className="h-8 w-[1px] bg-neutral-300 mx-2"></div>
                        </>
                    )}

                    <div className="flex flex-col items-end">
                        <span className="text-[15px] font-black text-black">
                            {userName}
                        </span>
                        <span className="text-[12px] font-bold text-[#737373] whitespace-nowrap">
                            {userRole}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
