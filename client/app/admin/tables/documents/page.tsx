"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { ListCard, Pagination, GenericFilterBar, StatusBadge } from "@/components/ropa/ListComponents";
import Select from "@/components/ui/Select";

function DocumentsPageContent() {
    const searchParams = useSearchParams();
    const globalSearchQuery = searchParams.get("search") || "";

    const [docsData, setDocsData] = useState<{
        summary: any;
        documents_list: any[];
    }>({
        summary: null,
        documents_list: []
    });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
    const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");
    const [customDate, setCustomDate] = useState("");

    const ITEMS_PER_PAGE = 5;

    const fetchDocuments = async () => {
        // Mock data with timestamps for filtering
        const now = new Date();
        const twoDaysAgo = new Date(); twoDaysAgo.setDate(now.getDate() - 2);
        const tenDaysAgo = new Date(); tenDaysAgo.setDate(now.getDate() - 10);
        const twelveDaysAgo = new Date(); twelveDaysAgo.setDate(now.getDate() - 12);

        const formatDateThai = (date: Date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear() + 543;
            return `${day}/${month}/${year}`;
        };

        const data = {
            documents_list: [
                {
                    id: "RP-2026-03",
                    name: "ข้อมูลลูกค้า",
                    owner: "นางสาวพรรษชล บุญมาก",
                    department: "แผนก IT",
                    dpo: "นางสาวพิมพ์ชนก วัฒนากุล",
                    activity: `สร้างเมื่อ ${formatDateThai(twoDaysAgo)}`,
                    status: "รอดำเนินการ",
                    timestamp: twoDaysAgo.toISOString()
                },
                {
                    id: "RP-2026-02",
                    name: "การกำกับดูแลข้อมูลธุรกรรม",
                    owner: "นางสาวพรรษชล บุญมาก",
                    department: "แผนก IT",
                    dpo: "นางสาวพิมพ์ชนก วัฒนากุล",
                    activity: `แก้ไขล่าสุดเมื่อ ${formatDateThai(tenDaysAgo)}`,
                    status: "รอตรวจสอบ",
                    timestamp: tenDaysAgo.toISOString()
                },
                {
                    id: "RP-2026-01",
                    name: "การจัดการข้อมูลโครงข่าย",
                    owner: "นางสาวพรรษชล บุญมาก",
                    department: "แผนก IT",
                    dpo: "นางสาวพิมพ์ชนก วัฒนากุล",
                    activity: `สร้างเมื่อ ${formatDateThai(now)}`,
                    status: "เสร็จสมบูรณ์",
                    timestamp: now.toISOString()
                },
                {
                    id: "RP-2026-04",
                    name: "ข้อมูลพนักงาน",
                    owner: "นายสมชาย ใจดี",
                    department: "แผนก HR",
                    dpo: "นางสาวพิมพ์ชนก วัฒนากุล",
                    activity: `สร้างเมื่อ ${formatDateThai(twelveDaysAgo)}`,
                    status: "เสร็จสมบูรณ์",
                    timestamp: twelveDaysAgo.toISOString()
                },
                {
                    id: "RP-2026-05",
                    name: "ข้อมูลผู้สมัครงาน",
                    owner: "นางสาววิไลลักษณ์ สวยสม",
                    department: "แผนก HR",
                    dpo: "นางสาวพิมพ์ชนก วัฒนากุล",
                    activity: `กำลังแก้ไขเมื่อ ${formatDateThai(now)}`,
                    status: "รอดำเนินการ",
                    timestamp: now.toISOString()
                }
            ]
        };

        setDocsData({
            summary: null,
            documents_list: data.documents_list
        });
        setLoading(false);
    };

    React.useEffect(() => {
        fetchDocuments();
    }, []);

    const filteredDocs = docsData.documents_list.filter((doc: any) => {
        const matchesStatus = selectedStatus === "ทั้งหมด" || doc.status === selectedStatus;
        const matchesSearch = doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            doc.id.toLowerCase().includes(globalSearchQuery.toLowerCase());

        // Date filtering logic
        let matchesDate = true;
        const now = new Date();
        const docDate = new Date(doc.timestamp);

        if (selectedDateRange === "ภายใน 7 วัน") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            matchesDate = docDate >= sevenDaysAgo;
        } else if (selectedDateRange === "ภายใน 30 วัน") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            matchesDate = docDate >= thirtyDaysAgo;
        } else if (selectedDateRange === "กำหนดเอง" && customDate) {
            const selectedDate = new Date(customDate);
            // Compare only year, month, and day
            matchesDate = docDate.getFullYear() === selectedDate.getFullYear() &&
                docDate.getMonth() === selectedDate.getMonth() &&
                docDate.getDate() === selectedDate.getDate();
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
    const paginatedDocs = filteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full -m-8">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Page Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">ตารางแสดงเอกสารในระบบ</h2>
                    </div>
                </div>

                {/* Filters Box */}
                <GenericFilterBar onClear={() => { setSelectedStatus("ทั้งหมด"); setSelectedDateRange("ทั้งหมด"); setCustomDate(""); setCurrentPage(1); }}>
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
                                { label: "รอดำเนินการ", value: "รอดำเนินการ" },
                                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                                { label: "เสร็จสมบูรณ์", value: "เสร็จสมบูรณ์" }
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
                                    { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" },
                                    { label: "กำหนดเอง", value: "กำหนดเอง" }
                                ]}
                                containerClassName="!w-full"
                            />
                        </div>

                        {selectedDateRange === "กำหนดเอง" && (
                            <div className="w-[200px] animate-in fade-in slide-in-from-left-2 duration-300">
                                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight mb-2">เลือกวันที่</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full h-11 bg-white border border-[#E5E2E1] rounded-xl px-4 py-2 text-sm font-medium outline-none hover:border-primary/20 transition-all text-[#6B7280]"
                                    />
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">calendar_month</span>
                                </div>
                            </div>
                        )}
                    </div>
                </GenericFilterBar>

                {/* ListCard Table */}
                <div className="space-y-0">
                    <ListCard title="เอกสารในระบบทั้งหมด" icon="check_circle" iconColor="#00818B">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E2E1]/40">
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อเอกสาร</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อผู้รับผิดชอบข้อมูล</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สังกัด /แผนก</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">ชื่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">การดำเนินการ</th>
                                    <th className="py-5 text-[14px] font-black tracking-tight text-[#5C403D] uppercase">สถานะเอกสาร</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E2E1]/10">
                                {paginatedDocs.length > 0 ? paginatedDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-7 text-[13.5px] font-medium text-left pl-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-secondary text-[13.5px] opacity-70">{doc.id}</span>
                                                <span className="text-[#1B1C1C] font-medium tracking-tight">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{doc.owner}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{doc.department}</td>
                                        <td className="py-7 text-[13.5px] font-medium text-secondary">{doc.dpo}</td>
                                        <td className="py-7 text-[12px] font-medium text-secondary italic opacity-80">{doc.activity}</td>
                                        <td className="py-7">
                                            <div className="flex justify-center scale-110">
                                                <StatusBadge status={doc.status as any} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-[#5F5E5E] text-[14px] font-medium">ไม่พบข้อมูลเอกสารในระบบ</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Section matching the requested layout */}
                        <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                            <div className="px-6 flex items-center justify-between">
                                <p className="text-[12px] font-medium text-secondary opacity-80">
                                    แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)} จากทั้งหมด {filteredDocs.length} รายการ
                                </p>
                                <div className="[&_p]:hidden [&_div]:mt-0">
                                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                                </div>
                            </div>
                        </div>
                    </ListCard>
                </div>
            </div>
        </div>
    );
}

export default function DocumentsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center p-8 text-on-surface-variant font-medium">
                กำลังโหลด...
            </div>
        }>
            <DocumentsPageContent />
        </Suspense>
    );
}
