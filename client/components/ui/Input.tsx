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
                value={props.value ?? ""}
                className={cn(
                    "w-full h-11 border border-[#E5E2E1] rounded-xl px-4 py-2 text-sm bg-white text-[#1B1C1C] focus:outline-none transition-all placeholder:text-[#9CA3AF] font-bold focus:border-current focus:bg-white",
                    error ? "border-red-500 ring-2 ring-red-500/10" : "focus:ring-4",
                    props.disabled ? "bg-[#F6F3F2] border-[#E5E2E1] opacity-100 placeholder:text-transparent text-[#1B1C1C]" : "hover:border-[#CEC4C2]",
                    className
                )}
                style={{ 
                    ...(focusColor ? { 
                        "--tw-ring-color": `${focusColor}1A`,
                        borderColor: props.disabled ? undefined : (error ? undefined : undefined) 
                    } as any : {}) 
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