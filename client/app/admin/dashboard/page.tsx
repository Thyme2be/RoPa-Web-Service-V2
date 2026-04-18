"use client";
import React, { useEffect, useState } from "react";
import RopaDonutChart from "@/components/ui/RopaDonutChart";

interface DashboardData {
    document_status_chart: {
        draft: number;
        pending: number;
        completed: number;
        reviewing: number;
    };
    role_stats: {
        data_owner_docs: { title: string, completed: number, incomplete: number };
        processor_docs: { title: string, completed: number, incomplete: number };
        dpo_docs: { title: string, completed: number, incomplete: number };
        auditor_docs: { title: string, completed: number, incomplete: number };
    };
    revision_stats: {
        owner_revisions: { title: string, completed: number, incomplete: number };
        processor_revisions: { title: string, completed: number, incomplete: number };
        destroyed_docs: { title: string, completed: number, incomplete: number };
        due_for_destruction: { title: string, completed: number, incomplete: number };
    };
    user_stats: any;
}

// Helper to map API role keys to Thai labels and colors
const roleMap: Record<string, { label: string, color: string }> = {
    OWNER: { label: "ผู้รับผิดชอบข้อมูล", color: "#BF0D21" },
    PROCESSOR: { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", color: "#E1424E" },
    DPO: { label: "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", color: "#FFB000" },
    AUDITOR: { label: "ผู้ตรวจสอบ", color: "#1F4E79" },
    ADMIN: { label: "ผู้ดูแลระบบ", color: "#4472C4" },
    EXECUTIVE: { label: "ผู้บริหารระดับสูง", color: "#7030A0" }
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
    const [timeRange, setTimeRange] = useState<"7_days" | "30_days" | "all">("30_days");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = "http://localhost:8000";

    const fetchDashboardData = async () => {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found. Please login.");
            setLoading(false);
            return;
        }

        try {
            const headers = { "Authorization": `Bearer ${token}` };

            // Fetch Documents Dashboard
            const docRes = await fetch(`${API_BASE_URL}/dashboard?period=${timeRange}`, { headers });
            if (!docRes.ok) throw new Error("Failed to fetch document statistics");
            const docJson = await docRes.json();

            // Fetch Users Dashboard
            const userRes = await fetch(`${API_BASE_URL}/dashboard/users?period=${timeRange}`, { headers });
            if (!userRes.ok) throw new Error("Failed to fetch user statistics");
            const userJson = await userRes.json();

            setData({
                document_status_chart: {
                    draft: docJson.document_overview.statuses.draft || 0,
                    pending: docJson.document_overview.statuses.pending || 0,
                    completed: docJson.document_overview.statuses.completed || 0,
                    reviewing: docJson.document_overview.statuses.reviewing || 0
                },
                role_stats: docJson.role_based_stats,
                revision_stats: docJson.revision_and_deletion_stats,
                user_stats: userJson
            });
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8 text-on-surface-variant">กำลังโหลดข้อมูล...</div>;
    }

    if (!data) {
        return <div className="flex h-full items-center justify-center p-8 text-[#B90A1E]">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้</div>;
    }

    return (
        <div className="space-y-8 pb-12 max-w-[1440px] mx-auto">
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
                                <option value="7_days">7 วันล่าสุด</option>
                                <option value="30_days">30 วันล่าสุด</option>
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
                                    const chartData = data.document_status_chart;
                                    const totalDocsTimeRange = chartData.draft + chartData.pending + chartData.completed + chartData.reviewing;
                                    const draftPct = totalDocsTimeRange > 0 ? (chartData.draft / totalDocsTimeRange) * 100 : 0;
                                    const pendingPct = totalDocsTimeRange > 0 ? (chartData.pending / totalDocsTimeRange) * 100 : 0;
                                    const completedPct = totalDocsTimeRange > 0 ? (chartData.completed / totalDocsTimeRange) * 100 : 0;
                                    const reviewingPct = totalDocsTimeRange > 0 ? (chartData.reviewing / totalDocsTimeRange) * 100 : 0;

                                    // Custom ordering for the SVG stroke offset (starting from top)
                                    const completedOffset = 0;
                                    const reviewingOffset = -completedPct;
                                    const pendingOffset = reviewingOffset - reviewingPct;
                                    const draftOffset = pendingOffset - pendingPct;

                                    return (
                                        <>
                                            {/* Donut Chart Portion */}
                                            <div className="relative w-56 h-56 group cursor-pointer drop-shadow-md">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                                                    {completedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`${completedOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-200"></circle>}
                                                    {reviewingPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ED393C" strokeDasharray={`${reviewingPct} 100`} strokeDashoffset={`${reviewingOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-300"></circle>}
                                                    {pendingPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#FFCC00" strokeDasharray={`${pendingPct} 100`} strokeDashoffset={`${pendingOffset}`} strokeWidth="3.5" className="transition-all duration-1000 ease-out delay-100"></circle>}
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
                                                    <span className="text-sm font-black text-neutral-500">{chartData.pending} ฉบับ</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors duration-200 cursor-default group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[#ED393C] shadow-sm"></div>
                                                        <span className="text-sm font-bold text-neutral-700">รอตรวจสอบ</span>
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-500">{chartData.reviewing} ฉบับ</span>
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

                    {/* Role-based Document Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MiniDonutChartCard
                            title={data.role_stats.data_owner_docs.title}
                            completed={data.role_stats.data_owner_docs.completed}
                            empty={data.role_stats.data_owner_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.processor_docs.title}
                            completed={data.role_stats.processor_docs.completed}
                            empty={data.role_stats.processor_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.dpo_docs.title}
                            completed={data.role_stats.dpo_docs.completed}
                            empty={data.role_stats.dpo_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.auditor_docs.title}
                            completed={data.role_stats.auditor_docs.completed}
                            empty={data.role_stats.auditor_docs.incomplete}
                        />
                    </div>

                    {/* Revision and Deletion Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MiniDonutChartCard
                            title={data.revision_stats.owner_revisions.title}
                            completed={data.revision_stats.owner_revisions.completed}
                            empty={data.revision_stats.owner_revisions.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.processor_revisions.title}
                            completed={data.revision_stats.processor_revisions.completed}
                            empty={data.revision_stats.processor_revisions.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.destroyed_docs.title}
                            completed={data.revision_stats.destroyed_docs.completed}
                            empty={data.revision_stats.destroyed_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.due_for_destruction.title}
                            completed={data.revision_stats.due_for_destruction.completed}
                            empty={data.revision_stats.due_for_destruction.incomplete}
                        />
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100">
                        <div className="mb-1">
                            <h3 className="text-[20px] font-bold tracking-tight text-[#1B1C1C]">จำนวนผู้ใช้ทั้งหมด</h3>
                            <p className="text-[16px] text-[#5C403D] font-medium tracking-wide mt-1">แบ่งตามบทบาทการทำงาน</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
                            {(() => {
                                const userStats = (data as any).user_stats;
                                const overview = userStats.user_overview || { total: 0, roles: {} };

                                const roleChartData = Object.entries(overview.roles).map(([key, count]) => ({
                                    title: roleMap[key]?.label || key,
                                    count: count as number,
                                    color: roleMap[key]?.color || "#CCC"
                                }));

                                const totalUsersCount = overview.total || 0;
                                let currentOffset = 0;

                                return (
                                    <>
                                        {/* Main Multi-segmented Donut Chart */}
                                        <div className="relative w-56 h-56 drop-shadow-md cursor-pointer group">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                                                {roleChartData.map((item, idx) => {
                                                    const pct = totalUsersCount > 0 ? (item.count / totalUsersCount) * 100 : 0;
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
                                            {roleChartData.map((item, idx) => (
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
                        {(() => {
                            const bd = (data as any).user_stats.role_breakdowns || {};
                            const aud = bd.auditor_breakdown || { internal: { by_department: [] }, external: { by_company: [] } };

                            const cards = [
                                {
                                    title: "จำนวนผู้รับผิดชอบข้อมูล",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    items: (bd.owner_breakdown?.by_department || []).map((i: any) => ({ name: i.department, count: i.count }))
                                },
                                {
                                    title: "จำนวนผู้ประมวลผลข้อมูลส่วนบุคคล",
                                    subtitle: "แบ่งตามบริษัท",
                                    items: (bd.processor_breakdown?.by_company || []).map((i: any) => ({ name: i.company, count: i.count }))
                                },
                                {
                                    title: "จำนวนเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    items: (bd.dpo_breakdown?.by_department || []).map((i: any) => ({ name: i.department, count: i.count }))
                                },
                                {
                                    title: "จำนวนผู้ตรวจสอบ",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    hasTabs: true,
                                    tabData: {
                                        "คนในบริษัท": (aud.internal?.by_department || []).map((i: any) => ({ name: i.department, count: i.count })),
                                        "คนนอกบริษัท": (aud.external?.by_company || []).map((i: any) => ({ name: i.company, count: i.count }))
                                    }
                                }
                            ];

                            return cards.map((c, idx) => {
                                const total = c.hasTabs
                                    ? (c.tabData["คนในบริษัท"].reduce((s: any, i: any) => s + i.count, 0) + c.tabData["คนนอกบริษัท"].reduce((s: any, i: any) => s + i.count, 0))
                                    : c.items.reduce((s: any, i: any) => s + i.count, 0);

                                return <UserListCard key={idx} data={{ ...c, total }} />;
                            });
                        })()}
                    </section>
                </div>
            )}
        </div>
    );
}
