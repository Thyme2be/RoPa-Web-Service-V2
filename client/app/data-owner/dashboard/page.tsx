"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { StatsCard, FilterBar } from "@/components/dashboard/DashboardComponents";
import { DashboardChart } from "@/components/dashboard/DashboardChart";

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col bg-surface-container-low">
                <TopBar pageTitle="แดชบอร์ดสำหรับการรับผิดชอบข้อมูล" />

                <div className="p-10 space-y-10">
                    {/* Welcome Header */}
                    <div className="space-y-1">
                        <h1 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight">
                            แดชบอร์ดสรุปข้อมูล
                        </h1>
                        <p className="text-[#5F5E5E] text-[15px] font-medium opacity-80">
                            ภาพรวมการปฏิบัติตามข้อกำหนดและความคืบหน้าขององค์กร
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <FilterBar />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatsCard 
                            icon="inventory_2" 
                            label="จำนวนเอกสารทั้งหมด" 
                            value="1,248" 
                            subLabel="รายการทั้งหมดในระบบ"
                        />
                        <StatsCard 
                            icon="hourglass_empty" 
                            label="รายการที่รอตรวจสอบ" 
                            value="42" 
                            subLabel="รอผู้ตรวจสอบทำการตรวจสอบ"
                            accentColor="blue"
                        />
                        <StatsCard 
                            icon="priority_high" 
                            label="ต้องดำเนินการ / ต้องแก้ไข" 
                            value="05" 
                            subLabel="ต้องแก้ไขจากผู้ตรวจสอบ"
                            accentColor="red"
                        />
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
