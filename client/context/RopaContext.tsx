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
    StatusBadge
} from "@/types/dataOwner";
import { RopaProcessorRecord } from "@/types/dataProcessor";
import { ExecutiveDashboardResponse, RiskByDepartment } from "@/types/executive";
import { ropaService } from "@/services/ropaService";
import { api } from "@/lib/api";
import { RopaStatus, CollectionMethod, RetentionUnit, SectionStatus } from "@/types/enums";
import { useAuth } from "./AuthContext";

interface RopaContextType {
    records: OwnerRecord[];
    activeRecords: ActiveTableItem[];
    sentRecords: SentToDpoTableItem[];
    approvedRecords: ApprovedTableItem[];
    destroyedRecords: DestroyedTableItem[];
    ownerSnapshots: OwnerSnapshotTableItem[];
    processorRecords: RopaProcessorRecord[];
    processorSnapshots: OwnerSnapshotTableItem[];
    executiveDashboardData: ExecutiveDashboardResponse | null;
    ownerDashboardData: OwnerDashboardData | null;


    // Data Owner Actions
    saveRecord: (record: Partial<OwnerRecord>) => Promise<OwnerRecord>;
    getById: (id: string) => OwnerRecord | undefined;
    fetchFullOwnerRecord: (id: string) => Promise<OwnerRecord | null>;
    submitDoSection: (id: string, record: Partial<OwnerRecord>) => Promise<void>;
    sendToDpo: (id: string, payload?: any) => Promise<void>;
    saveRiskAssessment: (id: string, risk: any) => Promise<void>;
    deleteRecord: (id: string, status?: string) => Promise<void>;
    requestDelete: (id: string, reason: string) => Promise<void>;
    createOwnerSnapshot: (id: string, data: any) => Promise<any>;
    fetchOwnerSnapshot: (snapshotId: string) => Promise<OwnerRecord | null>;
    deleteOwnerSnapshot: (snapshotId: string) => Promise<void>;
    assignProcessor: (recordId: string, name: string, title: string) => Promise<void>;
    submitFeedbackBatch: (id: string, items: { section_number: number; field_name?: string; comment: string }[]) => Promise<any>;
    sendBackToDpo: (id: string) => Promise<void>;

    // Data Processor Actions
    saveProcessorRecord: (record: Partial<RopaProcessorRecord>, idOverride?: string) => Promise<RopaProcessorRecord>;
    getProcessorById: (id: string) => RopaProcessorRecord | undefined;
    fetchFullProcessorRecord: (id: string) => Promise<RopaProcessorRecord | null>;
    submitDpSection: (id: string, data?: any) => Promise<void>;
    dispatchDpSection: (id: string) => Promise<void>;
    deleteProcessorRecord: (snapshotId: string) => Promise<void>;
    fetchProcessorSnapshot: (snapshotId: string) => Promise<RopaProcessorRecord | null>;

    // Data Fetching
    refresh: () => Promise<void>;
    fetchExecutiveData: (period?: string, department?: string) => Promise<void>;
    fetchOwnerDashboard: (period?: string) => Promise<void>;
    
    // Paginated Fetchers
    fetchActiveTable: (page?: number, limit?: number) => Promise<void>;
    fetchSentTable: (page?: number, limit?: number) => Promise<void>;
    fetchApprovedTable: (page?: number, limit?: number) => Promise<void>;
    fetchDestroyedTable: (page?: number, limit?: number) => Promise<void>;
    
    annualReview: (id: string, payload?: any) => Promise<void>;

    isLoading: boolean;
    activeMeta: { total: number; page: number; limit: number };
    sentMeta: { total: number; page: number; limit: number };
    approvedMeta: { total: number; page: number; limit: number };
    destroyedMeta: { total: number; page: number; limit: number };
    stats: {
        total: number;
        withProcessor: number;
    };

    // Dashboard Statistics (Compatibility layer)
    getDashboardStats: () => any;
    getExecutiveStats: (dept?: string) => any;
}

const RopaContext = createContext<RopaContextType | undefined>(undefined);

export function RopaProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [records, setRecords] = useState<OwnerRecord[]>([]);
    const [activeRecords, setActiveRecords] = useState<ActiveTableItem[]>([]);
    const [sentRecords, setSentRecords] = useState<SentToDpoTableItem[]>([]);
    const [approvedRecords, setApprovedRecords] = useState<ApprovedTableItem[]>([]);
    const [destroyedRecords, setDestroyedRecords] = useState<DestroyedTableItem[]>([]);
    const [ownerSnapshots, setOwnerSnapshots] = useState<OwnerSnapshotTableItem[]>([]);
    const [processorRecords, setProcessorRecords] = useState<RopaProcessorRecord[]>([]);
    const [processorSnapshots, setProcessorSnapshots] = useState<OwnerSnapshotTableItem[]>([]);
    const [executiveDashboardData, setExecutiveDashboardData] = useState<any | null>(null);
    const [ownerDashboardData, setOwnerDashboardData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination Metadata
    const [activeMeta, setActiveMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [sentMeta, setSentMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [approvedMeta, setApprovedMeta] = useState({ total: 0, page: 1, limit: 3 });
    const [destroyedMeta, setDestroyedMeta] = useState({ total: 0, page: 1, limit: 3 });

    const fetchActiveTable = useCallback(async (page = 1, limit = 3) => {
        setIsLoading(true);
        try {
            const res = await ropaService.getOwnerActiveTable(page, limit);
            setActiveRecords(res.items);
            setActiveMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Active Table failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSentTable = useCallback(async (page = 1, limit = 3) => {
        setIsLoading(true);
        try {
            const res = await ropaService.getOwnerSentTable(page, limit);
            setSentRecords(res.items);
            setSentMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Sent Table failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchApprovedTable = useCallback(async (page = 1, limit = 3) => {
        setIsLoading(true);
        try {
            const res = await ropaService.getOwnerApprovedTable(page, limit);
            setApprovedRecords(res.items);
            setApprovedMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Approved Table failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDestroyedTable = useCallback(async (page = 1, limit = 3) => {
        setIsLoading(true);
        try {
            const res = await ropaService.getOwnerDestroyedTable(page, limit);
            setDestroyedRecords(res.items);
            setDestroyedMeta({ total: res.total, page: res.page, limit: res.limit });
        } catch (err) {
            console.error("Fetch Destroyed Table failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        setIsLoading(true);
        try {
            if (user.role === "OWNER") {
                // Fetch only first pages and dashboard
                await Promise.all([
                    fetchActiveTable(1, 3),
                    fetchSentTable(1, 3),
                    fetchApprovedTable(1, 3),
                    fetchDestroyedTable(1, 3),
                    ropaService.getOwnerSnapshots().then(setOwnerSnapshots),
                    ropaService.getOwnerDashboard().then(setOwnerDashboardData)
                ]);
            }

            if (user.role === "PROCESSOR") {
                try {
                    const assignedDocs = await ropaService.getProcessorAssignedTable();

                    let activeDocs: any[] = [];
                    let draftDocs: any[] = [];

                    if (Array.isArray(assignedDocs)) {
                        activeDocs = assignedDocs;
                    } else if (assignedDocs && typeof assignedDocs === 'object') {
                        activeDocs = assignedDocs.active || [];
                        draftDocs = assignedDocs.drafts || [];
                    }

                    const mapItem = (item: any, isDraft: boolean) => ({
                        id: item.document_id,
                        ropa_id: item.document_id,
                        document_id: item.document_id,
                        document_name: item.title || item.document_name,
                        title: item.title || item.document_name,
                        document_number: item.document_number,
                        // ใช้ do_name ที่ backend format มาให้แล้ว (นางสาวพรรษชล บุญมาก)
                        full_name: item.do_name,
                        title_prefix: item.owner_title || "",
                        first_name: item.owner_first_name || "",
                        last_name: item.owner_last_name || "",
                        due_date: item.due_date, // เก็บเป็น raw date เพื่อให้มา format ที่ frontend
                        updated_at: item.updated_at,
                        assigned_processor: {
                            assigned_date: item.received_at
                        },
                        processing_status: {
                            do_status: "pending", // Owner status hidden from DP
                            dp_status: item.status?.code === "CHECK_DONE" ? "done" : "pending"
                        },
                        processor_status: item.status,
                        is_sent: item.is_sent,
                        status: isDraft ? SectionStatus.DRAFT : (item.status?.code === "CHECK_DONE" ? RopaStatus.COMPLETED : RopaStatus.IN_PROGRESS)
                    });

                    const normalizedActive = activeDocs.map(item => mapItem(item, false));
                    const normalizedDrafts = draftDocs.map(item => mapItem(item, true));
                    const snapshots = await ropaService.getProcessorSnapshots();

                    const allNormalized = [...normalizedActive, ...normalizedDrafts];
                    setProcessorRecords(allNormalized as any);
                    setProcessorSnapshots(snapshots);
                    setRecords(allNormalized as any);
                } catch (err) {
                    console.error("Processor data fetch failed:", err);
                }
            }

            if (user.role === "EXECUTIVE") {
                try {
                    const execData = await ropaService.getExecutiveDashboard();
                    setExecutiveDashboardData(execData);
                } catch (err) {
                    console.error("Executive data fetch failed:", err);
                }
            }

        } catch (error) {
            console.error("Failed to refresh Ropa data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    const fetchExecutiveData = async (period: string = "all", department?: string) => {
        setIsLoading(true);
        try {
            const data = await ropaService.getExecutiveDashboard(period, department);
            setExecutiveDashboardData(data);
        } catch (error) {
            console.error("Failed to fetch executive data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            refresh();
        }
    }, [isAuthenticated, user, refresh]);

    const stats = {
        total: records.length,
        withProcessor: records.filter(r => r.assigned_processor).length
    };

    // Compatibility layer for existing components
    const getDashboardStats = () => {
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
            docsToEdit: {
                owner: d.needs_fix_do_count,
                processor: d.needs_fix_dp_count
            },
            risk: {
                low: d.risk_low_count,
                medium: d.risk_medium_count,
                high: d.risk_high_count,
                total: d.risk_low_count + d.risk_medium_count + d.risk_high_count
            },
            pendingDpo: {
                store: d.under_review_storage_count,
                destroy: d.under_review_deletion_count
            },
            pendingDocs: {
                owner: d.pending_do_count,
                processor: d.pending_dp_count
            },
            approved: d.completed_count,
            sensitive: d.sensitive_document_count,
            delayed: d.overdue_dp_count,
            annualCheck: {
                reviewed: d.annual_reviewed_count,
                notReviewed: d.annual_not_reviewed_count
            },
            dueDestroy: d.destruction_due_count,
            destroyed: d.deleted_count
        };
    };

    const getExecutiveStats = (dept?: string) => {
        if (!executiveDashboardData) return {
            total: 0, draft: 0, pending: 0, underReview: 0, approved: 0,
            risk: { low: 0, medium: 0, high: 0 }
        };

        const d = executiveDashboardData;
        const riskByDept = d.risk_by_department || [];

        // Sum up risks if not filtered by department
        let low = 0, medium = 0, high = 0;
        if (dept) {
            const risk = riskByDept.find((r: RiskByDepartment) => r.department === dept);
            low = risk?.low || 0;
            medium = risk?.medium || 0;
            high = risk?.high || 0;
        } else {
            riskByDept.forEach((r: RiskByDepartment) => {
                low += r.low || 0;
                medium += r.medium || 0;
                high += r.high || 0;
            });
        }

        return {
            total: d.ropa_status_overview?.total || 0,
            draft: d.ropa_status_overview?.draft || 0,
            pending: d.ropa_status_overview?.pending || 0,
            underReview: d.ropa_status_overview?.under_review || 0,
            approved: d.ropa_status_overview?.completed || 0,
            risk: { low, medium, high }
        };
    };



    // ─── Data Owner Handlers ──────────────────────────────────────────────────


    /**
     * Helper to map raw backend snapshot/section data to OwnerRecord frontend type
     */
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
            workflow: "processing"

        };
    };

    const fetchFullOwnerRecord = async (id: string): Promise<OwnerRecord | null> => {
        setIsLoading(true);
        try {
            const data = await ropaService.getOwnerDocumentSection(id);
            const normalized = mapToOwnerRecord(data);

            // Fetch deletion info
            try {
                const delReq = await ropaService.getDeletionRequest(id);
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
                // If 404, no deletion request yet
                normalized.deletion_status = null;
                normalized.deletion_request = undefined;
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
        // Build minor_consent_types array from individual boolean fields as fallback
        let minorConsentTypes: string[] = record.minor_consent_types || [];
        if (minorConsentTypes.length === 0) {
            if (record.minor_consent_under_10) minorConsentTypes.push("UNDER_10");
            if (record.minor_consent_10_to_20) minorConsentTypes.push("10_TO_20");
            if (record.minor_consent_none) minorConsentTypes.push("NONE");
        }

        // Build data_sources array from boolean flags
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
                ? parseInt(String(record.retention_value), 10)
                : undefined,
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

        const response = await ropaService.saveOwnerDraft(record.id, payload);
        
        // ลิงก์ข้อมูล: บันทึก snapshot (ฉบับร่าง) ไปพร้อมกันเพื่อให้สองตารางเหมือนกันเสมอ
        try {
            await ropaService.saveOwnerSnapshot(record.id, payload);
        } catch (e) {
            console.warn("Failed to sync snapshot during saveRecord:", e);
        }

        await refresh();
        return record as OwnerRecord;
    };

    const getById = (id: string) => records.find(r => r.id === id);

    const assignProcessor = async (recordId: string, processorName: string, documentTitle: string) => {
        // This functionality might be part of createDocument or a separate action
        console.warn("assignProcessor API integration pending");
    };

    const submitDoSection = async (id: string, record: Partial<OwnerRecord>) => {
        const payload = mapOwnerRecordToPayload(record);
        await ropaService.submitOwnerSection(id, payload);
        
        // ลิงก์สถานะ: เมื่อบันทึกสมบูรณ์ (Submit) ให้ลบฉบับร่างออกเพื่อความสะอาดของตาราง
        try {
            const snapshots = await ropaService.getOwnerSnapshots();
            const snap = snapshots.find((s: any) => s.document_id === id);
            if (snap) {
                await ropaService.deleteOwnerSnapshot(snap.id);
            }
        } catch (e) {
            console.warn("Snapshot cleanup skipped or failed:", e);
        }

        await refresh();
    };

    const sendToDpo = async (id: string, payload: any = {}) => {
        await ropaService.sendToDpo(id, payload);
        await refresh();
    };

    const fetchOwnerDashboard = useCallback(async (period: string = "all") => {
        if (!isAuthenticated || user?.role !== "OWNER") return;
        try {
            console.log("Fetching owner dashboard with period:", period);
            const data = await ropaService.getOwnerDashboard(period);
            setOwnerDashboardData(data);
        } catch (err) {
            console.error("Failed to fetch owner dashboard:", err);
        }
    }, [isAuthenticated, user]);

    const annualReview = async (id: string, payload: any = {}) => {
        await ropaService.annualReview(id, payload);
        await refresh();
    };

    const sendBackToDpo = async (id: string) => {
        await ropaService.sendBackToDpo(id);
        await refresh();
    };

    const saveRiskAssessment = async (id: string, risk: any) => {
        try {
            const payload = {
                likelihood: risk.probability || risk.likelihood,
                impact: risk.impact
            };
            await api.post(`/owner/documents/${id}/risk`, payload);
            await refresh();
        } catch (error) {
            console.error("Failed to save risk assessment:", error);
            throw error;
        }
    };

    const requestDelete = async (id: string, reason: string) => {
        await ropaService.requestDeletion(id, reason);
        await refresh();
    };

    const submitFeedbackBatch = async (id: string, items: { section_number: number; field_name?: string; comment: string }[]) => {
        const result = await ropaService.submitFeedbackBatch(id, items);
        await refresh();
        return result;
    };

    const deleteRecord = async (id: string, status?: string) => {
        try {
            if (status === "IN_PROGRESS") {
                // Hard delete สำหรับฉบับร่าง
                await ropaService.hardDeleteDocument(id);
            } else {
                // ยื่นคำร้องขอลบสำหรับสถานะอื่น
                await ropaService.requestDeletion(id, "Delete request from management table");
            }
            await refresh();
        } catch (error) {
            console.error("Failed to delete record:", error);
            throw error;
        }
    };

    const createOwnerSnapshot = async (id: string, record: any) => {
        const payload = mapOwnerRecordToPayload(record);

        const response = await ropaService.saveOwnerSnapshot(id, payload);
        await refresh();
        return response;
    };

    const fetchOwnerSnapshot = async (snapshotId: string): Promise<OwnerRecord | null> => {
        setIsLoading(true);
        try {
            const snapshot = await ropaService.getOwnerSnapshot(snapshotId);
            // ข้อมูลที่บันทึกไว้จะอยู่ใน snapshot.data เราต้องดึงออกมาและรวมกับ metadata พื้นฐาน
            const combinedData = {
                ...snapshot.data,
                document_id: snapshot.document_id,
                title: snapshot.title, // ใช้ชื่อเอกสารล่าสุดจาก metadata
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
        await ropaService.deleteOwnerSnapshot(snapshotId);
        await refresh();
    };

    // ─── Data Processor Handlers ──────────────────────────────────────────────
    const fetchFullProcessorRecord = async (id: string): Promise<RopaProcessorRecord | null> => {
        if (!id) return null;
        
        // Wait until user role is available to avoid 403 by calling wrong endpoint
        if (!user || !user.role) {
            console.warn("User role not yet loaded, postpone fetchFullProcessorRecord");
            return null;
        }

        setIsLoading(true);
        try {
            // Data Owners call /owner/.../processor-section
            // Processors call /processor/.../section
            const data = user.role === "OWNER"
                ? await ropaService.getOwnerProcessorSection(id)
                : await ropaService.getProcessorSection(id);

            const normalizedData = normalizeProcessorData(data);

            // Simpler mapping for processor for now
            const normalized: RopaProcessorRecord = {
                ...normalizedData,
                id: normalizedData.document_id,
                ropaId: normalizedData.document_id,
                documentName: normalizedData.title || "",
                status: normalizedData.status === "SUBMITTED" ? RopaStatus.Processing : RopaStatus.Draft,
            };

            // Sync with central state so getProcessorById works for Owners too
            setProcessorRecords(prev => {
                const existing = prev.findIndex(r => r.id === normalized.id);
                if (existing >= 0) {
                    const next = [...prev];
                    next[existing] = normalized;
                    return next;
                }
                return [...prev, normalized];
            });

            return normalized;
        } catch (error) {
            console.error("Failed to fetch full processor record:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const normalizeProcessorData = (data: any) => {
        if (!data) return data;
        
        // Map feedbacks to suggestions format used by the form sections
        const suggestions = (data.feedbacks || []).map((f: any) => ({
            section_id: `dp-${f.section_number}`,
            comment: f.comment,
            date: f.created_at
        }));

        return {
            ...data,
            suggestions,
            personal_data_items: data.personal_data_items?.map((item: any) => 
                typeof item === 'object' ? item.type : item
            ),
            data_categories: data.data_categories?.map((item: any) => 
                typeof item === 'object' ? item.category : item
            ),
            data_types: data.data_types?.map((item: any) => 
                typeof item === 'object' ? item.type : item
            ),
            collection_methods: data.collection_methods?.map((item: any) => 
                typeof item === 'object' ? item.method : item
            ),
            data_sources: data.data_sources?.map((item: any) => 
                typeof item === 'object' ? item.source : item
            ),
            storage_methods: data.storage_methods?.map((item: any) => 
                typeof item === 'object' ? item.method : item
            ),
            storage_types: data.storage_types?.map((item: any) => 
                typeof item === 'object' ? item.type : item
            ),
        };
    };

    const mapToProcessorPayload = (data: any) => {
        return {
            status: data.status,
            is_sent: data.is_sent,
            title_prefix: data.title_prefix,
            first_name: data.first_name,
            last_name: data.last_name,
            address: data.address,
            email: data.email,
            phone: data.phone,
            processor_name: data.processor_name,
            controller_name: data.controller_name,
            controller_address: data.controller_address,
            processing_activity: data.processing_activity,
            purpose_of_processing: data.purpose_of_processing,
            personal_data_items: data.personal_data_items?.map((item: any) => 
                typeof item === 'string' ? { type: item } : item
            ),
            data_categories: data.data_categories?.map((item: any) => 
                typeof item === 'string' ? { category: item } : item
            ),
            data_types: data.data_types?.map((item: any) => 
                typeof item === 'string' ? { type: item } : item
            ),
            collection_methods: data.collection_methods?.map((item: any) => 
                typeof item === 'string' ? { method: item } : item
            ),
            data_sources: data.data_sources?.map((item: any) => 
                typeof item === 'string' ? { source: item } : item
            ),
            storage_methods: data.storage_methods?.map((item: any) => 
                typeof item === 'string' ? { method: item } : item
            ),
            storage_types: data.storage_types?.map((item: any) => 
                typeof item === 'string' ? { type: item } : item
            ),
            data_source_other: data.data_source_other,
            retention_value: (data.retention_value !== undefined && data.retention_value !== null && String(data.retention_value) !== "")
                ? parseInt(String(data.retention_value), 10)
                : undefined,
            retention_unit: data.retention_unit,
            storage_methods_other: data.storage_methods_other,
            access_condition: data.access_condition,
            deletion_method: data.deletion_method,
            legal_basis: data.legal_basis,
            has_cross_border_transfer: data.has_cross_border_transfer,
            transfer_country: data.transfer_country,
            transfer_company: data.transfer_company,
            transfer_method: data.transfer_method,
            transfer_protection_standard: data.transfer_protection_standard,
            transfer_exception: data.transfer_exception,
            org_measures: data.org_measures,
            access_control_measures: data.access_control_measures,
            technical_measures: data.technical_measures,
            responsibility_measures: data.responsibility_measures,
            physical_measures: data.physical_measures,
            audit_measures: data.audit_measures,
        };
    };

    const saveProcessorRecord = async (record: Partial<RopaProcessorRecord>, idOverride?: string): Promise<RopaProcessorRecord> => {
        const targetId = idOverride || record.id;
        if (!targetId) {
            throw new Error("Cannot save processor record: Missing ID");
        }

        const payload = mapToProcessorPayload(record);
        const saved = await ropaService.saveProcessorDraft(targetId, payload);
        
        // Sync draft as a snapshot for tracking (matching Data Owner pattern)
        try {
            await ropaService.saveProcessorSnapshot(targetId, payload);
        } catch (e) {
            console.warn("Failed to sync processor snapshot during saveProcessorRecord:", e);
        }

        await refresh();
        return normalizeProcessorData(saved);
    };

    const getProcessorById = (id: string) => processorRecords.find(r => r.id === id);

    const submitDpSection = async (id: string, data: any = {}) => {
        const payload = mapToProcessorPayload(data);
        await ropaService.submitProcessorSection(id, payload);
        await refresh();
    };

    const dispatchDpSection = async (id: string) => {
        await ropaService.dispatchProcessorSection(id);
        await refresh();
    };

    const deleteProcessorRecord = async (snapshotId: string) => {
        await ropaService.deleteProcessorSnapshot(snapshotId);
        await refresh();
    };

    const fetchProcessorSnapshot = async (id: string): Promise<RopaProcessorRecord | null> => {
        setIsLoading(true);
        try {
            const snapshot = await ropaService.getProcessorSnapshot(id);
            // Snapshot data is in snapshot.data, merge with metadata
            const combinedData = {
                ...snapshot.data,
                document_id: snapshot.document_id,
                title: snapshot.title,
            };
            
            const normalizedData = normalizeProcessorData(combinedData);
            
            // Re-use mapToOwnerRecord logic simplified for processor if needed, 
            // or just return the combined data. The form expects ProcessorRecord.
            return {
                ...normalizedData,
                id: normalizedData.document_id,
                ropaId: normalizedData.document_id,
                status: SectionStatus.DRAFT,
            } as any;
        } catch (error) {
            console.error("Failed to fetch processor snapshot:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <RopaContext.Provider value={{
            records,
            activeRecords,
            sentRecords,
            approvedRecords,
            destroyedRecords,
            ownerSnapshots,
            processorRecords,
            processorSnapshots,
            executiveDashboardData,
            ownerDashboardData,
            activeMeta,
            sentMeta,
            approvedMeta,
            destroyedMeta,
            saveRecord,
            getById,
            fetchFullOwnerRecord,
            submitDoSection,
            sendToDpo,
            sendBackToDpo,
            saveRiskAssessment,
            deleteRecord,
            requestDelete,
            createOwnerSnapshot,
            fetchOwnerSnapshot,
            deleteOwnerSnapshot,
            assignProcessor,
            submitFeedbackBatch,
            saveProcessorRecord,
            getProcessorById,
            fetchFullProcessorRecord,
            submitDpSection,
            dispatchDpSection,
            deleteProcessorRecord,
            fetchProcessorSnapshot,
            refresh,
            fetchExecutiveData,
            fetchOwnerDashboard,
            fetchActiveTable,
            fetchSentTable,
            fetchApprovedTable,
            fetchDestroyedTable,
            isLoading,
            stats,
            getDashboardStats,
            getExecutiveStats,
            annualReview
        }}>
            {children}
        </RopaContext.Provider>
    );
}

export function useRopa() {
    const context = useContext(RopaContext);
    if (!context) {
        throw new Error("useRopa must be used within a RopaProvider");
    }
    return context;
}

export default RopaProvider;