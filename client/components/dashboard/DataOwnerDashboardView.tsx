"use client";

import React from "react";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import DonutChart from "@/components/ui/DonutChart";

interface DataOwnerDashboardViewProps {
    userId?: string;
    stats?: {
        total_documents: number;
        needs_fix_do_count: number;
        needs_fix_dp_count: number;
        risk_low_count: number;
        risk_medium_count: number;
        risk_high_count: number;
        under_review_storage_count: number;
        under_review_deletion_count: number;
        pending_do_count: number;
        pending_dp_count: number;
        completed_count: number;
        sensitive_document_count: number;
        overdue_dp_count: number;
        annual_reviewed_count: number;
        annual_not_reviewed_count: number;
        destruction_due_count: number;
        deleted_count: number;
    };
}

export default function DataOwnerDashboardView({ userId, stats }: DataOwnerDashboardViewProps) {
    if (!stats) return <div className="p-10 text-center text-neutral-400 font-bold">กำลังโหลดข้อมูล...</div>;

    const riskChartData = [
        { label: "ความเสี่ยงต่ำ (1)", value: stats.risk_low_count || 0, color: "#B4F534" },
        { label: "ความเสี่ยงปานกลาง (2)", value: stats.risk_medium_count || 0, color: "#F9A506" },
        { label: "ความเสี่ยงสูง (3)", value: stats.risk_high_count || 0, color: "#FB8827" },
    ];

    const riskTotal = (stats.risk_low_count || 0) + (stats.risk_medium_count || 0) + (stats.risk_high_count || 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardSummaryCard
                    icon="inventory_2"
                    label="จำนวนเอกสารทั้งหมด"
                    value={stats.total_documents}
                    subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                    accentColor="neutral"
                />
                <DashboardSummaryCard
                    icon="edit_document"
                    label="เอกสารที่ต้องแก้ไขหลังจากเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                    accentColor="danger"
                    splitValues={[
                        { label: "ผู้รับผิดชอบข้อมูล", value: stats.needs_fix_do_count },
                        { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: stats.needs_fix_dp_count }
                    ]}
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {riskTotal > 0 ? (
                        <DonutChart
                            variant="card"
                            title="ความเสี่ยงของเอกสารทั้งหมด"
                            data={riskChartData}
                            total={riskTotal}
                        />
                    ) : (
                        <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E2E1]/50 p-8 h-full flex flex-col items-center">
                            <div className="w-full text-left mb-6">
                                <h3 className="text-base font-black text-[#1B1C1C] tracking-tight">ความเสี่ยงของเอกสารทั้งหมด</h3>
                            </div>
                            <div className="mb-8 relative flex items-center justify-center border-8 border-[#F6F3F2] rounded-full" style={{ width: 180, height: 180 }}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                                    <p className="text-xs font-bold text-[#5F5E5E] leading-tight">จากเอกสารทั้งหมด</p>
                                    <p className="text-xl font-black text-[#1B1C1C] tracking-tighter">0 ฉบับ</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                    <DashboardSummaryCard
                        icon="hourglass_empty"
                        label="เอกสารรอเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ"
                        accentColor="info"
                        splitValues={[
                            { label: "อยู่ระหว่างตรวจสอบเพื่อจัดเก็บเอกสาร", value: stats.under_review_storage_count },
                            { label: "อยู่ระหว่างตรวจสอบเพื่อทำลายเอกสาร", value: stats.under_review_deletion_count }
                        ]}
                    />
                    <DashboardSummaryCard
                        icon="hourglass_empty"
                        label="เอกสารที่รอดำเนินการ"
                        accentColor="info"
                        splitValues={[
                            { label: "ผู้รับผิดชอบข้อมูล", value: stats.pending_do_count },
                            { label: "ผู้ประมวลผลข้อมูลส่วนบุคคล", value: stats.pending_dp_count }
                        ]}
                    />
                </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardSummaryCard
                    icon="check_circle"
                    label="เอกสารที่ได้รับการอนุมัติ"
                    value={stats.completed_count}
                    subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                    accentColor="success"
                />
                <DashboardSummaryCard
                    icon="visibility_off"
                    label="เอกสารประเภทข้อมูลอ่อนไหว"
                    value={stats.sensitive_document_count}
                    subLabel="เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล"
                    accentColor="accent"
                />
                <DashboardSummaryCard
                    icon="priority_high"
                    label="เอกสารที่เครื่องประมวลผลล่าช้า"
                    value={stats.overdue_dp_count}
                    subLabel="เอกสารที่เกินกำหนดการดำเนินการโดยผู้ประมวลผล"
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
                        { label: "เอกสารที่ตรวจสอบแล้วโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", value: stats.annual_reviewed_count },
                        { label: "เอกสารที่ยังไม่ได้ตรวจสอบ", value: stats.annual_not_reviewed_count }
                    ]}
                />
            </div>

            {/* Fifth Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardSummaryCard
                    icon="event_busy"
                    label="เอกสารที่ครบกำหนดทำลาย"
                    value={stats.destruction_due_count}
                    subLabel="เอกสารทั้งหมดที่ถึงกำหนดทำลายตามระยะเวลาจัดเก็บ"
                    accentColor="warning"
                />
                <DashboardSummaryCard
                    icon="event_note"
                    label="เอกสารที่ถูกทำลายแล้ว"
                    value={stats.deleted_count}
                    subLabel="เอกสารทั้งหมดที่ได้รับการยืนยันการทำลายแล้ว"
                    accentColor="muted"
                />
            </div>
        </div>
    );
}
