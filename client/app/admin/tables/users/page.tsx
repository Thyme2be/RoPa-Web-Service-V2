"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReusableForm, { FormField } from "@/components/ui/ReusableForm";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { ListCard, Pagination, GenericFilterBar, StatusBadge } from "@/components/ropa/ListComponents";
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
    const [createFormData, setCreateFormData] = useState<Record<string, string>>({
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
        // Mock data to match screenshot
        const data = {
            total_users: 10,
            active_users: 3,
            total_users_trend: {
                direction: "up",
                value: "10%",
                text_label: "จากเดือนที่แล้ว"
            },
            users_list: [
                { id: "user-15", name: "นางสาวศิริพร ใจงาม", email: "name15@gmail.com", role: "ผู้รับผิดชอบข้อมูล", department: "แผนก IT", status: "กำลังใช้งาน" },
                { id: "user-14", name: "นายมานะ ขยันทำงาน", email: "name14@gmail.com", role: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", department: "แผนกกฎหมาย", status: "กำลังใช้งาน" },
                { id: "user-13", name: "นางสาวสมหญิง รักเรียน", email: "name13@gmail.com", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", department: "แผนกบัญชี", status: "ปิดการใช้งาน" },
                { id: "user-12", name: "นายวิชัย ชนะศึก", email: "name12@gmail.com", role: "ผู้รับผิดชอบข้อมูล", department: "แผนกขาย", status: "กำลังใช้งาน" },
                { id: "user-11", name: "นางสาววิไลลักษณ์ สวยสม", email: "name11@gmail.com", role: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", department: "แผนกการตลาด", status: "กำลังใช้งาน" },
                { id: "user-10", name: "นายสมชาย สายเสมอ", email: "name10@gmail.com", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", department: "แผนกขนส่ง", status: "ปิดการใช้งาน" },
                { id: "user-09", name: "นางสาวเกศรา พรหมศร", email: "name9@gmail.com", role: "ผู้รับผิดชอบข้อมูล", department: "แผนก HR", status: "กำลังใช้งาน" },
                { id: "user-08", name: "นายปกรณ์ บุณยเกียรติ", email: "name8@gmail.com", role: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", department: "แผนก IT", status: "กำลังใช้งาน" },
                { id: "user-07", name: "นางสาวอารีวรรณ นามวงศ์", email: "name7@gmail.com", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", department: "แผนกจัดซื้อ", status: "ปิดการใช้งาน" },
                { id: "user-06", name: "นายธนพล มีสุข", email: "name6@gmail.com", role: "ผู้รับผิดชอบข้อมูล", department: "แผนกคลังสินค้า", status: "กำลังใช้งาน" },
                { id: "user-05", name: "นางสาวสิรินทรา ชัยชนะ", email: "name5@gmail.com", role: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", department: "แผนกบริการลูกค้า", status: "กำลังใช้งาน" },
                { id: "user-04", name: "นายณัฐพล บุญส่ง", email: "name4@gmail.com", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", department: "แผนก IT", status: "ปิดการใช้งาน" },
                { id: "user-03", name: "นางสาวพรรษชล บุญมาก", email: "name3@gmail.com", role: "ผู้รับผิดชอบข้อมูล", department: "แผนก IT", status: "กำลังใช้งาน" },
                { id: "user-02", name: "นางสาวพิมพ์ชนก วัฒนากุล", email: "name2@gmail.com", role: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", department: "แผนกการตลาด", status: "กำลังใช้งาน" },
                { id: "user-01", name: "นายกิตติพงศ์ สุวรรณชัย", email: "name1@gmail.com", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", department: "แผนก HR", status: "ปิดการใช้งาน" }
            ]
        };

        setUsersData({
            total_users: 15,
            active_users: data.active_users,
            users_list: data.users_list,
            total_users_trend: data.total_users_trend
        });
        setLoading(false);
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = usersData.users_list.filter(user => {
        const matchesRole = selectedRole === "ทั้งหมด" || user.role === selectedRole;
        const matchesStatus = selectedStatus === "ทั้งหมด" || user.status === selectedStatus;
        const matchesSearch = user.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            user.id.toLowerCase().includes(globalSearchQuery.toLowerCase());
        return matchesRole && matchesStatus && matchesSearch;
    });

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateUser = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsCreating(true);
        setTimeout(() => {
            setIsCreateModalOpen(false);
            setCreateFormData({
                username: "", prefix: "นางสาว", first_name: "", last_name: "",
                email: "", password: "", role: "ไม่มีบทบาท", company: "บริษัท A",
                company_type: "ภายในองค์กร", department: "แผนก IT", status: "กำลังใช้งาน"
            });
            fetchUsers();
            setIsCreating(false);
            setIsEditMode(false);
        }, 500);
    };

    const handleOpenEditModal = (user: any) => {
        const [firstName, lastName] = user.name.split(" ");
        setCreateFormData({
            username: user.id, // Fallback สำหรับ mockup
            prefix: user.name.startsWith("นางสาว") ? "นางสาว" : user.name.startsWith("นาย") ? "นาย" : "นาง",
            first_name: firstName.replace(/นางสาว|นาย|นาง/, "").trim(),
            last_name: lastName || "",
            email: user.email,
            password: "password123",
            role: user.role,
            company: "บริษัท A",
            company_type: "ภายในองค์กร",
            department: user.department,
            status: user.status
        });
        setIsEditMode(true);
        setIsCreateModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        setTimeout(() => {
            setIsDeleteModalOpen(false);
            fetchUsers();
            setIsDeleting(false);
        }, 500);
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
                        onClick={() => setIsCreateModalOpen(true)}
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
                    <ListCard title="รายชื่อผู้ใช้ทั้งหมด" icon="account_circle">
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
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{user.id}</td>
                                        <td className="py-7 text-[15.5px] font-medium text-[#1B1C1C] tracking-tight leading-snug">{user.name}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{user.email}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{user.role}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{user.department}</td>
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
                                                    className="w-7 h-7 rounded-full bg-[#E5E2E1]/60 flex items-center justify-center text-secondary hover:text-[#1B1C1C] transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">account_circle</span>
                                                </button>
                                                <button
                                                    onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                                                    title="ลบผู้ใช้งาน"
                                                    className="w-7 h-7 rounded-full bg-[#E5E2E1]/60 flex items-center justify-center text-secondary hover:text-[#ED393C] transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">delete</span>
                                                </button>
                                                <Link
                                                    href={`/admin/users/${user.id}/dashboard`}
                                                    title="ดูแดชบอร์ด"
                                                    className="w-7 h-7 rounded-full bg-[#E5E2E1]/60 flex items-center justify-center text-secondary hover:text-[#1B1C1C] transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                                                </Link>
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

                        {/* Pagination integrated into the same card footer area if possible, 
                            but keeping the requested 30% background from the previous turn 
                            by placing it right after the table inside the card padding or outside?
                            Actually, Data Owner puts it INSIDE the ListCard.
                        */}
                        <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                            <div className="px-6 mt-[-24px]">
                                <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
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
                                        <option>บริษัท A</option>
                                        <option>บริษัท B</option>
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
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">แผนก</label>
                                <div className="relative">
                                    <select
                                        value={createFormData.department}
                                        onChange={(e) => setCreateFormData(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] pl-4 pr-10 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#6B7280] appearance-none cursor-pointer"
                                    >
                                        <option>แผนก IT</option>
                                        <option>แผนก HR</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>

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
