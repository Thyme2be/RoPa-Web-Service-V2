"use client";

import React, { useState, useEffect } from "react";
import ThaiDatePicker from "@/components/ui/ThaiDatePicker";
import Select from "@/components/ui/Select";
import { ownerService } from "@/services/ownerService";

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; company: string; dueDate: string }) => void;
}

export default function CreateDocumentModal({ isOpen, onClose, onCreate }: CreateDocumentModalProps) {
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [companies, setCompanies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [companyError, setCompanyError] = useState("");

    useEffect(() => {
        if (isOpen) {
            const fetchCompanies = async () => {
                setIsLoading(true);
                try {
                    const data = await ownerService.getProcessorCompanies();
                    setCompanies(data);
                } catch (error) {
                    console.error("Failed to fetch companies:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCompanies();
        } else {
            // Reset state on close
            setName("");
            setCompany("");
            setDueDate("");
            setCompanyError("");
        }
    }, [isOpen]);



    const handleCompanyChange = async (val: string) => {
        setCompany(val);
        setCompanyError(""); // Clear old error

        if (val) {
            try {
                const res = await ownerService.checkProcessorAvailability(val);
                if (!res.available) {
                    setCompanyError(res.message || "ไม่พบผู้ประมวลผลข้อมูลส่วนบุคคลในบริษัทนี้");
                }
            } catch (error) {
                console.error("Validation error:", error);
            }
        }
    };

    if (!isOpen) return null;

    const companyOptions = companies.map(c => ({
        label: c,
        value: c
    }));

    const handleCreate = () => {
        if (!name || !company || !dueDate) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        if (companyError) {
            alert(companyError);
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

                    {/* Company Dropdown */}
                    <div className="space-y-1.5 focus-within:z-50">
                        <Select
                            label="ชื่อบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล"
                            options={companyOptions}
                            value={company}
                            name="company"
                            placeholder={isLoading ? "กำลังโหลดข้อมูล..." : "เลือกบริษัท..."}
                            onChange={(e) => handleCompanyChange(e.target.value)}
                            error={companyError}
                            required
                        />
                    </div>

                    {/* Due Date + Buttons row */}
                    <div className="flex items-end gap-6 w-full pt-1">
                        {/* Date Picker */}
                        <div className="flex-1">
                            <label className="text-sm font-black text-[#5C403D] block mb-1.5">วันที่กำหนดส่ง</label>
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
