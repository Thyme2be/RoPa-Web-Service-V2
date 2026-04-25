"use client";

import React from "react";
import Button from "./Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export default function ErrorState({
    title = "เกิดข้อผิดพลาด",
    message = "ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div className={cn(
            "w-full py-16 flex flex-col items-center justify-center text-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            className
        )}>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-red-500 text-4xl font-bold">
                    error
                </span>
            </div>
            
            <h3 className="text-xl font-black text-[#1B1C1C] mb-2">
                {title}
            </h3>
            
            <p className="text-secondary font-medium max-w-md mb-8 leading-relaxed">
                {message}
            </p>
            
            {onRetry && (
                <Button 
                    onClick={onRetry} 
                    variant="primary" 
                    size="md"
                    leftIcon={<span className="material-symbols-outlined">refresh</span>}
                >
                    ลองใหม่อีกครั้ง
                </Button>
            )}
        </div>
    );
}
