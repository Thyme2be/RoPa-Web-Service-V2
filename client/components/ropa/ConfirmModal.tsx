"use client";

import React from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    description,
    confirmText,
    onConfirm,
    onCancel,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <h2 className="text-[22px] font-black text-[#1B1C1C] mb-3">{title}</h2>
                <p className="text-sm font-bold text-[#5F5E5E] mb-8">{description}</p>
                <div className="flex gap-4 w-full">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl border border-[#E5E2E1] font-bold text-[#5C403D] hover:bg-[#F6F3F2] transition-all disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl bg-logout-gradient text-white font-black shadow-lg shadow-[#ED393C]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
