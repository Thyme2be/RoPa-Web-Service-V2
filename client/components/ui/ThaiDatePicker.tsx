"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
    // Prop to allow portaling into a specific container (e.g. Modal overlay)
    portalContainerId?: string;
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
    variant = "default",
    portalContainerId
}: ThaiDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isMounted, setIsMounted] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const updatePosition = () => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        
        // If we have a portal container like a modal overlay, we should check space
        // Most modals have enough top space, but little bottom space.
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 350;

        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
            // Open UPWARDS
            setDropdownStyle({
                position: "fixed",
                bottom: window.innerHeight - rect.top + 8,
                left: rect.left,
                width: Math.max(rect.width, 320),
            });
        } else {
            // Open DOWNWARDS
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 8,
                left: rect.left,
                width: Math.max(rect.width, 320),
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            const timestamp = parseDateStr(value);
            setViewDate(timestamp ? new Date(timestamp) : new Date());
            updatePosition();
        }
    }, [isOpen, value]);

    // Handle outside clicks
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                inputRef.current && !inputRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside, true);
        return () => document.removeEventListener("mousedown", handleClickOutside, true);
    }, [isOpen]);

    // Track scroll/resize to update position if portaled
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    const selectedTimestamp = useMemo(() => parseDateStr(value), [value]);
    const selectedDate = selectedTimestamp ? new Date(selectedTimestamp) : null;

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const grid = [];
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            grid.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({ day: i, month: month, year, isCurrentMonth: true });
        }
        const remainingCells = 42 - grid.length;
        for (let i = 1; i <= remainingCells; i++) {
            grid.push({ day: i, month: month + 1, year, isCurrentMonth: false });
        }
        return grid;
    }, [viewDate]);

    const handleDateSelect = (d: number, m: number, y: number) => {
        const newDate = new Date(y, m, d);
        const day = String(newDate.getDate()).padStart(2, "0");
        const month = String(newDate.getMonth() + 1).padStart(2, "0");
        const year = newDate.getFullYear();
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const isToday = (d: number, m: number, y: number) => {
        const today = new Date();
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    const isSelected = (d: number, m: number, y: number) => {
        return selectedDate && d === selectedDate.getDate() && m === selectedDate.getMonth() && y === selectedDate.getFullYear();
    };

    const displayYear = viewDate.getFullYear() + 543;

    const popover = (
        <div
            ref={dropdownRef}
            style={{ ...dropdownStyle, zIndex: 9999 }}
            className="bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-[#E5E2E1] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-4 flex items-center justify-between border-b border-[#F6F3F2] bg-white">
                <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F6F3F2]">
                    <span className="material-symbols-outlined text-secondary">chevron_left</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[14px] font-black text-[#1B1C1C]">{THAI_MONTHS[viewDate.getMonth()]}</span>
                    <span className="text-[11px] font-bold text-[#5F5E5E]">พ.ศ. {displayYear}</span>
                </div>
                <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F6F3F2]">
                    <span className="material-symbols-outlined text-secondary">chevron_right</span>
                </button>
            </div>
            <div className="p-3">
                <div className="grid grid-cols-7 mb-1">
                    {DAYS_SHORT.map(d => (
                        <span key={d} className="text-[10px] font-black text-[#9CA3AF] text-center">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((dateObj, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleDateSelect(dateObj.day, dateObj.month, dateObj.year)}
                            className={cn(
                                "h-8 w-full rounded-lg flex items-center justify-center text-[12px] font-bold transition-all",
                                !dateObj.isCurrentMonth ? "text-gray-300 font-medium" : "text-[#1B1C1C]",
                                isSelected(dateObj.day, dateObj.month, dateObj.year)
                                    ? "bg-primary text-white"
                                    : "hover:bg-[#F6F3F2]",
                                isToday(dateObj.day, dateObj.month, dateObj.year) && !isSelected(dateObj.day, dateObj.month, dateObj.year) && "text-primary border border-primary/20"
                            )}
                        >
                            {dateObj.day}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-2 border-t border-[#F6F3F2] flex justify-center">
                <button type="button" onClick={() => { const today = new Date(); handleDateSelect(today.getDate(), today.getMonth(), today.getFullYear()); }} className="text-[11px] font-bold text-primary px-3 py-1 hover:bg-primary/5 rounded-full">
                    วันนี้
                </button>
            </div>
        </div>
    );

    const portalTarget = portalContainerId ? document.getElementById(portalContainerId) : (typeof document !== 'undefined' ? document.body : null);

    return (
        <div className={cn("space-y-2 w-full", containerClassName)}>
            {label && (
                <label className={cn("text-sm font-black text-[#5C403D] block mb-1.5", labelClassName)}>
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}

            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    readOnly
                    disabled={disabled}
                    placeholder={placeholder}
                    value={value ? formatDateThai(value) : ""}
                    onClick={() => !disabled && setIsOpen(prev => !prev)}
                    className={cn(
                        "w-full px-4 h-[44px] text-sm font-medium outline-none transition-all cursor-pointer border",
                        variant === "compact" ? "bg-[#F6F3F2] border-none" : "bg-white border-[#E5E2E1]",
                        rounding === "2xl" ? "rounded-2xl" : rounding === "xl" ? "rounded-xl" : "rounded-lg",
                        error ? "border-red-500 bg-red-50" : "",
                        "hover:bg-white hover:ring-1 hover:ring-primary/20",
                        isOpen && "ring-2 ring-primary/20",
                        disabled && "opacity-100 cursor-not-allowed bg-gray-50 text-[#1B1C1C] font-bold"
                    )}
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">
                    calendar_month
                </span>
            </div>

            {isOpen && isMounted && portalTarget && createPortal(popover, portalTarget)}
        </div>
    );
}
