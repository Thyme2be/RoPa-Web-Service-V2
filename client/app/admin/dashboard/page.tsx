"use client";
import React, { useEffect, useState } from "react";

interface DashboardData {
    users: {
        data_owners: { count: number; trends: { direction: string; value: string; text_label: string } };
        data_processors: { count: number; trends: { direction: string; value: string; text_label: string } };
        auditors: { count: number; trends: { direction: string; value: string; text_label: string } };
    };
    documents: {
        total: number;
        trends: { direction: string; value: string; text_label: string };
    };
    document_status_chart: {
        this_week: { draft: number; in_progress: number; completed: number; rejected: number };
        this_month: { draft: number; in_progress: number; completed: number; rejected: number };
        all_time: { draft: number; in_progress: number; completed: number; rejected: number };
    };
}

function getTrendStyling(direction: string) {
    if (direction === "up") return { trendIcon: "trending_up", trendColorClass: "text-[#00666e]" };
    if (direction === "down") return { trendIcon: "trending_down", trendColorClass: "text-[#B90A1E]" };
    return { trendIcon: "horizontal_rule", trendColorClass: "text-zinc-400" };
}

interface StatCardProps {
    title: string;
    value: string | number;
    trend: string;
    trendIcon: string;
    trendColorClass: string;
    showBorder?: boolean;
    titleColor?: string;
    iconFill?: boolean;
}

function StatCard({
    title,
    value,
    trend,
    trendIcon,
    trendColorClass,
    showBorder = false,
    titleColor,
    iconFill = false
}: StatCardProps) {
    return (
        <div className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] flex flex-col justify-between group ${showBorder ? "border-l-4 border-[#B90A1E]" : ""}`}>
            <div>
                <span
                    className="text-[14px] font-bold uppercase tracking-normal"
                    style={{ color: titleColor || "var(--on-surface-variant)" }}
                >
                    {title}
                </span>
                <div className="text-3xl font-extrabold mt-1 text-[#1B1C1C]">
                    {value}
                </div>
            </div>
            <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${trendColorClass}`}>
                <span
                    className="material-symbols-outlined text-sm"
                    style={iconFill ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                    {trendIcon}
                </span>
                <span>{trend}</span>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [timeRange, setTimeRange] = useState<"week" | "month">("month");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token") || "";
                const response = await fetch("http://localhost:8000/admin/dashboard", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
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
        <div className="space-y-8 pb-12 overflow-x-hidden">
            {/* Summary Bento Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="ผู้รับผิดชอบข้อมูล"
                    value={data.users.data_owners.count.toLocaleString().padStart(2, '0')}
                    trend={`${data.users.data_owners.trends.value} ${data.users.data_owners.trends.text_label}`.trim()}
                    {...getTrendStyling(data.users.data_owners.trends.direction)}
                />
                <StatCard
                    title="ผู้ประมวลผลข้อมูลส่วนบุคคล"
                    value={data.users.data_processors.count.toLocaleString().padStart(2, '0')}
                    trend={`${data.users.data_processors.trends.value} ${data.users.data_processors.trends.text_label}`.trim()}
                    {...getTrendStyling(data.users.data_processors.trends.direction)}
                />
                <StatCard
                    title="ผู้ตรวจสอบ"
                    value={data.users.auditors.count.toLocaleString().padStart(2, '0')}
                    trend={`${data.users.auditors.trends.value} ${data.users.auditors.trends.text_label}`.trim()}
                    {...getTrendStyling(data.users.auditors.trends.direction)}
                    iconFill={data.users.auditors.trends.direction === "down"}
                />
                <StatCard
                    title="รวมเอกสารทั้งหมด"
                    value={data.documents.total.toLocaleString().padStart(2, '0')}
                    trend={`${data.documents.trends.value} ${data.documents.trends.text_label}`.trim()}
                    {...getTrendStyling(data.documents.trends.direction)}
                    titleColor="#B90A1E"
                    showBorder={true}
                />
            </section>

            {/* Main Analytics Section */}
            <section className="grid grid-cols-1 gap-8">
                {/* Combined ROPA Status Card */}
                <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)]">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight text-on-surface">สถานะเอกสาร ROPA</h3>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mt-0.5">แบ่งตามสถานะการดำเนินงานปัจจุบัน</p>
                        </div>
                        <div className="flex gap-2 text-white">
                            <button
                                onClick={() => setTimeRange("week")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${timeRange === "week"
                                    ? "bg-[#B90A1E] text-white shadow-sm shadow-[#B90A1E]/10"
                                    : "bg-[#F6F3F2] text-[#1B1C1C] hover:bg-surface-container-high"
                                    }`}
                            >
                                สัปดาห์นี้
                            </button>
                            <button
                                onClick={() => setTimeRange("month")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${timeRange === "month"
                                    ? "bg-[#B90A1E] text-white shadow-sm shadow-[#B90A1E]/10"
                                    : "bg-[#F6F3F2] text-[#1B1C1C] hover:bg-surface-container-high"
                                    }`}
                            >
                                เดือนนี้
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 py-4">
                        {(() => {
                            const chartData = timeRange === "week" ? data.document_status_chart.this_week : data.document_status_chart.this_month;
                            const totalDocsTimeRange = chartData.draft + chartData.in_progress + chartData.completed + chartData.rejected;

                            // Calculate stroke array parts for circle drawing
                            const draftPct = totalDocsTimeRange > 0 ? (chartData.draft / totalDocsTimeRange) * 100 : 0;
                            const inProgressPct = totalDocsTimeRange > 0 ? (chartData.in_progress / totalDocsTimeRange) * 100 : 0;
                            const completedPct = totalDocsTimeRange > 0 ? (chartData.completed / totalDocsTimeRange) * 100 : 0;
                            const rejectedPct = totalDocsTimeRange > 0 ? (chartData.rejected / totalDocsTimeRange) * 100 : 0;

                            // Offsets
                            const inProgressOffset = -draftPct;
                            const completedOffset = inProgressOffset - inProgressPct;
                            const rejectedOffset = completedOffset - completedPct;

                            return (
                                <>
                                    {/* Donut Chart Portion */}
                                    <div className="relative w-56 h-56 group cursor-pointer">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>

                                            {/* ฉบับร่าง - Grey */}
                                            {draftPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#F0EDED" strokeDasharray={`${draftPct} 100`} strokeDashoffset="0" strokeWidth="4" className="transition-all duration-1000 ease-out"></circle>}
                                            {/* กำลังดำเนินการ - Yellow */}
                                            {inProgressPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#FFCC00" strokeDasharray={`${inProgressPct} 100`} strokeDashoffset={`${inProgressOffset}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-100"></circle>}
                                            {/* เสร็จสมบูรณ์ - Green */}
                                            {completedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2C8C00" strokeDasharray={`${completedPct} 100`} strokeDashoffset={`${completedOffset}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-200"></circle>}
                                            {/* ถูกปฏิเสธ - Red */}
                                            {rejectedPct > 0 && <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ED393C" strokeDasharray={`${rejectedPct} 100`} strokeDashoffset={`${rejectedOffset}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-300"></circle>}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-500 group-hover:scale-110 text-center px-4">
                                            <span className="text-[20px] font-bold text-on-surface-variant leading-relaxed">
                                                จำนวนเอกสาร<br />ทั้งหมด
                                            </span>
                                        </div>
                                    </div>

                                    {/* Legend / Status Description */}
                                    <div className="w-full max-w-xs space-y-1">
                                        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#F0EDED] shadow-sm border border-zinc-200"></div>
                                                <span className="text-sm font-bold text-on-surface">ฉบับร่าง</span>
                                            </div>
                                            <span className="text-sm font-black text-[#71717A]">{chartData.draft} ฉบับ</span>
                                        </div>
                                        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#FFCC00] shadow-sm"></div>
                                                <span className="text-sm font-bold text-on-surface">กำลังดำเนินการ</span>
                                            </div>
                                            <span className="text-sm font-black text-[#71717A]">{chartData.in_progress} ฉบับ</span>
                                        </div>
                                        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#2C8C00] shadow-sm"></div>
                                                <span className="text-sm font-bold text-on-surface">เสร็จสมบูรณ์</span>
                                            </div>
                                            <span className="text-sm font-black text-[#71717A]">{chartData.completed} ฉบับ</span>
                                        </div>
                                        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#ED393C] shadow-sm shadow-primary/20"></div>
                                                <span className="text-sm font-bold text-on-surface">ถูกปฏิเสธ</span>
                                            </div>
                                            <span className="text-sm font-black text-[#71717A]">{chartData.rejected} ฉบับ</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </section>
        </div>
    );
}
