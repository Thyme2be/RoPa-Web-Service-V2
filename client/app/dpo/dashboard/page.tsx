"use client";

import React, { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function SummaryCard({ title, value, unit, subtitle, icon, color = "primary", borderColor = "border-zinc-200" }: any) {
    const colorClasses: any = {
        primary: "text-[#1B1C1C]",
        red: "text-[#ED393C]",
        green: "text-[#2C8C00]",
        blue: "text-[#1F4E79]",
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 ${borderColor} flex flex-col justify-between h-full`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-lg bg-surface-container shadow-sm border border-neutral-100">
                    <span className="material-symbols-outlined text-[#5F5E5E] text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
                </div>
                {subtitle && <p className="text-[14px] font-bold text-[#5F5E5E] text-right leading-tight">{subtitle}</p>}
            </div>
            
            <div>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-[32px] font-black ${colorClasses[color] || colorClasses.primary}`}>{value}</span>
                    {unit && <span className="text-[14px] font-bold text-[#5F5E5E]">{unit}</span>}
                </div>
                <h4 className="text-[14px] font-bold text-[#5F5E5E] leading-snug">{title}</h4>
            </div>
        </div>
    );
}

function RiskDonutChart({ riskData, totalDocuments }: { riskData: any; totalDocuments: number }) {
    const radius = 15;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate proportions (0 to circumference)
    const lowStroke = totalDocuments > 0 ? (riskData.low / totalDocuments) * circumference : 0;
    const mediumStroke = totalDocuments > 0 ? (riskData.medium / totalDocuments) * circumference : 0;
    const highStroke = totalDocuments > 0 ? (riskData.high / totalDocuments) * circumference : 0;

    return (
        <div className="bg-white p-8 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-zinc-200 flex flex-col items-center h-full">
            <h4 className="text-[17px] font-bold text-neutral-900 w-full text-left mb-8">ความเสี่ยงของเอกสารทั้งหมด</h4>
            
            <div className="relative w-48 h-48 mb-8 drop-shadow-sm group cursor-pointer">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle cx="18" cy="18" fill="transparent" r={radius} stroke="#f0eded" strokeWidth="4"></circle>
                    
                    {/* Green: Low Risk */}
                    <circle 
                        cx="18" cy="18" fill="transparent" r={radius} 
                        stroke="#A7F305" 
                        strokeDasharray={`${lowStroke} ${circumference}`} 
                        strokeDashoffset="0" 
                        strokeWidth="4" 
                        strokeLinecap="butt"
                        className="transition-all duration-1000 ease-out"
                    ></circle>
                    
                    {/* Orange: Medium Risk */}
                    <circle 
                        cx="18" cy="18" fill="transparent" r={radius} 
                        stroke="#F9A506" 
                        strokeDasharray={`${mediumStroke} ${circumference}`} 
                        strokeDashoffset={`-${lowStroke}`} 
                        strokeWidth="4" 
                        strokeLinecap="butt"
                        className="transition-all duration-1000 ease-out delay-100"
                    ></circle>
                    
                    {/* Red: High Risk */}
                    <circle 
                        cx="18" cy="18" fill="transparent" r={radius} 
                        stroke="#FB8827" 
                        strokeDasharray={`${highStroke} ${circumference}`} 
                        strokeDashoffset={`-${lowStroke + mediumStroke}`} 
                        strokeWidth="4" 
                        strokeLinecap="butt"
                        className="transition-all duration-1000 ease-out delay-200"
                    ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center px-4 flex-col transition-transform duration-300 group-hover:scale-105">
                    <span className="text-[13px] font-bold text-neutral-900 leading-tight uppercase">จากเอกสารทั้งหมด</span>
                    <span className="text-[14px] font-bold text-neutral-900">{totalDocuments} ฉบับ</span>
                </div>
            </div>

            <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#A7F305] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงต่ำ</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#5F5E5E]">{riskData.low} ฉบับ</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#F9A506] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงปานกลาง</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#5F5E5E]">{riskData.medium} ฉบับ</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FB8827] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงสูง</span>
                    </div>
                    <span className="text-[14px] font-bold text-[#5F5E5E]">{riskData.high} ฉบับ</span>
                </div>
            </div>
        </div>
    );
}

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

export default function DPODashboard() {
    const [timeRange, setTimeRange] = useState("all");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        if (!token) {
            setError("No token found");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/dpo?period=${timeRange}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch DPO dashboard");

            const data = await response.json();
            
            // Map backend DpoDashboardResponse to local stats
            setStats({
                totalDocs: data.total_reviewed.count,
                correctivePersonalDocs: data.revision_needed.owner_count,
                correctiveProcessorDocs: data.revision_needed.processor_count,
                pendingStorage: data.pending_dpo_review.for_archiving,
                pendingDestruction: data.pending_dpo_review.for_destruction,
                riskDistribution: data.risk_overview,
                auditorPending: data.auditor_review_status.pending,
                auditorCompleted: data.auditor_review_status.completed,
                approvedDocs: data.approved_documents.total,
                delayedDocs: data.auditor_delayed.count
            });
        } catch (err: any) {
            console.error("Fetch dashboard error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (loading || !stats) {
        return <LoadingState fullPage message="กำลังโหลด..." />;
    }
    if (error) return <ErrorState title="ไม่สามารถโหลดข้อมูลแดชบอร์ดได้" description={error} onRetry={fetchDashboard} />;

    return (
        <div className="space-y-8 pb-12 transition-opacity duration-300 relative opacity-100">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">แดชบอร์ดสรุปข้อมูล</h2>
                    <p className="text-[#5C403D] text-[16px] font-medium">ภาพรวมการปฏิบัติตามข้อกำหนดและความคืบหน้าของเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</p>
                </div>
                
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <span className="text-[13px] font-bold text-neutral-800">ช่วงเวลา</span>
                    <div className="relative">
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="h-9 px-4 pr-10 appearance-none bg-white border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:bg-neutral-50 cursor-pointer min-w-[200px]"
                        >
                            <option value="7_days">7 วันล่าสุด</option>
                            <option value="30_days">30 วันล่าสุด</option>
                            <option value="6_months">6 เดือนล่าสุด</option>
                            <option value="1_year">1 ปีล่าสุด</option>
                            <option value="all">ทั้งหมด</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-sm">
                            expand_more
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Grid: Summary and Corrective Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <SummaryCard 
                        title="เอกสารทั้งหมดของเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
                        value={stats.totalDocs.toLocaleString()}
                        subtitle="จำนวนเอกสารทั้งหมดที่ดำเนินการตรวจสอบ"
                        icon="inventory_2"
                        borderColor="border-[#6B7280]"
                    />
                </div>
                
                <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-[#BA1A1A]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-[#F6F3F2]">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>edit_note</span>
                        </div>
                        <h4 className="text-[15px] font-bold text-[#5F5E5E] flex-1 text-right">เอกสารที่ต้องแก้ไขหลังจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 divide-x-4 divide-neutral-100">
                        <div className="flex flex-col items-center">
                            <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.correctivePersonalDocs}</span>
                            <span className="text-[14px] font-bold text-[#5F5E5E]">ผู้รับผิดชอบข้อมูล</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.correctiveProcessorDocs}</span>
                            <span className="text-[14px] font-bold text-[#5F5E5E]">ผู้ประมวลผลข้อมูลส่วนบุคคล</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Grid: Risk and Pending Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-4">
                    <RiskDonutChart riskData={stats.riskDistribution} totalDocuments={stats.totalDocs} />
                </div>
                
                <div className="lg:col-span-8 space-y-6 flex flex-col">
                    {/* Sub-grid for Pending DPO tasks */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-blue-500 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-[#F0F5FF]">
                                <span className="material-symbols-outlined text-[#3981ED]" style={{ fontVariationSettings: "'FILL' 0" }}>hourglass_empty</span>
                            </div>
                            <h4 className="text-[15px] font-bold text-[#5F5E5E] flex-1 text-right">เอกสารที่รอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 divide-x-4 divide-blue-100 flex-1 items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.pendingStorage}</span>
                                <span className="text-[14px] font-bold text-[#5F5E5E] text-center px-4">อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.pendingDestruction}</span>
                                <span className="text-[14px] font-bold text-[#5F5E5E] text-center px-4">อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร</span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-grid for Auditor Review */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-blue-500 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-[#F0F5FF]">
                                <span className="material-symbols-outlined text-[#3981ED]" style={{ fontVariationSettings: "'FILL' 0" }}>hourglass_empty</span>
                            </div>
                            <h4 className="text-[15px] font-bold text-[#5F5E5E] flex-1 text-right">การตรวจสอบเอกสารของผู้ตรวจสอบ</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 divide-x-4 divide-blue-100 flex-1 items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.auditorPending}</span>
                                <span className="text-[14px] font-bold text-[#5F5E5E]">เอกสารที่รอการตรวจสอบ</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.auditorCompleted}</span>
                                <span className="text-[14px] font-bold text-[#5F5E5E]">เอกสารที่ตรวจสอบเสร็จสิ้น</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Approval and Delays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-[#2C8C00]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-lg bg-[#F0F9EA] text-[#2C8C00]">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
                        </div>
                        <span className="text-[15px] font-bold text-[#5F5E5E]">เอกสารที่อนุมัติแล้ว</span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[36px] font-black text-neutral-900">{stats.approvedDocs}</span>
                        </div>
                        <p className="text-[14px] font-bold text-[#5F5E5E]">เอกสารทั้งหมดที่ได้รับจากผู้รับผิดชอบข้อมูล</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-[#ED393C]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-lg bg-[#FFF2F2] text-primary">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>priority_high</span>
                        </div>
                        <span className="text-[15px] font-bold text-[#5F5E5E]">เอกสารที่ผู้ตรวจสอบดำเนินการตรวจสอบล่าช้า</span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[36px] font-black text-neutral-900">{stats.delayedDocs}</span>
                        </div>
                        <p className="text-[14px] font-bold text-[#5F5E5E]">ผู้ตรวจสอบดำเนินการล่าช้าเกินกำหนด</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
