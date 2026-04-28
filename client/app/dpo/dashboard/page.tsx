"use client";

import React, { useState, useEffect, useCallback } from "react";
import DpoDashboardView from "@/components/dashboard/DpoDashboardView";
import Select from "@/components/ui/Select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
                
                <div className="min-w-[240px]">
                    <Select
                        label="ช่วงเวลา"
                        name="timeRange"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        rounding="xl"
                        bgColor="white"
                        options={[
                            { label: "7 วันล่าสุด", value: "7_days" },
                            { label: "30 วันล่าสุด", value: "30_days" },
                            { label: "6 เดือนล่าสุด", value: "6_months" },
                            { label: "1 ปีล่าสุด", value: "1_year" },
                            { label: "ทั้งหมด", value: "all" },
                        ]}
                    />
                </div>
            </div>

            <DpoDashboardView stats={stats} />
        </div>
    );
}
