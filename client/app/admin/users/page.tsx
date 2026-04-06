"use client";
import React, { useState } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/ui/DataTable";
import ReusableForm, { FormField } from "@/components/ui/ReusableForm";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

export default function UsersPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState<Record<string, string>>({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "NONE",
        password: ""
    });

    const [usersData, setUsersData] = useState<{ 
        total_users: number, 
        active_users: number, 
        users_list: any[],
        total_users_trend?: {
            direction: string;
            value: string;
            text_label: string;
        }
    }>({
        total_users: 0,
        active_users: 0,
        users_list: [],
        total_users_trend: {
            direction: "neutral",
            value: "0%",
            text_label: "จากเดือนที่แล้ว"
        }
    });
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = "http://localhost:8000";

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const mappedList = data.users_list.map((u: any) => ({
                    id: u.id,
                    name: `${u.first_name} ${u.last_name}`,
                    email: u.email,
                    role: u.role === "Admin" ? "ผู้ดูแลระบบ" :
                        u.role === "Auditor" ? "ผู้ตรวจสอบ" :
                            u.role === "Data Owner" ? "ผู้รับผิดชอบข้อมูล" :
                                u.role === "Data Processor" ? "ผู้ประมวลผลข้อมูลส่วนบุคคล" : "ไม่มีสิทธิ์",
                    status: u.status === "active" ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน",
                    rawRole: u.role
                }));
                setUsersData({
                    total_users: data.total_users,
                    active_users: data.active_users,
                    users_list: mappedList,
                    total_users_trend: data.total_users_trend
                });
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const getRoleStyle = (role: string) => {
        switch (role) {
            case "ผู้ตรวจสอบ":
                return "bg-tertiary/10 text-tertiary";
            case "ผู้ดูแลระบบ":
                return "bg-[#B90A1E]/10 text-[#B90A1E]";
            case "ผู้รับผิดชอบข้อมูล":
                return "bg-secondary/10 text-secondary";
            case "ผู้ประมวลผลข้อมูลส่วนบุคคล":
                return "bg-blue-100 text-blue-700";
            case "ไม่มีสิทธิ์":
            default:
                return "bg-outline-variant/20 text-secondary";
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "ใช้งานอยู่":
                return "bg-tertiary";
            case "ไม่ได้ใช้งาน":
                return "bg-error";
            default:
                return "bg-secondary";
        }
    };

    // Trends are now fetched from API

    const filteredUsers = usersData.users_list.filter(user => {
        const matchesRole = selectedRole === "ทั้งหมด" || user.role === selectedRole;
        const matchesStatus = selectedStatus === "ทั้งหมด" || user.status === selectedStatus;
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesStatus && matchesSearch;
    });

    const ITEMS_PER_PAGE = 4;
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const token = localStorage.getItem("token") || "";
            const payload = {
                ...createFormData,
                role: createFormData.role === "NONE" ? null : createFormData.role
            };

            const response = await fetch(`${API_BASE_URL}/admin/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Success
                setIsCreateModalOpen(false);
                setCreateFormData({
                    username: "", first_name: "", last_name: "",
                    email: "", role: "NONE", password: ""
                });
                fetchUsers();
                alert("สร้างผู้ใช้งานสำเร็จ");
            } else {
                const errData = await response.json();
                alert(`เกิดข้อผิดพลาด: ${errData.detail || "ไม่สามารถสร้างผู้ใช้งานได้"}`);
            }
        } catch (error) {
            console.error("Failed to create user:", error);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem("token") || "";
            const url = newRole === "NONE"
                ? `${API_BASE_URL}/admin/users/${userId}/role`
                : `${API_BASE_URL}/admin/users/${userId}/role?role=${encodeURIComponent(newRole)}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                fetchUsers();
                alert("อัปเดตสิทธิ์การใช้งานสำเร็จ");
            } else {
                alert("ไม่สามารถอัปเดตสิทธิ์ได้");
            }
        } catch (error) {
            console.error("Failed to update role:", error);
            alert("เกิดข้อผิดพลาดในการเรียก API");
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setIsDeleteModalOpen(false);
                fetchUsers();
                alert("ลบผู้ใช้งานสำเร็จ");
            } else {
                alert("ไม่สามารถลบผู้ใช้งานได้");
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("เกิดข้อผิดพลาดในการเรียก API");
        } finally {
            setIsDeleting(false);
        }
    };

    const userColumns: Column<any>[] = [
        { header: "ชื่อ - นามสกุล", key: "name", width: "18%" },
        { header: "อีเมล", key: "email", width: "18%" },
        {
            header: "บทบาท", key: "role", width: "20%", align: "center", render: (user) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase whitespace-nowrap ${getRoleStyle(user.role)}`}>
                    {user.role || "ไม่มีสิทธิ์"}
                </span>
            )
        },
        {
            header: "สถานะ", key: "status", width: "14%", align: "center", render: (user) => (
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(user.status)}`}></span>
                    <span className="text-xs font-semibold text-on-surface">{user.status}</span>
                </div>
            )
        },
        {
            header: "การจัดการ", key: "actions", width: "30%", align: "center", render: (user) => (
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                    <div className="relative flex items-center bg-[#E5E2E1] px-3 py-1.5 rounded-md">
                        <select
                            value={user.rawRole || "NONE"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-transparent border-none text-[11px] text-on-surface focus:ring-0 p-0 pr-6 cursor-pointer appearance-none outline-none"
                        >
                            <option disabled value="">แก้ไขสิทธิ์</option>
                            <option value="Admin">ผู้ดูแลระบบ</option>
                            <option value="Auditor">ผู้ตรวจสอบ</option>
                            <option value="Data Owner">ผู้รับผิดชอบข้อมูล</option>
                            <option value="Data Processor">ผู้ประมวลผลข้อมูลส่วนบุคคล</option>
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
            )
        }
    ];

    const userFields: FormField[] = [
        { name: "username", label: "ชื่อผู้ใช้งาน", type: "text", required: true, colSpan: 2 },
        { name: "first_name", label: "ชื่อจริง", type: "text", required: true, colSpan: 1 },
        { name: "last_name", label: "นามสกุล", type: "text", required: true, colSpan: 1 },
        { name: "email", label: "อีเมล", type: "email", required: true, colSpan: 2 },
        {
            name: "role",
            label: "สิทธิ์การใช้งาน",
            type: "select",
            colSpan: 2,
            options: [
                { label: "ไม่มีบทบาท", value: "NONE" },
                { label: "ผู้รับผิดชอบข้อมูล", value: "Data Owner" },
                { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: "Data Processor" },
                { label: "ผู้ตรวจสอบ", value: "Auditor" },
                { label: "ผู้ดูแลระบบ", value: "Admin" },
            ]
        },
        { name: "password", label: "รหัสผ่าน", type: "password", required: true, colSpan: 2 },
    ];

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

                {/* Reusable Data Table Section */}
                <DataTable
                    columns={userColumns}
                    data={paginatedUsers}
                    searchQuery={searchQuery}
                    onSearchChange={(query) => { setSearchQuery(query); setCurrentPage(1); }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredUsers.length}
                    filters={
                        <>
                            {/* Role Filter */}
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0px_2px_8px_rgba(27,28,28,0.04)] relative group h-auto">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] shrink-0">บทบาท:</span>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                                    className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 p-0 pl-2 pr-10 cursor-pointer appearance-none outline-none relative z-10 leading-relaxed py-1"
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                                    <option value="ผู้ตรวจสอบ">ผู้ตรวจสอบ</option>
                                    <option value="ผู้รับผิดชอบข้อมูล">ผู้รับผิดชอบข้อมูล</option>
                                    <option value="ผู้ประมวลผลข้อมูลส่วนบุคคล">ผู้ประมวลผลข้อมูลส่วนบุคคล</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0px_2px_8px_rgba(27,28,28,0.04)] relative group h-auto">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] shrink-0">สถานะ:</span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                                    className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 p-0 pl-2 pr-10 cursor-pointer appearance-none outline-none relative z-10 leading-relaxed py-1"
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    <option value="ใช้งานอยู่">ใช้งานอยู่</option>
                                    <option value="ไม่ได้ใช้งาน">ไม่ได้ใช้งาน</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 text-lg text-secondary pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                            </div>
                        </>
                    }
                />

                {/* Bento Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-[#B90A1E] shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-[#71717A] mb-1">ผู้ใช้งานทั้งหมด</p>
                            <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">{usersData.total_users.toLocaleString()}</h3>
                            <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${
                                usersData.total_users_trend?.direction === 'up' ? 'text-tertiary' : 
                                usersData.total_users_trend?.direction === 'down' ? 'text-error' : 'text-on-surface-variant'
                            }`}>
                                <span className="material-symbols-outlined text-sm">
                                    {usersData.total_users_trend?.direction === 'up' ? 'trending_up' : 
                                     usersData.total_users_trend?.direction === 'down' ? 'trending_down' : 'trending_flat'}
                                </span>
                                <span>
                                    {usersData.total_users_trend?.value || "0%"} {usersData.total_users_trend?.text_label || "จากเดือนที่แล้ว"}
                                </span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-[#B90A1E]/5 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                    </div>
                    <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-tertiary shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[14px] font-bold uppercase tracking-widest text-[#71717A] mb-1">เซสชันที่กำลังใช้งาน</p>
                            <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">
                                {usersData.active_users.toLocaleString()}
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

            {/* Create User Modal with ReusableForm */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-8">
                            <h3 className="text-[22px] font-bold text-on-surface mb-1 tracking-tight">เพิ่มผู้ใช้งานใหม่</h3>
                            <p className="text-[#5C403D] font-medium text-[14px]">กรอกข้อมูลผู้ใช้งานเพื่อสร้างบัญชีใหม่</p>
                            <div className="mt-6">
                                <ReusableForm
                                    fields={userFields}
                                    formData={createFormData}
                                    onChange={(name, value) => setCreateFormData(prev => ({ ...prev, [name]: value }))}
                                    onSubmit={handleCreateUser}
                                    onCancel={() => setIsCreateModalOpen(false)}
                                    submitLabel="สร้างผู้ใช้งาน"
                                    isLoading={isCreating}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reusable Delete Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                title="ยืนยันการลบผู้ใช้งาน"
                description={`กรุณาตรวจสอบข้อมูลผู้ใช้งานให้เรียบร้อยก่อนดำเนินการลบ`}
                confirmLabel="ลบผู้ใช้งาน"
                isLoading={isDeleting}
            />
        </div>
    );
}

