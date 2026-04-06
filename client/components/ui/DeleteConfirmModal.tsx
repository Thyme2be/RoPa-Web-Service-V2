"use client";

import React from "react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "ยืนยันการลบข้อมูล",
    description = "กรุณาตรวจสอบข้อมูลให้เรียบร้อยก่อนดำเนินการลบ",
    confirmLabel = "ลบข้อมูล",
    cancelLabel = "ยกเลิก",
    isLoading = false
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-[440px] rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 p-8 text-center">
                <h3 className="text-[22px] font-bold text-on-surface mb-3 tracking-tight">
                    {title}
                </h3>
                <p className="text-[#5C403D] font-medium text-[14px] mb-8 leading-relaxed">
                    {description}
                </p>

                <div className="flex flex-row items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-8 h-11 rounded-2xl text-[15px] font-bold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-10 h-11 bg-logout-gradient rounded-2xl shadow-lg shadow-red-900/20 text-white font-bold cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isLoading ? "กำลังลบ..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
