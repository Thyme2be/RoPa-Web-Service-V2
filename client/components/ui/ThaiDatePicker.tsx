"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn, formatDateThai, parseDateStr } from "@/lib/utils";

interface ThaiDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    containerClassName?: string;
    error?: string;
    rounding?: "lg" | "xl" | "2xl";
    disabled?: boolean;
    bgColor?: string;
    labelClassName?: string;
    variant?: "default" | "compact";
}

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default function ThaiDatePicker({ 
    value, 
    onChange, 
    placeholder = "วัน/เดือน/ปี", 
    label,
    required,
    containerClassName,
    error,
    rounding = "2xl",
    disabled,
    bgColor,
    labelClassName,
    variant = "default"
}: ThaiDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date()); // The month we are currently viewing
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync viewDate with current value when opening
    useEffect(() => {
        if (isOpen) {
            const timestamp = parseDateStr(value);
            if (timestamp) {
                setViewDate(new Date(timestamp));
            } else {
                setViewDate(new Date());
            }
        }
    }, [isOpen, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedTimestamp = useMemo(() => parseDateStr(value), [value]);
    const selectedDate = selectedTimestamp ? new Date(selectedTimestamp) : null;

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthLastDay = new Date(year, month, 0).getDate();

        const grid = [];

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            grid.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year: year,
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({
                day: i,
                month: month,
                year: year,
                isCurrentMonth: true
            });
        }

        // Next month days
        const remainingCells = 42 - grid.length;
        for (let i = 1; i <= remainingCells; i++) {
            grid.push({
                day: i,
                month: month + 1,
                year: year,
                isCurrentMonth: false
            });
        }

        return grid;
    }, [viewDate]);

    const handleDateSelect = (d: number, m: number, y: number) => {
        const newDate = new Date(y, m, d);
        const day = String(newDate.getDate()).padStart(2, "0");
        const month = String(newDate.getMonth() + 1).padStart(2, "0");
        const year = newDate.getFullYear();

        // We store it as DD/MM/YYYY internally for consistency
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    // Replace the exact function block for changeMonth
    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const isToday = (d: number, m: number, y: number) => {
        const today = new Date();
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    const isSelected = (d: number, m: number, y: number) => {
        return selectedDate && d === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear();
    };

    const displayYear = viewDate.getFullYear() + 543;

    return (
        <div className={cn("space-y-2 w-full relative", containerClassName)} ref={containerRef}>
            {label && (
                <label className={cn("text-[15px] font-extrabold text-[#5C403D] block tracking-tight ml-0", labelClassName)}>
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}

            <div className="relative group">
                <input
                    type="text"
                    readOnly
                    disabled={disabled}
                    placeholder={placeholder}
                    value={value ? formatDateThai(value) : ""}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "w-full px-6 py-2 text-sm font-medium outline-none transition-all cursor-pointer border placeholder:text-[#999] placeholder:opacity-100",
                        variant === "compact" ? "h-[48px] bg-[#F1F1F1] border-none" : (bgColor === "white" ? "bg-white" : "bg-[#FAFAFA]"),
                        rounding === "2xl" ? "rounded-2xl" : rounding === "xl" ? "rounded-xl" : "rounded-lg",
                        error ? "border-red-500/50 bg-red-50/50" : (variant === "compact" ? "" : "border-[#E4E4E7]"),
                        "hover:bg-white hover:border-primary/20",
                        isOpen && "bg-primary/5 border-primary/20 rounded-b-none",
                        disabled ? "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 pointer-events-none text-[#6B7280]" : "text-black"
                    )}
                />
                <span className={cn(
                    "material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors",
                    isOpen ? "text-primary" : "text-[#6B7280]"
                )}>
                    calendar_month
                </span>

                {/* Date Picker Popover */}
                {isOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-[100] w-[320px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-primary/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-5 flex items-center justify-between border-b border-primary/5 bg-primary/[0.02]">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined text-[20px] text-secondary">chevron_left</span>
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="text-[15px] font-black text-[#1B1C1C] leading-none">{THAI_MONTHS[viewDate.getMonth()]}</span>
                                <span className="text-[12px] font-bold text-secondary/60 mt-1">พ.ศ. {displayYear}</span>
                            </div>

                            <button
                                onClick={() => changeMonth(1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
                            </button>
                        </div>

                        {/* Calendar Body */}
                        <div className="p-4">
                            {/* Week Header */}
                            <div className="grid grid-cols-7 mb-2">
                                {DAYS_SHORT.map(d => (
                                    <span key={d} className="text-[11px] font-black text-secondary/40 text-center uppercase tracking-wider">{d}</span>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarGrid.map((dateObj, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleDateSelect(dateObj.day, dateObj.month, dateObj.year)}
                                        className={cn(
                                            "h-9 w-full rounded-xl flex items-center justify-center text-[13px] font-bold transition-all relative group/day",
                                            !dateObj.isCurrentMonth ? "text-secondary/20 font-medium" : "text-[#1B1C1C]",
                                            isSelected(dateObj.day, dateObj.month, dateObj.year)
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10"
                                                : "hover:bg-primary/5 hover:text-primary",
                                            isToday(dateObj.day, dateObj.month, dateObj.year) && !isSelected(dateObj.day, dateObj.month, dateObj.year) && "text-primary bg-primary/10 ring-1 ring-primary/20"
                                        )}
                                    >
                                        {dateObj.day}
                                        {isToday(dateObj.day, dateObj.month, dateObj.year) && !isSelected(dateObj.day, dateObj.month, dateObj.year) && (
                                            <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-primary/5 bg-primary/[0.01] flex justify-center">
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    handleDateSelect(today.getDate(), today.getMonth(), today.getFullYear());
                                }}
                                className="text-[12px] font-black text-primary px-4 py-1.5 rounded-full hover:bg-primary/5 transition-colors"
                            >
                                กลับสู่ปฏิทินวันนี้
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
