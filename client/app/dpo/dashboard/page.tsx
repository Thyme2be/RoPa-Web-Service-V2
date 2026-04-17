"use client";

import React, { useState, useEffect } from "react";

// Mock API function
const fetchDPODashboardData = async (timeRange: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Different data based on time range
    const data: any = {
        "7_days": {
            totalDocs: 124,
            pendingReview: 12,
            actionNeeded: 2,
            complianceScore: 92.5,
            correctivePersonalDocs: 4,
            correctiveProcessorDocs: 1,
            pendingStorage: 8,
            pendingDestruction: 4,
            riskDistribution: { low: 80, medium: 15, high: 5 },
            auditorPending: 5,
            auditorCompleted: 15,
            approvedDocs: 10,
            delayedDocs: 1
        },
        "30_days": {
            totalDocs: 548,
            pendingReview: 42,
            actionNeeded: 5,
            complianceScore: 94.2,
            correctivePersonalDocs: 10,
            correctiveProcessorDocs: 5,
            pendingStorage: 20,
            pendingDestruction: 30,
            riskDistribution: { low: 70, medium: 20, high: 10 },
            auditorPending: 20,
            auditorCompleted: 30,
            approvedDocs: 20,
            delayedDocs: 5
        },
        "all": {
            totalDocs: 1248,
            pendingReview: 85,
            actionNeeded: 12,
            complianceScore: 95.8,
            correctivePersonalDocs: 25,
            correctiveProcessorDocs: 15,
            pendingStorage: 45,
            pendingDestruction: 52,
            riskDistribution: { low: 75, medium: 18, high: 7 },
            auditorPending: 35,
            auditorCompleted: 120,
            approvedDocs: 95,
            delayedDocs: 8
        }
    };
    
    return data[timeRange] || data["30_days"];
};

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
                    <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
                </div>
                {subtitle && <p className="text-[14px] font-bold text-secondary text-right leading-tight">{subtitle}</p>}
            </div>
            
            <div>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-[32px] font-black ${colorClasses[color] || colorClasses.primary}`}>{value}</span>
                    {unit && <span className="text-[14px] font-bold text-secondary">{unit}</span>}
                </div>
                <h4 className="text-[14px] font-bold text-secondary leading-snug">{title}</h4>
            </div>
        </div>
    );
}

function RiskDonutChart({ riskData }: { riskData: any }) {
    const total = riskData.low + riskData.medium + riskData.high;
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-zinc-200 flex flex-col items-center h-full">
            <h4 className="text-[17px] font-bold text-neutral-900 w-full text-left mb-8">ความเสี่ยงของเอกสารทั้งหมด</h4>
            
            <div className="relative w-48 h-48 mb-8 drop-shadow-sm group cursor-pointer">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#f0eded" strokeWidth="4"></circle>
                    {/* Green: Low Risk */}
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#A7F305" strokeDasharray={`${riskData.low} 100`} strokeDashoffset="0" strokeWidth="4" className="transition-all duration-1000 ease-out"></circle>
                    {/* Orange: Medium Risk */}
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#F9A506" strokeDasharray={`${riskData.medium} 100`} strokeDashoffset={`-${riskData.low}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-100"></circle>
                    {/* Red: High Risk */}
                    <circle cx="18" cy="18" fill="transparent" r="15" stroke="#FB8827" strokeDasharray={`${riskData.high} 100`} strokeDashoffset={`-${riskData.low + riskData.medium}`} strokeWidth="4" className="transition-all duration-1000 ease-out delay-200"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center px-4 flex-col transition-transform duration-300 group-hover:scale-105">
                    <span className="text-[13px] font-bold text-neutral-900 leading-tight uppercase">จากเอกสารทั้งหมด</span>
                    <span className="text-[14px] font-bold text-neutral-900">100 ฉบับ</span>
                </div>
            </div>

            <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#A7F305] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงต่ำ (1)</span>
                    </div>
                    <span className="text-[14px] font-bold text-secondary">{riskData.low} ฉบับ</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#F9A506] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงปานกลาง (2)</span>
                    </div>
                    <span className="text-[14px] font-bold text-secondary">{riskData.medium} ฉบับ</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FB8827] shadow-sm"></div>
                        <span className="text-[14px] font-bold text-neutral-700">ความเสี่ยงสูง (3)</span>
                    </div>
                    <span className="text-[14px] font-bold text-secondary">{riskData.high} ฉบับ</span>
                </div>
            </div>
        </div>
    );
}

export default function DPODashboard() {
    const [timeRange, setTimeRange] = useState("30_days");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchDPODashboardData(timeRange);
            setStats(data);
            setLoading(false);
        };
        loadData();
    }, [timeRange]);

    if (!stats) return <div className="h-screen flex items-center justify-center text-secondary font-bold">กำลังโหลดข้อมูล...</div>;

    return (
        <div className={`space-y-8 pb-12 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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
                        <h4 className="text-[15px] font-bold text-secondary flex-1 text-right">เอกสารที่ต้องแก้ไขหลังจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 divide-x-4 divide-neutral-100">
                        <div className="flex flex-col items-center">
                            <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.correctivePersonalDocs}</span>
                            <span className="text-[14px] font-bold text-secondary">ผู้รับผิดชอบข้อมูล</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.correctiveProcessorDocs}</span>
                            <span className="text-[14px] font-bold text-secondary">ผู้ประมวลผลข้อมูลส่วนบุคคล</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Grid: Risk and Pending Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-4">
                    <RiskDonutChart riskData={stats.riskDistribution} />
                </div>
                
                <div className="lg:col-span-8 space-y-6 flex flex-col">
                    {/* Sub-grid for Pending DPO tasks */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-blue-500 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-[#F0F5FF]">
                                <span className="material-symbols-outlined text-[#3981ED]" style={{ fontVariationSettings: "'FILL' 0" }}>hourglass_empty</span>
                            </div>
                            <h4 className="text-[15px] font-bold text-secondary flex-1 text-right">เอกสารที่รอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 divide-x-4 divide-blue-100 flex-1 items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.pendingStorage}</span>
                                <span className="text-[14px] font-bold text-secondary text-center px-4">อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.pendingDestruction}</span>
                                <span className="text-[14px] font-bold text-secondary text-center px-4">อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร</span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-grid for Auditor Review */}
                    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-blue-500 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-[#F0F5FF]">
                                <span className="material-symbols-outlined text-[#3981ED]" style={{ fontVariationSettings: "'FILL' 0" }}>hourglass_empty</span>
                            </div>
                            <h4 className="text-[15px] font-bold text-secondary flex-1 text-right">การตรวจสอบเอกสารของผู้ตรวจสอบ</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 divide-x-4 divide-blue-100 flex-1 items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.auditorPending}</span>
                                <span className="text-[14px] font-bold text-secondary">เอกสารที่รอการตรวจสอบ</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[42px] font-black text-neutral-800 mb-1">{stats.auditorCompleted}</span>
                                <span className="text-[14px] font-bold text-secondary">เอกสารที่ตรวจสอบเสร็จสิ้น</span>
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
                        <span className="text-[15px] font-bold text-secondary">เอกสารที่อนุมัติแล้ว</span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[36px] font-black text-neutral-900">{stats.approvedDocs}</span>
                        </div>
                        <p className="text-[14px] font-bold text-secondary">เอกสารทั้งหมดที่ได้รับจากผู้รับผิดชอบข้อมูล</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-b-4 border-[#ED393C]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-lg bg-[#FFF2F2] text-primary">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>priority_high</span>
                        </div>
                        <span className="text-[15px] font-bold text-secondary">เอกสารที่ผู้ตรวจสอบดำเนินการตรวจสอบล่าช้า</span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[36px] font-black text-neutral-900">{stats.delayedDocs}</span>
                        </div>
                        <p className="text-[14px] font-bold text-secondary">ผู้ตรวจสอบดำเนินการล่าช้าเกินกำหนด</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
