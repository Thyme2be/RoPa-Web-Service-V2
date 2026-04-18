import React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    required?: boolean;
    containerClassName?: string;
    error?: string;
    focusColor?: string;
    requiredColor?: string;
};

export default function Input({ 
    label, 
    required, 
    containerClassName, 
    className, 
    error, 
    focusColor,
    requiredColor,
    ...props 
}: Props) {
    return (
        <div className={cn("space-y-2", containerClassName)}>
            {label && (
                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                    {label} {required && <span className="font-bold" style={{ color: requiredColor || "#ED393C" }}>*</span>}
                </label>
            )}
            <input
                {...props}
                className={cn(
                    "w-full h-11 border-none rounded-xl px-4 py-2 text-sm bg-[#F6F3F2] text-[#1B1C1C] focus:outline-none transition-all placeholder:text-[#9CA3AF] font-medium disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-[#F6F3F2] disabled:text-[#1B1C1C] disabled:font-bold",
                    error ? "ring-2 ring-red-500/10" : "focus:ring-4",
                    className
                )}
                style={{ 
                    ...(focusColor ? { "--tw-ring-color": `${focusColor}1A` } as any : {}) 
                }}
            />
            {error && (
                <p className="text-[11px] text-red-500 font-medium px-1">
                    {error}
                </p>
            )}
        </div>
    );
}