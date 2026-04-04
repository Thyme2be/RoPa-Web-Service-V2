"use client";
import React, { useState } from "react";

export default function TrackingPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [searchQuery, setSearchQuery] = useState("");

    const MOCK_WORKFLOWS = [
        {
            id: "ROPA-2023-084",
            name: "การบริหารจัดการข้อมูลการขายและรายได้องค์กร",
            role: "ผู้ดูแลระบบ",
            owner: "นายธนพล พึ่งธรรม",
            updatedAt: "27/10/2023, 14:22",
            status: "รอการตรวจสอบ"
        },
        {
            id: "ROPA-2023-112",
            name: "ระบบจัดเก็บข้อมูลสมาชิกและพฤติกรรมผู้ใช้งาน",
            role: "ผู้รับผิดชอบข้อมูล",
            owner: "นายวรเมธ ศรีสวัสดิ์",
            updatedAt: "25/10/2023, 09:15",
            status: "รอการตรวจสอบ"
        },
        {
            id: "ROPA-2023-095",
            name: "การจัดการฐานข้อมูลสินค้าและคลังสินค้า",
            role: "ผู้ตรวจสอบ",
            owner: "นางอรอนงค์ มีเดช",
            updatedAt: "24/10/2023, 16:30",
            status: "เสร็จสมบูรณ์"
        },
        {
            id: "ROPA-2023-144",
            name: "ระบบบริหารข้อมูลซัพพลายเออร์และการจัดซื้อ",
            role: "ผู้ประมวลผลข้อมูลส่วนบุคคล",
            owner: "นายกิตติพงษ์ สดใส",
            updatedAt: "05/10/2023, 11:45",
            status: "รอการตรวจสอบ"
        }
    ];

    const filteredWorkflows = MOCK_WORKFLOWS.filter(workflow => {
        const matchesRole = selectedRole === "ทั้งหมด" || workflow.role === selectedRole;
        const matchesStatus = selectedStatus === "ทั้งหมด" || workflow.status === selectedStatus;
        const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workflow.owner.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesStatus && matchesSearch;
    });

    const ITEMS_PER_PAGE = 4;
    const totalPages = Math.ceil(filteredWorkflows.length / ITEMS_PER_PAGE);
    const paginatedWorkflows = filteredWorkflows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Page Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-xl font-bold tracking-tight text-[#5C403D]">ติดตามการทำงานภายในองค์กร</p>
                    </div>
                </div>

                {/* Bento Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Controller */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-[#B90A1E]">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้รับผิดชอบข้อมูล</p>
                            <span className="material-symbols-outlined text-[#B90A1E]">admin_panel_settings</span>
                        </div>
                        <h3 className="text-2xl font-extrabold mb-1">
                            {MOCK_WORKFLOWS.filter(w => w.role === "ผู้รับผิดชอบข้อมูล" || w.role === "ผู้ดูแลระบบ").length} 
                            <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">รอยืนยันความถูกต้อง</p>
                        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                            <div className="bg-[#B90A1E] h-full w-[65%]"></div>
                        </div>
                    </div>
                    {/* Processor */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-tertiary-container">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้ประมวลผลข้อมูลส่วนบุคคล</p>
                            <span className="material-symbols-outlined text-tertiary-container">account_tree</span>
                        </div>
                        <h3 className="text-2xl font-extrabold mb-1">
                            {MOCK_WORKFLOWS.filter(w => w.role === "ผู้ประมวลผลข้อมูลส่วนบุคคล").length} 
                            <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">อยู่ระหว่างประมวลผล</p>
                        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                            <div className="bg-tertiary-container h-full w-[40%]"></div>
                        </div>
                    </div>
                    {/* DPO */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.04)] border-l-4 border-[#474747]">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-secondary">บทบาท: ผู้ตรวจสอบ</p>
                            <span className="material-symbols-outlined text-secondary">verified_user</span>
                        </div>
                        <h3 className="text-2xl font-extrabold mb-1">
                            {MOCK_WORKFLOWS.filter(w => w.role === "ผู้ตรวจสอบ").length} 
                            <span className="text-sm font-medium text-secondary"> ฉบับ</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">รอตรวจสอบความยินยอม</p>
                        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                            <div className="bg-secondary h-full w-[25%]"></div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] overflow-hidden">
                    {/* Table Header Content */}
                    <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container-lowest">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-[#B90A1E] rounded-full"></div>
                            <h3 className="text-lg font-bold tracking-tight">รายการติดตามเอกสาร</h3>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="px-6 py-4 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
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

                            {/* Status Filter */}
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

                        {/* Search Input */}
                        <div className="flex-1 max-w-md relative mx-4">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
                            <input
                                type="text"
                                placeholder="ค้นหา..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl shadow-[0px_2px_8px_rgba(27,28,28,0.04)] border-none text-sm font-medium text-on-surface focus:ring-2 focus:ring-[#B90A1E]/20 transition-all outline-none"
                            />
                        </div>

                        <div className="text-[14px] font-bold uppercase tracking-widest text-[#1B1C1C]">
                            แสดงผล {filteredWorkflows.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkflows.length)} จาก {filteredWorkflows.length} รายการ
                        </div>
                    </div>

                    {/* High-density Data Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low/40">
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ชื่อเอกสาร</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ผู้รับผิดชอบ</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">วันที่แก้ไขล่าสุด</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedWorkflows.map((workflow) => (
                                    <tr key={workflow.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-surface-container/30">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-on-surface">{workflow.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-sm text-on-surface">{workflow.owner}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-secondary">{workflow.updatedAt}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold rounded-full ${workflow.status === "เสร็จสมบูรณ์" ? "bg-[#2C8C00]" : "bg-[#EFC65F]"}`}>
                                                {workflow.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="px-6 py-3 bg-surface-container-low/30 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`text-xs font-bold flex items-center gap-1 transition-all ${currentPage === 1 ? "text-secondary opacity-50 cursor-not-allowed" : "text-secondary hover:text-[#B90A1E] cursor-pointer"
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span> ย้อนกลับ
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${currentPage === page
                                        ? "bg-[#B90A1E] text-white shadow-md shadow-red-900/10"
                                        : "hover:bg-surface-container-high text-on-surface"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`text-xs font-bold flex items-center gap-1 transition-all ${currentPage === totalPages ? "text-secondary opacity-50 cursor-not-allowed" : "text-secondary hover:text-[#B90A1E] cursor-pointer"
                                }`}
                        >
                            ถัดไป <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
