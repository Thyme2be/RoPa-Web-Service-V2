"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
    label?: string;
    options: Option[];
    required?: boolean;
    containerClassName?: string;
    placeholder?: string;
    error?: string;
    rounding?: "lg" | "xl" | "2xl";
    disabled?: boolean;
    bgColor?: string;
    labelClassName?: string;
    onChange?: (e: { target: { name: string; value: string } }) => void;
};

export default function Select({
    label,
    options,
    required,
    containerClassName,
    value,
    name,
    onChange,
    placeholder,
    error,
    rounding = "2xl",
    bgColor,
    labelClassName,
    ...props
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find the current selected option label
    const selectedOption = options.find((o) => o.value === value);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (onChange && name) {
            onChange({ target: { name, value: optionValue } });
        }
        setIsOpen(false);
    };

    return (
        <div className={cn("space-y-2 w-full", containerClassName)} ref={containerRef}>
            {label && (
                <label className={cn("text-lg font-extrabold text-black block tracking-tight", labelClassName)}>
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Header / Trigger */}
                <div
                    onClick={() => !props.disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between w-full h-11 px-6 py-2 border border-[#E4E4E7] cursor-pointer transition-all hover:bg-white hover:border-primary/20",
                        bgColor === "white" ? "bg-white" : "bg-[#FAFAFA]",
                        rounding === "2xl" ? "rounded-2xl" : rounding === "xl" ? "rounded-xl" : "rounded-lg",
                        error ? "border-red-500/50 bg-red-50/50" : "",
                        isOpen && "bg-primary/5 border-primary/20 rounded-b-none",
                        props.disabled && "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 pointer-events-none"
                    )}
                >
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                        selectedOption ? "text-black" : "text-[#6B7280]"
                    )}>
                        {selectedOption ? selectedOption.label : placeholder || "เลือกรายการ..."}
                    </span>
                    <span className={cn(
                        "material-symbols-outlined text-gray-400 transition-transform duration-300",
                        isOpen && "rotate-180 text-primary"
                    )}>
                        expand_more
                    </span>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={cn(
                        "absolute z-50 w-full bg-white border border-primary/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden top-full mt-[-1px]",
                        rounding === "2xl" ? "rounded-b-2xl" : rounding === "xl" ? "rounded-b-xl" : "rounded-b-lg"
                    )}>
                        <div className="max-h-60 overflow-y-auto py-2">
                            {options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "px-4 py-3 text-sm font-medium text-black cursor-pointer transition-all border-l-4 border-l-transparent hover:bg-primary/5 hover:text-primary",
                                        opt.value === value && "bg-primary/5 text-primary border-l-primary border-y border-y-primary/10"
                                    )}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {error && (
                    <p className="text-[11px] text-red-500 font-medium px-1 mt-1 transition-all animate-in fade-in slide-in-from-top-1 duration-200">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}