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
            <div className="relative bg-white w-full max-w-[540px] rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-12 flex flex-col items-center animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-10 p-2 text-[#1B1C1C] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center font-bold"
                >
                    <span className="material-symbols-outlined text-[32px] font-bold">
                        close
                    </span>
                </button>

                {/* Content */}
                <div className="mt-4 mb-10 text-center">
                    <h2 className="text-[36px] font-black text-[#1B1C1C] mb-4 tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-[20px] font-medium text-[#5F5E5E] px-4 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={onConfirm}
                    className="w-[320px] h-[72px] bg-gradient-to-r from-[#ED393C] to-[#9E1A1D] text-white text-[22px] font-black rounded-3xl shadow-[0_12px_24px_rgba(237,57,60,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
}
