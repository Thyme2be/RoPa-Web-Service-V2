"use client";

import React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import Button from "./Button";

export default function CancelButton({ onClick }: { onClick?: () => void }) {
    const router = useRouter();
    const [isConfirmingCancel, setIsConfirmingCancel] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleCancel = () => {
        if (isConfirmingCancel) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            router.push("/");
            return;
        }

        setIsConfirmingCancel(true);
        toast("กดปุ่มยกเลิกอีกครั้งเพื่อยืนยัน");
        timeoutRef.current = setTimeout(() => {
            setIsConfirmingCancel(false);
        }, 3000);
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
