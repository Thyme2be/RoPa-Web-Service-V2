"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const MOCK_DOCUMENTS = [
    {
        id: 1,
        name: "การจัดการข้อมูลด้านการเงินส่วนบุคคล",
        type: "ข้อมูลอ่อนไหว",
        company: "Netbay PLC.",
        completeness: 100,
        status: "เสร็จสมบูรณ์",
        role: "ผู้ดูแลระบบ"
    },
    {
        id: 2,
        name: "ระบบข้อมูลการให้บริการลูกค้า",
        type: "ข้อมูลทั่วไป",
        company: "Netbay PLC.",
        completeness: 65,
        status: "รอการตรวจสอบ",
        role: "ผู้รับผิดชอบข้อมูล"
    },
    {
        id: 3,
        name: "การบริหารข้อมูลโครงการและแผนงานองค์กร",
        type: "ข้อมูลอ่อนไหว",
        company: "Netbay PLC.",
        completeness: 65,
        status: "รอการตรวจสอบ",
        role: "ผู้ประมวลผลข้อมูลส่วนบุคคล"
    },
    {
        id: 4,
        name: "การบริหารจัดการข้อมูลธุรกรรมดิจิทัล",
        type: "ข้อมูลอ่อนไหว",
        company: "Netbay PLC.",
        completeness: 92,
        status: "รอการตรวจสอบ",
        role: "ผู้ตรวจสอบ"
    },
    {
        id: 5,
        name: "การจัดการสิทธิ์การเข้าถึงอาคารสำนักงาน",
        type: "ข้อมูลทั่วไป",
        company: "Netbay PLC.",
        completeness: 100,
        status: "เสร็จสมบูรณ์",
        role: "ผู้ดูแลระบบ"
    },
    {
        id: 6,
        name: "ระบบบันทึกเวลาทำงานและสวัสดิการพนักงาน",
        type: "ข้อมูลอ่อนไหว",
        company: "Netbay PLC.",
        completeness: 45,
        status: "รอการตรวจสอบ",
        role: "ผู้รับผิดชอบข้อมูล"
    },
    {
        id: 7,
        name: "การประมวลผลข้อมูลแคมเปญการตลาด",
        type: "ข้อมูลทั่วไป",
        company: "Netbay PLC.",
        completeness: 100,
        status: "เสร็จสมบูรณ์",
        role: "ผู้ประมวลผลข้อมูลส่วนบุคคล"
    },
    {
        id: 8,
        name: "ระบบบริหารจัดการคลังสินค้าอัจฉริยะ",
        type: "ข้อมูลทั่วไป",
        company: "Netbay PLC.",
        completeness: 88,
        status: "เสร็จสมบูรณ์",
        role: "ผู้ตรวจสอบ"
    },
    {
        id: 9,
        name: "ข้อมูลประวัติการรักษาพยาบาลเบื้องต้น",
        type: "ข้อมูลอ่อนไหว",
        company: "Netbay PLC.",
        completeness: 10,
        status: "รอการตรวจสอบ",
        role: "ผู้ประมวลผลข้อมูลส่วนบุคคล"
    },
    {
        id: 10,
        name: "การจัดการข้อมูลคู่ค้าและซัพพลายเออร์",
        type: "ข้อมูลทั่วไป",
        company: "Netbay PLC.",
        completeness: 100,
        status: "เสร็จสมบูรณ์",
        role: "ผู้ตรวจสอบ"
    }
];

const MOCK_DOCS_STATS = {
    totalTrend: "+12% เดือนนี้"
};

export default function DocumentsPage() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const ITEMS_PER_PAGE = 4;
    
    const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
        const matchesRole = selectedRole === "ทั้งหมด" || doc.role === selectedRole;
        const matchesStatus = selectedStatus === "ทั้งหมด" || doc.status === selectedStatus;
        const matchesSearch = doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase());
        return matchesRole && matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-8 max-w-[1440px] mx-auto w-full">
            {/* Header Section */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-neutral-900">ศูนย์จัดการเอกสาร</h2>
                    <p className="text-[#5C403D] text-lg font-medium">รวบรวมและกำกับการประมวลผลข้อมูลส่วนบุคคลตามมาตราฐาน PDPA</p>
                </div>
            </div>

            {/* Bento Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Documents */}
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-surface-container rounded-lg text-secondary transition-colors">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-widest text-secondary">{MOCK_DOCS_STATS.totalTrend}</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-4xl font-extrabold leading-none text-neutral-900">{MOCK_DOCUMENTS.length.toLocaleString()}</p>
                        <p className="text-secondary font-medium mt-1 uppercase tracking-wider text-xs">เอกสารทั้งหมดในระบบ</p>
                    </div>
                </div>

                {/* Pending Review --> */}
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-tertiary-container rounded-lg text-white">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-widest text-tertiary">ต้องการการยืนยัน</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-4xl font-extrabold leading-none text-neutral-900">
                            {MOCK_DOCUMENTS.filter(doc => doc.status === "รอการตรวจสอบ").length.toLocaleString()}
                        </p>
                        <p className="text-secondary font-medium mt-1 uppercase tracking-wider text-xs">รอกำลังตรวจสอบ</p>
                    </div>
                </div>
            </div>

            {/* Filters & Table Section */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] overflow-hidden">
                {/* Filters Header */}
                <div className="p-6 bg-surface-container-low/50 flex flex-wrap items-center gap-4">
                    <div className="flex gap-4">
                        {/* Role Filter */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0px_2px_8px_rgba(27,28,28,0.04)] relative group transition-all hover:shadow-md h-auto">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] shrink-0">บทบาท:</span>
                            <select 
                                value={selectedRole}
                                onChange={(e) => {
                                    setSelectedRole(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 p-0 pl-2 pr-10 cursor-pointer appearance-none outline-none relative z-10 leading-relaxed py-1"
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                                <option value="ผู้รับผิดชอบข้อมูล">ผู้รับผิดชอบข้อมูล</option>
                                <option value="ผู้ประมวลผลข้อมูลส่วนบุคคล">ผู้ประมวลผลข้อมูลส่วนบุคคล</option>
                                <option value="ผู้ตรวจสอบ">ผู้ตรวจสอบ</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                        </div>

                        {/* Status Filter --> */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0px_2px_8px_rgba(27,28,28,0.04)] relative group transition-all hover:shadow-md h-auto">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] shrink-0">สถานะ:</span>
                            <select 
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 p-0 pl-2 pr-10 cursor-pointer appearance-none outline-none relative z-10 leading-relaxed py-1"
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                <option value="เสร็จสมบูรณ์">เสร็จสมบูรณ์</option>
                                <option value="รอการตรวจสอบ">รอการตรวจสอบ</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Table --> */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/40">
                                <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ชื่อรายการ</th>
                                <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ประเภทข้อมูล</th>
                                <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">บริษัท</th>
                                <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ความครบถ้วน</th>
                                <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {paginatedDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-surface-container-low/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-on-surface">{doc.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium px-2 py-1 bg-secondary-container rounded text-neutral-700">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <p className="text-xs font-bold text-neutral-800">{doc.company}</p>
                                    </td>
                                    <td className="px-6 py-4">
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
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold rounded-full ${doc.status === "เสร็จสมบูรณ์" ? "bg-[#2C8C00]" : "bg-[#EFC65F]"}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination --> */}
                <div className="p-6 bg-surface-container-low/30 flex items-center justify-between border-t border-surface-container">
                    <p className="text-xs text-secondary font-bold tracking-tight">
                        แสดง {filteredDocs.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)} จาก {filteredDocs.length} รายการ
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${currentPage === 1 ? "text-neutral-300 pointer-events-none" : "hover:bg-surface-container text-secondary"}`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all ${currentPage === index + 1
                                    ? "bg-[#B90A1E] text-white shadow-sm"
                                    : "hover:bg-surface-container text-neutral-700"
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${currentPage === totalPages ? "text-neutral-300 pointer-events-none" : "hover:bg-surface-container text-secondary"}`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
