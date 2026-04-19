"use client";

import React, { useState } from "react";
import ThaiDatePicker from "@/components/ui/ThaiDatePicker";

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; company: string; dueDate: string }) => void;
}

export default function CreateDocumentModal({ isOpen, onClose, onCreate }: CreateDocumentModalProps) {
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [dueDate, setDueDate] = useState("");

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!name || !company || !dueDate) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        onCreate({ name, company, dueDate });
        // Reset form
        setName("");
        setCompany("");
        setDueDate("");
    };

    return (
        /* The z-[100] container is our stacking context root for this modal */
        <div 
            id="modal-root-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-300"
        >
            <div className="bg-white w-full max-w-[520px] rounded-[32px] shadow-2xl p-10 relative flex flex-col items-start animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="space-y-1 mb-6 w-full">
                    <h2 className="text-[28px] font-black text-[#1C1B1F] tracking-tight leading-tight">
                        สร้างเอกสาร
                    </h2>
                    <p className="text-base font-bold text-[#5F5E5E]">
                        กรอกข้อมูลในการสร้างเอกสาร
                    </p>
                </div>

                <div className="space-y-4 w-full">
                    {/* Document Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-black text-[#5C403D]">ชื่อเอกสาร</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ระบุชื่อเอกสาร..."
                            className="w-full h-[48px] bg-[#F6F3F2] border-none rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#ED393C]/20 transition-all placeholder:text-[#999]"
                        />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-black text-[#5C403D]">ชื่อบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล</label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="ระบุชื่อบริษัท..."
                            className="w-full h-[48px] bg-[#F6F3F2] border-none rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#ED393C]/20 transition-all placeholder:text-[#999]"
                        />
                    </div>

                    {/* Due Date + Buttons row */}
                    <div className="flex items-end gap-6 w-full pt-1">
                        {/* Date Picker */}
                        <div className="flex-1">
                            <label className="text-sm font-black text-[#5C403D] block mb-1.5">วันครบกำหนด</label>
                            <ThaiDatePicker
                                value={dueDate}
                                onChange={setDueDate}
                                placeholder="วัน/เดือน/ปี"
                                variant="compact"
                                portalContainerId="modal-root-overlay"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-6 pb-0.5 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="text-lg font-black text-[#1B1C1C] hover:text-[#ED393C] transition-colors whitespace-nowrap"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-logout-gradient leading-none text-white px-8 h-[48px] rounded-2xl font-black text-sm shadow-lg shadow-[#ED393C]/20 hover:brightness-110 transition-all active:scale-95 whitespace-nowrap"
                            >
                                สร้างเอกสาร
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
