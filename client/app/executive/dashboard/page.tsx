"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Select from "@/components/ui/Select";
import RopaStatusCard from "@/components/dashboard/RopaStatusCard";
import RiskAnalysisCard from "@/components/dashboard/RiskAnalysisCard";
import SensitiveDataCard from "@/components/dashboard/SensitiveDataCard";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import { DonutData } from "@/components/ui/DonutChart";
import { useExecutive } from "@/context/ExecutiveContext";

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

const PERIOD_OPTIONS = [
    { label: "7 วันล่าสุด", value: "7_days" },
    { label: "30 วันล่าสุด", value: "30_days" },
    { label: "6 เดือนล่าสุด", value: "6_months" },
    { label: "1 ปีล่าสุด", value: "1_year" },
    { label: "ทั้งหมด", value: "all" },
];

export default function ExecutiveDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { 
        executiveDashboardData, 
        fetchExecutiveData, 
        isLoading, 
        error, 
        clearError, 
        refresh,
        currentPeriod 
    } = useExecutive();
    
    const data = executiveDashboardData;
    
    // URL State Management
    const periodParam = searchParams.get("period") || "all";
    const deptParam = searchParams.get("dept") || "";
    
    const [selectedDept, setSelectedDept] = useState(deptParam || "IT");

    // Initial Data Fetch & Sync URL with Context
    useEffect(() => {
        if (periodParam !== currentPeriod || !data) {
            refresh(periodParam);
        }
    }, [periodParam, refresh, currentPeriod, data]);

    // Update selectedDept if current selection is not in available departments
    useEffect(() => {
        if (data?.available_departments && data.available_departments.length > 0) {
            if (!selectedDept || !data.available_departments.includes(selectedDept)) {
                setSelectedDept(data.available_departments[0]);
            }
        }
    }, [data?.available_departments, selectedDept]);

    const handleFilterChange = (newPeriod: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("period", newPeriod);
        router.push(`?${params.toString()}`);
    };

    const handleDeptChange = (newDept: string) => {
        setSelectedDept(newDept);
        const params = new URLSearchParams(searchParams.toString());
        params.set("dept", newDept);
        router.push(`?${params.toString()}`);
    };

    if (error) {
        return (
            <div className="flex min-h-screen bg-[#F6F3F2]">
                <Sidebar />
                <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex items-center justify-center p-10">
                    <ErrorState 
                        title="ไม่สามารถโหลดข้อมูลแดชบอร์ดผู้บริหารได้" 
                        description={error} 
                        onRetry={() => { clearError(); refresh(periodParam); }} 
                    />
                </main>
            </div>
        );
    }

    if (isLoading || !data) {
        return <LoadingState fullPage message="กำลังโหลด..." />;
    }

    // ─── Data Mapping ────────────────────────────────────────────────────────
    const riskByDept = data.risk_by_department || [];
    const sensitiveByDept = data.sensitive_docs_by_department || [];
    const statusOverview = data.ropa_status_overview;
    const pendingDocs = data.pending_documents;
    const approvedDocs = data.approved_documents;
    const pendingDpo = data.pending_dpo_review;

    const ropaStatusData: DonutData[] = [
        { label: "ฉบับร่าง", value: statusOverview?.draft ?? 0, color: "#F0EDED" },
        { label: "รอดำเนินการ", value: statusOverview?.pending ?? 0, color: "#FFCC00" },
        { label: "รอตรวจสอบ", value: statusOverview?.under_review ?? 0, color: "#ED393C" },
        { label: "เสร็จสมบูรณ์", value: statusOverview?.completed ?? 0, color: "#2C8C00" },
    ];

    const currentDeptRisk = riskByDept.find((d: any) => d.department === selectedDept) || {
        low: 0, medium: 0, high: 0, total: 0
    };

    const riskData: DonutData[] = [
        { label: "ความเสี่ยงต่ำ (1)", value: currentDeptRisk.low || 0, color: "#B4F534" },
        { label: "ความเสี่ยงปานกลาง (2)", value: currentDeptRisk.medium || 0, color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)", value: currentDeptRisk.high || 0, color: "#FB8827" },
    ];

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

                {isLoading && (
                  <div className="fixed top-0 left-0 w-full h-1 z-50 overflow-hidden bg-transparent">
                     <div className="h-full bg-primary animate-progress origin-left"></div>
                  </div>
                )}

                <div className="flex-1 p-10 space-y-10 max-w-[1440px] w-full mx-auto relative transition-all duration-300">

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
                                value={periodParam}
                                options={PERIOD_OPTIONS}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                rounding="2xl"
                                labelClassName="text-foreground"
                                bgColor="#FAFAFA"
                                borderColor="#E4E4E7"
                            />
                        </div>
                    </div>

                    <RopaStatusCard data={ropaStatusData} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <RiskAnalysisCard
                            data={riskData}
                            totalDocuments={currentDeptRisk.total || 0}
                            departments={(data.available_departments || []).map((d: string) => ({ label: `แผนก ${d}`, value: d }))}
                            selectedDept={selectedDept}
                            onDeptChange={(v) => handleDeptChange(v)}
                        />
                        <SensitiveDataCard
                            items={sensitiveSummary}
                            totalCount={totalSensitive}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-10">
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

                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={approvedDocs?.total ?? 0}
                            subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                            accentColor="success"
                        />

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