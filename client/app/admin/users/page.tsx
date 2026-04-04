"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function UsersPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "NONE",
        password: ""
    });

    const API_BASE_URL = "http://localhost:8000";

    const MOCK_USERS = [
        { id: 1, name: "นายอนันต์ มุ่งมั่น", email: "anant.m@netbay.co.th", role: "ผู้ดูแลระบบ", status: "ใช้งานอยู่", roleColor: "bg-[#B90A1E]/10 text-[#B90A1E]", statusColor: "bg-tertiary" },
        { id: 2, name: "นางสาววรัญญา แสงสุวรรณ", email: "waranya.s@netbay.co.th", role: "ผู้ตรวจสอบ", status: "ใช้งานอยู่", roleColor: "bg-tertiary/10 text-tertiary", statusColor: "bg-tertiary" },
        { id: 3, name: "นายสมชาย รักสะอาด", email: "somchai.r@netbay.co.th", role: "ผู้รับผิดชอบข้อมูล", status: "ระงับการใช้งาน", roleColor: "bg-secondary/10 text-secondary", statusColor: "bg-error animate-pulse" },
        { id: 4, name: "นางพัชราภรณ์ ทรัพย์มาก", email: "patcha.t@netbay.co.th", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", status: "ใช้งานอยู่", roleColor: "bg-blue-100 text-blue-700", statusColor: "bg-tertiary" },
        { id: 5, name: "นายปกรณ์ มีศิลป์", email: "pakorn.m@netbay.co.th", role: "ผู้ดูแลระบบ", status: "ใช้งานอยู่", roleColor: "bg-[#B90A1E]/10 text-[#B90A1E]", statusColor: "bg-tertiary" },
        { id: 6, name: "นางสาวศิรินทรา มาพร้อม", email: "sirintra.m@netbay.co.th", role: "ผู้ตรวจสอบ", status: "ใช้งานอยู่", roleColor: "bg-tertiary/10 text-tertiary", statusColor: "bg-tertiary" },
        { id: 7, name: "นายวีระพล สุขใจ", email: "weerapol.s@netbay.co.th", role: "ผู้ดูแลระบบ", status: "ใช้งานอยู่", roleColor: "bg-[#B90A1E]/10 text-[#B90A1E]", statusColor: "bg-tertiary" },
        { id: 8, name: "นางกานดา ตั้งใจ", email: "kanda.t@netbay.co.th", role: "ไม่มีสิทธิ์", status: "ใช้งานอยู่", roleColor: "bg-outline-variant/20 text-secondary", statusColor: "bg-tertiary" },
        { id: 9, name: "นายอดิศร สอนดี", email: "adisorn.s@netbay.co.th", role: "ผู้รับผิดชอบข้อมูล", status: "ใช้งานอยู่", roleColor: "bg-secondary/10 text-secondary", statusColor: "bg-tertiary" },
        { id: 10, name: "นางสาวมณี ขยันเรียน", email: "manee.k@netbay.co.th", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", status: "ใช้งานอยู่", roleColor: "bg-blue-100 text-blue-700", statusColor: "bg-tertiary" }
    ];

    const MOCK_USERS_STATS = {
        userTrend: "+12% จากเดือนที่แล้ว"
    };

    const filteredUsers = MOCK_USERS.filter(user => {
        const matchesRole = selectedRole === "ทั้งหมด" || user.role === selectedRole;
        const matchesStatus = selectedStatus === "ทั้งหมด" || user.status === selectedStatus;
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesStatus && matchesSearch;
    });

    const ITEMS_PER_PAGE = 4;
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/admin/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createFormData)
            });
            if (response.ok) {
                setIsCreateModalOpen(false);
                setCreateFormData({
                    username: "", first_name: "", last_name: "",
                    email: "", role: "NONE", password: ""
                });
            }
        } catch (error) {
            console.error("Failed to create user:", error);
        }
    };

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Page Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xl font-bold tracking-tight text-[#5C403D]">ตรวจสอบและกำหนดสิทธิ์การเข้าถึงข้อมูลส่วนบุคคลภายในองค์กร</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-br from-[#B90A1E] to-[#de2d33] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        <span>เพิ่มผู้ใช้งานใหม่</span>
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] overflow-hidden">
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
                                    <option value="ใช้งานอยู่">ใช้งานอยู่</option>
                                    <option value="ระงับการใช้งาน">ระงับการใช้งาน</option>
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
                            แสดงผล {filteredUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} จาก {filteredUsers.length} รายการ
                        </div>
                    </div>

                    {/* High-density Data Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low/40">
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">ชื่อ - นามสกุล</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">อีเมล</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">บทบาท</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">สถานะ</th>
                                    <th className="px-6 py-4 text-[14px] font-extrabold uppercase tracking-[0.1em] text-secondary text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-surface-container/30">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-on-surface">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{user.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase ${user.roleColor || "bg-outline-variant/20 text-secondary"}`}>
                                                {user.role || "ไม่มีสิทธิ์"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.statusColor}`}></span>
                                                <span className="text-xs font-semibold text-on-surface">{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="relative flex items-center bg-[#E5E2E1] px-3 py-1.5 rounded-md">
                                                    <select
                                                        defaultValue=""
                                                        className="bg-transparent border-none text-[11px] text-on-surface focus:ring-0 p-0 pr-6 cursor-pointer appearance-none outline-none"
                                                    >
                                                        <option disabled value="">แก้ไขสิทธิ์</option>
                                                        <option value="ADMIN">ผู้ดูแลระบบ</option>
                                                        <option value="AUDITOR">ผู้ตรวจสอบ</option>
                                                        <option value="OWNER">ผู้รับผิดชอบข้อมูล</option>
                                                        <option value="PROCESSOR">ผู้ประมวลผลข้อมูล</option>
                                                        <option value="NONE">ไม่มีสิทธิ์</option>
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-1.5 text-[18px] text-secondary pointer-events-none">expand_more</span>
                                                </div>
                                                <Link
                                                    href={`/admin/users/${user.id}/dashboard`}
                                                    className="bg-[#E5E2E1] px-4 py-1.5 text-on-surface hover:text-primary transition-all cursor-pointer rounded-lg text-[11px] font-bold whitespace-nowrap"
                                                >
                                                    ดูแดชบอร์ด
                                                </Link>
                                                <button
                                                    onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                                                    className="p-1.5 text-[#B90A1E] hover:brightness-110 transition-all cursor-pointer rounded-md hover:bg-red-50"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
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

                {/* Bento Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-[#B90A1E] shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-[#71717A] mb-1">ผู้ใช้งานทั้งหมด</p>
                            <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">{MOCK_USERS.length.toLocaleString()}</h3>
                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-tertiary">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                <span>{MOCK_USERS_STATS.userTrend}</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-[#B90A1E]/5 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                    </div>
                    <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-tertiary shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-[#71717A] mb-1">เซสชันที่กำลังใช้งาน</p>
                            <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">
                                {MOCK_USERS.filter(u => u.status === "ใช้งานอยู่").length.toLocaleString()}
                            </h3>
                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                                <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                                <span>กำลังใช้งานแบบ Real-time</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-tertiary/5 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>lan</span>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
                        <form onSubmit={handleCreateUser}>
                            <div className="p-8">
                                <h3 className="text-[22px] font-bold text-on-surface mb-1 tracking-tight">เพิ่มผู้ใช้งานใหม่</h3>
                                <p className="text-[#5C403D] font-medium text-[14px]">กรอกข้อมูลผู้ใช้งานเพื่อสร้างบัญชีใหม่</p>
                                <div className="mt-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Username</label>
                                        <input type="text" required value={createFormData.username} onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-secondary uppercase tracking-wider">ชื่อจริง</label>
                                            <input type="text" required value={createFormData.first_name} onChange={(e) => setCreateFormData({ ...createFormData, first_name: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-secondary uppercase tracking-wider">นามสกุล</label>
                                            <input type="text" required value={createFormData.last_name} onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">อีเมล</label>
                                        <input type="email" required value={createFormData.email} onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">สิทธิ์การใช้งาน</label>
                                        <select value={createFormData.role} onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none">
                                            <option value="NONE">ไม่มีบทบาท</option>
                                            <option value="OWNER">ผู้รับผิดชอบข้อมูล</option>
                                            <option value="PROCESSOR">ผู้ประมวลผลข้อมูลส่วนบุคคล</option>
                                            <option value="AUDITOR">ผู้ตรวจสอบ</option>
                                            <option value="ADMIN">ผู้ดูแลระบบ</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">รหัสผ่าน</label>
                                        <input type="password" required value={createFormData.password} onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })} className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 pt-4 flex flex-row items-center justify-center gap-3 bg-surface-container-lowest border-t border-surface-container/30">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-10 h-11 rounded-2xl text-[15px] font-bold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer">ยกเลิก</button>
                                <button type="submit" className="px-10 h-11 bg-logout-gradient rounded-2xl shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95 text-white font-bold cursor-pointer">สร้างผู้ใช้งาน</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[440px] rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 p-8 text-center">
                        <h3 className="text-[22px] font-bold text-on-surface mb-3">ยืนยันการลบผู้ใช้งาน</h3>
                        <p className="text-[#5C403D] font-medium text-[14px] mb-6">กรุณาตรวจสอบข้อมูล {userToDelete?.name} ให้เรียบร้อยก่อนลบ</p>
                        <div className="flex flex-row items-center justify-center gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-10 h-11 rounded-2xl text-[15px] font-bold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer">ยกเลิก</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-10 h-11 bg-logout-gradient rounded-2xl shadow-lg text-white font-bold cursor-pointer">ลบผู้ใช้งาน</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
