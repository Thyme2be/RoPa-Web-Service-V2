"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    fullPage?: boolean;
    className?: string;
}

export default function LoadingState({
    message = "กำลังโหลด...",
    fullPage = false,
    className,
}: LoadingStateProps) {
    const content = (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4",
            fullPage ? "animate-in fade-in zoom-in duration-300" : ""
        )}>
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                
                {/* Inner Pulse */}
                <div className="absolute inset-0 m-auto w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
            
            {message && (
                <p className="text-secondary font-bold tracking-tight animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm",
                className
            )}>
                {content}
            </div>
        );
    }

    return (
        <div className={cn("w-full py-12 flex items-center justify-center", className)}>
            {content}
        </div>
    );
}
