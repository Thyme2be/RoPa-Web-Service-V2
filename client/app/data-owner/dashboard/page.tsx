"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import DonutChart from "@/components/ui/DonutChart";
import { useRopa } from "@/context/RopaContext";
import Select from "@/components/ui/Select";

export default function DashboardPage() {
  const { getDashboardStats, refresh, fetchOwnerDashboard, isLoading } =
    useRopa();
  const [timeFilter, setTimeFilter] = React.useState("all");

  // Initial refresh
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle filter change
  useEffect(() => {
    if (timeFilter !== "all" || true) {
      // Always refresh when filter state changes if we want live updates
      fetchOwnerDashboard(timeFilter);
    }
  }, [timeFilter, fetchOwnerDashboard]);

  const stats = getDashboardStats();

  const timeOptions = [
    { label: "สัปดาห์นี้", value: "weekly" },
    { label: "เดือนนี้", value: "monthly" },
    { label: "6 เดือน", value: "6months" },
    { label: "1 ปี", value: "yearly" },
    { label: "ทั้งหมด", value: "all" },
  ];

  const riskChartData = [
    { label: "ความเสี่ยงต่ำ", value: stats.risk.low, color: "#B4F534" },
    { label: "ความเสี่ยงปานกลาง", value: stats.risk.medium, color: "#F9A506" },
    { label: "ความเสี่ยงสูง", value: stats.risk.high, color: "#FB8827" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        <TopBar hideSearch={true} minimal={true} />

        <div className="p-10 space-y-8">
          {/* Welcome Header */}
          <div className="flex justify-between items">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#1B1C1C]">
                แดชบอร์ดสรุปข้อมูล
              </h1>
              <p className="text-[#5C403D] text-base font-medium opacity-80">
                ภาพรวมการปฏิบัติตามข้อกำหนดและความคืบหน้าของผู้รับผิดชอบข้อมูล
              </p>
            </div>
            <div className="w-64">
              <Select
                label="ช่วงเวลา"
                name="timeFilter"
                value={timeFilter}
                options={timeOptions}
                onChange={(e) => setTimeFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State Overlay */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm font-medium text-muted-foreground italic">
                กำลังอัปเดตข้อมูล...
              </span>
            </div>
          )}

          {/* Status Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* First Row - Part 1: Total Docs */}
            <div className="lg:col-span-1">
              <DashboardSummaryCard
                icon="inventory_2"
                label="จำนวนเอกสารทั้งหมด"
                value={stats.totalDocs}
                subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                accentColor="neutral"
              />
            </div>
            {/* First Row - Part 2: Docs to Edit (Wide) */}
            <div className="lg:col-span-2">
              <DashboardSummaryCard
                icon="edit_note"
                label="เอกสารที่ต้องแก้ไขหลังจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                accentColor="danger"
                splitValues={[
                  {
                    label: "ผู้รับผิดชอบข้อมูล",
                    value: stats.docsToEdit.owner,
                  },
                  {
                    label: "ผู้ประมวลผลข้อมูลส่วนบุคคล",
                    value: stats.docsToEdit.processor,
                  },
                ]}
              />
            </div>

            {/* Second Row - Part 1: Risk Chart */}
            <div className="lg:col-span-1 h-full">
              <DonutChart
                variant="card"
                title="ความเสี่ยงของเอกสารทั้งหมด"
                data={riskChartData}
                total={stats.risk.total}
              />
            </div>
            {/* Second Row - Part 2: Pending DPO (Wide) */}
            <div className="lg:col-span-2 space-y-8 flex flex-col h-full">
              <DashboardSummaryCard
                icon="hourglass_empty"
                label="เอกสารรอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                accentColor="info"
                splitValues={[
                  {
                    label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร",
                    value: stats.pendingDpo.store,
                  },
                  {
                    label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร",
                    value: stats.pendingDpo.destroy,
                  },
                ]}
              />
              <DashboardSummaryCard
                icon="hourglass_top"
                label="เอกสารที่รอดำเนินการ"
                accentColor="info"
                splitValues={[
                  {
                    label: "ผู้รับผิดชอบข้อมูล",
                    value: stats.pendingDocs.owner,
                  },
                  {
                    label: "ผู้ประมวลผลข้อมูลส่วนบุคคล",
                    value: stats.pendingDocs.processor,
                  },
                ]}
              />
            </div>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardSummaryCard
              icon="approval_delegation"
              label="เอกสารที่ได้รับการอนุมัติ"
              value={stats.approved}
              subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
              accentColor="success"
            />
            <DashboardSummaryCard
              icon="visibility_off"
              label="เอกสารประเภทข้อมูลอ่อนไหว"
              value={stats.sensitive}
              subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
              accentColor="accent"
            />
            <DashboardSummaryCard
              icon="priority_high"
              label="เอกสารที่ล่าช้า"
              value={stats.delayed}
              subLabel="เอกสารที่ครบกำหนดทำลายและเกินกำหนดทำลาย"
              accentColor="danger"
            />
          </div>

          {/* Fourth Row - Annual Check (Wide) */}
          <div className="grid grid-cols-1 gap-6">
            <DashboardSummaryCard
              icon="content_paste_search"
              label="เอกสารที่ต้องเช็ครายปี"
              accentColor="info"
              splitValues={[
                {
                  label:
                    "เอกสารที่ตรวจสอบแล้วโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
                  value: stats.annualCheck.reviewed,
                },
                {
                  label: "เอกสารที่ยังไม่ได้ตรวจสอบ",
                  value: stats.annualCheck.notReviewed,
                },
              ]}
            />
          </div>

          {/* Fifth Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardSummaryCard
              icon="event_busy"
              label="เอกสารที่ครบกำหนดทำลาย"
              value={stats.dueDestroy}
              subLabel="เอกสารทั้งหมดที่รอยื่นคำร้องขอทำลาย"
              accentColor="danger"
            />
            <DashboardSummaryCard
              icon="event_note"
              label="เอกสารที่ถูกทำลายแล้ว"
              value={stats.destroyed}
              subLabel="เอกสารทั้งหมดที่ถูกลบออกจากระดับชั้นความปลอดภัย"
              accentColor="neutral"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
