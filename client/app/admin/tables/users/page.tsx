"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReusableForm, { FormField } from "@/components/ui/ReusableForm";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { ListCard, Pagination, GenericFilterBar, StatusBadge } from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";

function UsersPageContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState("ทั้งหมด");
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUserDbId, setSelectedUserDbId] = useState<number | null>(null);
    const initialCreateFormData = {
        username: "",
        prefix: "นางสาว",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "ไม่มีบทบาท",
        company: "บริษัท A",
        company_type: "ภายในองค์กร",
        department: "แผนก IT",
        status: "กำลังใช้งาน"
    };

    const [createFormData, setCreateFormData] = useState<Record<string, string>>(initialCreateFormData);

    const [usersData, setUsersData] = useState<{
        total_users: number,
        active_users: number,
        users_list: any[],
    }>({
        total_users: 0,
        active_users: 0,
        users_list: [],
    });
    const [loading, setLoading] = useState(true);
    const [allDepartments, setAllDepartments] = useState<any[]>([]);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const ITEMS_PER_PAGE = 3;

    // Mapping for Thai labels to Backend Enums
    const roleToEnum: Record<string, string> = {
        "ทั้งหมด": "",
        "ผู้รับผิดชอบข้อมูล": "OWNER",
        "ผู้ประมวลผลข้อมูลส่วนบุคคล": "PROCESSOR",
        "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล": "DPO",
        "ผู้ตรวจสอบ": "AUDITOR",
        "ผู้ดูแลระบบ": "ADMIN",
        "ผู้บริหารระดับสูง": "EXECUTIVE",
        "ไม่มีบทบาท": "NONE"
    };

    const statusToEnum: Record<string, string> = {
        "ทั้งหมด": "",
        "กำลังใช้งาน": "ACTIVE",
        "ปิดการใช้งาน": "INACTIVE"
    };

    // Mapping for Backend Enums back to Thai Labels
    const enumToRole: Record<string, string> = {
        "OWNER": "ผู้รับผิดชอบข้อมูล",
        "PROCESSOR": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
        "DPO": "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
        "AUDITOR": "ผู้ตรวจสอบ",
        "ADMIN": "ผู้ดูแลระบบ",
        "EXECUTIVE": "ผู้บริหารระดับสูง",
        "NONE": "ไม่มีบทบาท"
    };

    const enumToStatus: Record<string, string> = {
        "ACTIVE": "กำลังใช้งาน",
        "INACTIVE": "ปิดการใช้งาน"
    };

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
            console.warn("No token found, using mock data...");
            // Use mock data fallback if no token
            setUsersData(prev => ({ ...prev, users_list: [] }));
            setLoading(false);
            return;
        }

        try {
            const roleFilter = roleToEnum[selectedRole] || "";
            const statusFilter = statusToEnum[selectedStatus] || "";
            const searchParam = globalSearchQuery ? `&search=${encodeURIComponent(globalSearchQuery)}` : "";
            const roleParam = roleFilter ? `&role=${roleFilter}` : "";
            const statusParam = statusFilter ? `&status=${statusFilter}` : "";

            const response = await fetch(
                `${API_BASE_URL}/admin/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}${searchParam}${roleParam}${statusParam}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();

            const transformedUsers = data.items.map((u: any) => ({
                id: u.user_code || `user-${u.id}`,
                db_id: u.id,
                username: u.username,
                name: `${u.title || ""} ${u.first_name} ${u.last_name || ""}`.trim(),
                email: u.email,
                role: enumToRole[u.role] || u.role,
                department: u.department || "ไม่ระบุ",
                status: enumToStatus[u.status] || u.status,
                company_name: u.company_name,
                auditor_type: u.auditor_type
            }));

            setUsersData({
                total_users: data.total,
                active_users: data.items.filter((u: any) => u.status === "ACTIVE").length, // Approximate active in current view
                users_list: transformedUsers,
            });
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const headers = { "Authorization": `Bearer ${token}` };

            const [dRes, cRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/departments?limit=1000`, { headers }),
                fetch(`${API_BASE_URL}/admin/companies?limit=1000`, { headers })
            ]);

            if (dRes.ok) setAllDepartments((await dRes.json()).items || []);
            if (cRes.ok) setAllCompanies((await cRes.json()).items || []);
        } catch (e) {
            console.error("Failed to fetch master data:", e);
        }
    };

    React.useEffect(() => {
        fetchUsers();
        fetchMasterData();
    }, [currentPage, selectedRole, selectedStatus, globalSearchQuery]);

    // Filters are now handled server-side, so paginatedUsers is just usersData.users_list
    const paginatedUsers = usersData.users_list;
    const totalPages = Math.ceil(usersData.total_users / ITEMS_PER_PAGE);

    const handleOpenCreateModal = () => {
        const defaultDept = allDepartments.length > 0 ? allDepartments[0].name : "ไม่ระบุ";
        const defaultComp = allCompanies.length > 0 ? allCompanies[0].name : "ไม่ระบุ";
        
        setCreateFormData({
            ...initialCreateFormData,
            department: defaultDept,
            company: defaultComp
        });
        setSelectedUserDbId(null);
        setIsEditMode(false);
        setIsCreateModalOpen(true);
    };

    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateUser = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsCreating(true);

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const roleEnum = roleToEnum[createFormData.role] || "NONE";
            const statusEnum = statusToEnum[createFormData.status] || "ACTIVE";
            
            const payload = {
                username: createFormData.username,
                title: createFormData.prefix,
                first_name: createFormData.first_name,
                last_name: createFormData.last_name,
                email: createFormData.email,
                password: createFormData.password,
                role: roleEnum,
                department: createFormData.department,
                company_name: createFormData.company,
                auditor_type: roleEnum === "AUDITOR" ? (createFormData.company_type === "ภายในองค์กร" ? "INTERNAL" : "EXTERNAL") : null,
                status: statusEnum
            };

            const method = isEditMode ? "PUT" : "POST";
            const url = isEditMode 
                ? `${API_BASE_URL}/admin/users/${selectedUserDbId}`
                : `${API_BASE_URL}/admin/users`;

            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to save user");
            }

            setIsCreateModalOpen(false);
            setCreateFormData(initialCreateFormData);
            fetchUsers();
        } catch (error: any) {
            console.error("Error saving user:", error);
            alert(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsCreating(false);
            setIsEditMode(false);
        }
    };

    const handleOpenEditModal = (user: any) => {
        // Extract names carefully
        const nameParts = user.name.split(" ");
        let firstName = "";
        let lastName = "";
        let prefix = "นางสาว";

        if (nameParts.length > 0) {
            if (["นาย", "นาง", "นางสาว"].includes(nameParts[0])) {
                prefix = nameParts[0];
                firstName = nameParts[1] || "";
                lastName = nameParts.slice(2).join(" ");
            } else {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(" ");
            }
        }

        setCreateFormData({
            username: user.username || user.email.split("@")[0], // If username missing, fallback to email prefix
            prefix: prefix,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            password: "", // Don't show password, keep empty if not changing
            role: user.role,
            company: user.company_name || "",
            company_type: user.auditor_type === "EXTERNAL" ? "ภายนอกองค์กร" : "ภายในองค์กร",
            department: user.department || "",
            status: user.status
        });
        setSelectedUserDbId(user.db_id);
        setIsEditMode(true);
        setIsCreateModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.db_id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to deactivate user");

            setIsDeleteModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Error deactivating user:", error);
            alert("เกิดข้อผิดพลาดในการปิดการใช้งานผู้ใช้");
        } finally {
            setIsDeleting(false);
        }
    };

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
                        <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงรายชื่อผู้ใช้ในระบบ</h2>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 bg-[#ED393C] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span>เพิ่มผู้ใช้ใหม่</span>
                    </button>
                </div>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedRole("ทั้งหมด"); }}>
                    <div className="w-[200px]">
                        <Select
                            label="สถานะ"
                            name="status"
                            rounding="xl"
                            bgColor="white"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "กำลังใช้งาน", value: "กำลังใช้งาน" },
                                { label: "ปิดการใช้งาน", value: "ปิดการใช้งาน" }
                            ]}
                            containerClassName="!w-full"
                        />
                    </div>
                    <div className="w-[280px]">
                        <Select
                            label="บทบาท"
                            name="role"
                            rounding="xl"
                            bgColor="white"
                            value={selectedRole}
                            onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                            options={[
                                { label: "ทั้งหมด", value: "ทั้งหมด" },
                                { label: "ผู้รับผิดชอบข้อมูล", value: "ผู้รับผิดชอบข้อมูล" },
                                { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: "ผู้ประมวลผลข้อมูลส่วนบุคคล" },
                                { label: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", value: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล" },
                                { label: "ผู้ตรวจสอบ", value: "ผู้ตรวจสอบ" },
                                { label: "ผู้ดูแลระบบ", value: "ผู้ดูแลระบบ" },
                                { label: "ผู้บริหารระดับสูง", value: "ผู้บริหารระดับสูง" }
                            ]}
                            containerClassName="!w-full"
                        />
                    </div>
                </GenericFilterBar>

                {/* ListCard Table */}
                <div className="space-y-0">
                    <ListCard title="รายชื่อผู้ใช้ทั้งหมด" icon="account_circle" filled={true} iconColor="#5C403D">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">รหัสผู้ใช้</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อ-สกุล</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">อีเมล</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">บทบาท</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สังกัด /แผนก</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะ</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-7 text-[13.5px] font-medium text-[#5F5E5E]">{user.id}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-[#1B1C1C] tracking-tight leading-snug">{user.name}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-[#5F5E5E]">{user.email}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-[#5F5E5E]">{user.role}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-[#5F5E5E]">{user.department}</td>
                                        <td className="py-7">
                                            <div className="flex justify-center scale-110">
                                                <StatusBadge status={user.status as any} />
                                            </div>
                                        </td>
                                        <td className="py-7">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    title="จัดการผู้ใช้"
                                                    className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                                                </button>
                                                <button
                                                    onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                                                    title="ลบผู้ใช้งาน"
                                                    className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                                {user.role !== "ผู้ประมวลผลข้อมูลส่วนบุคคล" && user.role !== "ผู้ตรวจสอบ" && user.role !== "Data Processor" && user.role !== "Auditor" && (
                                                    <Link
                                                        href={`/admin/tables/users/${user.db_id}/dashboard`}
                                                        title="ดูแดชบอร์ด"
                                                        className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-[#5F5E5E] text-[14px] font-medium">ไม่พบข้อมูลผู้ใช้งาน</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                            <div className="px-6 flex items-center justify-between">
                                <p className="text-[12px] font-medium text-[#5F5E5E] opacity-80">
                                    แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, usersData.total_users)} จากทั้งหมด {usersData.total_users} รายการ
                                </p>
                                <div className="[&_p]:hidden [&_div]:mt-0">
                                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                                </div>
                            </div>
                        </div>
                    </ListCard>
                </div>

            </div>

            {/* Create User Modal with Custom Layout matching screenshot */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[500px] rounded-[16px] shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 relative shrink-0 border-b border-transparent">
                            <button onClick={() => { setIsCreateModalOpen(false); setIsEditMode(false); }} className="absolute right-6 top-6 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[28px] font-light">close</span>
                            </button>
                            <h3 className="text-[26px] font-black text-[#1B1C1C] mb-1 tracking-tight">
                                {isEditMode ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
                            </h3>
                            <p className="text-[#5C403D] font-medium text-[16px]">
                                {isEditMode ? "กรอกข้อมูลผู้ใช้งานเพื่อแก้ไขข้อมูลผู้ใช้" : "กรอกข้อมูลผู้ใช้งานเพื่อสร้างบัญชีใหม่"}
                            </p>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="px-8 overflow-y-auto flex-1 space-y-5 pb-6">

                            {/* username */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">ชื่อผู้ใช้งาน</label>
                                <input
                                    type="text"
                                    placeholder="Admin01"
                                    value={createFormData.username}
                                    onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#1B1C1C] placeholder:text-gray-500"
                                />
                            </div>

                            {/* 3 cols row */}
                            <div className="grid grid-cols-[1fr_1.5fr_1.5fr] gap-4">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">คำนำ</label>
                                    <div className="relative">
                                        <select
                                            value={createFormData.prefix}
                                            onChange={(e) => setCreateFormData(prev => ({ ...prev, prefix: e.target.value }))}
                                            className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                        >
                                            <option>นางสาว</option>
                                            <option>นาย</option>
                                            <option>นาง</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">ชื่อจริง</label>
                                    <input
                                        type="text"
                                        placeholder="พรรษชล"
                                        value={createFormData.first_name}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#1B1C1C] placeholder:text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">นามสกุล</label>
                                    <input
                                        type="text"
                                        placeholder="บุญมาก"
                                        value={createFormData.last_name}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#1B1C1C] placeholder:text-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">อีเมล</label>
                                <input
                                    type="email"
                                    placeholder="phatsachoneiei@gmail.com"
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#1B1C1C] placeholder:text-gray-500"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">รหัสผ่าน</label>
                                <input
                                    type="password"
                                    placeholder="•••••••"
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[18px] tracking-[4px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-black text-[#6B7280] placeholder:text-gray-500"
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">บทบาท</label>
                                <div className="relative">
                                    <select
                                        value={createFormData.role}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                    >
                                        <option>ไม่มีบทบาท</option>
                                        <option>ผู้รับผิดชอบข้อมูล</option>
                                        <option>ผู้ประมวลผลข้อมูลส่วนบุคคล</option>
                                        <option>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</option>
                                        <option>ผู้ตรวจสอบ</option>
                                        <option>ผู้ดูแลระบบ</option>
                                        <option>ผู้บริหารระดับสูง</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>

                            {/* Company */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">บริษัท (ผู้ประมวลผลข้อมูลส่วนบุคคล)</label>
                                <div className="relative">
                                    <select
                                        value={createFormData.company}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, company: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                    >
                                        {allCompanies.length > 0 ? (
                                            allCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                                        ) : (
                                            <option value="">ไม่มีข้อมูลบริษัท</option>
                                        )}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>

                            {/* Internal / External toggle */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">บริษัท (ผู้ประมวลผลข้อมูลส่วนบุคคล)</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCreateFormData(prev => ({ ...prev, company_type: "ภายในองค์กร" }))}
                                        className={`h-[42px] rounded-[8px] font-bold text-[13px] transition-all flex-1 ${createFormData.company_type === "ภายในองค์กร"
                                            ? "bg-[#B91C1C] text-white shadow-md border-transparent"
                                            : "bg-white border text-[#5C403D] border-[#E5E2E1] hover:bg-gray-50 cursor-pointer"
                                            }`}
                                    >
                                        ภายในองค์กร
                                    </button>
                                    <button
                                        onClick={() => setCreateFormData(prev => ({ ...prev, company_type: "ภายนอกองค์กร" }))}
                                        className={`h-[42px] rounded-[8px] font-bold text-[13px] transition-all flex-1 ${createFormData.company_type === "ภายนอกองค์กร"
                                            ? "bg-[#B91C1C] text-white shadow-md border-transparent"
                                            : "bg-white border text-[#5C403D] border-[#E5E2E1] hover:bg-gray-50 cursor-pointer"
                                            }`}
                                    >
                                        ภายนอกองค์กร
                                    </button>
                                </div>
                            </div>

                            {/* Department */}
                            {createFormData.company_type === "ภายในองค์กร" && (
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">แผนก</label>
                                    <div className="relative">
                                        <select
                                            value={createFormData.department}
                                            onChange={(e) => setCreateFormData(prev => ({ ...prev, department: e.target.value }))}
                                            className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                        >
                                            {allDepartments.length > 0 ? (
                                                allDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                                            ) : (
                                                <option value="">ไม่มีข้อมูลแผนก</option>
                                            )}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">สถานะ</label>
                                <div className="relative">
                                    <select
                                        value={createFormData.status}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                    >
                                        <option>กำลังใช้งาน</option>
                                        <option>ปิดการใช้งาน</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>

                        </div>

                        {/* Footer buttons */}
                        <div className="px-8 py-5 shrink-0 flex items-center justify-between border-t border-transparent bg-white">
                            <button onClick={() => { setIsCreateModalOpen(false); setIsEditMode(false); }} className="h-[42px] px-10 rounded-[8px] bg-white border border-[#E5E2E1] text-[#5C403D] font-bold text-[14px] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                ยกเลิก
                            </button>
                            <button onClick={handleCreateUser} className="h-[42px] px-8 rounded-[8px] bg-[#B91C1C] text-white font-bold text-[14px] shadow-sm hover:brightness-110 transition-all cursor-pointer">
                                {isEditMode ? "บันทึกข้อมูลผู้ใช้งาน" : "สร้างผู้ใช้งาน"}
                            </button>
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

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-on-surface-variant font-medium">กำลังโหลด...</div>}>
            <UsersPageContent />
        </Suspense>
    );
}
