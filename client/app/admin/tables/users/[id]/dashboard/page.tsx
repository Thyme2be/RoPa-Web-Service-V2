"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";
import DpoDashboardView from "@/components/dashboard/DpoDashboardView";
import ExecutiveDashboardView from "@/components/dashboard/ExecutiveDashboardView";
import DataOwnerDashboardView from "@/components/dashboard/DataOwnerDashboardView";

interface UserDashboardData {
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
        role: string;
        status: string;
    };
    statistics: {
        documents_created: Record<string, number>;
        processor_assignments: number;
        auditor_assignments: number;
        owned_assignments: number;
    };
    role_dashboard?: any;
    accessed_by: string;
}

export default function UserRoleDashboardPage() {
    const params = useParams();
    const userId = params.id as string;
    const [data, setData] = useState<UserDashboardData | null>(null);
    const [adminData, setAdminData] = useState<any>(null); // For Admin-viewing-Admin
    const [timeRange, setTimeRange] = useState<"7_days" | "30_days" | "all" | "weekly" | "monthly" | "6months" | "yearly">("30_days");
    const [activeTab, setActiveTab] = useState<"documents" | "users">("documents");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("ไม่พบ Token สำหรับยืนยันตัวตน (Authentication token missing)");

                const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/dashboard`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const statusText = response.status === 500 ? "Server Error (500)" : response.statusText;
                    if (response.status === 404) throw new Error("ไม่พบข้อมูลผู้ใช้งาน (User not found)");
                    throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${statusText} (${response.status})`);
                }

                const json = await response.json();
                
                // Infer role if missing from json.user
                let inferredRole = json.user?.role;
                if (!inferredRole && json.role_dashboard) {
                    const rd = json.role_dashboard;
                    if (rd.total_reviewed) inferredRole = "DPO";
                    else if (rd.pending_audits !== undefined) inferredRole = "AUDITOR";
                    else if (rd.pending_submissions !== undefined) inferredRole = "PROCESSOR";
                    else if (rd.compliance_score !== undefined) inferredRole = "EXECUTIVE";
                    else if (rd.total_documents !== undefined) inferredRole = "OWNER";
                } else if (!inferredRole && !json.role_dashboard) {
                    inferredRole = "ADMIN";
                }
                inferredRole = inferredRole || "OWNER";

                setData({
                    ...json,
                    user: {
                        ...(json.user || {}),
                        role: inferredRole
                    }
                });

                // Initialize a safe default timeRange based on role
                const normalizedRole = inferredRole.toUpperCase();
                if (normalizedRole === "EXECUTIVE" || normalizedRole === "OWNER") {
                    setTimeRange("monthly");
                } else {
                    setTimeRange("30_days");
                }

                // If user is Admin, we might want to fetch Org stats to show the Admin dashboard style
                if (normalizedRole === "ADMIN") {
                    const orgRes = await fetch(`${API_BASE_URL}/dashboard?period=${timeRange}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (orgRes.ok) {
                        const orgJson = await orgRes.json();
                        
                        const userRes = await fetch(`${API_BASE_URL}/dashboard/users?period=${timeRange}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                        const userJson = userRes.ok ? await userRes.json() : null;

                        setAdminData({
                            document_status_chart: {
                                draft: orgJson?.document_overview?.statuses?.draft || 0,
                                pending: orgJson?.document_overview?.statuses?.pending || 0,
                                completed: orgJson?.document_overview?.statuses?.completed || 0,
                                reviewing: orgJson?.document_overview?.statuses?.reviewing || 0
                            },
                            role_stats: orgJson?.role_based_stats || {
                                data_owner_docs: { title: "เอกสารผู้รับผิดชอบข้อมูล", completed: 0, incomplete: 0 },
                                processor_docs: { title: "เอกสารผู้ประมวลผลข้อมูลส่วนบุคคล", completed: 0, incomplete: 0 },
                                dpo_docs: { title: "เอกสารเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", completed: 0, incomplete: 0 },
                                auditor_docs: { title: "เอกสารผู้ตรวจสอบ", completed: 0, incomplete: 0 }
                            },
                            revision_stats: orgJson?.revision_and_deletion_stats || {
                                owner_revisions: { title: "การแก้ไขโดยผู้รับผิดชอบข้อมูล", completed: 0, incomplete: 0 },
                                processor_revisions: { title: "การแก้ไขโดยผู้ประมวลผล", completed: 0, incomplete: 0 },
                                destroyed_docs: { title: "เอกสารที่ทำลายแล้ว", completed: 0, incomplete: 0 },
                                due_for_destruction: { title: "เอกสารที่ถึงกำหนดทำลาย", completed: 0, incomplete: 0 }
                            },
                            user_stats: userJson || { user_overview: { total: 0, roles: {} }, role_breakdowns: {} }
                        });
                    }
                }
            } catch (err: any) {
                console.error("Error fetching user dashboard:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUserData();
    }, [userId, timeRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="ml-4 text-[#5F5E5E] font-medium text-lg">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    if (!data) {
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                    <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">เกิดข้อผิดพลาด</h3>
                    <p className="text-[#5F5E5E] mb-6">{error}</p>
                    <Link href="/admin/tables/users" className="text-primary font-bold hover:underline flex items-center gap-2">
                        <span className="material-symbols-outlined">arrow_back</span> กลับไปหน้าตารางผู้ใช้
                    </Link>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="ml-4 text-[#5F5E5E] font-medium text-lg">กำลังเตรียมข้อมูล...</span>
            </div>
        );
    }

    const user = data.user || {
        id: userId,
        email: "ไม่ระบุ",
        first_name: "ไม่ระบุ",
        last_name: "",
        username: "ไม่ระบุ",
        role: "OWNER",
        status: "ACTIVE"
    };
    
    const statistics = data.statistics || {
        documents_created: {},
        processor_assignments: 0,
        auditor_assignments: 0,
        owned_assignments: 0
    };
    
    // Ensure roleNormalized captures the inferred role stored in state
    const roleNormalized = (user.role || "OWNER").toUpperCase();

    // Translation maps
    const roleTranslation: Record<string, string> = {
        "ADMIN": "ผู้ดูแลระบบ",
        "OWNER": "ผู้รับผิดชอบข้อมูล",
        "PROCESSOR": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
        "DPO": "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
        "AUDITOR": "ผู้ตรวจสอบ",
        "EXECUTIVE": "ผู้บริหารระดับสูง"
    };

    const statusTranslation: Record<string, string> = {
        "ACTIVE": "ใช้งานอยู่",
        "INACTIVE": "ปิดการใช้งาน",
        "PENDING": "รอการยืนยัน"
    };

    const translatedRole = roleTranslation[roleNormalized] || user.role || "ไม่ระบุ";
    const statusKey = (user.status || "ACTIVE").toUpperCase();
    const translatedStatus = statusTranslation[statusKey] || user.status || "ไม่ระบุ";

    // Render based on role
    const renderDashboardContent = () => {
        if (roleNormalized === "ADMIN" && adminData) {
            return <AdminDashboardView data={adminData} activeTab={activeTab} />;
        }
// ... [Remaining code]
// ... [Remaining code remains the same]

        if (roleNormalized === "DPO" && data.role_dashboard) {
            const rd = data.role_dashboard;
            const dpoStats = {
                totalDocs: rd.total_reviewed?.count || 0,
                pendingReview: (rd.pending_dpo_review?.for_archiving || 0) + (rd.pending_dpo_review?.for_destruction || 0),
                actionNeeded: (rd.revision_needed?.owner_count || 0) + (rd.revision_needed?.processor_count || 0),
                complianceScore: 0,
                correctivePersonalDocs: rd.revision_needed?.owner_count || 0,
                correctiveProcessorDocs: rd.revision_needed?.processor_count || 0,
                pendingStorage: rd.pending_dpo_review?.for_archiving || 0,
                pendingDestruction: rd.pending_dpo_review?.for_destruction || 0,
                riskDistribution: rd.risk_overview || { low: 0, medium: 0, high: 0 },
                auditorPending: rd.auditor_review_status?.pending || 0,
                auditorCompleted: rd.auditor_review_status?.completed || 0,
                approvedDocs: rd.approved_documents?.total || 0,
                delayedDocs: rd.auditor_delayed?.count || 0
            };
            return <DpoDashboardView stats={dpoStats} />;
        }

        if (roleNormalized === "OWNER") {
            return <DataOwnerDashboardView userId={userId} stats={data.role_dashboard} />;
        }

        if (roleNormalized === "EXECUTIVE") {
            return <ExecutiveDashboardView stats={data.role_dashboard} />;
        }

        // Default basic view for other roles
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="เอกสารที่สร้างทั้งหมด" value={Object.values(statistics.documents_created).reduce((a, b) => a + b, 0)} icon="description" color="text-blue-600" bgColor="bg-blue-50" />
                    <StatCard title="งานมอบหมายผู้ประมวลผล" value={statistics.processor_assignments} icon="assignment_ind" color="text-purple-600" bgColor="bg-purple-50" />
                    <StatCard title="งานมอบหมายผู้ตรวจสอบ" value={statistics.auditor_assignments} icon="verified_user" color="text-emerald-600" bgColor="bg-emerald-50" />
                    <StatCard title="งานที่มอบหมายให้ผู้อื่น" value={statistics.owned_assignments} icon="share_reviews" color="text-orange-600" bgColor="bg-orange-50" />
                </div>
                <div className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
                    <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_outline</span>
                        ข้อมูลโปรไฟล์
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                        <InfoItem label="ชื่อผู้ใช้งาน (Username)" value={user.username} />
                        <InfoItem label="อีเมล (Email)" value={user.email} />
                        <InfoItem label="บทบาท (Role)" value={user.role} />
                        <InfoItem label="สถานะ (Status)" value={user.status} />
                        <InfoItem label="รหัสฐานข้อมูล (DB ID)" value={user.id} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12 max-w-[1440px] mx-auto animate-in fade-in duration-500">
            {/* Header and Back navigation */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">
                        แดชบอร์ดส่วนบุคคล: {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-[#5C403D] text-[18px] font-medium">
                        สรุปข้อมูลสถิติและการใช้งานของ {translatedRole} (สถานะ: {translatedStatus})
                    </p>
                </div>

                <div className="flex items-center gap-6 self-start md:self-auto">
                    {/* Tab Switcher (Show only for Admin view) */}
                    {roleNormalized === "ADMIN" && (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-bold text-neutral-800">เลือกส่วนการแสดงผล</span>
                            <div className="flex gap-2 h-9">
                                <button
                                    onClick={() => setActiveTab("documents")}
                                    className={`px-6 text-sm font-bold transition-all rounded-md border cursor-pointer ${activeTab === "documents"
                                        ? "bg-[#F33140] text-white border-[#F33140] shadow-sm"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                        }`}
                                >
                                    เอกสาร
                                </button>
                                <button
                                    onClick={() => setActiveTab("users")}
                                    className={`px-6 text-sm font-bold transition-all rounded-md border cursor-pointer ${activeTab === "users"
                                        ? "bg-[#F33140] text-white border-[#F33140] shadow-sm"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                        }`}
                                >
                                    ผู้ใช้
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Time Range Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold text-neutral-800">ช่วงเวลา</span>
                        <div className="relative">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as any)}
                                className="h-9 px-4 pr-10 appearance-none bg-white border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:bg-neutral-50 cursor-pointer min-w-[200px]"
                            >
                                {roleNormalized === "EXECUTIVE" ? (
                                    <>
                                        <option value="weekly">สัปดาห์นี้</option>
                                        <option value="monthly">เดือนนี้</option>
                                        <option value="yearly">ปีนี้</option>
                                    </>
                                ) : roleNormalized === "OWNER" ? (
                                    <>
                                        <option value="weekly">สัปดาห์นี้</option>
                                        <option value="monthly">เดือนนี้</option>
                                        <option value="6months">6 เดือน</option>
                                        <option value="yearly">1 ปี</option>
                                        <option value="all">ทั้งหมด</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="7_days">7 วันล่าสุด</option>
                                        <option value="30_days">30 วันล่าสุด</option>
                                        <option value="all">ทั้งหมด</option>
                                    </>
                                )}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-sm">
                                expand_more
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-[19px]"> {/* Spacer to align with select */}
                        <Link
                            href="/admin/tables/users"
                            className="flex items-center gap-2 h-9 px-4 text-sm font-bold bg-white text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            กลับไปรายชื่อผู้ใช้
                        </Link>
                    </div>
                </div>
            </div>

            {renderDashboardContent()}
        </div>
    );
}

function StatCard({ title, value, icon, color, bgColor }: { title: string; value: number; icon: string; color: string; bgColor: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${color} text-[28px]`}>{icon}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-[#5F5E5E] mb-0.5">{title}</p>
                    <p className="text-2xl font-black text-neutral-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
            <p className="text-[16px] font-bold text-neutral-800">{value}</p>
        </div>
    );
}
