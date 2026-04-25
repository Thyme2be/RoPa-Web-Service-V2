"use client";

import React, { useState, useMemo } from "react";
import RopaStatusCard from "@/components/dashboard/RopaStatusCard";
import RiskAnalysisCard from "@/components/dashboard/RiskAnalysisCard";
import SensitiveDataCard from "@/components/dashboard/SensitiveDataCard";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import Select from "@/components/ui/Select";
import { DonutData } from "@/components/ui/DonutChart";

interface ExecutiveDashboardViewProps {
    stats?: {
        selected_period: string;
        ropa_status_overview: {
            draft: number;
            pending: number;
            under_review: number;
            completed: number;
            total: number;
        };
        risk_by_department: {
            department: string;
            low: number;
            medium: number;
            high: number;
            total: number;
        }[];
        sensitive_docs_by_department: {
            department: string;
            count: number;
        }[];
        pending_documents: {
            data_owner_count: number;
            data_processor_count: number;
        };
        approved_documents: {
            total: number;
        };
        pending_dpo_review: {
            for_archiving: number;
            for_destruction: number;
        };
    };
}

const RISK_COLORS: DonutData["color"][] = ["#B4F534", "#F9A506", "#FB8827"];

function makeRisk(low: number, med: number, high: number): DonutData[] {
    return [
        { label: "ความเสี่ยงต่ำ (1)", value: low, color: RISK_COLORS[0] },
        { label: "ความเสี่ยงปานกลาง (2)", value: med, color: RISK_COLORS[1] },
        { label: "ความเสี่ยงสูง (3)", value: high, color: RISK_COLORS[2] },
    ];
}

function makeStatus(draft: number, pending: number, review: number, done: number): DonutData[] {
    return [
        { label: "ฉบับร่าง", value: draft, color: "#F0EDED" },
        { label: "รอดำเนินการ", value: pending, color: "#FFCC00" },
        { label: "รอตรวจสอบ", value: review, color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: done, color: "#2C8C00" },
    ];
}

import LoadingState from "@/components/ui/LoadingState";

export default function ExecutiveDashboardView({ stats }: ExecutiveDashboardViewProps) {
    if (!stats) return <LoadingState message="กำลังโหลดข้อมูลแดชบอร์ด..." />;

    const [selectedDept, setSelectedDept] = useState<string>("ทั้งหมด");

    // Dynamic department options from backend data
    const DEPT_OPTIONS = useMemo(() => {
        const base = [{ label: "ทุกแผนก", value: "ทั้งหมด" }];
        if (!stats?.risk_by_department) return base;
        const depts = stats.risk_by_department.map(d => ({ label: d.department, value: d.department }));
        return [...base, ...depts];
    }, [stats]);

    // ROPA Status Mapping
    const orgRopaStatus = useMemo(() => {
        if (!stats?.ropa_status_overview) return makeStatus(0, 0, 0, 0);
        const { draft, pending, under_review, completed } = stats.ropa_status_overview;
        return makeStatus(draft, pending, under_review, completed);
    }, [stats]);

    const totalOrgDocs = stats?.ropa_status_overview?.total || 0;

    // Risk Mapping (Filtered by Dept)
    const riskChartData = useMemo(() => {
        if (!stats?.risk_by_department) return makeRisk(0, 0, 0);
        
        if (selectedDept === "ทั้งหมด") {
            const low = stats.risk_by_department.reduce((s, d) => s + d.low, 0);
            const med = stats.risk_by_department.reduce((s, d) => s + d.medium, 0);
            const high = stats.risk_by_department.reduce((s, d) => s + d.high, 0);
            return makeRisk(low, med, high);
        }
        
        const deptData = stats.risk_by_department.find(d => d.department === selectedDept);
        return deptData ? makeRisk(deptData.low, deptData.medium, deptData.high) : makeRisk(0, 0, 0);
    }, [stats, selectedDept]);

    const totalRiskDocs = useMemo(() => riskChartData.reduce((s, i) => s + i.value, 0), [riskChartData]);

    // Sensitive Data Mapping
    const sensitiveItems = useMemo(() => {
        if (!stats?.sensitive_docs_by_department) return [];
        return stats.sensitive_docs_by_department.map(d => ({ dept: d.department, count: d.count }));
    }, [stats]);

    const sensitiveTotal = useMemo(() => sensitiveItems.reduce((s, i) => s + i.count, 0), [sensitiveItems]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* ROPA Status (org-wide) */}
            {totalOrgDocs > 0 ? (
                <RopaStatusCard data={orgRopaStatus} />
            ) : (
                <div className="bg-white rounded-[48px] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F6F3F2]">
                    <div className="flex flex-col mb-12">
                        <h2 className="text-[20px] font-black text-[#1B1C1C] tracking-tight mb-1">สถานะเอกสาร ROPA</h2>
                        <p className="text-[15px] text-neutral-400 font-bold uppercase tracking-wider">แบ่งตามสถานะการดำเนินงานปัจจุบัน</p>
                    </div>
                    <div className="flex items-center justify-center gap-24">
                        <div className="relative flex items-center justify-center shrink-0 border-[35px] border-[#F6F3F2] rounded-full" style={{ width: 260, height: 260 }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                                <div className="text-[13px] font-black text-[#1B1C1C] leading-tight flex flex-col items-center">
                                    <span>จำนวนเอกสาร</span>
                                    <span>ทั้งหมด</span>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-400 mt-1">0 ฉบับ</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-y-6">
                            {orgRopaStatus.map((item, i) => (
                                <div key={i} className="flex items-center justify-between w-[280px] group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-[17px] font-bold text-[#1B1C1C] opacity-80 group-hover:opacity-100 transition-opacity">
                                            {item.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[18px] font-black text-[#1B1C1C]">0</span>
                                        <span className="text-[14px] text-neutral-400 font-bold">ฉบับ</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Risk + Sensitive (filtered by dept) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {totalRiskDocs > 0 ? (
                    <RiskAnalysisCard
                        data={riskChartData}
                        totalDocuments={totalRiskDocs}
                        departments={DEPT_OPTIONS}
                        selectedDept={selectedDept}
                        onDeptChange={(v) => setSelectedDept(v)}
                    />
                ) : (
                    <div className="bg-white rounded-[48px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F6F3F2] flex flex-col h-full">
                        <h3 className="text-[18px] font-black text-[#1B1C1C] tracking-tight leading-snug mb-8">
                            ความเสี่ยงของเอกสารทั้งหมด โดยแสดงผลแต่ละแผนก
                        </h3>
                        <Select
                            label="แผนก"
                            name="department"
                            value={selectedDept}
                            options={DEPT_OPTIONS}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            rounding="2xl"
                            bgColor="white"
                            labelClassName="text-black"
                        />
                        <div className="flex items-center justify-between px-4 mt-10">
                            <div className="relative flex items-center justify-center shrink-0 border-[25px] border-[#F6F3F2] rounded-full" style={{ width: 180, height: 180 }}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                                    <p className="text-[10px] font-bold text-[#5F5E5E] leading-tight mb-0.5">จากเอกสารทั้งหมด</p>
                                    <p className="text-[14px] font-black text-[#1B1C1C] tracking-tighter">0 ฉบับ</p>
                                </div>
                            </div>
                            <div className="space-y-4 shrink-0">
                                {riskChartData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between gap-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[14.5px] font-bold text-[#5F5E5E]">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-black text-[#1B1C1C]">0</span>
                                            <span className="text-[13px] text-neutral-400 font-bold">ฉบับ</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <SensitiveDataCard
                    items={sensitiveItems}
                    totalCount={sensitiveTotal}
                />
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                {/* Pending — 2 col */}
                <div className="lg:col-span-2">
                    <DashboardSummaryCard
                        icon="hourglass_empty"
                        label="เอกสารที่รอดำเนินการ"
                        accentColor="info"
                        splitValues={[
                            { label: "ผู้รับผิดชอบข้อมูล", value: stats?.pending_documents.data_owner_count || 0 },
                            { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: stats?.pending_documents.data_processor_count || 0 },
                        ]}
                    />
                </div>

                {/* Approved — 1 col */}
                <DashboardSummaryCard
                    icon="check_circle"
                    label="เอกสารที่ได้รับการอนุมัติ"
                    value={stats?.approved_documents.total || 0}
                    subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                    accentColor="success"
                />

                {/* DPO Review — full width */}
                <div className="lg:col-span-3">
                    <DashboardSummaryCard
                        icon="hourglass_empty"
                        label="เอกสารรอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                        accentColor="info"
                        splitValues={[
                            { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: stats?.pending_dpo_review.for_archiving || 0 },
                            { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร", value: stats?.pending_dpo_review.for_destruction || 0 },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
