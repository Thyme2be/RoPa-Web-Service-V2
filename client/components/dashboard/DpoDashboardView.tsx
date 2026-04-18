import React from "react";
import RopaDonutChart from "@/components/ui/RopaDonutChart";

interface DpoDashboardProps {
    stats: {
        totalDocs: number;
        pendingReview: number;
        actionNeeded: number;
        complianceScore: number;
        correctivePersonalDocs: number;
        correctiveProcessorDocs: number;
        pendingStorage: number;
        pendingDestruction: number;
        riskDistribution: { low: number, medium: number, high: number };
        auditorPending: number;
        auditorCompleted: number;
        approvedDocs: number;
        delayedDocs: number;
    };
}

export default function DpoDashboardView({ stats }: DpoDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
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
    const chartData = [
        { label: "ความเสี่ยงต่ำ (1)", value: riskData.low, color: "#A7F305" },
        { label: "ความเสี่ยงปานกลาง (2)", value: riskData.medium, color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)", value: riskData.high, color: "#FB8827" },
    ];

    return (
        <RopaDonutChart
            variant="card"
            title="ความเสี่ยงของเอกสารทั้งหมด"
            data={chartData}
            total={riskData.low + riskData.medium + riskData.high}
        />
    );
}

function RiskLegendItem({ color, label, value }: { color: string, label: string, value: number }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                <span className="text-[14px] font-bold text-neutral-700">{label}</span>
            </div>
            <span className="text-[14px] font-bold text-secondary">{value} ฉบับ</span>
        </div>
    );
}
