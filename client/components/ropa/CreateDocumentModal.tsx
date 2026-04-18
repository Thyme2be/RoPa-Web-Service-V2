"use client";

import React, { useState } from "react";
import ThaiDatePicker from "@/components/ui/ThaiDatePicker";
import { cn } from "@/lib/utils";

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
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[580px] rounded-[40px] shadow-2xl p-10 relative flex flex-col items-start animate-in zoom-in-95 duration-300">
                <div className="space-y-1 mb-6 w-full">
                    <h2 className="text-[32px] font-black text-[#1C1B1F] tracking-tight leading-tight">
                        สร้างเอกสาร
                    </h2>
                    <p className="text-lg font-bold text-[#5F5E5E]">
                        กรอกข้อมูลในการสร้างเอกสาร
                    </p>
                </div>

                <div className="space-y-4 w-full">
                    {/* Document Name */}
                    <div className="space-y-1.5">
                        <label className="text-base font-black text-[#5C403D]">ชื่อเอกสาร</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ระบุชื่อเอกสาร..."
                            className="w-full h-[48px] bg-[#F1F1F1] border-none rounded-xl px-4 text-base font-medium outline-none focus:ring-2 focus:ring-[#ED393C]/20 transition-all placeholder:text-[#999]"
                        />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                        <label className="text-base font-black text-[#5C403D]">ชื่อบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล</label>
                        <input 
                            type="text" 
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="ระบุชื่อบริษัท..."
                            className="w-full h-[48px] bg-[#F1F1F1] border-none rounded-xl px-4 text-base font-medium outline-none focus:ring-2 focus:ring-[#ED393C]/20 transition-all placeholder:text-[#999]"
                        />
                    </div>

                    {/* Due Date */}
                    <div className="w-full">
                        <ThaiDatePicker 
                            label="วันครบกำหนด"
                            labelClassName="!text-base !font-black !text-[#5C403D] !mb-1.5"
                            value={dueDate}
                            onChange={setDueDate}
                            placeholder="วัน/เดือน/ปี"
                            variant="compact"
                        />
                    </div>
                </div>

                <div className="mt-8 w-full flex items-center justify-end gap-8">
                    <button 
                        onClick={onClose}
                        className="text-xl font-black text-[#1B1C1C] hover:text-[#ED393C] transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleCreate}
                        className="bg-logout-gradient leading-none text-white px-8 h-[52px] rounded-2xl font-black text-base shadow-lg shadow-[#ED393C]/20 hover:brightness-110 transition-all active:scale-95"
                    >
                        สร้างเอกสาร
                    </button>
                </div>
            </div>
        </div>
    );
}
