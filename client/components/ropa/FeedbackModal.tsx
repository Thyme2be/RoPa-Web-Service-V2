"use client";

import React from "react";

interface FeedbackModalProps {
    isOpen: boolean;
    sectionName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function FeedbackModal({ isOpen, sectionName, onClose, onConfirm }: FeedbackModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-10 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px] text-[#1B1C1C]">close</span>
                </button>

                {/* Icon */}
                <div className="bg-primary/5 p-4 rounded-2xl mb-6">
                    <span className="material-symbols-outlined text-primary text-[32px]">send</span>
                </div>

                {/* Title */}
                <h2 className="text-[22px] font-black text-[#1B1C1C] tracking-tight leading-tight mb-2">
                    ส่งคำร้องขอเปลี่ยนแปลง
                </h2>
                <p className="text-sm font-bold text-[#5F5E5E] leading-relaxed mb-8">
                    ไปยังส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                    {sectionName && (
                        <span className="block text-[#1B1C1C] mt-1">({sectionName})</span>
                    )}
                </p>

                {/* Confirm Button */}
                <button
                    onClick={onConfirm}
                    className="w-full bg-logout-gradient leading-none text-white h-[52px] rounded-2xl font-black text-base shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    ยืนยันการร้องขอ
                </button>
            </div>
        </div>
    );
}
