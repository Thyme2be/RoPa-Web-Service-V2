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
    focusColor?: string;
    primaryColor?: string;
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
    focusColor,
    primaryColor = "#ED393C",
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
                <label className={cn("text-[13px] font-extrabold text-[#5C403D] block tracking-tight", labelClassName)}>
                    {label} {required && <span className="font-bold" style={{ color: primaryColor }}>*</span>}
                </label>
            )}

            <div className="relative">
                {/* Header / Trigger */}
                <div
                    onClick={() => !props.disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between w-full h-11 px-4 py-2 border-none cursor-pointer transition-all",
                        bgColor === "white" ? "bg-white" : "bg-[#F6F3F2]",
                        rounding === "2xl" ? "rounded-2xl" : rounding === "xl" ? "rounded-xl" : "rounded-lg",
                        error ? "ring-2 ring-red-500/20 bg-red-50/50" : "",
                        isOpen && "rounded-b-none",
                        props.disabled && "opacity-100 cursor-not-allowed bg-[#F6F3F2] pointer-events-none"
                    )}
                    style={{
                        backgroundColor: isOpen ? `${primaryColor}0D` : undefined,
                        ...(focusColor && isOpen ? { ringColor: `${focusColor}33` } : {})
                    }}
                >
                    <span className={cn(
                        "text-sm font-bold transition-colors",
                        selectedOption ? "text-[#1B1C1C]" : "text-[#6B7280]",
                        props.disabled && "text-[#1B1C1C]"
                    )}>
                        {selectedOption ? selectedOption.label : placeholder || "เลือกรายการ..."}
                    </span>
                    <span className="material-symbols-outlined text-gray-400 transition-transform duration-300"
                        style={{ color: isOpen ? primaryColor : undefined }}>
                        expand_more
                    </span>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div 
                        className={cn(
                            "absolute z-50 w-full bg-white border border-opacity-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden top-full mt-[-1px]",
                            rounding === "2xl" ? "rounded-b-2xl" : rounding === "xl" ? "rounded-b-xl" : "rounded-b-lg"
                        )}
                        style={{ borderColor: primaryColor }}
                    >
                        <div className="max-h-60 overflow-y-auto py-2">
                            {options.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "px-4 py-3 text-sm font-medium text-black cursor-pointer transition-all border-l-4 border-l-transparent",
                                        opt.value === value && "border-y border-y-opacity-10"
                                    )}
                                    style={{
                                        borderLeftColor: opt.value === value ? primaryColor : "transparent",
                                        backgroundColor: opt.value === value ? `${primaryColor}0D` : undefined,
                                        color: opt.value === value ? primaryColor : undefined
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
                                        e.currentTarget.style.color = primaryColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (opt.value !== value) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'black';
                                        }
                                    }}
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