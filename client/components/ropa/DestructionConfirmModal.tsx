"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DestructionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export default function DestructionConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: DestructionConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-[2px]"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white w-full max-w-[540px] rounded-[48px] shadow-2xl relative p-14 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 text-[#1B1C1C] hover:bg-black/5 rounded-full transition-colors group"
                >
                    <span className="material-symbols-outlined text-[32px] font-light group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>

                <div className="space-y-3 mb-10 mt-6">
                    <h2 className="text-[32px] font-black text-[#1B1C1C] tracking-tight leading-tight">
                        ส่งคำร้องขอทำลายเอกสาร
                    </h2>
                    <p className="text-[17px] font-bold text-[#5F5E5E] tracking-tight">
                        โปรดตรวจสอบข้อมูลให้ครบถ้วน
                    </p>
                </div>

                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                        "bg-logout-gradient leading-none text-white px-10 h-[64px] rounded-full font-black text-lg shadow-2xl shadow-red-900/40 transition-all w-full max-w-[320px] flex items-center justify-center gap-3",
                        isLoading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110 active:scale-95 cursor-pointer"
                    )}
                >
                    {isLoading ? (
                        <>
                            <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>กำลังส่งคำร้อง...</span>
                        </>
                    ) : (
                        "ยืนยันการส่งคำร้อง"
                    )}
                </button>
            </div>
        </div>
    );
}
