"use client";

import React from "react";
import DocumentDonutChart from "./DocumentDonutChart";
import MiniDonutChartCard from "./MiniDonutChartCard";
import UserOverviewChart from "./UserOverviewChart";
import UserListCard from "./UserListCard";

interface DashboardData {
    document_status_chart: {
        draft: number;
        pending: number;
        completed: number;
        reviewing: number;
    };
    role_stats: {
        data_owner_docs: { title: string, completed: number, incomplete: number };
        processor_docs: { title: string, completed: number, incomplete: number };
        dpo_docs: { title: string, completed: number, incomplete: number };
        auditor_docs: { title: string, completed: number, incomplete: number };
    };
    revision_stats: {
        owner_revisions: { title: string, completed: number, incomplete: number };
        processor_revisions: { title: string, completed: number, incomplete: number };
        destroyed_docs: { title: string, completed: number, incomplete: number };
        due_for_destruction: { title: string, completed: number, incomplete: number };
    };
    user_stats: any;
}

export default function AdminDashboardView({ data, activeTab }: { data: DashboardData, activeTab: "documents" | "users" }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {activeTab === "documents" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Status Chart */}
                    <section className="bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100">
                        <div className="mb-1 text-center md:text-left">
                            <h3 className="text-[20px] font-bold tracking-tight text-[#1B1C1C]">สถานะเอกสาร ROPA</h3>
                            <p className="text-[16px] text-[#5C403D] font-medium uppercase tracking-wider mt-0.5">แบ่งตามสถานะการดำเนินงานปัจจุบัน</p>
                        </div>
                        <DocumentDonutChart chartData={data.document_status_chart} />
                    </section>

                    {/* Role-based Document Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MiniDonutChartCard
                            title={data.role_stats.data_owner_docs.title}
                            completed={data.role_stats.data_owner_docs.completed}
                            empty={data.role_stats.data_owner_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.processor_docs.title}
                            completed={data.role_stats.processor_docs.completed}
                            empty={data.role_stats.processor_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.dpo_docs.title}
                            completed={data.role_stats.dpo_docs.completed}
                            empty={data.role_stats.dpo_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.role_stats.auditor_docs.title}
                            completed={data.role_stats.auditor_docs.completed}
                            empty={data.role_stats.auditor_docs.incomplete}
                        />
                    </div>

                    {/* Revision and Deletion Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MiniDonutChartCard
                            title={data.revision_stats.owner_revisions.title}
                            completed={data.revision_stats.owner_revisions.completed}
                            empty={data.revision_stats.owner_revisions.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.processor_revisions.title}
                            completed={data.revision_stats.processor_revisions.completed}
                            empty={data.revision_stats.processor_revisions.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.destroyed_docs.title}
                            completed={data.revision_stats.destroyed_docs.completed}
                            empty={data.revision_stats.destroyed_docs.incomplete}
                        />
                        <MiniDonutChartCard
                            title={data.revision_stats.due_for_destruction.title}
                            completed={data.revision_stats.due_for_destruction.completed}
                            empty={data.revision_stats.due_for_destruction.incomplete}
                        />
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <section className="bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-neutral-100">
                        <div className="mb-1">
                            <h3 className="text-[20px] font-bold tracking-tight text-[#1B1C1C]">จำนวนผู้ใช้ทั้งหมด</h3>
                            <p className="text-[16px] text-[#5C403D] font-medium tracking-wide mt-1">แบ่งตามบทบาทการทำงาน</p>
                        </div>
                        <UserOverviewChart userStats={data.user_stats} />
                    </section>

                    {/* Department Grids */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(() => {
                            const bd = data.user_stats.role_breakdowns || {};
                            const aud = bd.auditor_breakdown || { internal: { by_department: [] }, external: { by_company: [] } };

                            const cards = [
                                {
                                    title: "จำนวนผู้รับผิดชอบข้อมูล",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    items: (bd.owner_breakdown?.by_department || []).map((i: any) => ({ name: i.department, count: i.count }))
                                },
                                {
                                    title: "จำนวนผู้ประมวลผลข้อมูลส่วนบุคคล",
                                    subtitle: "แบ่งตามบริษัท",
                                    items: (bd.processor_breakdown?.by_company || []).map((i: any) => ({ name: i.company, count: i.count }))
                                },
                                {
                                    title: "จำนวนเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    items: (bd.dpo_breakdown?.by_department || []).map((i: any) => ({ name: i.department, count: i.count }))
                                },
                                {
                                    title: "จำนวนผู้ตรวจสอบ",
                                    subtitle: "แบ่งตามแผนกการทำงาน",
                                    hasTabs: true,
                                    tabData: {
                                        "คนในบริษัท": (aud.internal?.by_department || []).map((i: any) => ({ name: i.department, count: i.count })),
                                        "คนนอกบริษัท": (aud.external?.by_company || []).map((i: any) => ({ name: i.company, count: i.count }))
                                    }
                                }
                            ];

                            return cards.map((c, idx) => {
                                const total = c.hasTabs
                                    ? (c.tabData["คนในบริษัท"].reduce((s: any, i: any) => s + i.count, 0) + c.tabData["คนนอกบริษัท"].reduce((s: any, i: any) => s + i.count, 0))
                                    : c.items.reduce((s: any, i: any) => s + i.count, 0);

                                return <UserListCard key={idx} data={{ ...c, total }} />;
                            });
                        })()}
                    </section>
                </div>
            )}
        </div>
    );
}
