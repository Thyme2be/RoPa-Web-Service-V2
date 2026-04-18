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

type DeptKey = "แผนกขาย" | "แผนกการตลาด" | "แผนก IT" | "แผนก HR";

interface DeptData {
    ropaStatus: DonutData[];
    risk: DonutData[];
    sensitiveItems: { dept: string; count: number }[];
    sensitiveTotal: number;
    pending: { owner: number; processor: number };
    approved: number;
    dpo: { store: number; destroy: number };
}

// ─── Mock Data per Department ─────────────────────────────────────────────────

const RISK_COLORS: DonutData["color"][] = ["#B4F534", "#F9A506", "#FB8827"];

function makeRisk(low: number, med: number, high: number): DonutData[] {
    return [
        { label: "ความเสี่ยงต่ำ (1)",       value: low,  color: RISK_COLORS[0] },
        { label: "ความเสี่ยงปานกลาง (2)",   value: med,  color: RISK_COLORS[1] },
        { label: "ความเสี่ยงสูง (3)",        value: high, color: RISK_COLORS[2] },
    ];
}

function makeStatus(draft: number, pending: number, review: number, done: number): DonutData[] {
    return [
        { label: "ฉบับร่าง",     value: draft,   color: "#F0EDED" },
        { label: "รอดำเนินการ",  value: pending, color: "#FFCC00" },
        { label: "รอตรวจสอบ",    value: review,  color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: done,    color: "#2C8C00" },
    ];
}

const mockByDept: Record<DeptKey, DeptData> = {
    "แผนกขาย": {
        ropaStatus: makeStatus(45, 120, 12, 200),
        risk: makeRisk(70, 20, 10),
        sensitiveItems: [
            { dept: "กระบวนการขายหลัก",       count: 8 },
            { dept: "ข้อมูลลูกค้า CRM",       count: 6 },
            { dept: "สัญญาและข้อตกลง",         count: 4 },
            { dept: "รายงานการขาย",            count: 2 },
        ],
        sensitiveTotal: 20,
        pending: { owner: 12, processor: 18 },
        approved: 8,
        dpo: { store: 7, destroy: 5 },
    },
    "แผนกการตลาด": {
        ropaStatus: makeStatus(30, 95, 8, 160),
        risk: makeRisk(55, 30, 15),
        sensitiveItems: [
            { dept: "แคมเปญโฆษณาออนไลน์",     count: 7 },
            { dept: "ข้อมูลพฤติกรรมผู้บริโภค", count: 6 },
            { dept: "งานวิจัยตลาด",            count: 5 },
            { dept: "ฐานข้อมูลสมาชิก",         count: 2 },
        ],
        sensitiveTotal: 20,
        pending: { owner: 8, processor: 14 },
        approved: 6,
        dpo: { store: 9, destroy: 3 },
    },
    "แผนก IT": {
        ropaStatus: makeStatus(60, 140, 18, 250),
        risk: makeRisk(40, 35, 25),
        sensitiveItems: [
            { dept: "ระบบฐานข้อมูลหลัก",       count: 9 },
            { dept: "บันทึก Log การเข้าถึง",   count: 5 },
            { dept: "ข้อมูลโครงสร้างพื้นฐาน",  count: 4 },
            { dept: "รหัสและ Credential",       count: 2 },
        ],
        sensitiveTotal: 20,
        pending: { owner: 20, processor: 30 },
        approved: 15,
        dpo: { store: 12, destroy: 8 },
    },
    "แผนก HR": {
        ropaStatus: makeStatus(80, 127, 4, 230),
        risk: makeRisk(80, 12, 8),
        sensitiveItems: [
            { dept: "ข้อมูลพนักงานส่วนตัว",    count: 10 },
            { dept: "ประวัติการจ้างงาน",        count: 5 },
            { dept: "เงินเดือนและสวัสดิการ",    count: 3 },
            { dept: "ประเมินผลการทำงาน",        count: 2 },
        ],
        sensitiveTotal: 20,
        pending: { owner: 5, processor: 9 },
        approved: 18,
        dpo: { store: 4, destroy: 2 },
    },
};

// Aggregated overview (all depts combined) for ROPA Status card
const allRopaStatus: DonutData[] = makeStatus(215, 482, 42, 840);

const DEPT_OPTIONS: { label: string; value: DeptKey }[] = [
    { label: "แผนกขาย",        value: "แผนกขาย" },
    { label: "แผนกการตลาด",    value: "แผนกการตลาด" },
    { label: "แผนก IT",        value: "แผนก IT" },
    { label: "แผนก HR",        value: "แผนก HR" },
];

const PERIOD_OPTIONS = [
    { label: "สัปดาห์นี้", value: "weekly" },
    { label: "เดือนนี้",   value: "monthly" },
    { label: "ปีนี้",      value: "yearly" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutiveDashboard() {
    const [period, setPeriod] = useState("monthly");
    const [selectedDept, setSelectedDept] = useState<DeptKey>("แผนกขาย");

    const dept = mockByDept[selectedDept];
    const totalDeptDocs = dept.risk.reduce((s, i) => s + i.value, 0);

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
                    <RopaStatusCard data={allRopaStatus} />

                    {/* ── Risk + Sensitive (filtered by dept) ─────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <RiskAnalysisCard
                            data={dept.risk}
                            totalDocuments={totalDeptDocs}
                            departments={DEPT_OPTIONS}
                            selectedDept={selectedDept}
                            onDeptChange={(v) => setSelectedDept(v as DeptKey)}
                        />
                        <SensitiveDataCard
                            items={dept.sensitiveItems}
                            totalCount={dept.sensitiveTotal}
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
                                    { label: "ผู้รับผิดชอบข้อมูล",              value: dept.pending.owner },
                                    { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล",      value: dept.pending.processor },
                                ]}
                            />
                        </div>

                        {/* Approved — 1 col */}
                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={dept.approved}
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
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: dept.dpo.store },
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร",   value: dept.dpo.destroy },
                                ]}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
