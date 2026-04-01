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
}

export default function MultiSelect({
    label,
    placeholder = "เลือกรายการ...",
    options,
    selectedValues,
    onChange,
    required,
    description,
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
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter((v) => v !== option));
        } else {
            onChange([...selectedValues, option]);
        }
        setSearchTerm("");
    };

    const removeTag = (option: string) => {
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
            <label className="text-sm font-bold text-[#5C403D] flex items-center gap-1 tracking-tight">
                {label} {required && <span className="text-primary">*</span>}
            </label>

            {description && (
                <div className="mt-[-4px] mb-1">
                    {description}
                </div>
            )}

            {/* Selected Tags Display */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {selectedValues.slice(0, 5).map((val) => (
                    <div
                        key={val}
                        className="flex items-center justify-between px-4 py-1.5 bg-primary/5 border border-primary/30 text-black rounded-full text-xs font-semibold transition-all hover:bg-primary/10"
                    >
                        <span className="truncate mr-1">{val}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(val);
                            }}
                            className="flex items-center justify-center hover:bg-primary/20 rounded-full w-4 h-4 flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                        </button>
                    </div>
                ))}
                {selectedValues.length > 5 && (
                    <div className="flex items-center justify-center px-4 py-1.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-full text-xs font-bold">
                        ...
                    </div>
                )}
            </div>

            {/* Input and Dropdown Container */}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between px-4 py-3 bg-[#F6F3F2] border border-gray-100 rounded-2xl cursor-pointer transition-all hover:bg-white hover:border-primary/30 shadow-sm",
                        isOpen && "bg-white border-primary ring-4 ring-primary/5"
                    )}
                >
                    <input
                        type="text"
                        className="bg-transparent border-none outline-none text-sm w-full placeholder-[#6B7280] font-medium"
                        placeholder={selectedValues.length === 0 ? placeholder : ""}
                        value={searchTerm}
                        onChange={(e) => {
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
                    <div className="absolute z-50 w-full mt-2 py-2 bg-white border border-gray-100 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        {filteredOptions.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                {filteredOptions.map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => toggleOption(opt)}
                                        className="px-4 py-2.5 text-sm font-medium text-black hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
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
            </div>
        </div>
    );
}
