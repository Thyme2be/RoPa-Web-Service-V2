"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

export default function DPODestructionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const docId = params?.id;

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 p-8 space-y-6">
                <div className="w-full bg-white rounded-[32px] border border-[#E5E2E1]/40 shadow-sm p-12 min-h-[600px] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-[#F6F3F2] rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-[40px] text-gray-400">delete_sweep</span>
                    </div>
                    <h3 className="text-[20px] font-black text-[#5C403D] mb-2 text-center">หน้ารายละเอียดเอกสาร (ขอทำลาย)</h3>
                    <p className="text-secondary opacity-60 font-medium max-w-md mx-auto">
                        รหัสเอกสาร: {docId} <br/>
                        หน้านี้สำหรับจัดการเอกสารที่ขอทำลาย
                    </p>
                    <button 
                        onClick={() => router.back()}
                        className="mt-8 px-6 py-2 bg-white border border-[#E5E2E1] rounded-xl text-secondary font-bold hover:text-primary hover:border-primary transition-all cursor-pointer flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        กลับไปหน้าตาราง
                    </button>
                </div>
            </div>
        </div>
    );
}
