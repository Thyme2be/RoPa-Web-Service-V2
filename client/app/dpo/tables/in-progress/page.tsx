"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, Pagination, GenericFilterBar } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SendToAuditorModal from "@/components/ui/SendToAuditorModal";

function InProgressTableContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");
    const [customDate, setCustomDate] = useState("");
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 5;

    const getStatusColor = (type: string) => {
        switch (type) {
            case "success": return "bg-[#228B15] text-white"; // Green
            case "warning": return "bg-[#FBBF24] text-[#5C403D]"; // Yellow
            case "edit": return "bg-[#ED393C] text-white"; // Red
            default: return "bg-gray-200 text-gray-700";
        }
    };

    const tooltipContent = (
        <div className="bg-white text-[#5C403D] p-5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-left border border-[#E5E2E1]/60 w-max max-w-[450px]">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-[#F1EDEC] pb-2">
                    <span className="text-[15px] font-bold tracking-tight text-[#5C403D]">สถานะ</span>
                    <span className="material-symbols-outlined text-[14px] opacity-70">info</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-baseline gap-4 text-[14px] whitespace-nowrap">
                        <span className="font-bold w-[100px] shrink-0">Data Owner</span>
                        <span className="font-medium opacity-80 leading-relaxed">หมายถึง ผู้รับผิดชอบข้อมูล</span>
                    </div>
                    <div className="flex items-baseline gap-4 text-[14px] whitespace-nowrap">
                        <span className="font-bold w-[100px] shrink-0">Data Processor</span>
                        <span className="font-medium opacity-80 leading-relaxed">หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Expanded Mock data for DPO In-Progress
    const mockDocsBase = [
        { id: "RP-2026-03", name: "ข้อมูลลูกค้า", owner: "นางสาวพรรษชล บุญมาก", receivedDate: "2026-03-20", displayReceivedDate: "20/03/2569", reviewDate: "25/03/2569", mainStatus: "ตรวจสอบเสร็จสิ้น", mainStatusType: "success", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-02", name: "การกำกับดูแลข้อมูลธุรกรรม", owner: "นางสาวพรรษชล บุญมาก", receivedDate: "2026-03-18", displayReceivedDate: "18/03/2569", reviewDate: "-", mainStatus: "รอตรวจสอบ", mainStatusType: "warning", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-04", name: "ข้อมูลพนักงาน", owner: "นายสมชาย ใจดี", receivedDate: "2026-04-10", displayReceivedDate: "10/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data Owner", mainStatusType: "edit", pairedStatus: [{ label: "รอส่วนของ Data Owner", type: "edit" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-05", name: "ข้อมูลการตลาด", owner: "นางสาวสมหญิง รักเรียน", receivedDate: "2026-04-12", displayReceivedDate: "12/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data processor", mainStatusType: "edit", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "รอส่วนของ Data processor", type: "edit" }] },
        { id: "RP-2026-06", name: "ระบบ CRM ใหม่", owner: "นายวิชาญ ดวงดี", receivedDate: "2026-04-14", displayReceivedDate: "14/04/2569", reviewDate: "-", mainStatus: "รอตรวจสอบ", mainStatusType: "warning" },
        { id: "RP-2026-07", name: "ข้อมูลสาขา", owner: "นางสาวปิยะนาถ มั่นคง", receivedDate: "2026-04-15", displayReceivedDate: "15/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data Owner", mainStatusType: "edit", pairedStatus: [{ label: "รอส่วนของ Data Owner", type: "edit" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-08", name: "การจัดการคุกกี้", owner: "นายสุรพล มีทรัพย์", receivedDate: "2026-03-05", displayReceivedDate: "05/03/2569", reviewDate: "15/03/2569", mainStatus: "ตรวจสอบเสร็จสิ้น", mainStatusType: "success", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-09", name: "ล็อกระบบเข้าถึงข้อมูล", owner: "นางสาวกรรณิกา ช่ำชอง", receivedDate: "2026-04-16", displayReceivedDate: "16/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data processor", mainStatusType: "edit", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "รอส่วนของ Data processor", type: "edit" }] },
        { id: "RP-2026-10", name: "นโยบายความเป็นส่วนตัว", owner: "นายกิตติศักดิ์ ภักดี", receivedDate: "2026-04-17", displayReceivedDate: "17/04/2569", reviewDate: "-", mainStatus: "รอตรวจสอบ", mainStatusType: "warning" },
        { id: "RP-2026-11", name: "ข้อมูลแอปพลิเคชัน", owner: "นางสาววรัญญา มีชัย", receivedDate: "2026-03-25", displayReceivedDate: "25/03/2569", reviewDate: "01/04/2569", mainStatus: "ตรวจสอบเสร็จสิ้น", mainStatusType: "success", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-12", name: "ข้อมูลธุรกรรมการเงิน", owner: "นายพงศกร รัตนผล", receivedDate: "2026-04-18", displayReceivedDate: "18/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data Owner", mainStatusType: "edit", pairedStatus: [{ label: "รอส่วนของ Data Owner", type: "edit" }, { label: "Data processor ดำเนินการเสร็จสิ้น", type: "success" }] },
        { id: "RP-2026-13", name: "ข้อมูลการจ้างงาน", owner: "นางสาวลดาวรรณ เจริญสุข", receivedDate: "2026-04-19", displayReceivedDate: "19/04/2569", reviewDate: "-", mainStatus: "รอส่วนของ Data processor", mainStatusType: "edit", pairedStatus: [{ label: "Data owner ดำเนินการเสร็จสิ้น", type: "success" }, { label: "รอส่วนของ Data processor", type: "edit" }] }
    ];

    // Filtering logic
    const filteredDocs = mockDocsBase.filter(doc => {
        // Search filter
        const matchesSearch = globalSearchQuery === "" ||
            doc.id.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            doc.owner.toLowerCase().includes(globalSearchQuery.toLowerCase());

        // Status filter
        const matchesStatus = selectedStatus === "ทั้งหมด" ||
            doc.mainStatus === selectedStatus ||
            (doc.pairedStatus && doc.pairedStatus.some(ps => ps.label === selectedStatus));

        // Date range filter
        let matchesDate = true;
        if (selectedDateRange !== "ทั้งหมด") {
            const docDate = new Date(doc.receivedDate);
            const now = new Date("2026-04-18"); // Using current "mock" date
            const diffDays = (now.getTime() - docDate.getTime()) / (1000 * 3600 * 24);

            if (selectedDateRange === "ภายใน 7 วัน") matchesDate = diffDays <= 7;
            else if (selectedDateRange === "ภายใน 30 วัน") matchesDate = diffDays <= 30;
            else if (selectedDateRange === "เกินกำหนด") matchesDate = diffDays > 30 && doc.reviewDate === "-";
            else if (selectedDateRange === "กำหนดเอง" && customDate) {
                matchesDate = doc.receivedDate === customDate;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 p-8 space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ดำเนินการ</h2>
                </div>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedDateRange("ทั้งหมด"); setCustomDate(""); setCurrentPage(1); }}>
                    <div className="w-[280px]">
                        <Select
                            label="สถานะ"
                            name="status"
                            rounding="xl"
                            bgColor="white"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                                { label: "รอส่วนของ Data Owner", value: "รอส่วนของ Data Owner" },
                                { label: "รอส่วนของ Data processor", value: "รอส่วนของ Data processor" },
                                { label: "Data owner ดำเนินการเสร็จสิ้น", value: "Data owner ดำเนินการเสร็จสิ้น" },
                                { label: "Data processor ดำเนินการเสร็จสิ้น", value: "Data processor ดำเนินการเสร็จสิ้น" },
                                { label: "ตรวจสอบเสร็จสิ้น", value: "ตรวจสอบเสร็จสิ้น" }
                            ]}
                            containerClassName="!w-full"
                        />
                    </div>
                    <div className="flex gap-6 items-end">
                        <div className="w-[280px]">
                            <Select
                                label="ช่วงวันที่"
                                name="dateRange"
                                rounding="xl"
                                bgColor="white"
                                value={selectedDateRange}
                                onChange={(e) => { setSelectedDateRange(e.target.value); setCurrentPage(1); }}
                                options={[
                                    { label: "ทั้งหมด", value: "ทั้งหมด" },
                                    { label: "ภายใน 7 วัน", value: "ภายใน 7 วัน" },
                                    { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" },
                                    { label: "เกินกำหนด", value: "เกินกำหนด" },
                                    { label: "กำหนดเอง", value: "กำหนดเอง" }
                                ]}
                                containerClassName="!w-full"
                            />
                        </div>

                        {selectedDateRange === "กำหนดเอง" && (
                            <div className="w-[200px] animate-in fade-in slide-in-from-left-2 duration-300">
                                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight mb-2">เลือกวันที่</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => { setCustomDate(e.target.value); setCurrentPage(1); }}
                                        className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 py-2 text-sm font-medium outline-none hover:border-primary/20 transition-all text-[#6B7280]"
                                    />
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">calendar_month</span>
                                </div>
                            </div>
                        )}
                    </div>
                </GenericFilterBar>

                {/* Table Section */}
                <div className="relative z-10">
                    <ListCard title="เอกสารที่ดำเนินการ" icon="check_circle" iconColor="#00818B">
                        <div className="overflow-visible">
                            <table className="w-full text-center border-collapse">
                                <thead className="relative z-20">
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อเอกสาร</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ได้รับ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">วันที่ตรวจสอบ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase overflow-visible">
                                            <div className="flex items-center justify-center gap-1 overflow-visible">
                                                <span>สถานะ</span>
                                                <CustomTooltip content={tooltipContent}>
                                                    <span className="text-[#5C403D] opacity-70 material-symbols-outlined text-xs cursor-help">info</span>
                                                </CustomTooltip>
                                            </div>
                                        </th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {currentDocs.length > 0 ? currentDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 text-[13.5px] font-medium text-left pl-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-secondary text-[13.5px] font-medium">{doc.id}</span>
                                                    <span className="text-[#1B1C1C] font-medium tracking-tight">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.owner}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.displayReceivedDate}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-secondary text-center">{doc.reviewDate}</td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1 items-center justify-center py-1">
                                                    {/* If it's DPO specific status, show only one badge */}
                                                    {doc.mainStatus === "รอตรวจสอบ" || doc.mainStatus === "ตรวจสอบเสร็จสิ้น" ? (
                                                        <span className={`px-4 py-1 rounded-lg text-[11px] font-black inline-block text-center min-w-[180px] shadow-sm ${getStatusColor(doc.mainStatusType)}`}>
                                                            {doc.mainStatus}
                                                        </span>
                                                    ) : (
                                                        /* For progress tracking, show only the pair of statuses */
                                                        <div className="flex flex-col gap-1">
                                                            {doc.pairedStatus && doc.pairedStatus.map((status, idx) => (
                                                                <span key={idx} className={`px-3 py-1 rounded-lg text-[10px] font-black inline-block text-center min-w-[180px] ${getStatusColor(status.type)} shadow-sm`}>
                                                                    {status.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center gap-3">
                                                    <Link 
                                                        href={`/dpo/tables/in-progress/${doc.id}`} 
                                                        title="ดูรายละเอียดและส่งข้อเสนอแนะ" 
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>comment</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => { setSelectedDocId(doc.id); setIsSendModalOpen(true); }}
                                                        title="ส่งให้ผู้ตรวจสอบ"
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>send</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-secondary opacity-60 font-medium">ไม่พบข้อมูลที่ค้นหา</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Area */}
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {startIndex + 1} ถึง {Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)} จากทั้งหมด {filteredDocs.length} รายการ
                                    </p>
                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                        <Pagination
                                            current={currentPage}
                                            total={totalPages}
                                            onChange={setCurrentPage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ListCard>
                </div>
            </div>

            {/* Send to Auditor Modal */}
            <SendToAuditorModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                onConfirm={(data) => {
                    console.log("Sending to auditor for doc:", selectedDocId, data);
                    setIsSendModalOpen(false);
                }}
            />
        </div>
    );
}

export default function InProgressPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <InProgressTableContent />
        </Suspense>
    );
}
