"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ onClick }: { onClick?: () => void }) {
    const router = useRouter();

    const handleCancel = () => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการกรอกข้อมูล? ข้อมูลที่ยังไม่ได้บันทึกจะสูญหาย")) {
            router.push("/"); // Or wherever you want to redirect
        }
    };

    return (
        <button
            onClick={onClick || handleCancel}
            className="px-6 py-2.5 text-[#5C403D] font-bold hover:text-red-600 transition-all text-[14px] tracking-wide cursor-pointer"
        >
            ยกเลิก
        </button>
    );
}
