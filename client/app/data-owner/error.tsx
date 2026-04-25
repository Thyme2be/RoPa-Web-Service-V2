"use client";

import React, { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <ErrorState
                title="เกิดข้อผิดพลาดในการโหลดหน้าเว็บ"
                message={error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้"}
                onRetry={() => reset()}
            />
        </div>
    );
}
