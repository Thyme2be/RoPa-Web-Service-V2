"use client";
import React, { useEffect, useState } from "react";

interface DashboardData {
    document_status_chart: {
        this_week: { draft: number; in_progress: number; completed: number; rejected: number };
        this_month: { draft: number; in_progress: number; completed: number; rejected: number };
        all_time: { draft: number; in_progress: number; completed: number; rejected: number };
    };
}

// Document Tab Mock Data helper
const getDocumentsMiniChartsData = (range: string) => {
    const multi = range === 'week' ? 1 : range === 'month' ? 4 : range === '6months' ? 24 : range === '12months' ? 48 : 82;
    return [
        { title: "เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดของผู้ประมวลผลข้อมูลส่วนบุคคล", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่ต้องตรวจโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่ต้องตรวจสอบโดยผู้ตรวจสอบ", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่รอผู้รับผิดชอบข้อมูลแก้ไข", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่รอผู้ประมวลผลข้อมูลส่วนบุคคลแก้ไข", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่ถูกทำลาย", completed: 80 * multi, empty: 20 * multi },
        { title: "เอกสารทั้งหมดที่ครบกำหนดทำลาย", completed: 80 * multi, empty: 20 * multi },
    ];
};

// Users Tab Mock Data helpers
const getUsersRoleData = (range: string) => {
    const multi = range === 'week' ? 1 : range === 'month' ? 4 : range === '6months' ? 24 : range === '12months' ? 48 : 82;
    return [
        { title: "ผู้รับผิดชอบข้อมูล", count: 15 * multi, color: "#BF0D21" },
        { title: "ผู้ประมวลผลข้อมูลส่วนบุคคล", count: 20 * multi, color: "#E1424E" },
        { title: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", count: 25 * multi, color: "#FFC000" },
        { title: "ผู้ตรวจสอบ", count: 15 * multi, color: "#1F4E79" },
        { title: "ผู้ดูแลระบบ", count: 15 * multi, color: "#4472C4" },
        { title: "ผู้บริหารระดับสูง", count: 5 * multi, color: "#7030A0" },
    ];
};

const getUsersDepartmentData = (range: string) => {
    const multi = range === 'week' ? 1 : range === 'month' ? 4 : range === '6months' ? 24 : range === '12months' ? 48 : 82;
    
    const generic = [
        { name: "แผนกที่ 1 แผนกขาย", count: 3 * multi },
        { name: "แผนกที่ 2 แผนกการตลาด", count: 3 * multi },
        { name: "แผนกที่ 3 แผนกประชาสัมพันธ์", count: 3 * multi },
        { name: "แผนกที่ 4 แผนก IT", count: 3 * multi },
        { name: "แผนกที่ 5 แผนก HR", count: 3 * multi },
    ];

    const processors = [
        { name: "บริษัทที่ 1 A", count: 4 * multi },
        { name: "บริษัทที่ 2 B", count: 4 * multi },
        { name: "บริษัทที่ 3 C", count: 4 * multi },
        { name: "บริษัทที่ 4 D", count: 4 * multi },
        { name: "บริษัทที่ 5 E", count: 4 * multi },
    ];

    return [
        { title: "จำนวนผู้รับผิดชอบข้อมูล", subtitle: "แบ่งตามแผนกการทำงาน", total: 15 * multi, items: generic },
        { title: "จำนวนผู้ประมวลผลข้อมูลส่วนบุคคล", subtitle: "แบ่งตามบริษัท", total: 20 * multi, items: processors },
        { title: "จำนวนเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", subtitle: "แบ่งตามแผนกการทำงาน", total: 25 * multi, items: generic.map(d => ({ ...d, count: d.count + 2 * multi })) },
        {
            title: "จำนวนผู้ตรวจสอบ", subtitle: "แบ่งตามแผนกการทำงาน", total: 9 * multi,
            hasTabs: true,
            tabData: {
                "คนในบริษัท": generic.slice(0, 5).map(d => ({ ...d, count: Math.ceil(d.count / 3) })),
                "คนนอกบริษัท": processors.slice(0, 5).map(d => ({ ...d, count: Math.ceil(d.count / 4) }))
            }
        },
        { title: "จำนวนผู้ดูแลระบบ", subtitle: "แบ่งตามแผนกการทำงาน", total: 15 * multi, items: generic },
        { title: "จำนวนผู้บริหารระดับสูง", subtitle: "แบ่งตามแผนกการทำงาน", total: 5 * multi, items: generic.map(d => ({ ...d, count: Math.ceil(multi) })) },
    ];
};

function MiniDonutChartCard({ title, completed, empty }: { title: string, completed: number, empty: number }) {
    const total = completed + empty;
    const completedPct = total > 0 ? (completed / total) * 100 : 0;
    const emptyPct = total > 0 ? (empty / total) * 100 : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col items-center justify-between min-h-[360px]">
            <h4 className="text-sm font-bold text-neutral-900 w-full text-left mb-6 leading-relaxed h-10">{title}</h4>

            <div className="relative w-40 h-40 mb-6 drop-shadow-sm">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#f0eded" strokeWidth="4"></circle>
                    {/* Empty/Incomplete portion (Red) */}
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#ED393C" strokeDasharray={`${emptyPct} 100`} strokeDashoffset="0" strokeWidth="4" className="transition-all duration-1000 ease-out"></circle>
                    {/* Completed portion (Green) Starts offset after Red portion */}
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`-${emptyPct}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-100"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                    <span className="text-[10px] font-bold text-neutral-800 leading-tight">
                        จำนวนเอกสารทั้งหมด
                    </span>
                </div>
            </div>

            <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#2C8C00]"></div>
                        <span className="text-sm font-bold text-neutral-700">เสร็จสมบูรณ์</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-500">{completed} ฉบับ</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ED393C]"></div>
                        <span className="text-sm font-bold text-neutral-700">ไม่เสร็จสมบูรณ์</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-500">{empty} ฉบับ</span>
                </div>
            </div>
        </div>
    );
}

function UserListCard({ data }: { data: any }) {
    const [activeTab, setActiveTab] = useState("คนในบริษัท");

    const itemsToDisplay = data.hasTabs ? data.tabData[activeTab] : data.items;

    // Calculate total dynamically if tabs exist, otherwise use data.total
    const currentTotal = data.hasTabs
        ? itemsToDisplay.reduce((sum: number, item: any) => sum + item.count, 0)
        : data.total;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col h-full min-h-[400px]">
            {/* Header Series */}
            <div className="flex flex-col mb-6 space-y-3">
                {/* Title Row */}
                <div className="flex justify-between items-start gap-4">
                    <h4 className="text-[17px] font-bold text-neutral-900 leading-snug">{data.title}</h4>

                    <div className="flex items-center gap-2 shrink-0">
                        {data.hasTabs && (
                            <div className="flex gap-2 mr-1">
                                <button
                                    onClick={() => setActiveTab("คนในบริษัท")}
                                    className={`h-7 px-3 text-[12px] font-bold transition-all rounded-md border cursor-pointer ${activeTab === "คนในบริษัท" 
                                        ? "bg-[#ED393C] text-white border-[#ED393C] shadow-sm" 
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}
                                >
                                    คนในบริษัท
                                </button>
                                <button
                                    onClick={() => setActiveTab("คนนอกบริษัท")}
                                    className={`h-7 px-3 text-[12px] font-bold transition-all rounded-md border cursor-pointer ${activeTab === "คนนอกบริษัท" 
                                        ? "bg-[#ED393C] text-white border-[#ED393C] shadow-sm" 
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}
                                >
                                    คนนอกบริษัท
                                </button>
                            </div>
                        )}
                        <div className="px-3 py-1 bg-surface-container rounded-md border border-neutral-200 shadow-sm min-w-[60px] text-center">
                            <span className="text-sm font-bold text-neutral-700">{currentTotal} คน</span>
                        </div>
                    </div>
                </div>

                {/* Subtitle Row */}
                <div>
                    <p className="text-sm text-[#5C403D] font-medium">
                        {data.hasTabs && activeTab === "คนนอกบริษัท" ? "แบ่งตามบริษัท" : data.subtitle}
                    </p>
                </div>
            </div>

            {/* List Array */}
            <div className="flex-1 flex flex-col gap-2">
                {itemsToDisplay.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors shadow-sm bg-white">
                        <span className="text-[14px] font-bold text-neutral-800">{item.name}</span>
                        <span className="text-[14px] font-medium text-neutral-500">{item.count} คน</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<"documents" | "users">("documents");
    const [timeRange, setTimeRange] = useState<"week" | "month">("week");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Mock data directly
            const result = {
                document_status_chart: {
                    this_week: { draft: 215, in_progress: 482, completed: 840, rejected: 42 },
                    this_month: { draft: 315, in_progress: 682, completed: 1840, rejected: 82 },
                    all_time: { draft: 1215, in_progress: 2482, completed: 5840, rejected: 342 }
                }
            };
            setData(result);
            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8 text-on-surface-variant">กำลังโหลดข้อมูล...</div>;
    }

    if (!data) {
        return <div className="flex h-full items-center justify-center p-8 text-[#B90A1E]">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</div>;
    }

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header and Tabs */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">แดชบอร์ดสรุปข้อมูล</h2>
                    <p className="text-[#5C403D] text-[18px] font-medium">ภาพรวมทั้งหมดของระบบ</p>
                </div>

                <div className="flex items-center gap-6 self-start md:self-auto">
                    {/* Group Tab Switch */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold text-neutral-800">เลือกส่วนการแสดงผล</span>
                        <div className="flex gap-2 h-9">
                            <button
                                onClick={() => setActiveTab("documents")}
                                className={`px-6 text-sm font-bold transition-all rounded-md border cursor-pointer ${activeTab === "documents"
                                    ? "bg-[#F33140] text-white border-[#F33140] shadow-sm"
                                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                    }`}
                            >
                                เอกสาร
                            </button>
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`px-6 text-sm font-bold transition-all rounded-md border cursor-pointer ${activeTab === "users"
                                    ? "bg-[#F33140] text-white border-[#F33140] shadow-sm"
                                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                    }`}
                            >
                                ผู้ใช้
                            </button>
                        </div>
                    </div>

                    {/* Time Range Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold text-neutral-800">ช่วงเวลา</span>
                        <div className="relative">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as any)}
                                className="h-9 px-4 pr-10 appearance-none bg-white border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:bg-neutral-50 cursor-pointer min-w-[200px]"
                            >
                                <option value="week">สัปดาห์นี้</option>
                                <option value="month">เดือนนี้</option>
                                <option value="6months">6 เดือนล่าสุด</option>
                                <option value="12months">1 ปีล่าสุด</option>
                                <option value="all">ทั้งหมด</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-sm">
                                expand_more
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Dashboard View */}
            {activeTab === "documents" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                    {/* Main Analytics Section */}
                    <section className="grid grid-cols-1 gap-8">
                        {/* Combined ROPA Status Card */}
                        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100">
                            <div className="mb-1">
                                <h3 className="text-[20px] font-bold tracking-tight text-[#1B1C1C]">สถานะเอกสาร ROPA</h3>
                                <p className="text-[16px] text-[#5C403D] font-medium uppercase tracking-wider mt-0.5">แบ่งตามสถานะการดำเนินงานปัจจุบัน</p>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
                                {(() => {
                                    // Map timeRange to mock data keys
                                    let chartData = data.document_status_chart.this_week;
                                    const multi = timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : timeRange === '6months' ? 24 : timeRange === '12months' ? 48 : 82;
                                    
                                    if (timeRange === "month") chartData = data.document_status_chart.this_month;
                                    else if (timeRange !== "week") {
                                        // Scale month data for larger ranges
                                        chartData = {
                                            draft: data.document_status_chart.this_month.draft * (multi/4),
                                            in_progress: data.document_status_chart.this_month.in_progress * (multi/4),
                                            completed: data.document_status_chart.this_month.completed * (multi/4),
                                            rejected: data.document_status_chart.this_month.rejected * (multi/4),
                                        };
                                    }
                                    const totalDocsTimeRange = chartData.draft + chartData.in_progress + chartData.completed + chartData.rejected;

                                    const draftPct = totalDocsTimeRange > 0 ? (chartData.draft / totalDocsTimeRange) * 100 : 0;
                                    const inProgressPct = totalDocsTimeRange > 0 ? (chartData.in_progress / totalDocsTimeRange) * 100 : 0;
                                    const completedPct = totalDocsTimeRange > 0 ? (chartData.completed / totalDocsTimeRange) * 100 : 0;
                                    const rejectedPct = totalDocsTimeRange > 0 ? (chartData.rejected / totalDocsTimeRange) * 100 : 0;

                                    // Custom ordering for the SVG stroke offset (starting from top)
                                    const completedOffset = 0;
                                    const rejectedOffset = -completedPct;
                                    const inProgressOffset = rejectedOffset - rejectedPct;
                                    const draftOffset = inProgressOffset - inProgressPct;

                                    return (
                                        <>
                                            {/* Donut Chart Portion */}
                                            <div className="relative w-56 h-56 group cursor-pointer drop-shadow-md">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                                                    {completedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`${completedOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-200"></circle>}
                                                    {rejectedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ED393C" strokeDasharray={`${rejectedPct} 100`} strokeDashoffset={`${rejectedOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-300"></circle>}
                                                    {inProgressPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#FFCC00" strokeDasharray={`${inProgressPct} 100`} strokeDashoffset={`${inProgressOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-100"></circle>}
                                                    {draftPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#F0EDED" strokeDasharray={`${draftPct} 100`} strokeDashoffset={`${draftOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out"></circle>}
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-500 group-hover:scale-110 text-center px-4">
                                                    <span className="text-[20px] font-bold text-neutral-800 leading-relaxed">
                                                        จำนวนเอกสาร<br />ทั้งหมด
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Legend */}
                                            <div className="w-56 space-y-1">
                                                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[#F0EDED] shadow-sm border border-zinc-200"></div>
                                                        <span className="text-sm font-bold text-neutral-700">ฉบับร่าง</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500">{chartData.draft} ฉบับ</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[#FFCC00] shadow-sm"></div>
                                                        <span className="text-sm font-bold text-neutral-700">รอดำเนินการ</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500">{chartData.in_progress} ฉบับ</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[#ED393C] shadow-sm"></div>
                                                        <span className="text-sm font-bold text-neutral-700">รอตรวจสอบ</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500">{chartData.rejected} ฉบับ</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[#2C8C00] shadow-sm"></div>
                                                        <span className="text-sm font-bold text-neutral-700">เสร็จสมบูรณ์</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500">{chartData.completed} ฉบับ</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </section>

                    {/* Mini Charts Grid */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {getDocumentsMiniChartsData(timeRange).map((chart, idx) => (
                            <MiniDonutChartCard key={idx} title={chart.title} completed={chart.completed} empty={chart.empty} />
                        ))}
                    </section>
                </div>
            )}

            {/* User Dashboard View */}
            {activeTab === "users" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100">
                        <div className="mb-1">
                            <h3 className="text-[20px] font-bold tracking-tight text-[#1B1C1C]">จำนวนผู้ใช้ทั้งหมด</h3>
                            <p className="text-[16px] text-[#5C403D] font-medium tracking-wide mt-1">แบ่งตามบทบาทการทำงาน</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
                            {(() => {
                                const activeUserRoleData = getUsersRoleData(timeRange);
                                const totalUsersCount = activeUserRoleData.reduce((sum, item) => sum + item.count, 0);
                                let currentOffset = 0;

                                return (
                                    <>
                                        {/* Main Multi-segmented Donut Chart */}
                                        <div className="relative w-56 h-56 drop-shadow-md cursor-pointer group">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                                                {activeUserRoleData.map((item, idx) => {
                                                    const pct = (item.count / totalUsersCount) * 100;
                                                    const dashArray = `${pct} 100`;
                                                    const offset = currentOffset;
                                                    currentOffset -= pct;

                                                    return (
                                                        <circle
                                                            key={idx}
                                                            cx="18"
                                                            cy="18"
                                                            fill="transparent"
                                                            r="16"
                                                            stroke={item.color}
                                                            strokeWidth="3.5"
                                                            strokeDasharray={dashArray}
                                                            strokeDashoffset={offset}
                                                            className="transition-all duration-1000 ease-out"
                                                        ></circle>
                                                    );
                                                })}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-300 group-hover:scale-105 text-center px-4">
                                                <span className="text-[20px] font-bold text-neutral-800 leading-tight">
                                                    จำนวนผู้ใช้ทั้งหมด
                                                </span>
                                            </div>
                                        </div>

                                        {/* Legend List */}
                                        <div className="w-full max-w-[320px] space-y-1">
                                            {activeUserRoleData.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-sm font-bold text-neutral-700 whitespace-nowrap">{item.title}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500 shrink-0 ml-4">{item.count} คน</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Department Grids */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {getUsersDepartmentData(timeRange).map((data, idx) => (
                            <UserListCard key={idx} data={data} />
                        ))}
                    </section>
                </div>
            )}
        </div>
    );
}
