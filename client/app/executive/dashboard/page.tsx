"use client";

import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Select from "@/components/ui/Select";
import RopaStatusCard from "@/components/dashboard/RopaStatusCard";
import RiskAnalysisCard from "@/components/dashboard/RiskAnalysisCard";
import SensitiveDataCard from "@/components/dashboard/SensitiveDataCard";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import { DonutData } from "@/components/ui/DonutChart";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

import { useRopa } from "@/context/RopaContext";
import { RopaStatus, DataType } from "@/types/enums";

const DEPT_OPTIONS = [
    { label: "แผนกขาย",        value: "แผนกขาย" },
    { label: "แผนกการตลาด",    value: "แผนกการตลาด" },
    { label: "แผนก IT",        value: "แผนก IT" },
    { label: "แผนก HR",        value: "แผนก HR" },
];

const PERIOD_OPTIONS = [
    { label: "สัปดาห์นี้", value: "weekly" },
    { label: "เดือนนี้",   value: "monthly" },
    { label: "ปีนี้",      value: "yearly" },
    { label: "ทั้งหมด",    value: "all" },
];

const RISK_COLORS: DonutData["color"][] = ["#B4F534", "#F9A506", "#FB8827"];

export default function ExecutiveDashboard() {
    const { getExecutiveStats, records } = useRopa();
    const [period, setPeriod] = useState("all");
    const [selectedDept, setSelectedDept] = useState("แผนกขาย");

    // Org-wide stats
    const globalStats = getExecutiveStats();
    
    // Dept-specific stats
    const deptStats = getExecutiveStats(selectedDept);

    const ropaStatusData: DonutData[] = [
        { label: "ฉบับร่าง",     value: records.filter(r => r.status === RopaStatus.Draft).length,   color: "#F0EDED" },
        { label: "รอดำเนินการ",  value: globalStats.processing, color: "#FFCC00" },
        { label: "รอตรวจสอบ",    value: globalStats.sentDpo,  color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: globalStats.approved,    color: "#2C8C00" },
    ];

    const riskData: DonutData[] = [
        { label: "ความเสี่ยงต่ำ (1)",       value: deptStats.risk.low,  color: RISK_COLORS[0] },
        { label: "ความเสี่ยงปานกลาง (2)",   value: deptStats.risk.medium,  color: RISK_COLORS[1] },
        { label: "ความเสี่ยงสูง (3)",        value: deptStats.risk.high, color: RISK_COLORS[2] },
    ];

    // Calculate sensitive data count for the selected department
    const deptRecords = records.filter(r => r.department === selectedDept);
    const sensitiveDeptRecords = deptRecords.filter(r => {
        if (Array.isArray(r.dataType)) return r.dataType.includes(DataType.Sensitive);
        return r.dataType === DataType.Sensitive;
    });

    const sensitiveSummary = sensitiveDeptRecords.reduce((acc, r) => {
        const activity = r.processingActivity || "อื่นๆ";
        const existing = acc.find(item => item.dept === activity);
        if (existing) existing.count++;
        else acc.push({ dept: activity, count: 1 });
        return acc;
    }, [] as { dept: string; count: number }[]);

    const pendingStats = {
        owner: deptRecords.filter(r => r.workflow === "processing" && r.processingStatus?.doStatus !== "done").length,
        processor: deptRecords.filter(r => r.workflow === "processing" && r.processingStatus?.dpStatus !== "done").length
    };

    const dpoStats = {
        store: deptRecords.filter(r => r.workflow === "sent_dpo" && r.status === RopaStatus.ReviewPending).length,
        destroy: deptRecords.filter(r => r.workflow === "sent_dpo" && r.status === RopaStatus.DeletePending).length
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar isExecutive pageTitle="แดชบอร์ดสรุปข้อมูล" hideSearch />

                <div className="flex-1 p-10 space-y-10 max-w-[1440px] w-full mx-auto">

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
                            totalDocuments={deptStats.total}
                            departments={DEPT_OPTIONS}
                            selectedDept={selectedDept}
                            onDeptChange={(v) => setSelectedDept(v)}
                        />
                        <SensitiveDataCard
                            items={sensitiveSummary}
                            totalCount={sensitiveDeptRecords.length}
                        />
                    </div>
 
                    {/* ── Bottom Metrics (filtered by dept) ────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        {/* Pending — 2 col */}
                        <div className="lg:col-span-2">
                            <DashboardSummaryCard
                                icon="hourglass_empty"
                                label="เอกสารที่รอดำเนินการ"
                                accentColor="info"
                                splitValues={[
                                    { label: "ผู้รับผิดชอบข้อมูล",              value: pendingStats.owner },
                                    { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล",      value: pendingStats.processor },
                                ]}
                            />
                        </div>
 
                        {/* Approved — 1 col */}
                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={deptStats.approved}
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
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: dpoStats.store },
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร",   value: dpoStats.destroy },
                                ]}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
