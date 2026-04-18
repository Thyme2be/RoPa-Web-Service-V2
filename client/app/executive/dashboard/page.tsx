"use client";

import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Select from "@/components/ui/Select";
import RopaStatusCard from "@/components/dashboard/RopaStatusCard";
import RiskAnalysisCard from "@/components/dashboard/RiskAnalysisCard";
import SensitiveDataCard from "@/components/dashboard/SensitiveDataCard";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import { DonutData } from "@/components/ui/DonutChart";
import { useState, useEffect } from "react";
import { useRopa } from "@/context/RopaContext";

const DEPT_OPTIONS = [
    { label: "แผนกขาย",        value: "Sales" },
    { label: "แผนกการตลาด",    value: "Marketing" },
    { label: "แผนก IT",        value: "IT" },
    { label: "แผนก HR",        value: "HR" },
];

const PERIOD_OPTIONS = [
    { label: "7 วันล่าสุด",    value: "7_days" },
    { label: "30 วันล่าสุด",   value: "30_days" },
    { label: "เดือนนี้",       value: "this_month" },
    { label: "ปีนี้",          value: "this_year" },
    { label: "ทั้งหมด",       value: "all" },
];

export default function ExecutiveDashboard() {
    const { executiveDashboardData, fetchExecutiveData, isLoading } = useRopa();
    const [period, setPeriod] = useState("all");
    const [selectedDept, setSelectedDept] = useState("IT");

    // Fetch data when period or department changes
    useEffect(() => {
        fetchExecutiveData(period, selectedDept);
    }, [period, selectedDept]);

    if (!executiveDashboardData && isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
                <div className="text-xl font-bold text-gray-400">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    const data = executiveDashboardData;

    // ─── Data Mapping ────────────────────────────────────────────────────────

    const ropaStatusData: DonutData[] = data ? [
        { label: "ฉบับร่าง",     value: data.ropa_status_overview.draft,   color: "#F0EDED" },
        { label: "รอดำเนินการ",  value: data.ropa_status_overview.pending, color: "#FFCC00" },
        { label: "รอตรวจสอบ",    value: data.ropa_status_overview.under_review,  color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: data.ropa_status_overview.completed,    color: "#2C8C00" },
    ] : [];

    // Map risk data for the current department
    // Note: Backend returns a list, we might need to find the one for the selected dept
    const currentDeptRisk = data?.risk_by_department.find((d: any) => d.department === selectedDept) || {
        low: 0, medium: 0, high: 0, total: 0
    };

    const riskData: DonutData[] = [
        { label: "ความเสี่ยงต่ำ (1)",       value: currentDeptRisk.low,  color: "#B4F534" },
        { label: "ความเสี่ยงปานกลาง (2)",   value: currentDeptRisk.medium,  color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)",        value: currentDeptRisk.high, color: "#FB8827" },
    ];

    // Map sensitive data items
    const sensitiveSummary = data?.sensitive_docs_by_department.map((item: any) => ({
        dept: item.department,
        count: item.count
    })) || [];

    const totalSensitive = sensitiveSummary.reduce((acc: number, item: any) => acc + item.count, 0);

    return (
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar isExecutive pageTitle="แดชบอร์ดสรุปข้อมูล" hideSearch />

                <div className={`flex-1 p-10 space-y-10 max-w-[1440px] w-full mx-auto transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>

                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-[32px] font-black text-[#1B1C1C] tracking-tight leading-none mb-2">
                                แดชบอร์ดสรุปข้อมูล
                            </h1>
                            <p className="text-[#5F5E5E] font-bold text-[16px] uppercase tracking-wide opacity-80">
                                ภาพรวมของเอกสารโดยรวมทั้งระบบ
                            </p>
                        </div>
                        <div className="w-[280px]">
                            <Select
                                label="ช่วงเวลา"
                                name="period"
                                value={period}
                                options={PERIOD_OPTIONS}
                                onChange={(e) => setPeriod(e.target.value)}
                                rounding="2xl"
                                bgColor="white"
                                labelClassName="text-black"
                            />
                        </div>
                    </div>

                    {/* ── ROPA Status (org-wide) ───────────────────────────── */}
                    <RopaStatusCard data={ropaStatusData} />
 
                    {/* ── Risk + Sensitive (filtered by dept) ─────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <RiskAnalysisCard
                            data={riskData}
                            totalDocuments={currentDeptRisk.total}
                            departments={DEPT_OPTIONS}
                            selectedDept={selectedDept}
                            onDeptChange={(v) => setSelectedDept(v)}
                        />
                        <SensitiveDataCard
                            items={sensitiveSummary}
                            totalCount={totalSensitive}
                        />
                    </div>
 
                    {/* ── Bottom Metrics ────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        {/* Pending — 2 col */}
                        <div className="lg:col-span-2">
                            <DashboardSummaryCard
                                icon="hourglass_empty"
                                label="เอกสารที่รอดำเนินการ"
                                accentColor="info"
                                splitValues={[
                                    { label: "ผู้รับผิดชอบข้อมูล",              value: data?.pending_documents.data_owner_count || 0 },
                                    { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล",      value: data?.pending_documents.data_processor_count || 0 },
                                ]}
                            />
                        </div>
 
                        {/* Approved — 1 col */}
                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={data?.approved_documents.total || 0}
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
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: data?.pending_dpo_review.for_archiving || 0 },
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร",   value: data?.pending_dpo_review.for_destruction || 0 },
                                ]}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
