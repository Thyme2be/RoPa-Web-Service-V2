"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SaveSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    subtitle?: string;
    buttonText?: string;
}

export default function SaveSuccessModal({
    isOpen,
    onClose,
    onConfirm,
    title = "บันทึกรายการ RoPA เสร็จสิ้น",
    subtitle = "สามารถดูเอกสารได้ที่ตารางแสดงเอกสารที่ดำเนินการ",
    buttonText = "ยืนยันการบันทึก"
}: SaveSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#1B1C1C]/40"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative p-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-[#1B1C1C] hover:bg-black/5 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-[28px] font-light">close</span>
                </button>

                <div className="space-y-4 mb-10 mt-4">
                    <h2 className="text-[32px] font-black text-[#1B1C1C] tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-[15px] font-bold text-[#5F5E5E] tracking-tight">
                        {subtitle}
                    </p>
                </div>

                <button
                    onClick={onConfirm}
                    className="bg-logout-gradient leading-none text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all w-fit min-w-[200px]"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
