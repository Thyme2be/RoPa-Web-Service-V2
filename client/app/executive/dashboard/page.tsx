"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Select from "@/components/ui/Select";
import ExecutiveDashboardView from "@/components/dashboard/ExecutiveDashboardView";
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
        isLoading, 
        error, 
        clearError, 
        refresh,
        currentPeriod 
    } = useExecutive();
    
    const data = executiveDashboardData;
    
    // URL State Management
    const periodParam = searchParams.get("period") || "all";
    // Initial Data Fetch & Sync URL with Context
    useEffect(() => {
        if (periodParam !== currentPeriod || !data) {
            refresh(periodParam);
        }
    }, [periodParam, refresh, currentPeriod, data]);

    const handleFilterChange = (newPeriod: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("period", newPeriod);
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

                    <ExecutiveDashboardView stats={data} />

                </div>
            </main>
        </div>
    );
}