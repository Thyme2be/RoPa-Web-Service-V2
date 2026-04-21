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
            <div className="bg-white w-full max-w-[440px] rounded-[32px] shadow-2xl p-12 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-[#1B1C1C] hover:bg-gray-100 p-2 rounded-full transition-all"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                {/* Title */}
                <h2 className="text-[28px] font-black text-[#1B1C1C] tracking-tight leading-tight mt-6 mb-2">
                    ส่งคำร้องขอเปลี่ยนแปลง
                </h2>
                <p className="text-[16px] font-bold text-[#5F5E5E] leading-relaxed mb-10">
                    โปรดตรวจสอบข้อมูลให้ครบถ้วน
                </p>

                {/* Confirm Button */}
                <button
                    onClick={onConfirm}
                    className="w-full max-w-[240px] bg-logout-gradient leading-none text-white h-[52px] rounded-full font-black text-[16px] shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    ยืนยันการส่งคำร้อง
                </button>
            </div>
        </div>
    );
}
