"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserRoleDashboardPlaceholder() {
    const params = useParams();
    const userId = params.id as string;

    return (
        <div className="space-y-8 pb-12 max-w-[1440px] mx-auto">
            {/* Header and Back navigation */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">
                        แดชบอร์ดส่วนบุคคล
                    </h2>
                    <p className="text-[#5C403D] text-[18px] font-medium">
                        พื้นที่แสดงผลตามบทบาทและสิทธิ์ของผู้ใช้งาน
                    </p>
                </div>

                <div className="flex items-center gap-6 self-start md:self-auto">
                    <Link
                        href="/admin/tables/users"
                        className="flex items-center gap-2 h-9 px-4 text-sm font-bold bg-white text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        กลับไปรายชื่อผู้ใช้
                    </Link>
                </div>
            </div>

            {/* Empty Context Area */}
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100 min-h-[500px] flex flex-col items-center justify-center p-8 text-center mt-8">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[48px] text-[#ED393C] opacity-80">
                        dashboard_customize
                    </span>
                </div>
                <h3 className="text-[24px] font-bold text-neutral-900 mb-3 tracking-tight">
                    แดชบอร์ดกำลังอยู่ในระหว่างพัฒนา
                </h3>
                <p className="text-[#5C403D] font-medium text-[16px] max-w-lg leading-relaxed">
                    เนื้อหา กราฟ และการสรุปข้อมูลในรูปแบบ Dashboard หน้านี้ <br/>
                    จะถูกอัปเดตและแสดงผลแตกต่างกันไปตามโครงสร้างข้อมูลและบทบาทความรับผิดชอบของผู้ใช้งานคนนี้
                    <br/><br/>
                    <span className="text-sm text-neutral-400 font-normal">รหัสอ้างอิงผู้ใช้งาน (User ID): {userId}</span>
                </p>
            </div>
        </div>
    );
}
