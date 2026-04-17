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
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search and exclude already selected
    const filteredOptions = options.filter(
        (opt) =>
            opt.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedValues.includes(opt)
    );

    const toggleOption = (option: string) => {
        if (disabled) return;
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter((v) => v !== option));
        } else {
            onChange([...selectedValues, option]);
        }
        setSearchTerm("");
    };

    const removeTag = (option: string) => {
        if (disabled) return;
        onChange(selectedValues.filter((v) => v !== option));
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
        <div className="space-y-2 w-full" ref={containerRef}>
            <label className={cn(
                "text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight",
                disabled && "opacity-60"
            )}>
                {label} {required && <span className="text-primary">*</span>}
            </label>

            {description && (
                <div className="mt-[-4px] mb-1">
                    {description}
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
                {selectedValues.map((val) => (
                    <div
                        key={val}
                        className="flex items-center justify-between px-4 py-1.5 bg-[#FFF1F1] border border-[#FFD9D9] text-[#1B1C1C] rounded-full text-xs font-bold transition-all hover:bg-red-50"
                    >
                        <span className="truncate mr-2 font-black">{val}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(val);
                            }}
                            className="flex items-center justify-center hover:bg-red-200/50 rounded-full w-4 h-4 flex-shrink-0 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px] font-bold text-black">close</span>
                        </button>
                    </div>
                ))}
            </div>

            <div className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between px-4 py-3 bg-[#F6F3F2] border rounded-2xl cursor-pointer transition-all hover:bg-white hover:border-primary/20 shadow-sm",
                        error ? "border-red-500/50 bg-red-50/50" : "border-transparent",
                        isOpen && "bg-white border-primary rounded-b-none shadow-sm",
                        disabled && "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 pointer-events-none"
                    )}
                >
                    <input
                        type="text"
                        disabled={disabled}
                        className="bg-transparent border-none outline-none text-sm w-full placeholder-[#6B7280] font-medium disabled:cursor-not-allowed"
                        placeholder={selectedValues.length === 0 ? placeholder : ""}
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
                    <span className={cn(
                        "material-symbols-outlined text-gray-400 transition-transform duration-300",
                        isOpen && "rotate-180 text-primary"
                    )}>
                        expand_more
                    </span>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full bg-white border border-primary rounded-b-2xl shadow-xl animate-in fade-in duration-200 overflow-hidden top-full mt-[-1px]">
                        {filteredOptions.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                {filteredOptions.map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => toggleOption(opt)}
                                        className="px-4 py-3 text-sm font-medium text-black hover:bg-primary/5 hover:text-primary cursor-pointer transition-all border-l-4 border-l-transparent"
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
