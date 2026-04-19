"use client";

import React, { useState } from "react";
import Select from "./Select";

interface SendToAuditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    isLoading?: boolean;
}

export default function SendToAuditorModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: SendToAuditorModalProps) {
    const [auditorType, setAuditorType] = useState<"internal" | "external">("internal");
    const [department, setDepartment] = useState("");
    const [prefix, setPrefix] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dueDate, setDueDate] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            auditorType,
            department,
            prefix,
            firstName,
            lastName,
            dueDate
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 p-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-8 top-8 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Auditor Type */}
                    <div className="space-y-4">
                        <label className="text-[18px] font-black text-[#5C403D] tracking-tight block">ประเภทของผู้ตรวจสอบ</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setAuditorType("internal")}
                                className={`flex-1 h-12 rounded-xl text-[15px] font-bold transition-all cursor-pointer ${auditorType === "internal"
                                    ? "bg-logout-gradient text-white shadow-lg shadow-red-900/10"
                                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-gray-200"
                                    }`}
                            >
                                ภายในองค์กร
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuditorType("external")}
                                className={`flex-1 h-12 rounded-xl text-[15px] font-bold transition-all border border-gray-200 cursor-pointer ${auditorType === "external"
                                    ? "bg-logout-gradient text-white"
                                    : "bg-white text-[#6B7280] hover:bg-gray-50"
                                    }`}
                            >
                                ภายนอกองค์กร
                            </button>
                        </div>
                    </div>

                    {/* Department - Only shown if internal */}
                    {auditorType === "internal" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-[16px] font-black text-[#5C403D] tracking-tight block">ระบุแผนก</label>
                            <Select
                                name="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="เลือกแผนก..."
                                options={[
                                    { label: "แผนกขาย", value: "แผนกขาย" },
                                    { label: "แผนกการตลาด", value: "แผนกการตลาด" },
                                    { label: "แผนกประชาสัมพันธ์", value: "แผนกประชาสัมพันธ์" },
                                    { label: "แผนก IT", value: "แผนก IT" },
                                    { label: "แผนก HR", value: "แผนก HR" }
                                ]}
                                rounding="xl"
                                bgColor="white"
                                error=""
                                containerClassName="!w-full"
                            />
                        </div>
                    )}

                    {/* Auditor Name */}
                    <div className="space-y-3">
                        <label className="text-[16px] font-black text-[#5C403D] tracking-tight block">ระบุชื่อผู้ตรวจสอบ</label>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4 space-y-1.5">
                                <label className="text-[13px] font-medium text-[#6B7280] px-1">คำนำ</label>
                                <Select
                                    name="prefix"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                    placeholder="เลือก..."
                                    options={[
                                        { label: "นางสาว", value: "นางสาว" },
                                        { label: "นาย", value: "นาย" },
                                        { label: "นาง", value: "นาง" }
                                    ]}
                                    rounding="xl"
                                    bgColor="white"
                                    error=""
                                    containerClassName="!w-full"
                                />
                            </div>
                            <div className="col-span-4 space-y-1.5">
                                <label className="text-[13px] font-medium text-[#6B7280] px-1">ชื่อจริง</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    placeholder="กรอกชื่อจริง"
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 text-sm font-medium outline-none focus:border-red-500/30 transition-all text-[#1B1C1C]"
                                />
                            </div>
                            <div className="col-span-4 space-y-1.5">
                                <label className="text-[13px] font-medium text-[#6B7280] px-1">นามสกุล</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    placeholder="กรอกนามสกุล"
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 text-sm font-medium outline-none focus:border-red-500/30 transition-all text-[#1B1C1C]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="text-[16px] font-black text-[#5C403D] tracking-tight block">วันที่กำหนดส่ง</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                placeholder="วัน/เดือน/ปี"
                                className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-red-500/30 transition-all text-[#6B7280] appearance-none"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">calendar_month</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 h-12 rounded-xl text-[15px] font-bold text-[#6B7280] border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-10 h-12 bg-logout-gradient rounded-xl shadow-lg shadow-red-900/20 text-white font-bold text-[15px] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isLoading ? "กำลังส่ง..." : "ส่งให้ผู้ตรวจสอบ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
