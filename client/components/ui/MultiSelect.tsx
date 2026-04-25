"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
    label: string;
    placeholder?: string;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    required?: boolean;
    description?: React.ReactNode;
    error?: string;
    disabled?: boolean;
    variant?: "owner" | "processor";
    id?: string;
}

export default function MultiSelect({
    label,
    placeholder = "เลือกรายการ...",
    options,
    selectedValues,
    onChange,
    required,
    description,
    error,
    disabled,
    variant = "owner",
    id,
}: MultiSelectProps) {
    const isProcessor = variant === "processor";
    const primaryColor = "#ED393C";
    const tagBg = "bg-[#FFF1F1]";
    const tagBorder = "border-[#FFD9D9]";
    const tagHover = "hover:bg-red-50";
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Ensure selectedValues is always an array to prevent runtime errors like .filter or .includes is not a function
    const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

    // Filter options based on search and exclude already selected
    const filteredOptions = options.filter(
        (opt) =>
            opt.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !safeSelectedValues.includes(opt)
    );

    const toggleOption = (option: string) => {
        if (disabled) return;
        if (safeSelectedValues.includes(option)) {
            onChange(safeSelectedValues.filter((v) => v !== option));
        } else {
            onChange([...safeSelectedValues, option]);
        }
        setSearchTerm("");
    };

    const removeTag = (option: string) => {
        if (disabled) return;
        onChange(safeSelectedValues.filter((v) => v !== option));
    };

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

    return (
        <div className="space-y-2 w-full" ref={containerRef} id={id}>
            <label className={cn(
                "text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight",
                disabled && "opacity-60"
            )}>
                {label} {required && <span style={{ color: "#ED393C" }}>*</span>}
            </label>

            {description && (
                <div className="mt-[-4px] mb-1">
                    {description}
                </div>
            )}

            <div className={cn("grid grid-cols-3 gap-2 mb-3", disabled && "pointer-events-none")}>
                {Array.from(new Set(safeSelectedValues)).map((val, idx) => (
                    <div
                        key={`${val}-${idx}`}
                        className={cn(
                            "flex items-center justify-between px-4 py-1.5 text-[#1B1C1C] rounded-full text-xs font-bold transition-all border",
                            tagBg,
                            tagBorder,
                            tagHover
                        )}
                    >
                        <span className="truncate mr-2 font-black">{val}</span>
                        {!disabled && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(val);
                                }}
                                className="flex items-center justify-center hover:bg-red-200/50 rounded-full w-4 h-4 flex-shrink-0 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px] font-bold text-black">close</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between px-4 py-3 bg-white border border-[#E5E2E1] rounded-2xl cursor-pointer transition-all hover:border-[#CEC4C2] shadow-sm",
                        error ? "border-red-500/50 bg-red-50/50" : "",
                        isOpen && "bg-white border-primary rounded-b-none shadow-sm",
                        disabled && "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 pointer-events-none"
                    )}
                >
                    <input
                        type="text"
                        disabled={disabled}
                        className="bg-transparent border-none outline-none text-sm w-full placeholder-[#6B7280] font-medium disabled:cursor-not-allowed"
                        placeholder={safeSelectedValues.length === 0 ? placeholder : ""}
                        value={searchTerm}
                        onChange={(e) => {
                            if (disabled) return;
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredOptions.length > 0) {
                                toggleOption(filteredOptions[0]);
                                setIsOpen(false);
                            }
                        }}
                    />
                    <span className="material-symbols-outlined text-gray-400 transition-transform duration-300"
                        style={{ color: isOpen ? primaryColor : undefined }}>
                        expand_more
                    </span>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div 
                        className="absolute z-50 w-full bg-white border rounded-b-2xl shadow-xl animate-in fade-in duration-200 overflow-hidden top-full mt-[-1px]"
                        style={{ borderColor: primaryColor }}
                    >
                        {filteredOptions.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                {filteredOptions.map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => toggleOption(opt)}
                                        className="px-4 py-3 text-sm font-medium text-black cursor-pointer transition-all border-l-4 border-l-transparent"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
                                            e.currentTarget.style.color = primaryColor;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'black';
                                        }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-[#6B7280] italic text-center font-medium">
                                ไม่พบผลลัพธ์
                            </div>
                        )}
                    </div>
                )}
                {error && (
                    <p className="text-[11px] text-red-500 font-medium px-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
