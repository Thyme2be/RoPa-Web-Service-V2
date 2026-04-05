"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import { SelectionCard } from "@/components/ropa/SelectionComponents";

export default function RopaSelectionPage() {
    return (
        <div className="flex min-h-screen bg-surface-container-low font-sans">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                <TopBar pageTitle="บันทึกกิจกรรมการประมวลผล (RoPA)" />

                <div className="flex-1 flex flex-col items-center justify-center p-10">
                    <div className="w-full max-w-5xl space-y-12">
                        <div className="text-center space-y-3">
                            <h1 className="text-[34px] font-headline font-black text-[#1B1C1C] tracking-tight">
                                เลือกบริการที่ต้องการ
                            </h1>
                            <p className="text-[#5F5E5E] text-[17px] font-medium opacity-80">
                                จัดการข้อมูล RoPA ขององค์กรคุณได้ง่ายๆ ในที่เดียว
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <SelectionCard
                                title="สร้างรายการใหม่"
                                description="เริ่มบันทึกกิจกรรมการประมวลผลข้อมูลส่วนตัวใหม่"
                                icon="add_circle"
                                href="/data-owner/ropa/form"
                                accentColor="red"
                            />
                            <SelectionCard
                                title="จัดการรายการ RoPA"
                                description="ดูและแก้ไขรายการ RoPA ที่ได้บันทึกไว้ในระบบ"
                                icon="inventory"
                                href="/data-owner/ropa/list"
                                accentColor="teal"
                            />
                            <SelectionCard
                                title="ตรวจสอบรายการ"
                                description="ติดตามสถานะการส่งตรวจและยืนยันความถูกต้อง"
                                icon="fact_check"
                                href="/data-owner/ropa/review"
                                accentColor="blue"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
