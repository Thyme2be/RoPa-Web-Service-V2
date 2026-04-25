"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-logout-gradient text-white shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-[0.98]",
    secondary: "bg-white text-[#5C403D] border-2 border-[#E5E2E1] hover:bg-[#F6F3F2] shadow-sm active:scale-[0.98]",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.98]",
    ghost: "bg-transparent text-[#5C403D] hover:bg-black/5 active:scale-[0.98]",
    outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-9 px-4 text-sm rounded-lg",
    md: "h-11 px-6 text-[15px] rounded-xl font-bold",
    lg: "h-[52px] px-8 text-[16px] rounded-xl font-black",
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    loadingText,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={isLoading || disabled}
            className={cn(
                "inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                        progress_activity
                    </span>
                    {loadingText && <span>{loadingText}</span>}
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex items-center">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="flex items-center">{rightIcon}</span>}
                </>
            )}
        </button>
    );
}
