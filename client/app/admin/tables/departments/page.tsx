"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { ListCard, Pagination } from "@/components/ropa/ListComponents";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

function ManagementModal({ isOpen, onClose, type, mode, initialData, onSave }: any) {
    const [inputValue, setInputValue] = React.useState(initialData?.name || "");

    React.useEffect(() => {
        if (isOpen) {
            setInputValue(initialData?.name || "");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const contentMap = {
        dept: {
            addTitle: "เพิ่มแผนกใหม่", editTitle: "แก้ไขข้อมูลแผนก",
            addDesc: "กรอกข้อมูลเพื่อเพิ่มแผนกใหม่", editDesc: "กรอกข้อมูลเพื่อแก้ไขข้อมูลแผนก",
            label: "ชื่อแผนก", placeholder: "ระบุชื่อแผนก",
        },
        role: {
            addTitle: "เพิ่มบทบาทใหม่", editTitle: "แก้ไขข้อมูลบทบาท",
            addDesc: "กรอกข้อมูลเพื่อเพิ่มบทบาทใหม่", editDesc: "กรอกข้อมูลเพื่อแก้ไขข้อมูลบทบาท",
            label: "ชื่อบทบาท", placeholder: "ระบุชื่อบทบาท",
        },
        company: {
            addTitle: "เพิ่มบริษัทภายนอกองค์กร", editTitle: "แก้ไขข้อมูลบริษัทภายนอกองค์กร",
            addDesc: "กรอกข้อมูลเพื่อเพิ่มบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล", editDesc: "กรอกข้อมูลเพื่อแก้ไขข้อมูลบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล",
            label: "ชื่อบริษัทภายนอกองค์กร", placeholder: "ระบุชื่อบริษัทภายนอกองค์กร",
        }
    };

    const currentContent = contentMap[type as keyof typeof contentMap];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1B1C1C]/40 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-[500px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 pt-8 pb-4 relative shrink-0">
                    <button onClick={onClose} className="absolute right-6 top-6 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[28px] font-light">close</span>
                    </button>
                    <h3 className="text-[26px] font-black text-[#1B1C1C] mb-1 tracking-tight">
                        {mode === "add" ? currentContent.addTitle : currentContent.editTitle}
                    </h3>
                    <p className="text-[#5C403D] font-medium text-[16px]">
                        {mode === "add" ? currentContent.addDesc : currentContent.editDesc}
                    </p>
                </div>
                <div className="px-8 pb-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#5E5D5D] block tracking-tight">{currentContent.label}</label>
                        <input
                            type="text"
                            placeholder={currentContent.placeholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full h-[42px] bg-[#F6F3F2] border-transparent rounded-[8px] px-4 text-[14px] outline-none hover:bg-[#EAE6E4] focus:ring-2 focus:ring-[#ED393C]/20 transition-all font-medium text-[#1B1C1C] placeholder:text-gray-500"
                        />
                    </div>
                </div>
                <div className="px-8 py-5 flex items-center justify-between border-t border-transparent bg-white">
                    <button onClick={onClose} className="px-8 h-11 rounded-2xl text-[15px] font-bold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer">
                        ยกเลิก
                    </button>
                    <button onClick={() => onSave(inputValue)} className="px-10 h-11 bg-logout-gradient rounded-2xl shadow-lg shadow-red-900/20 text-white font-bold cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all">
                        {mode === "add" ? "บันทึกข้อมูล" : "บันทึกการแก้ไข"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeptManagementPageContent() {
    const [deptPage, setDeptPage] = useState(1);
    const [rolePage, setRolePage] = useState(1);
    const [compPage, setCompPage] = useState(1);
    
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'dept', mode: 'add', data: null as any });
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, type: 'dept', data: null as any });
    const [isProcessing, setIsProcessing] = useState(false);

    const ITEMS_PER_PAGE = 3;

    const API_BASE_URL = "https://ropa-web-service-v2.onrender.com";

    const [depts, setDepts] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const headers = { "Authorization": `Bearer ${token}` };

            const [dRes, rRes, cRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/departments?limit=1000`, { headers }),
                fetch(`${API_BASE_URL}/admin/roles?limit=1000`, { headers }),
                fetch(`${API_BASE_URL}/admin/companies?limit=1000`, { headers })
            ]);

            if (dRes.ok) setDepts((await dRes.json()).items || []);
            if (rRes.ok) setRoles((await rRes.json()).items || []);
            if (cRes.ok) setCompanies((await cRes.json()).items || []);
        } catch (e) {
            console.error("Failed to fetch master data:", e);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    // Pagination helper
    const paginate = (data: any[], page: number) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const paginatedDepts = paginate(depts, deptPage);
    const paginatedRoles = paginate(roles, rolePage);
    const paginatedCompanies = paginate(companies, compPage);

    const totalDeptPages = Math.ceil(depts.length / ITEMS_PER_PAGE);
    const totalRolePages = Math.ceil(roles.length / ITEMS_PER_PAGE);
    const totalCompPages = Math.ceil(companies.length / ITEMS_PER_PAGE);

    const getApiPath = (type: string) => {
        if (type === 'dept') return '/admin/departments';
        if (type === 'role') return '/admin/roles';
        if (type === 'company') return '/admin/companies';
        return '';
    };

    const handleSave = async (value: string) => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem("token");
            const path = getApiPath(modalConfig.type);
            const method = modalConfig.mode === 'edit' ? 'PUT' : 'POST';
            const url = modalConfig.mode === 'edit' 
                ? `${API_BASE_URL}${path}/${modalConfig.data.id}` 
                : `${API_BASE_URL}${path}`;
                
            const payload = modalConfig.type === 'role' && modalConfig.mode === 'add' 
                ? { name: value, code: "" } 
                : { name: value };

            const res = await fetch(url, {
                method,
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setModalConfig({ ...modalConfig, isOpen: false });
                await fetchMasterData();
            } else {
                console.error("Failed to save", await res.text());
                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem("token");
            const path = getApiPath(deleteConfig.type);
            const res = await fetch(`${API_BASE_URL}${path}/${deleteConfig.data.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (res.ok) {
                setDeleteConfig({ ...deleteConfig, isOpen: false });
                await fetchMasterData();
            } else {
                console.error("Failed to delete", await res.text());
                alert("เกิดข้อผิดพลาดในการลบข้อมูล");
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const deleteContentMap = {
        dept: { title: "ยืนยันการลบข้อมูลแผนก", desc: "กรุณาตรวจสอบข้อมูลแผนกให้เรียบร้อยก่อนดำเนินการลบ", btn: "ลบแผนก" },
        role: { title: "ยืนยันการลบข้อมูลบทบาท", desc: "กรุณาตรวจสอบข้อมูลบทบาทให้เรียบร้อยก่อนดำเนินการลบ", btn: "ลบบทบาท" },
        company: { title: "ยืนยันการลบข้อมูลบริษัท", desc: "กรุณาตรวจสอบข้อมูลบริษัทให้เรียบร้อยก่อนดำเนินการลบ", btn: "ลบบริษัท" }
    };
    const currentDeleteContent = deleteConfig.type ? deleteContentMap[deleteConfig.type as keyof typeof deleteContentMap] : deleteContentMap.dept;

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-20">
                {/* Page Header */}
                <h1 className="text-[24px] font-headline font-black text-[#1B1C1C] tracking-tight mb-4">
                    ตารางการจัดการแผนก บทบาท และบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล
                </h1>

                {/* Section 1: Departments */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[18px] font-headline font-black text-[#1B1C1C] tracking-tight">ตารางการจัดการแผนก</h2>
                        <button onClick={() => setModalConfig({ isOpen: true, type: 'dept', mode: 'add', data: null })} className="flex items-center gap-2 bg-[#ED393C] text-white px-4 py-2 rounded-lg font-black text-[14px] shadow-sm hover:opacity-90 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            เพิ่มแผนกใหม่
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto w-full">
                        <ListCard title="แผนกในบริษัททั้งหมด" icon="group" filled={true} iconColor="#5C403D">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase w-2/3">ชื่อสังกัด/แผนก</th>
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {paginatedDepts.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-7 text-[13.5px] font-medium text-secondary">{item.name}</td>
                                            <td className="py-7">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setModalConfig({ isOpen: true, type: 'dept', mode: 'edit', data: item })} title="แก้ไข" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    </div>
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setDeleteConfig({ isOpen: true, type: 'dept', data: item })} title="ลบ" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {(deptPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(deptPage * ITEMS_PER_PAGE, depts.length)} จากทั้งหมด {depts.length} รายการ
                                    </p>
                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                        <Pagination current={deptPage} total={totalDeptPages} onChange={setDeptPage} />
                                    </div>
                                </div>
                            </div>
                        </ListCard>
                    </div>
                </div>

                {/* Section 2: Roles */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[18px] font-headline font-black text-[#1B1C1C] tracking-tight">ตารางการจัดการบทบาท</h2>
                        <button onClick={() => setModalConfig({ isOpen: true, type: 'role', mode: 'add', data: null })} className="flex items-center gap-2 bg-[#ED393C] text-white px-4 py-2 rounded-lg font-black text-[14px] shadow-sm hover:opacity-90 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            เพิ่มบทบาทใหม่
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto w-full">
                        <ListCard title="บทบาทในบริษัททั้งหมด" icon="account_circle" filled={true} iconColor="#5C403D">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase w-2/3">บทบาท</th>
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {paginatedRoles.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-7 text-[13.5px] font-medium text-secondary">{item.name}</td>
                                            <td className="py-7">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setModalConfig({ isOpen: true, type: 'role', mode: 'edit', data: item })} title="แก้ไข" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    </div>
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setDeleteConfig({ isOpen: true, type: 'role', data: item })} title="ลบ" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {(rolePage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(rolePage * ITEMS_PER_PAGE, roles.length)} จากทั้งหมด {roles.length} รายการ
                                    </p>
                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                        <Pagination current={rolePage} total={totalRolePages} onChange={setRolePage} />
                                    </div>
                                </div>
                            </div>
                        </ListCard>
                    </div>
                </div>

                {/* Section 3: Companies */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[18px] font-headline font-black text-[#1B1C1C] tracking-tight">ตารางการจัดการบริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล</h2>
                        <button onClick={() => setModalConfig({ isOpen: true, type: 'company', mode: 'add', data: null })} className="flex items-center gap-2 bg-[#ED393C] text-white px-4 py-2 rounded-lg font-black text-[14px] shadow-sm hover:opacity-90 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            เพิ่มบริษัทใหม่
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto w-full">
                        <ListCard title="บริษัทของผู้ประมวลผลข้อมูลส่วนบุคคล" icon="corporate_fare">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E2E1]/40">
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase w-2/3">บริษัท</th>
                                        <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E2E1]/10">
                                    {paginatedCompanies.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-7 text-[13.5px] font-medium text-secondary">{item.name}</td>
                                            <td className="py-7">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setModalConfig({ isOpen: true, type: 'company', mode: 'edit', data: item })} title="แก้ไข" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    </div>
                                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                                        <button onClick={() => setDeleteConfig({ isOpen: true, type: 'company', data: item })} title="ลบ" className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                                <div className="px-6 flex items-center justify-between">
                                    <p className="text-[12px] font-medium text-secondary opacity-80">
                                        แสดง {(compPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(compPage * ITEMS_PER_PAGE, companies.length)} จากทั้งหมด {companies.length} รายการ
                                    </p>
                                    <div className="[&_p]:hidden [&_div]:mt-0">
                                        <Pagination current={compPage} total={totalCompPages} onChange={setCompPage} />
                                    </div>
                                </div>
                            </div>
                        </ListCard>
                    </div>
                </div>
            </div>

            <ManagementModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                type={modalConfig.type} 
                mode={modalConfig.mode} 
                initialData={modalConfig.data} 
                onSave={handleSave} 
            />

            <DeleteConfirmModal
                isOpen={deleteConfig.isOpen}
                onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                onConfirm={handleDelete}
                title={currentDeleteContent.title}
                description={currentDeleteContent.desc}
                confirmLabel={currentDeleteContent.btn}
                isLoading={isProcessing}
            />
        </div>
    );
}

export default function DeptManagementPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-on-surface-variant font-medium">กำลังโหลด...</div>}>
            <DeptManagementPageContent />
        </Suspense>
    );
}
