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
import { useExecutive } from "@/context/ExecutiveContext";

// Removed hardcoded DEPT_OPTIONS to use dynamic departments from API

const PERIOD_OPTIONS = [
    { label: "7 วันล่าสุด", value: "7_days" },
    { label: "30 วันล่าสุด", value: "30_days" },
    { label: "เดือนนี้", value: "this_month" },
    { label: "ปีนี้", value: "this_year" },
    { label: "ทั้งหมด", value: "all" },
];

export default function ExecutiveDashboard() {
    const { executiveDashboardData, fetchExecutiveData, isLoading } = useExecutive();
    const data = executiveDashboardData;
    const [period, setPeriod] = useState("all");
    const [selectedDept, setSelectedDept] = useState("IT");

    // Fetch data when period or department changes
    useEffect(() => {
        fetchExecutiveData(period, selectedDept);
    }, [period, selectedDept]);

    // Update selectedDept if current selection is not in available departments
    useEffect(() => {
        if (data?.available_departments && data.available_departments.length > 0) {
            if (!data.available_departments.includes(selectedDept)) {
                setSelectedDept(data.available_departments[0]);
            }
        }
    }, [data?.available_departments]);

    if (!data && isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
                <div className="text-xl font-bold text-gray-400">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    // ─── Data Mapping ────────────────────────────────────────────────────────

    // Ensure we have arrays even if data is loading or backend has empty response
    const riskByDept = data?.risk_by_department || [];
    const sensitiveByDept = data?.sensitive_docs_by_department || [];
    const statusOverview = data?.ropa_status_overview;
    const pendingDocs = data?.pending_documents;
    const approvedDocs = data?.approved_documents;
    const pendingDpo = data?.pending_dpo_review;

    const ropaStatusData: DonutData[] = [
        { label: "ฉบับร่าง", value: statusOverview?.draft ?? 0, color: "#F0EDED" },
        { label: "รอดำเนินการ", value: statusOverview?.pending ?? 0, color: "#FFCC00" },
        { label: "รอตรวจสอบ", value: statusOverview?.under_review ?? 0, color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: statusOverview?.completed ?? 0, color: "#2C8C00" },
    ];

    // Map risk data for the current department
    const currentDeptRisk = riskByDept.find((d: any) => d.department === selectedDept) || {
        low: 0, medium: 0, high: 0, total: 0
    };

    const riskData: DonutData[] = [
        { label: "ความเสี่ยงต่ำ (1)", value: currentDeptRisk.low || 0, color: "#B4F534" },
        { label: "ความเสี่ยงปานกลาง (2)", value: currentDeptRisk.medium || 0, color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)", value: currentDeptRisk.high || 0, color: "#FB8827" },
    ];

    // Map sensitive data items
    const sensitiveSummary = sensitiveByDept.map((item: any) => ({
        dept: item.department,
        count: item.count
    }));

    const totalSensitive = sensitiveSummary.reduce((acc: number, item: any) => acc + item.count, 0);

    return (
        <div className="flex min-h-screen bg-[#F6F3F2]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar isExecutive pageTitle="แดชบอร์ดสรุปข้อมูล" hideSearch />

                <div className={`flex-1 p-10 space-y-10 max-w-[1440px] w-full mx-auto transition-all duration-300 ${isLoading ? 'opacity-50 grayscale-[0.2]' : 'opacity-100'}`}>

                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-[32px] font-black text-foreground tracking-tight leading-none">
                                แดชบอร์ดสรุปข้อมูล
                            </h1>
                            <p className="text-secondary-foreground font-bold text-[16px] uppercase tracking-wide opacity-80">
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
                                labelClassName="text-foreground"
                                bgColor="#FAFAFA"
                                borderColor="#E4E4E7"
                            />
                        </div>
                    </div>

                    {/* ── ROPA Status (org-wide) ───────────────────────────── */}
                    <RopaStatusCard data={ropaStatusData} />

                    {/* ── Risk + Sensitive (filtered by dept) ─────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <RiskAnalysisCard
                            data={riskData}
                            totalDocuments={currentDeptRisk.total || 0}
                            departments={(data?.available_departments || []).map((d: string) => ({ label: `แผนก ${d}`, value: d }))}
                            selectedDept={selectedDept}
                            onDeptChange={(v) => setSelectedDept(v)}
                        />
                        <SensitiveDataCard
                            items={sensitiveSummary}
                            totalCount={totalSensitive}
                        />
                    </div>

                    {/* ── Bottom Metrics ────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-10">
                        {/* Pending — 2 col */}
                        <div className="lg:col-span-2">
                            <DashboardSummaryCard
                                icon="hourglass_empty"
                                label="เอกสารที่รอดำเนินการ"
                                accentColor="info"
                                splitValues={[
                                    { label: "Data Owner", value: pendingDocs?.data_owner_count ?? 0 },
                                    { label: "Data Processor", value: pendingDocs?.data_processor_count ?? 0 },
                                ]}
                            />
                        </div>

                        {/* Approved — 1 col */}
                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={approvedDocs?.total ?? 0}
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
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: pendingDpo?.for_archiving ?? 0 },
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร", value: pendingDpo?.for_destruction ?? 0 },
                                ]}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}