"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import ThaiDatePicker from "@/components/ui/ThaiDatePicker";

export function SummaryCard({ label, value, accentColor, subtext, footer }: { label: string; value: string; accentColor: string; subtext?: string; footer?: React.ReactNode }) {
    const borderClass = accentColor === "red" ? "border-l-[#ED393C]" :
        accentColor === "teal" ? "border-l-[#0D9488]" :
            "border-l-neutral-400";

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 border-l-[4px] ${borderClass} flex flex-col justify-between min-h-[135px]`}>
            <div>
                <p className="text-[13px] font-bold text-secondary tracking-tight mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-[#1B1C1C] tracking-tighter">{value}</p>
                    {subtext && <span className="text-[14px] font-medium text-secondary opacity-60">{subtext}</span>}
                </div>
            </div>
            {footer && (
                <div className="pt-2 border-t border-[#E5E2E1]/20 mt-3">
                    {footer}
                </div>
            )}
        </div>
    );
}

export function AdvancedFilterBar({ initialTimeframe = "30" }: { initialTimeframe?: string }) {
    const [date, setDate] = useState("");
    const [timeframe, setTimeframe] = useState(initialTimeframe);

    const handleClear = () => {
        setDate("");
        setTimeframe(initialTimeframe);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E2E1]/40 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-1.5 pb-[2px] w-full">
                <ThaiDatePicker
                    label="วันที่รับข้อมูล"
                    value={date}
                    onChange={setDate}
                />
            </div>

            <Select
                label="ช่วงเวลา"
                rounding="xl"
                value={timeframe}
                name="timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
                options={[
                    { label: "30 วันล่าสุด", value: "30" },
                    { label: "90 วันล่าสุด", value: "90" },
                    { label: "ทั้งหมด", value: "all" },
                ]}
            />

            <div className="flex h-11">
                <button
                    onClick={handleClear}
                    className="w-full h-full bg-[#6B7280] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#4B5563] transition-colors shadow-sm active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">tune</span>
                    ล้างตัวกรอง
                </button>
            </div>
        </div>
    );
}

export function GenericFilterBar({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
    return (
        <div className="bg-[#EAE6E4]/70 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-end justify-between border border-[#E5E2E1]/40">
            <div className="flex flex-wrap gap-6 text-[#5C403D] flex-1">
                {children}
            </div>

            <button
                onClick={onClear}
                className="h-[42px] px-8 bg-[#6B7280] text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#4B5563] transition-colors shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                ล้างตัวกรอง
            </button>
        </div>
    );
}

export type RoPaStatusType = "อนุมัติ" | "รอตรวจสอบ" | "ต้องแก้ไข" | "กำลังตรวจสอบ" | "ตรวจสอบเสร็จสิ้น" | "ฉบับร่าง" | "กำลังใช้งาน" | "ปิดการใช้งาน";

export function StatusBadge({ status }: { status: RoPaStatusType }) {
    const styles: Record<string, string> = {
        "อนุมัติ": "bg-[#228B15] text-white",                    // Reference Green
        "ตรวจสอบเสร็จสิ้น": "bg-[#228B15] text-white",           // Reference Green (Review)
        "เสร็จสมบูรณ์": "bg-[#228B15] text-white",               // Reference Green (Processor)
        "รอตรวจสอบ": "bg-[#FBBF24] text-[#5C403D]",               // Yellow
        "ต้องแก้ไข": "bg-[#EF4444] text-white",                  // Reference Red
        "ไม่เสร็จสมบูรณ์": "bg-[#EF4444] text-white",             // Reference Red (Processor)
        "กำลังตรวจสอบ": "bg-[#E5E7EB] text-[#6B7280]",          // Gray (Review)
        "รอดำเนินการ": "bg-[#FBBF24] text-[#5C403D]",                // Yellow
        "ฉบับร่าง": "bg-[#9CA3AF] text-white",                    // Secondary Gray
        "กำลังใช้งาน": "bg-[#228B15] text-white",               // Green
        "ปิดการใช้งาน": "bg-[#ED393C] text-white"                 // Red
    };

    return (
        <span className={`${styles[status] || styles["ฉบับร่าง"]} px-4 py-1 rounded-lg text-[10px] font-black inline-block text-center min-w-[100px] shadow-sm whitespace-nowrap`}>
            {status}
        </span>
    );
}

export function ActionButton({ icon, label, color = "black", onClick, disabled }: { icon: string; label: string; color?: "black" | "red" | "gray"; onClick?: () => void; disabled?: boolean }) {
    const colorClasses = {
        black: "text-[#1B1C1C] opacity-80 hover:opacity-100",
        red: "text-[#ED393C] hover:opacity-80",
        gray: "text-[#9CA3AF] hover:opacity-80"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 font-black text-[14px] transition-all ${colorClasses[color]} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
            <span className="material-symbols-outlined text-[20px] font-bold">{icon}</span>
            {label}
        </button>
    );
}

export function ListCard({ title, icon, iconColor = "#1B1C1C", children, showSort = false, filled = false }: { title: string; icon: string; iconColor?: string; children: React.ReactNode; showSort?: boolean; filled?: boolean }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40">
            <div className="p-5 flex items-center justify-between bg-[#F1EDEC]">
                <div className="flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ 
                            color: iconColor, 
                            fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'GRAD' 0, 'opsz' 24`
                        }}
                    >
                        {icon}
                    </span>
                    <h2 className="text-[17px] font-headline font-black text-[#1B1C1C] tracking-tight">{title}</h2>
                </div>
                {showSort && <span className="material-symbols-outlined text-secondary text-lg cursor-pointer">sort</span>}
            </div>
            <div className="p-6 pt-2 overflow-x-auto">
                {children}
            </div>
        </div>
    );
}

// แยกระบบใหม่ของคุณออกมาเป็น DocumentListCard เพื่อไม่ให้กระทบโค้ดเดิมของเพื่อน
export function DocumentListCard({
    title,
    icon,
    iconColor = "#1B1C1C",
    children,
    showSort = false,
    filled = false,
    bodyClassName = "p-6 pt-2"
}: {
    title: string;
    icon: string;
    iconColor?: string;
    children: React.ReactNode;
    showSort?: boolean;
    filled?: boolean;
    bodyClassName?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/40">
            <div className="p-5 flex items-center justify-between bg-[#E0D9D7] rounded-t-[11px]">
                <div className="flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ 
                            color: iconColor, 
                            fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'GRAD' 0, 'opsz' 24`
                        }}
                    >
                        {icon}
                    </span>
                    <h2 className="text-[17px] font-headline font-black text-[#1B1C1C] tracking-tight">{title}</h2>
                </div>
                {showSort && <span className="material-symbols-outlined text-secondary text-lg cursor-pointer">sort</span>}
            </div>
            <div className={`${bodyClassName} overflow-x-auto`}>
                {children}
            </div>
        </div>
    );
}


export function Pagination({ current, total, onChange }: { current: number; total: number; onChange?: (page: number) => void }) {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);

    return (
        <div className="flex justify-between items-center mt-8 text-[12px] font-bold text-[#6B7280]">
            <p className="opacity-80 font-medium">หน้า {current} จากทั้งหมด {total} หน้า</p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange?.(Math.max(1, current - 1))}
                    disabled={current === 1}
                    className="material-symbols-outlined text-[19px] cursor-pointer disabled:opacity-30 hover:opacity-60 transition-opacity"
                >
                    chevron_left
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onChange?.(p)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${p === current ? "bg-[#ED393C] text-white font-bold shadow-sm" : "hover:bg-gray-100 font-medium"}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange?.(Math.min(total, current + 1))}
                    disabled={current === total}
                    className="material-symbols-outlined text-[19px] cursor-pointer disabled:opacity-30 hover:text-[#ED393C] transition-colors"
                >
                    chevron_right
                </button>
            </div>
        </div>
    );
}

export function DocumentFilterBar({
    statusOptions,
    statusValue = "all",
    onStatusChange,
    dateValue = "all",
    onDateChange,
    customDate = "",
    onCustomDateChange,
    onClear,
    additionalFilters,
    statusLabel = "สถานะ"
}: {
    statusOptions?: { label: string, value: string }[],
    statusValue?: string,
    onStatusChange?: (val: string) => void,
    dateValue?: string,
    onDateChange?: (val: string) => void,
    customDate?: string,
    onCustomDateChange?: (val: string) => void,
    onClear?: () => void,
    additionalFilters?: React.ReactNode,
    statusLabel?: string
}) {
    return (
        <div className="bg-[#EAE4E3] rounded-xl p-5 flex flex-wrap md:flex-nowrap items-end gap-6 border border-[#E5E2E1] overflow-visible">
            <div className="w-full md:w-[340px] shrink-0">
                <Select
                    label={statusLabel}
                    labelClassName="!text-[15px] !font-extrabold !text-[#5C403D] !tracking-tight !ml-0"
                    name="statusFilter"
                    value={statusValue || "all"}
                    options={statusOptions || [
                        { label: "ทั้งหมด", value: "all" },
                        { label: "รอดำเนินการ", value: "wait_all" },
                        { label: "เสร็จสิ้นทั้งหมด", value: "done_all" },
                        { label: "รอ Data Owner", value: "wait_owner" },
                        { label: "รอ Data Processor", value: "wait_processor" },
                        { label: "Data Owner ดำเนินการเสร็จสิ้น", value: "done_owner" },
                        { label: "Data Processor ดำเนินการเสร็จสิ้น", value: "done_processor" }
                    ]}
                    onChange={(e) => { onStatusChange?.(e.target.value) }}
                />
            </div>
            <div className="flex items-end gap-4 w-[516px] shrink-0 overflow-visible">
                <div className="w-[300px] shrink-0">
                    <Select
                        label="ช่วงวันที่"
                        labelClassName="!text-[15px] !font-extrabold !text-[#5C403D] !tracking-tight !ml-0"
                        name="dateFilter"
                        value={dateValue || "7days"}
                        options={[
                            { label: "ภายใน 7 วัน", value: "7days" },
                            { label: "ภายใน 30 วัน", value: "30days" },
                            { label: "เกินกำหนด", value: "overdue" },
                            { label: "กำหนดเอง", value: "custom" }
                        ]}
                        onChange={(e) => { onDateChange?.(e.target.value) }}
                    />
                </div>
                <div className="w-[200px] shrink-0">
                    {dateValue === 'custom' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <ThaiDatePicker
                                label="เลือกวัน"
                                labelClassName="!text-[15px] !font-extrabold !text-[#5C403D] !tracking-tight !ml-0"
                                value={customDate || ""}
                                onChange={(val) => onCustomDateChange?.(val)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {additionalFilters && (
                <div className="flex-1 flex items-end overflow-visible">
                    {additionalFilters}
                </div>
            )}

            <button
                onClick={onClear}
                className="h-[46px] px-8 bg-[#5F5E5E] text-white rounded-lg flex items-center gap-2 font-bold hover:bg-[#4F4E4E] transition-colors md:ml-auto shrink-0 whitespace-nowrap"
            >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                ล้างตัวกรอง
            </button>
        </div>
    );
}

export function ActionIconWithTooltip({ icon, tooltipText, onClick, className = "", buttonClassName = "", disabled = false }: { icon: string, tooltipText: React.ReactNode, onClick?: () => void, className?: string, buttonClassName?: string, disabled?: boolean }) {
    return (
        <div className={`group/tooltip relative flex items-center justify-center ${className}`}>
            <button onClick={disabled ? undefined : onClick} disabled={disabled} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#CCCCCC]/40 cursor-pointer'} ${buttonClassName}`}>
                <span className="material-symbols-outlined text-[20px] outline-none stroke-current" style={icon === 'cancel_schedule_send' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {icon}
                </span>
            </button>
            <div className="absolute bottom-full mb-2 right-0 w-max opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[60]">
                <div className="bg-white border border-[#E5E2E1] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-3 text-[11px] font-medium text-[#5F5E5E] text-center pointer-events-none">
                    {tooltipText}
                </div>
            </div>
        </div>
    );
}

export function DocumentPagination({ current, totalPages, totalItems, itemsPerPage, onChange }: { current: number, totalPages: number, totalItems: number, itemsPerPage: number, onChange?: (p: number) => void }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const startItem = (current - 1) * itemsPerPage + 1;
    const endItem = Math.min(current * itemsPerPage, totalItems);

    return (
        <div className="flex justify-between items-center py-4 px-6 text-sm font-medium text-[#5F5E5E]">
            <span>แสดง {startItem} ถึง {endItem} จากทั้งหมด {totalItems} รายการ</span>
            <div className="flex gap-2 items-center text-xs">
                <button
                    onClick={() => onChange?.(current - 1)}
                    disabled={current === 1}
                    className="w-8 h-8 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100 rounded text-[#1B1C1C]"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onChange?.(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded font-bold ${p === current ? "bg-[#ED393C] text-white" : "hover:bg-gray-100 text-[#1B1C1C]"}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange?.(current + 1)}
                    disabled={current === totalPages}
                    className="w-8 h-8 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100 rounded text-[#1B1C1C]"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}

// Reusable Table Components for Data Owner
export function DocumentTable({ children }: { children: React.ReactNode }) {
    return (
        <table className="w-full text-center border-collapse mt-0 relative z-0">
            {children}
        </table>
    );
}

export function DocumentTableHead({ children }: { children: React.ReactNode }) {
    return (
        <thead>
            <tr className="bg-[#F6F3F2] border-b border-[#E5E2E1]/40">
                {children}
            </tr>
        </thead>
    );
}

export function DocumentTableHeader({ children, width, className = "", align = "center" }: { children: React.ReactNode, width?: string, className?: string, align?: "left" | "center" | "right" }) {
    const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
    return (
        <th className={`py-5 px-4 first:pl-6 last:pr-6 text-sm font-black tracking-tight text-[#5C403D] ${width || ""} ${alignClass} ${className}`}>
            {children}
        </th>
    );
}

export function DocumentTableHeaderWithTooltip({ title, tooltipText, width, className = "", align = "center" }: { title: React.ReactNode, tooltipText: React.ReactNode, width?: string, className?: string, align?: "left" | "center" | "right" }) {
    const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
    const justifyClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
    return (
        <th className={`py-5 px-4 first:pl-6 last:pr-6 text-sm font-black tracking-tight text-[#5C403D] ${width || ""} ${alignClass} ${className}`}>
            <div className={`flex items-center ${justifyClass} gap-1 group relative cursor-help`}>
                {title}
                <span className="material-symbols-outlined text-[16px] text-[#5C403D]">info</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                    <div className="bg-white border border-[#E5E2E1] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-3 text-[11px] font-medium text-[#5F5E5E] space-y-1 text-left leading-relaxed">
                        {tooltipText}
                    </div>
                </div>
            </div>
        </th>
    );
}

export function DocumentTableBody({ children }: { children: React.ReactNode }) {
    return (
        <tbody className="divide-y divide-[#E5E2E1] border-b border-[#E5E2E1]/40">
            {children}
        </tbody>
    );
}

export function DocumentTableRow({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <tr className={`hover:bg-[#F9FAFB] transition-colors group ${className}`}>
            {children}
        </tr>
    );
}

export function DocumentTableCell({ children, className = "", align = "center", colSpan }: { children: React.ReactNode, className?: string, align?: "left" | "center" | "right", colSpan?: number }) {
    let justifyClass = "";
    if (align === "left") justifyClass = "text-left text-[#5C403D]";
    else if (align === "center") justifyClass = "text-center text-[#5C403D]";

    return (
        <td colSpan={colSpan} className={`py-5 px-4 first:pl-6 last:pr-6 text-[13.5px] font-medium ${justifyClass} ${className}`}>
            {children}
        </td>
    );
}