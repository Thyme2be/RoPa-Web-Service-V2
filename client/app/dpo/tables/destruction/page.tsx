"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, StatusBadge, GenericFilterBar, Pagination } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function DestructionTableContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");

    const ITEMS_PER_PAGE = 5;

    const fetchDestructionRequests = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
            setError("ไม่พบสิทธิ์การเข้าถึง กรุณาเข้าสู่ระบบใหม่");
            setLoading(false);
            return;
        }

        try {
            const daysFilter = selectedDateRange === "ภายใน 7 วัน" ? 7 : (selectedDateRange === "ภายใน 30 วัน" ? 30 : 0);
            
            let statusFilter = "";
            if (selectedStatus === "รอตรวจสอบทำลาย") statusFilter = "PENDING";
            else if (selectedStatus === "อนุมัติการทำลาย") statusFilter = "APPROVED";
            else if (selectedStatus === "ไม่อนุมัติการทำลาย") statusFilter = "REJECTED";

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                days_filter: daysFilter.toString()
            });

            if (statusFilter) queryParams.append("status", statusFilter);
            if (globalSearchQuery) queryParams.append("search", globalSearchQuery);

            const response = await fetch(`${API_BASE_URL}/dashboard/dpo/destruction-requests?${queryParams.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("ไม่สามารถเรียกข้อมูลคำขอทำลายได้");
            const data = await response.json();
            setDocuments(data.items || []);
            setTotalItems(data.total || 0);
        } catch (err: any) {
            console.error("Fetch destruction requests error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDestructionRequests();
    }, [currentPage, selectedStatus, selectedDateRange, globalSearchQuery]);

    const formatThaiDate = (dateStr: string | null) => {
        if (!dateStr || dateStr === "-") return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusType = (apiStatus: string) => {
        switch (apiStatus) {
            case "PENDING": return "warning";
            case "APPROVED": return "success";
            case "REJECTED": return "edit";
            default: return "neutral";
        }
    };

    const getDisplayStatus = (apiStatus: string) => {
        switch (apiStatus) {
            case "PENDING": return "รอตรวจสอบทำลาย";
            case "APPROVED": return "อนุมัติการทำลาย";
            case "REJECTED": return "ไม่อนุมัติการทำลาย";
            default: return apiStatus;
        }
    };

    const getStatusColor = (type: string) => {
        switch (type) {
            case "success": return "bg-[#228B15] text-white"; // Green
            case "warning": return "bg-[#FBBF24] text-[#5C403D]"; // Yellow
            case "edit": return "bg-[#ED393C] text-white"; // Red
            default: return "bg-gray-200 text-gray-700";
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 p-8 space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารที่ขอทำลาย</h2>
                </div>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedDateRange("ทั้งหมด"); setCurrentPage(1); }}>
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
                                { label: "รอตรวจสอบทำลาย", value: "รอตรวจสอบทำลาย" },
                                { label: "อนุมัติการทำลาย", value: "อนุมัติการทำลาย" },
                                { label: "ไม่อนุมัติการทำลาย", value: "ไม่อนุมัติการทำลาย" }
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
                                    { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" }
                                ]}
                                containerClassName="!w-full"
                            />
                        </div>
                    </div>
                </GenericFilterBar>

                {/* Table Section */}
                <div className="relative z-10">
                    <ListCard title="เอกสารที่ขอทำลาย" icon="delete" iconColor="#ED393C">
                        <div className="overflow-visible">
                            <table className="w-full text-center border-collapse">
                                <thead className="relative z-20">
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-left pl-4">ชื่อเอกสาร</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">ชื่อผู้รับผิดชอบข้อมูล</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">วันที่ได้รับ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">วันที่ตรวจสอบ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">สถานะ</th>
                                        <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-[#5F5E5E] font-medium italic animate-pulse">กำลังโหลดข้อมูล...</td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-[#ED393C] font-black">{error}</td>
                                        </tr>
                                    ) : documents.length > 0 ? documents.map((doc) => (
                                        <tr key={doc.raw_document_id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 text-[13.5px] font-medium text-left pl-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[#5F5E5E] text-[13.5px] font-medium">{doc.document_id}</span>
                                                    <span className="text-[#5F5E5E] font-medium tracking-tight">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">{doc.owner}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">{formatThaiDate(doc.received_date)}</td>
                                            <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">{formatThaiDate(doc.destruction_date)}</td>
                                            <td className="py-4">
                                                <div className="flex justify-center py-1">
                                                    <span className={`px-4 py-1 rounded-lg text-[11px] font-black inline-block text-center shadow-sm ${getStatusColor(getStatusType(doc.status))}`}>
                                                        {getDisplayStatus(doc.status)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center">
                                                    <Link 
                                                        href={`/dpo/tables/destruction/${doc.raw_document_id}`} 
                                                        title="ดูรายละเอียดและทำลาย" 
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-[#5F5E5E] opacity-60 font-medium">ไม่พบข้อมูลที่ค้นหา</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Area */}
                            {!loading && !error && documents.length > 0 && (
                                <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                    <div className="px-6 flex items-center justify-between">
                                        <p className="text-[12px] font-medium text-[#5F5E5E] opacity-80">
                                            แสดง {startIndex + 1} ถึง {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} จากทั้งหมด {totalItems} รายการ
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
                            )}
                        </div>
                    </ListCard>
                </div>
            </div>
        </div>
    );
}

export default function DestructionPage() {
    return (
        <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
            <DestructionTableContent />
        </Suspense>
    );
}
