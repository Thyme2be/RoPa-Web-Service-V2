"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
    OwnerRecord,
    OwnerDashboardData,
    ActiveTableItem,
    SentToDpoTableItem,
    ApprovedTableItem,
    DestroyedTableItem,
    OwnerSnapshotTableItem,
} from "@/types/dataOwner";
import { ownerService } from "@/services/ownerService";
import { api } from "@/lib/api";
import { RopaStatus, CollectionMethod, RetentionUnit } from "@/types/enums";
import { useAuth } from "./AuthContext";
import { withToast, getErrorMessage } from "@/lib/toastHelper";

interface OwnerContextType {
    records: OwnerRecord[];
    activeRecords: ActiveTableItem[];
    sentRecords: SentToDpoTableItem[];
    approvedRecords: ApprovedTableItem[];
    destroyedRecords: DestroyedTableItem[];
    ownerSnapshots: OwnerSnapshotTableItem[];
    ownerDashboardData: OwnerDashboardData | null;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;

    activeMeta: { total: number; page: number; limit: number };
    sentMeta: { total: number; page: number; limit: number };
    approvedMeta: { total: number; page: number; limit: number };
    destroyedMeta: { total: number; page: number; limit: number };

    fetchActiveTable: (page?: number, limit?: number, statusFilter?: string, period?: string, customDate?: string, search?: string) => Promise<void>;
    fetchSentTable: (page?: number, limit?: number) => Promise<void>;
    fetchApprovedTable: (page?: number, limit?: number) => Promise<void>;
    fetchDestroyedTable: (page?: number, limit?: number) => Promise<void>;
    
    fetchOwnerDashboard: (period?: string) => Promise<void>;
    fetchFullOwnerRecord: (id: string) => Promise<OwnerRecord | null>;
    saveRecord: (record: Partial<OwnerRecord>) => Promise<OwnerRecord>;
    submitDoSection: (id: string, record: Partial<OwnerRecord>) => Promise<void>;
    sendToDpo: (id: string, payload?: any) => Promise<void>;
    saveRiskAssessment: (id: string, risk: any) => Promise<void>;
    deleteRecord: (id: string, status?: string) => Promise<void>;
    requestDelete: (id: string, reason: string) => Promise<void>;
    createOwnerSnapshot: (id: string, data: any) => Promise<any>;
    fetchOwnerSnapshot: (snapshotId: string) => Promise<OwnerRecord | null>;
    deleteOwnerSnapshot: (snapshotId: string) => Promise<void>;
    submitFeedbackBatch: (id: string, items: { section_number: number; field_name?: string; comment: string }[]) => Promise<any>;
    sendBackToDpo: (id: string) => Promise<void>;
    annualReview: (id: string, payload?: any) => Promise<void>;
    getById: (id: string) => OwnerRecord | undefined;
    getDashboardStats: () => {
        totalDocs: number;
        docsToEdit: { owner: number; processor: number };
        risk: { low: number; medium: number; high: number; total: number };
        pendingDpo: { store: number; destroy: number };
        pendingDocs: { owner: number; processor: number };
        approved: number;
        sensitive: number;
        delayed: number;
        annualCheck: { reviewed: number; notReviewed: number };
        dueDestroy: number;
        destroyed: number;
    };
    currentPeriod: string;
    setCurrentPeriod: (p: string) => void;
    refresh: (period?: string) => Promise<void>;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [records, setRecords] = useState<OwnerRecord[]>([]);
    const [activeRecords, setActiveRecords] = useState<ActiveTableItem[]>([]);
    const [sentRecords, setSentRecords] = useState<SentToDpoTableItem[]>([]);
    const [approvedRecords, setApprovedRecords] = useState<ApprovedTableItem[]>([]);
    const [destroyedRecords, setDestroyedRecords] = useState<DestroyedTableItem[]>([]);
    const [ownerSnapshots, setOwnerSnapshots] = useState<OwnerSnapshotTableItem[]>([]);
    const [ownerDashboardData, setOwnerDashboardData] = useState<OwnerDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState("all");

    const clearError = useCallback(() => setError(null), []);

    const [activeMeta, setActiveMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [sentMeta, setSentMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [approvedMeta, setApprovedMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [destroyedMeta, setDestroyedMeta] = useState({ total: 0, page: 1, limit: 3 });

    const fetchActiveTable = useCallback(async (page = 1, limit = 3, statusFilter = "all", period = "all", customDate = "", search = "") => {
        setIsLoading(true);
        try {
            const data = await ownerService.getOwnerActiveTable(page, limit, statusFilter, period, customDate, search);
            setActiveRecords(data.items);
            setActiveMeta({ total: data.total, page: data.page, limit: data.limit });
        } catch (err: any) {
            setError(err.message || "Failed to fetch active records");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSentTable = useCallback(async (page = 1, limit = 3) => {
        try {
            const res = await ownerService.getOwnerSentTable(page, limit);
            setSentRecords(res.items);
            setSentMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Sent Table failed:", err);
        }
    }, []);

    const fetchApprovedTable = useCallback(async (page = 1, limit = 3) => {
        try {
            const res = await ownerService.getOwnerApprovedTable(page, limit);
            setApprovedRecords(res.items);
            setApprovedMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Approved Table failed:", err);
        }
    }, []);

    const fetchDestroyedTable = useCallback(async (page = 1, limit = 3) => {
        try {
            const res = await ownerService.getOwnerDestroyedTable(page, limit);
            setDestroyedRecords(res.items);
            setDestroyedMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Destroyed Table failed:", err);
        }
    }, []);

    const fetchOwnerDashboard = useCallback(async (period: string = "all") => {
        if (!isAuthenticated || user?.role !== "OWNER") return;
        setIsLoading(true);
        setError(null);
        setCurrentPeriod(period);
        try {
            const data = await ownerService.getOwnerDashboard(period);
            setOwnerDashboardData(data);
        } catch (err: any) {
            console.error("Failed to fetch owner dashboard:", err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    const refresh = useCallback(async (period?: string) => {
        if (!isAuthenticated || user?.role !== "OWNER") return;
        
        const targetPeriod = period || currentPeriod;
        setIsLoading(true);
        setError(null);
        try {
            // Bulk fetch initial data
            const [active, sent, approved, destroyed, snapshots, dashboard] = await Promise.all([
                ownerService.getOwnerActiveTable(1, 3),
                ownerService.getOwnerSentTable(1, 3),
                ownerService.getOwnerApprovedTable(1, 3),
                ownerService.getOwnerDestroyedTable(1, 3),
                ownerService.getOwnerSnapshots(),
                ownerService.getOwnerDashboard(targetPeriod)
            ]);

            setActiveRecords(active.items);
            setActiveMeta({ total: active.total, page: active.page, limit: active.limit });
            
            setSentRecords(sent.items);
            setSentMeta({ total: sent.total, page: sent.page, limit: sent.limit });
            
            setApprovedRecords(approved.items);
            setApprovedMeta({ total: approved.total, page: approved.page, limit: approved.limit });
            
            setDestroyedRecords(destroyed.items);
            setDestroyedMeta({ total: destroyed.total, page: destroyed.page, limit: destroyed.limit });
            
            setOwnerSnapshots(snapshots);
            setOwnerDashboardData(dashboard);
            if (period) setCurrentPeriod(period);
            
        } catch (error: any) {
            console.error("Failed to refresh Owner data:", error);
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, currentPeriod]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const mapToOwnerRecord = (data: any): OwnerRecord => {
        return {
            id: data.document_id,
            document_name: data.title || data.title_prefix || "",
            title_prefix: data.title_prefix || "",
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            address: data.address || "",
            email: data.email || "",
            phone: data.phone || "",
            rights_email: data.contact_email || "",
            rights_phone: data.company_phone || "",
            data_subject_name: data.data_owner_name || "",
            processing_activity: data.processing_activity || "",
            purpose_of_processing: data.purpose_of_processing || "",
            personal_data_items: data.personal_data_items?.map((i: any) => i.type) || [],
            data_categories: data.data_categories?.map((i: any) => i.category) || [],
            data_types: data.data_types?.map((i: any) => i.type) || [],
            stored_data_types_other: data.personal_data_items?.find((i: any) => i.other_description)?.other_description || "",
            collection_method: (data.collection_methods?.[0]?.method as any) || CollectionMethod.OnlineForm,
            data_source_direct: data.data_sources?.some((i: any) => i.source === "DIRECT") || false,
            data_source_indirect: data.data_sources?.some((i: any) => i.source === "INDIRECT") || false,
            legal_basis: data.legal_basis || "",
            minor_consent_under_10: data.minor_consent_types?.includes("UNDER_10") || false,
            minor_consent_10_to_20: data.minor_consent_types?.includes("AGE_10_20") || false,
            minor_consent_none: data.minor_consent_types?.includes("NONE") || false,
            minor_consent_types: data.minor_consent_types || [],
            storage_types: data.storage_types?.map((i: any) => i.type) || [],
            has_cross_border_transfer: data.has_cross_border_transfer || false,
            transfer_country: data.transfer_country,
            transfer_company: data.transfer_in_group,
            transfer_method: data.transfer_method,
            transfer_protection_standard: data.transfer_protection_standard,
            transfer_exception: data.transfer_exception,
            retention_value: data.retention_value || 0,
            retention_unit: data.retention_unit || RetentionUnit.YEARS,
            access_condition: data.access_control_policy || "",
            deletion_method: data.deletion_method || "",
            exemption_usage: data.exemption_usage || "",
            org_measures: data.org_measures,
            technical_measures: data.technical_measures,
            physical_measures: data.physical_measures,
            access_control_measures: data.access_control_measures,
            responsibility_measures: data.responsibility_measures,
            audit_measures: data.audit_measures,
            storage_methods: data.storage_methods?.map((m: any) => m.method).join(",") || "",
            status: data.status === "SUBMITTED" ? RopaStatus.Processing : RopaStatus.Draft,
            document_status: data.document_status,
            workflow: "processing",
            suggestions: data.suggestions || []
        };
    };

    const fetchFullOwnerRecord = async (id: string): Promise<OwnerRecord | null> => {
        setIsLoading(true);
        try {
            const data = await ownerService.getOwnerDocumentSection(id);
            const normalized = mapToOwnerRecord(data);
            try {
                const delReq = await ownerService.getDeletionRequest(id);
                normalized.deletion_status = delReq.status === "APPROVED" ? "DELETED" : "DELETE_PENDING";
                normalized.deletion_request = {
                    id: delReq.id,
                    status: delReq.status,
                    owner_reason: delReq.owner_reason || "",
                    dpo_reason: delReq.dpo_reason || "",
                    requested_at: delReq.requested_at || "",
                    decided_at: delReq.decided_at || ""
                };
            } catch (e) {
                normalized.deletion_status = null;
                normalized.deletion_request = undefined;
            }
            
            try {
                const riskData = await ownerService.getRiskAssessment(id);
                if (riskData) {
                    normalized.risk_assessment = {
                        probability: riskData.likelihood,
                        impact: riskData.impact,
                        total: riskData.risk_score,
                        level: riskData.risk_level === "LOW" ? "ต่ำ" : riskData.risk_level === "MEDIUM" ? "ปานกลาง" : "สูง",
                        submitted_date: riskData.assessed_at
                    };
                    if (riskData.suggestions && riskData.suggestions.length > 0) {
                        normalized.suggestions = [
                            ...(normalized.suggestions || []),
                            ...riskData.suggestions
                        ];
                    }
                }
            } catch (e) {
                // No risk assessment found
                normalized.risk_assessment = undefined;
            }
            
            return normalized;
        } catch (error) {
            console.error("Failed to fetch full owner record:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const mapOwnerRecordToPayload = (record: Partial<OwnerRecord>) => {
        let minorConsentTypes: string[] = record.minor_consent_types || [];
        if (minorConsentTypes.length === 0) {
            if (record.minor_consent_under_10) minorConsentTypes.push("UNDER_10");
            if (record.minor_consent_10_to_20) minorConsentTypes.push("10_TO_20");
            if (record.minor_consent_none) minorConsentTypes.push("NONE");
        }

        const dataSources: { source: string }[] = [];
        if (record.data_source_direct) dataSources.push({ source: "DIRECT" });
        if (record.data_source_indirect) dataSources.push({ source: "INDIRECT" });

        return {
            title: record.document_name,
            title_prefix: record.title_prefix,
            first_name: record.first_name,
            last_name: record.last_name,
            address: record.address,
            email: record.email,
            phone: record.phone,
            contact_email: record.rights_email,
            company_phone: record.rights_phone,
            data_owner_name: record.data_subject_name,
            processing_activity: record.processing_activity,
            purpose_of_processing: record.purpose_of_processing,
            personal_data_items: record.personal_data_items?.map(t => ({ type: t })),
            data_categories: record.data_categories?.map(c => ({ category: c })),
            data_types: record.data_types?.map(t => ({ type: t })),
            collection_methods: record.collection_method ? [{ method: record.collection_method }] : [],
            data_sources: dataSources.length > 0 ? dataSources : undefined,
            data_source_other: record.data_source_other,
            minor_consent_types: minorConsentTypes.length > 0 ? minorConsentTypes : undefined,
            storage_types: record.storage_types?.map(t => ({ type: t })),
            storage_methods: typeof record.storage_methods === 'string'
                ? record.storage_methods.split(",").filter(Boolean).map(m => ({
                    method: m,
                    other_description: m === "อื่นๆ" ? record.storage_methods_other : undefined
                }))
                : Array.isArray(record.storage_methods as any)
                    ? (record.storage_methods as unknown as any[]).map((m: any) => {
                        const methodName = typeof m === 'string' ? m : m.method;
                        return {
                            method: methodName,
                            other_description: methodName === "อื่นๆ" ? record.storage_methods_other : (typeof m === 'object' ? m.other_description : undefined)
                        };
                    })
                    : undefined,
            legal_basis: record.legal_basis,
            exemption_usage: record.exemption_usage,
            has_cross_border_transfer: record.has_cross_border_transfer,
            transfer_country: record.transfer_country,
            transfer_in_group: record.transfer_company,
            transfer_method: record.transfer_method,
            transfer_protection_standard: record.transfer_protection_standard,
            transfer_exception: record.transfer_exception,
            retention_value: (record.retention_value !== undefined && record.retention_value !== null && String(record.retention_value) !== "")
                ? parseInt(String(record.retention_value), 10) : undefined,
            retention_unit: record.retention_unit,
            access_control_policy: record.access_condition,
            deletion_method: record.deletion_method,
            org_measures: record.org_measures,
            technical_measures: record.technical_measures,
            physical_measures: record.physical_measures,
            access_control_measures: record.access_control_measures,
            responsibility_measures: record.responsibility_measures,
            audit_measures: record.audit_measures,
        };
    };

    const saveRecord = async (record: Partial<OwnerRecord>): Promise<OwnerRecord> => {
        if (!record.id) throw new Error("Document ID required for saving");
        const payload = mapOwnerRecordToPayload(record);

        return await withToast(
            (async () => {
                await ownerService.saveOwnerDraft(record.id as string, payload);
                try { await ownerService.saveOwnerSnapshot(record.id as string, payload); } catch (e) {}
                await refresh();
                return record as OwnerRecord;
            })(),
            { loading: "กำลังบันทึก...", success: "บันทึกข้อมูลสำเร็จ!" }
        );
    };

    const submitDoSection = async (id: string, record: Partial<OwnerRecord>) => {
        const payload = mapOwnerRecordToPayload(record);
        await withToast(
            (async () => {
                 await ownerService.submitOwnerSection(id, payload);
                 try {
                     const snapshots = await ownerService.getOwnerSnapshots();
                     const snap = snapshots.find((s: any) => s.document_id === id);
                     if (snap) await ownerService.deleteOwnerSnapshot(snap.id);
                 } catch (e) {}
                 await refresh();
            })(),
            { loading: "กำลังส่งข้อมูล...", success: "ส่งข้อมูลส่วนนี้สำเร็จ!" }
        );
    };

    const sendToDpo = async (id: string, payload: any = {}) => {
        await withToast(
            (async () => {
                await ownerService.sendToDpo(id, payload);
                await refresh();
            })(),
            { loading: "กำลังส่งให้ DPO...", success: "ส่งให้ DPO สำเร็จ!" }
        );
    };

    const annualReview = async (id: string, payload: any = {}) => {
        await withToast(
            (async () => {
                await ownerService.annualReview(id, payload);
                await refresh();
            })(),
            { loading: "กำลังดำเนินการตรวจสอบรายปี...", success: "ตรวจสอบรายปีสำเร็จ!" }
        );
    };

    const sendBackToDpo = async (id: string) => {
        await withToast(
            (async () => {
                await ownerService.sendBackToDpo(id);
                await refresh();
            })(),
            { loading: "กำลังส่งกลับให้ DPO...", success: "ส่งกลับให้ DPO สำเร็จ!" }
        );
    };

    const saveRiskAssessment = async (id: string, risk: any) => {
        await withToast(
            (async () => {
                const payload = {
                    likelihood: risk.probability || risk.likelihood,
                    impact: risk.impact
                };
                await api.post(`/owner/documents/${id}/risk`, payload);
                await refresh();
            })(),
            { loading: "กำลังบันทึกการประเมินความเสี่ยง...", success: "บันทึกการประเมินความเสี่ยงสำเร็จ!" }
        );
    };

    const requestDelete = async (id: string, reason: string) => {
        await withToast(
            (async () => {
                await ownerService.requestDeletion(id, reason);
                await refresh();
            })(),
            { loading: "กำลังส่งคำขอทำลาย...", success: "ส่งคำขอทำลายสำเร็จ!" }
        );
    };

    const submitFeedbackBatch = async (id: string, items: { section_number: number; field_name?: string; comment: string }[]) => {
        return await withToast(
            (async () => {
                 const result = await ownerService.submitFeedbackBatch(id, items);
                 await refresh();
                 return result;
            })(),
            { loading: "กำลังส่งข้อเสนอแนะ...", success: "ส่งข้อเสนอแนะสำเร็จ!" }
        );
    };

    const deleteRecord = async (id: string, status?: string) => {
        await withToast(
            (async () => {
                if (status === "IN_PROGRESS") {
                    await ownerService.hardDeleteDocument(id);
                } else {
                    await ownerService.requestDeletion(id, "Delete request from management table");
                }
                await refresh();
            })(),
            { loading: "กำลังลบ...", success: "ลบข้อมูลสำเร็จ!" }
        );
    };

    const createOwnerSnapshot = async (id: string, record: any) => {
        const payload = mapOwnerRecordToPayload(record);
        return await withToast(
            (async () => {
                 const response = await ownerService.saveOwnerSnapshot(id, payload);
                 await refresh();
                 return response;
            })(),
            { loading: "กำลังสร้างฉบับร่าง...", success: "สร้างฉบับร่างสำเร็จ!" }
        );
    };

    const fetchOwnerSnapshot = async (snapshotId: string): Promise<OwnerRecord | null> => {
        setIsLoading(true);
        try {
            const snapshot = await ownerService.getOwnerSnapshot(snapshotId);
            const combinedData = {
                ...snapshot.data,
                document_id: snapshot.document_id,
                title: snapshot.title,
            };
            return mapToOwnerRecord(combinedData);
        } catch (error) {
            console.error("Failed to fetch owner snapshot:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteOwnerSnapshot = async (snapshotId: string) => {
        await withToast(
            (async () => {
                 await ownerService.deleteOwnerSnapshot(snapshotId);
                 await refresh();
            })(),
            { loading: "กำลังลบฉบับร่าง...", success: "ลบฉบับร่างสำเร็จ!" }
        );
    };

    const getById = (id: string) => records.find(r => r.id === id);

    const getDashboardStats = useCallback(() => {
        if (!ownerDashboardData) return {
            totalDocs: 0,
            docsToEdit: { owner: 0, processor: 0 },
            risk: { low: 0, medium: 0, high: 0, total: 0 },
            pendingDpo: { store: 0, destroy: 0 },
            pendingDocs: { owner: 0, processor: 0 },
            approved: 0,
            sensitive: 0,
            delayed: 0,
            annualCheck: { reviewed: 0, notReviewed: 0 },
            dueDestroy: 0,
            destroyed: 0
        };

        const d = ownerDashboardData;
        return {
            totalDocs: d.total_documents,
            docsToEdit: { owner: d.needs_fix_do_count, processor: d.needs_fix_dp_count },
            risk: {
                low: d.risk_low_count, medium: d.risk_medium_count, high: d.risk_high_count,
                total: d.risk_low_count + d.risk_medium_count + d.risk_high_count
            },
            pendingDpo: { store: d.under_review_storage_count, destroy: d.under_review_deletion_count },
            pendingDocs: { owner: d.pending_do_count, processor: d.pending_dp_count },
            approved: d.completed_count,
            sensitive: d.sensitive_document_count,
            delayed: d.overdue_dp_count,
            annualCheck: { reviewed: d.annual_reviewed_count, notReviewed: d.annual_not_reviewed_count },
            dueDestroy: d.destruction_due_count,
            destroyed: d.deleted_count
        };
    }, [ownerDashboardData]);

    return (
        <OwnerContext.Provider value={{
            records, activeRecords, sentRecords, approvedRecords, destroyedRecords, ownerSnapshots,
            ownerDashboardData, isLoading, error, clearError,
            activeMeta, sentMeta, approvedMeta, destroyedMeta,
            fetchActiveTable, fetchSentTable, fetchApprovedTable, fetchDestroyedTable,
            fetchOwnerDashboard, fetchFullOwnerRecord, saveRecord, submitDoSection,
            sendToDpo, saveRiskAssessment, deleteRecord, requestDelete, createOwnerSnapshot,
            fetchOwnerSnapshot, deleteOwnerSnapshot, submitFeedbackBatch, sendBackToDpo,
            annualReview, getById, getDashboardStats, refresh,
            currentPeriod, setCurrentPeriod
        }}>
            {children}
        </OwnerContext.Provider>
    );
}

export const useOwner = () => {
    const context = useContext(OwnerContext);
    if (!context) throw new Error("useOwner must be used within OwnerProvider");
    return context;
};
