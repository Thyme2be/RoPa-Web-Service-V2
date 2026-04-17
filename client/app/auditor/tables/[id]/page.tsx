"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

export default function AuditorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const docId = params?.id;

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 p-8 space-y-6">
                <div className="w-full bg-white rounded-[32px] border border-[#E5E2E1]/40 shadow-sm p-12 min-h-[600px] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-[#F6F3F2] rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                    </div>
                    <h3 className="text-[20px] font-black text-[#5C403D] mb-2 text-center">กำลังพัฒนาส่วนเนื้อหา</h3>
                    <p className="text-secondary opacity-60 font-medium max-w-md mx-auto">
                        หน้านี้จะใช้สำหรับแสดงรายละเอียดและแบบฟอร์มการตรวจสอบข้อมูลของเอกสาร {docId}
                    </p>
                </div>
            </div>
        </div>
    );
}
