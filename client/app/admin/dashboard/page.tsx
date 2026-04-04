"use client";
import React from "react";

const MOCK_DOCUMENTS = [
    { id: 1, name: "Doc 1", role: "ผู้รับผิดชอบข้อมูล", status: "รอการตรวจสอบ" },
    { id: 2, name: "Doc 2", role: "ผู้รับผิดชอบข้อมูล", status: "เสร็จสมบูรณ์" },
    { id: 3, name: "Doc 3", role: "ผู้ตรวจสอบ", status: "รอการตรวจสอบ" },
    { id: 4, name: "Doc 4", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", status: "รอการตรวจสอบ" },
    { id: 5, name: "Doc 5", role: "ผู้รับผิดชอบข้อมูล", status: "รอการตรวจสอบ" },
    { id: 6, name: "Doc 6", role: "ผู้ตรวจสอบ", status: "รอการตรวจสอบ" },
    { id: 7, name: "Doc 7", role: "ผู้ตรวจสอบ", status: "รอการตรวจสอบ" },
    { id: 8, name: "Doc 8", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", status: "รอการตรวจสอบ" },
    { id: 9, name: "Doc 9", role: "ผู้รับผิดชอบข้อมูล", status: "เสร็จสมบูรณ์" },
    { id: 10, name: "Doc 10", role: "ผู้ตรวจสอบ", status: "รอการตรวจสอบ" },
    { id: 11, name: "Doc 11", role: "ผู้รับผิดชอบข้อมูล", status: "รอการตรวจสอบ" },
    { id: 12, name: "Doc 12", role: "ผู้ประมวลผลข้อมูลส่วนบุคคล", status: "เสร็จสมบูรณ์" },
];

const MOCK_DASHBOARD_STATS = {
    controllerTrend: "+2 เดือนนี้",
    processorTrend: "ไม่มีการเปลี่ยนแปลง",
    auditorTrend: "ต้องการการตรวจสอบ",
    totalTrend: "12% จากไตรมาสก่อน"
};

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
    const [timeRange, setTimeRange] = React.useState<"week" | "month">("month");

    return (
        <div className="space-y-8 pb-12 overflow-x-hidden">
            {/* Summary Bento Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="ผู้รับผิดชอบข้อมูล"
                    value={MOCK_DOCUMENTS.filter(d => d.role === "ผู้รับผิดชอบข้อมูล").length.toLocaleString().padStart(2, '0')}
                    trend={MOCK_DASHBOARD_STATS.controllerTrend}
                    trendIcon="trending_up"
                    trendColorClass="text-[#00666e]"
                />
                <StatCard
                    title="ผู้ประมวลผลข้อมูลส่วนบุคคล"
                    value={MOCK_DOCUMENTS.filter(d => d.role === "ผู้ประมวลผลข้อมูลส่วนบุคคล").length.toLocaleString().padStart(2, '0')}
                    trend={MOCK_DASHBOARD_STATS.processorTrend}
                    trendIcon="horizontal_rule"
                    trendColorClass="text-zinc-400"
                />
                <StatCard
                    title="ผู้ตรวจสอบ"
                    value={MOCK_DOCUMENTS.filter(d => d.role === "ผู้ตรวจสอบ").length.toLocaleString().padStart(2, '0')}
                    trend={MOCK_DASHBOARD_STATS.auditorTrend}
                    trendIcon="warning"
                    trendColorClass="text-[#B90A1E]"
                    iconFill={true}
                />
                <StatCard
                    title="รวมเอกสารทั้งหมด"
                    value={MOCK_DOCUMENTS.length.toLocaleString().padStart(2, '0')}
                    trend={MOCK_DASHBOARD_STATS.totalTrend}
                    trendIcon="arrow_upward"
                    trendColorClass="text-[#00666e]"
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
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    timeRange === "week" 
                                        ? "bg-[#B90A1E] text-white shadow-sm shadow-[#B90A1E]/10" 
                                        : "bg-[#F6F3F2] text-[#1B1C1C] hover:bg-surface-container-high"
                                }`}
                            >
                                สัปดาห์นี้
                            </button>
                            <button 
                                onClick={() => setTimeRange("month")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    timeRange === "month" 
                                        ? "bg-[#B90A1E] text-white shadow-sm shadow-[#B90A1E]/10" 
                                        : "bg-[#F6F3F2] text-[#1B1C1C] hover:bg-surface-container-high"
                                }`}
                            >
                                เดือนนี้
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 py-4">
                        {/* Donut Chart Portion */}
                        <div className="relative w-56 h-56 group cursor-pointer">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="3.5"></circle>
                                {/* ฉบับร่าง - Grey (12%) */}
                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#F0EDED" strokeDasharray="12 100" strokeDashoffset="0" strokeWidth="4" className="transition-all duration-1000 ease-out"></circle>
                                {/* กำลังดำเนินการ - Yellow (20%) */}
                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#FFCC00" strokeDasharray="20 100" strokeDashoffset="-12" strokeWidth="4" className="transition-all duration-1000 ease-out delay-100"></circle>
                                {/* เสร็จสมบูรณ์ - Green (65%) */}
                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2C8C00" strokeDasharray="65 100" strokeDashoffset="-32" strokeWidth="4" className="transition-all duration-1000 ease-out delay-200"></circle>
                                {/* ถูกปฏิเสธ - Red (3%) */}
                                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#ED393C" strokeDasharray="3 100" strokeDashoffset="-97" strokeWidth="4" className="transition-all duration-1000 ease-out delay-300"></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col transition-all duration-500 group-hover:scale-110">
                                <span className="text-lg font-extrabold text-[#1B1C1C] leading-tight">จำนวนเอกสาร</span>
                                <span className="text-lg font-extrabold text-[#1B1C1C] leading-tight">ทั้งหมด</span>
                            </div>
                        </div>

                        {/* Legend / Status Description */}
                        <div className="w-full max-w-xs space-y-3">
                            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                <div className="flex items-center gap-4">
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#F0EDED] shadow-sm border border-zinc-200"></div> 
                                    <span className="text-sm font-bold text-on-surface">ฉบับร่าง</span>
                                </div>
                                <span className="text-sm font-black text-[#71717A]">215 ฉบับ</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                <div className="flex items-center gap-4">
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFCC00] shadow-sm"></div> 
                                    <span className="text-sm font-bold text-on-surface">กำลังดำเนินการ</span>
                                </div>
                                <span className="text-sm font-black text-[#71717A]">482 ฉบับ</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                <div className="flex items-center gap-4">
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#2C8C00] shadow-sm"></div> 
                                    <span className="text-sm font-bold text-on-surface">เสร็จสมบูรณ์</span>
                                </div>
                                <span className="text-sm font-black text-[#71717A]">840 ฉบับ</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 cursor-default group">
                                <div className="flex items-center gap-4">
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#ED393C] shadow-sm shadow-primary/20"></div> 
                                    <span className="text-sm font-bold text-on-surface">ถูกปฏิเสธ</span>
                                </div>
                                <span className="text-sm font-black text-[#71717A]">42 ฉบับ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
