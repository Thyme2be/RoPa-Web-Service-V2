"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import DonutChart from "@/components/ui/DonutChart";
import Select from "@/components/ui/Select";
import { globalMockDashboardData } from "@/lib/mockDashboardData";


import { useRopa } from "@/context/RopaContext";

export default function DashboardPage() {
    const { getDashboardStats } = useRopa();
    const [timeFilter, setTimeFilter] = React.useState("all");

    const timeOptions = [
        { label: "สัปดาห์นี้", value: "weekly" },
        { label: "เดือนนี้", value: "monthly" },
        { label: "6 เดือน", value: "6months" },
        { label: "1 ปี", value: "yearly" },
        { label: "ทั้งหมด", value: "all" },
    ];

    const currentData = getDashboardStats();

    const riskChartData = [
        { label: "ความเสี่ยงต่ำ (1)", value: currentData.risk.low, color: "#B4F534" },
        { label: "ความเสี่ยงปานกลาง (2)", value: currentData.risk.medium, color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)", value: currentData.risk.high, color: "#FB8827" },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
                <TopBar hideSearch={true} minimal={true} />

                <div className="p-10 space-y-8">
                    {/* Welcome Header */}
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-[#1B1C1C] tracking-tight">
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
                                rounding="xl"
                                bgColor="white"
                            />
                        </div>
                    </div>
                    {/* First Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardSummaryCard
                            icon="inventory_2"
                            label="จำนวนเอกสารทั้งหมด"
                            value={currentData.totalDocs}
                            subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                            accentColor="neutral"
                        />
                        <DashboardSummaryCard
                            icon="edit_document"
                            label="เอกสารที่ต้องแก้ไขหลังจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                            accentColor="danger"
                            splitValues={[
                                { label: "ผู้รับผิดชอบข้อมูล", value: currentData.docsToEdit.owner },
                                { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: currentData.docsToEdit.processor }
                            ]}
                        />
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <DonutChart
                                variant="card"
                                title="ความเสี่ยงของเอกสารทั้งหมด"
                                data={riskChartData}
                                total={currentData.risk.total}
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                            <DashboardSummaryCard
                                icon="hourglass_empty"
                                label="เอกสารรอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                                accentColor="info"
                                splitValues={[
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: currentData.pendingDpo.store },
                                    { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร", value: currentData.pendingDpo.destroy }
                                ]}
                            />
                            <DashboardSummaryCard
                                icon="hourglass_empty"
                                label="เอกสารที่รอดำเนินการ"
                                accentColor="info"
                                splitValues={[
                                    { label: "ผู้รับผิดชอบข้อมูล", value: currentData.pendingDocs.owner },
                                    { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: currentData.pendingDocs.processor }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Third Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardSummaryCard
                            icon="check_circle"
                            label="เอกสารที่ได้รับการอนุมัติ"
                            value={currentData.approved}
                            subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                            accentColor="success"
                        />
                        <DashboardSummaryCard
                            icon="visibility_off"
                            label="เอกสารประเภทข้อมูลอ่อนไหว"
                            value={currentData.sensitive}
                            subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                            accentColor="accent"
                        />
                        <DashboardSummaryCard
                            icon="priority_high"
                            label="เอกสารที่ล่าช้า"
                            value={currentData.delayed}
                            subLabel="เอกสารที่ครบกำหนดทำลายและเกินกำหนดทำลาย"
                            accentColor="warning"
                        />
                    </div>

                    {/* Fourth Row */}
                    <div className="grid grid-cols-1 gap-6">
                        <DashboardSummaryCard
                            icon="content_paste_search"
                            label="เอกสารที่ต้องเช็ครายปี"
                            accentColor="info"
                            splitValues={[
                                { label: "เอกสารที่ตรวจสอบแล้วโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", value: currentData.annualCheck.reviewed },
                                { label: "เอกสารที่ยังไม่ได้ตรวจสอบ", value: currentData.annualCheck.notReviewed }
                            ]}
                        />
                    </div>

                    {/* Fifth Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardSummaryCard
                            icon="event_busy"
                            label="เอกสารที่ครบกำหนดทำลาย"
                            value={currentData.dueDestroy}
                            subLabel="เอกสารทั้งหมด"
                            accentColor="warning"
                        />
                        <DashboardSummaryCard
                            icon="event_note"
                            label="เอกสารที่ถูกทำลายแล้ว"
                            value={currentData.destroyed}
                            subLabel="เอกสารทั้งหมด"
                            accentColor="muted"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

