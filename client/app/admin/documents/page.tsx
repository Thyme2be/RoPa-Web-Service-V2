"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DataTable, { Column } from "@/components/ui/DataTable";

export default function DocumentsPage() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [docsData, setDocsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = "http://localhost:8000";

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE_URL}/admin/documents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDocsData({
                    summary: data.summary,
                    documents_list: data.documents_list.map((d: any) => ({
                        id: d.id,
                        name: d.title,
                        type: d.data_type,
                        company: d.company,
                        completeness: d.completeness_percent,
                        status: d.status
                    }))
                });
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDocuments();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const ITEMS_PER_PAGE = 4;

    const safeDocsList = docsData?.documents_list || [];

    const filteredDocs = safeDocsList.filter((doc: any) => {
        const matchesStatus = selectedStatus === "ทั้งหมด" || doc.status === selectedStatus;
        const matchesSearch = doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const docColumns: Column<any>[] = [
        { header: "ชื่อเอกสาร", key: "name", width: "32%" },
        {
            header: "ประเภทข้อมูล", key: "type", width: "18%", align: "center", render: (doc) => (
                <span className="text-sm font-medium px-2 py-1 bg-secondary-container rounded text-neutral-700">
                    {doc.type}
                </span>
            )
        },
        {
            header: "บริษัท", key: "company", width: "20%", align: "center", render: (doc) => (
                <p className="text-xs font-bold text-neutral-800">{doc.company}</p>
            )
        },
        {
            header: "ความครบถ้วน", key: "completeness", width: "15%", align: "center", render: (doc) => (
                <div className="w-full max-w-[120px] mx-auto">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold ${doc.completeness === 100 ? "text-[#2C8C00]" : "text-secondary"}`}>
                            {doc.completeness}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                            className={`h-full ${doc.completeness === 100 ? "bg-[#2C8C00]" : "bg-secondary"}`}
                            style={{ width: `${doc.completeness}%` }}
                        ></div>
                    </div>
                </div>
            )
        },
        {
            header: "สถานะ", key: "status", width: "15%", align: "center", render: (doc) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold rounded-full ${doc.status === "เสร็จสมบูรณ์" ? "bg-[#2C8C00]" :
                    doc.status === "รอการตรวจสอบ" ? "bg-[#EFC65F]" :
                        doc.status === "รอการแก้ไข" ? "bg-[#BA1A1A]" :
                            doc.status === "กำลังกรอกข้อมูล" ? "bg-[#FF5500]" :
                                "bg-secondary"
                    }`}>
                    {doc.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-8 max-w-[1440px] mx-auto w-full">
            {/* Header Section */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-neutral-900">ศูนย์จัดการเอกสาร</h2>
                    <p className="text-[#5C403D] text-lg font-medium">รวบรวมและกำกับการประมวลผลข้อมูลส่วนบุคคลตามมาตราฐาน PDPA</p>
                </div>
            </div>

            {loading ? (
                <div className="flex h-full items-center justify-center p-8 text-on-surface-variant font-medium">กำลังโหลดข้อมูล...</div>
            ) : (
                <>
                    {/* Bento Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Total Documents */}
                        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] flex flex-col justify-between group transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-surface-container rounded-lg text-secondary transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                </div>
                                <span className="text-[14px] font-bold uppercase tracking-widest text-secondary">{docsData?.summary?.total_documents?.trend}</span>
                            </div>
                            <div className="mt-6">
                                <p className="text-4xl font-extrabold leading-none text-neutral-900">{docsData?.summary?.total_documents?.count?.toLocaleString() || 0}</p>
                                <p className="text-secondary font-medium mt-1 uppercase tracking-wider text-xs">เอกสารทั้งหมดในระบบ</p>
                            </div>
                        </div>

                        {/* Pending Review --> */}
                        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] flex flex-col justify-between group transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-tertiary-container rounded-lg text-white">
                                    <span className="material-symbols-outlined">pending_actions</span>
                                </div>
                                <span className="text-[14px] font-bold uppercase tracking-widest text-tertiary">{docsData?.summary?.pending_audit?.trend || "ต้องการการยืนยัน"}</span>
                            </div>
                            <div className="mt-6">
                                <p className="text-4xl font-extrabold leading-none text-neutral-900">
                                    {docsData?.summary?.pending_audit?.count?.toLocaleString() || 0}
                                </p>
                                <p className="text-secondary font-medium mt-1 uppercase tracking-wider text-xs">รอกำลังตรวจสอบ</p>
                            </div>
                        </div>
                    </div>

                    {/* Reusable Data Table Section */}
                    <DataTable
                        columns={docColumns}
                        data={paginatedDocs}
                        searchQuery={globalSearchQuery}
                        // Search is controlled globally, so we don't provide onSearchChange here
                        // but the table will still show the results based on filteredDocs
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={filteredDocs.length}
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
                                        <option value="รอการตรวจสอบ">รอการตรวจสอบ</option>
                                        <option value="รอการแก้ไข">รอการแก้ไข</option>
                                        <option value="กำลังกรอกข้อมูล">กำลังกรอกข้อมูล</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                                </div>
                            </>
                        }
                    />
                </>
            )}
        </div>
    );
}

