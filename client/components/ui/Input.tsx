import React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    required?: boolean;
    containerClassName?: string;
    error?: string;
};

export default function Input({ label, required, containerClassName, className, error, ...props }: Props) {
    return (
        <div className={cn("space-y-2", containerClassName)}>
            {label && (
                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}
            <input
                {...props}
                className={cn(
                    "w-full h-11 border-none rounded-xl px-4 py-2 text-sm bg-[#F6F3F2] text-[#1B1C1C] focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF] font-medium disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-[#F6F3F2] disabled:text-[#1B1C1C] disabled:font-bold",
                    error ? "ring-2 ring-red-500/10" : "",
                    className
                )}
            />
            {error && (
                <p className="text-[11px] text-red-500 font-medium px-1">
                    {error}
                </p>
            )}
        </div>
    );
}