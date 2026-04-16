"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DataTable, { Column } from "@/components/ui/DataTable";

function TrackingPageContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");

    const [trackingData, setTrackingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = "http://localhost:8000";

    const fetchTrackingData = async () => {
        // Mock data
        const data = {
            role_summary: {
                data_owner: { count: 5, label: "รอยืนยันความถูกต้อง", progress_percent: 30 },
                data_processor: { count: 8, label: "อยู่ระหว่างประมวลผล", progress_percent: 60 },
                auditor: { count: 3, label: "รอตรวจสอบความยินยอม", progress_percent: 20 }
            },
            tracking_list: [
                { id: "1", title: "เอกสารข้อมูลพนักงาน (HR)", responsible_person: "สมชาย รักษา", auditor_name: "สมหญิง ตรวจสอบ", role: "Data Owner", last_updated: "2023-11-20 10:30", status: "completed" },
                { id: "2", title: "ข้อมูลลูกค้าการตลาด", responsible_person: "มาลี ดีใจ", auditor_name: "สมหญิง ตรวจสอบ", role: "Data Processor", last_updated: "2023-11-21 14:15", status: "pending" },
                { id: "3", title: "บันทึกข้อมูลกล้องวงจรปิด", responsible_person: "สมศักดิ์ ปลอดภัย", auditor_name: "สมหญิง ตรวจสอบ", role: "Data Owner", last_updated: "2023-11-22 09:00", status: "pending" },
                { id: "4", title: "ข้อมูลสัญญาคู่ค้า", responsible_person: "สมชาย รักษา", auditor_name: "สมหญิง ตรวจสอบ", role: "Data Processor", last_updated: "2023-11-23 11:45", status: "completed" }
            ]
        };
        setTrackingData(data);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchTrackingData();
    }, []);

    const mapStatus = (raw: string) => {
        if (!raw) return "รอดำเนินการ";
        if (raw.toLowerCase() === "completed") return "เสร็จสมบูรณ์";
        return "รอดำเนินการ";
    };

    const safeTrackingList = trackingData?.tracking_list || [];
    const mappedWorkflows = safeTrackingList.map((item: any) => ({
        id: item.id,
        name: item.title,
        owner: item.responsible_person || "-",
        auditor: item.auditor_name || "-",
        role: item.role || "",
        updatedAt: item.last_updated,
        status: mapStatus(item.status)
    }));

    const filteredWorkflows = mappedWorkflows.filter((workflow: any) => {
        const matchesStatus = selectedStatus === "ทั้งหมด" || workflow.status === selectedStatus;
        const matchesSearch = workflow.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            workflow.owner.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            workflow.auditor.toLowerCase().includes(globalSearchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const ITEMS_PER_PAGE = 4;
    const totalPages = Math.ceil(filteredWorkflows.length / ITEMS_PER_PAGE);
    const paginatedWorkflows = filteredWorkflows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const trackingColumns: Column<any>[] = [
        { header: "ชื่อเอกสาร", key: "name", width: "30%" },
        {
            header: "ผู้รับผิดชอบ", key: "owner", width: "20%", align: "center", render: (item) => (
                <span className="text-sm text-on-surface">{item.owner}</span>
            )
        },
        {
            header: "ผู้ตรวจสอบ", key: "auditor", width: "20%", align: "center", render: (item) => (
                <span className="text-sm text-on-surface">{item.auditor}</span>
            )
        },
        {
            header: "วันที่แก้ไขล่าสุด", key: "updatedAt", width: "15%", align: "center", render: (item) => (
                <span className="text-sm font-medium text-secondary">{item.updatedAt}</span>
            )
        },
        {
            header: "สถานะ", key: "status", width: "15%", align: "center", render: (item) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold rounded-full ${item.status === "เสร็จสมบูรณ์" ? "bg-[#2C8C00]" : "bg-[#EFC65F]"}`}>
                    {item.status}
                </span>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Page Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-xl font-bold tracking-tight text-[#5C403D]">ติดตามการทำงานภายในองค์กร</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-full items-center justify-center p-8 text-on-surface-variant font-medium">กำลังโหลดข้อมูล...</div>
                ) : (
                    <>
                        {/* Bento Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Controller */}
                            <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-[#B90A1E]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้รับผิดชอบข้อมูล</p>
                                    <span className="material-symbols-outlined text-[#B90A1E]">admin_panel_settings</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-1">
                                    {trackingData?.role_summary?.data_owner?.count || 0}
                                    <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                                </h3>
                                <p className="text-xs text-on-surface-variant">{trackingData?.role_summary?.data_owner?.label || "รอยืนยันความถูกต้อง"}</p>
                                <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                    <div className="bg-[#B90A1E] h-full transition-all" style={{ width: `${trackingData?.role_summary?.data_owner?.progress_percent || 0}%` }}></div>
                                </div>
                            </div>
                            {/* Processor */}
                            <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-tertiary-container">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                                    <span className="material-symbols-outlined text-tertiary-container">account_tree</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-1">
                                    {trackingData?.role_summary?.data_processor?.count || 0}
                                    <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                                </h3>
                                <p className="text-xs text-on-surface-variant">{trackingData?.role_summary?.data_processor?.label || "อยู่ระหว่างประมวลผล"}</p>
                                <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                    <div className="bg-tertiary-container h-full transition-all" style={{ width: `${trackingData?.role_summary?.data_processor?.progress_percent || 0}%` }}></div>
                                </div>
                            </div>
                            {/* DPO */}
                            <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-[#474747]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้ตรวจสอบ</p>
                                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-1">
                                    {trackingData?.role_summary?.auditor?.count || 0}
                                    <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                                </h3>
                                <p className="text-xs text-on-surface-variant">{trackingData?.role_summary?.auditor?.label || "รอตรวจสอบความยินยอม"}</p>
                                <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                    <div className="bg-secondary h-full transition-all" style={{ width: `${trackingData?.role_summary?.auditor?.progress_percent || 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Reusable Data Table Section */}
                        <DataTable
                            columns={trackingColumns}
                            data={paginatedWorkflows}
                            searchQuery={globalSearchQuery}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={filteredWorkflows.length}
                            filters={
                                <>
                                    {/* Status Filter */}
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0px_2px_8px_rgba(27,28,28,0.04)] relative group h-auto">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] shrink-0">สถานะ:</span>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                                            className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 p-0 pl-2 pr-10 cursor-pointer appearance-none outline-none relative z-10 leading-relaxed py-1"
                                        >
                                            <option value="ทั้งหมด">ทั้งหมด</option>
                                            <option value="เสร็จสมบูรณ์">เสร็จสมบูรณ์</option>
                                            <option value="รอดำเนินการ">รอดำเนินการ</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                                    </div>
                                </>
                            }
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-on-surface-variant font-medium">กำลังโหลด...</div>}>
            <TrackingPageContent />
        </Suspense>
    );
}

