"use client";

import React from "react";

interface SaveConfirmModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function SaveConfirmModal({
    isOpen,
    title = "บันทึกรายการ RoPA",
    description = "ตรวจสอบความถูกต้องของข้อมูลก่อนยืนยันการบันทึก",
    confirmText = "ยืนยันการบันทึก",
    onConfirm,
    onClose
}: SaveConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-[620px] rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-14 flex flex-col items-center animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-10 right-12 p-2 text-[#1B1C1C] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center font-bold"
                >
                    <span className="material-symbols-outlined text-[36px] font-bold">
                        close
                    </span>
                </button>

                {/* Content */}
                <div className="mt-8 mb-14 text-center space-y-4">
                    <h2 className="text-[42px] font-black text-[#1B1C1C] tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-[22px] font-medium text-[#5F5E5E] px-8 leading-relaxed opacity-90">
                        {description}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-6 w-full justify-center">
                    <button
                        onClick={onClose}
                        className="flex-1 max-w-[200px] h-[64px] border border-[#E5E2E1] text-[#1B1C1C] text-[18px] font-bold rounded-3xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 max-w-[300px] h-[64px] bg-gradient-to-r from-[#ED393C] to-[#9E1A1D] text-white text-[18px] font-black rounded-3xl shadow-[0_10px_20px_rgba(237,57,60,0.25)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
