"use client";

import React from "react";
import { useRouter } from "next/navigation";

import Button from "./Button";

export default function CancelButton({ onClick }: { onClick?: () => void }) {
    const router = useRouter();

    const handleCancel = () => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการกรอกข้อมูล? ข้อมูลที่ยังไม่ได้บันทึกจะสูญหาย")) {
            router.push("/");
        }
    };

    return (
        <Button
            variant="ghost"
            size="lg"
            onClick={onClick || handleCancel}
            className="text-[#5C403D] hover:text-[#ED393C]"
        >
            ยกเลิก
        </Button>
    );
}
