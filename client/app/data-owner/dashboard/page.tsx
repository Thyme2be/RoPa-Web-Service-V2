"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { StatsCard, FilterBar } from "@/components/dashboard/DashboardComponents";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { useRopa } from "@/context/RopaContext";
import Link from "next/link";

export default function DashboardPage() {
    const { stats } = useRopa();

    return (
        <div className="flex min-h-screen bg-[#FCF9F8]">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="แดชบอร์ดสำหรับการรับผิดชอบข้อมูล" hideSearch={true} />

                <div className="p-10 space-y-10">
                    {/* Welcome Header */}
                    <div className="space-y-1">
                        <h1 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            แดชบอร์ดสรุปข้อมูล
                        </h1>
                        <p className="text-[#5C403D] text-[15px] font-medium opacity-80">
                            ภาพรวมการปฏิบัติตามข้อกำหนดและความคืบหน้าขององค์กร
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <FilterBar />

                    {/* Dynamic Summary Cards — all clickable */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/data-owner/ropa/list">
                            <StatsCard
                                icon="inventory_2"
                                label="จำนวนเอกสารทั้งหมด"
                                value={stats.total.toString()}
                                subLabel="รายการทั้งหมดในระบบ"
                            />
                        </Link>
                        <Link href="/data-owner/ropa/list">
                            <StatsCard
                                icon="hourglass_empty"
                                label="รายการที่รอตรวจสอบ"
                                value={stats.submitted.toString()}
                                subLabel="รอผู้ตรวจสอบทำการตรวจสอบ"
                                accentColor="blue"
                            />
                        </Link>
                        <Link href="/data-owner/ropa/list">
                            <StatsCard
                                icon="priority_high"
                                label="ต้องดำเนินการ / ฉบับร่าง"
                                value={(stats.rejected + stats.draft).toString()}
                                subLabel="ต้องแก้ไข หรือกำลังร่าง"
                                accentColor="red"
                            />
                        </Link>
                    </div>

                    {/* Charts & Trends */}
                    <div className="grid grid-cols-1 gap-6">
                        <DashboardChart />
                    </div>
                </div>
            </main>
        </div>
    );
}
