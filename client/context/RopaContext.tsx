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
    executiveDashboardData: ExecutiveDashboardResponse | null;
    ownerDashboardData: OwnerDashboardData | null;


    // Data Owner Actions
    saveRecord: (record: Partial<OwnerRecord>) => Promise<OwnerRecord>;
    getById: (id: string) => OwnerRecord | undefined;
    fetchFullOwnerRecord: (id: string) => Promise<OwnerRecord | null>;
    submitDoSection: (id: string) => Promise<void>;
    sendToDpo: (id: string, payload?: any) => Promise<void>;
    saveRiskAssessment: (id: string, risk: any) => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
    requestDelete: (id: string, reason: string) => Promise<void>;
    createOwnerSnapshot: (id: string, data: any) => Promise<any>;
    fetchOwnerSnapshot: (snapshotId: string) => Promise<OwnerRecord | null>;
    assignProcessor: (recordId: string, name: string, title: string) => Promise<void>;

    // Data Processor Actions
    saveProcessorRecord: (record: Partial<RopaProcessorRecord>) => Promise<RopaProcessorRecord>;
    getProcessorById: (id: string) => RopaProcessorRecord | undefined;
    fetchFullProcessorRecord: (id: string) => Promise<RopaProcessorRecord | null>;
    submitDpSection: (id: string) => Promise<void>;
    deleteProcessorRecord: (id: string) => Promise<void>;

    // Data Fetching
    refresh: () => Promise<void>;
    fetchExecutiveData: (period?: string, department?: string) => Promise<void>;

    isLoading: boolean;
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
    const [executiveDashboardData, setExecutiveDashboardData] = useState<any | null>(null);
    const [ownerDashboardData, setOwnerDashboardData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        setIsLoading(true);
        try {
            if (user.role === "OWNER") {
                try {
                    const [active, sent, approved, destroyed, snapshots] = await Promise.all([
                        ropaService.getOwnerActiveTable(),
                        ropaService.getOwnerSentTable(),
                        ropaService.getOwnerApprovedTable(),
                        ropaService.getOwnerDestroyedTable(),
                        ropaService.getOwnerSnapshots()
                    ]);

                    setActiveRecords(active);
                    setSentRecords(sent);
                    setApprovedRecords(approved);
                    setDestroyedRecords(destroyed);
                    setOwnerSnapshots(snapshots);

                    // Legacy records mapping for screens that still use unified list
                    const legacyMapping = active.map(item => ({
                        id: item.document_id,
                        document_name: item.title,
                        assigned_processor: { name: item.dp_name },
                        processor_company: item.dp_company,
                        due_date: item.due_date ? new Date(item.due_date).toLocaleDateString("th-TH") : "—",
                        status: item.owner_section_status === "SUBMITTED" ? RopaStatus.IN_PROGRESS : RopaStatus.Draft,
                        processing_status: {
                            do_status: item.owner_status.code === "DO_DONE" ? "done" : "pending",
                            dp_status: item.processor_status.code === "DP_DONE" ? "done" : "pending"
                        }
                    }));
                    setRecords(legacyMapping as any);

                    const ownerStats = await ropaService.getOwnerDashboard();
                    setOwnerDashboardData(ownerStats);
                } catch (err: any) {
                    console.error("Owner data fetch failed:", err);
                    if (err.response?.status === 401) {
                        console.warn("Session expired (401). Redirecting via interceptor...");
                    }
                }
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
                        title_prefix: item.owner_title || "คุณ",
                        first_name: item.owner_first_name || item.owner_name || "—",
                        last_name: item.owner_last_name || "",
                        due_date: item.due_date ? new Date(item.due_date).toLocaleDateString("th-TH") : "—",
                        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString("th-TH") : "—",
                        assigned_processor: {
                            assigned_date: item.assigned_at ? new Date(item.assigned_at).toLocaleDateString("th-TH") : "—"
                        },
                        processing_status: {
                            do_status: item.owner_status?.code === "DO_DONE" ? "done" : "pending",
                            dp_status: item.processor_status?.code === "DP_DONE" ? "done" : "pending"
                        },
                        processor_status: item.processor_status,
                        owner_status: item.owner_status,
                        status: isDraft ? SectionStatus.DRAFT : (item.processor_status?.code === "DP_DONE" ? RopaStatus.COMPLETED : RopaStatus.IN_PROGRESS)
                    });

                    const normalizedActive = activeDocs.map(item => mapItem(item, false));
                    const normalizedDrafts = draftDocs.map(item => mapItem(item, true));

                    const allNormalized = [...normalizedActive, ...normalizedDrafts];
                    setProcessorRecords(allNormalized as any);
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
            minor_consent_10_to_20: data.minor_consent_types?.includes("10_TO_20") || false,
            minor_consent_none: data.minor_consent_types?.includes("NONE") || false,
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
            status: data.status === "DONE" ? RopaStatus.Processing : RopaStatus.Draft,
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

    const saveRecord = async (record: Partial<OwnerRecord>): Promise<OwnerRecord> => {
        if (!record.id) throw new Error("Document ID required for saving");

        // Re-mapping frontend back to backend expected format for saveOwnerDraft
        // Build minor_consent_types array from individual boolean fields
        const minorConsentTypes: string[] = [];
        if (record.minor_consent_under_10) minorConsentTypes.push("UNDER_10");
        if (record.minor_consent_10_to_20) minorConsentTypes.push("10_TO_20");
        if (record.minor_consent_none) minorConsentTypes.push("NONE");

        // Build data_sources array from boolean flags
        const dataSources: { source: string }[] = [];
        if (record.data_source_direct) dataSources.push({ source: "DIRECT" });
        if (record.data_source_indirect) dataSources.push({ source: "INDIRECT" });

        const payload = {
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
            minor_consent_types: minorConsentTypes.length > 0 ? minorConsentTypes : undefined,
            legal_basis: record.legal_basis,
            exemption_usage: record.exemption_usage,
            has_cross_border_transfer: record.has_cross_border_transfer,
            transfer_country: record.transfer_country,
            transfer_in_group: record.transfer_company,
            transfer_method: record.transfer_method,
            transfer_protection_standard: record.transfer_protection_standard,
            transfer_exception: record.transfer_exception,
            retention_value: record.retention_value,
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

    const submitDoSection = async (id: string) => {
        await ropaService.submitOwnerSection(id);
        
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

    const saveRiskAssessment = async (id: string, risk: any) => {
        try {
            await api.post(`/owner/documents/${id}/risk`, risk);
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

    const deleteRecord = async (id: string) => {
        console.warn("deleteRecord API integration pending");
    };

    const createOwnerSnapshot = async (id: string, record: any) => {
        // Re-mapping frontend back to backend expected format
        // Build minor_consent_types array from individual boolean fields
        const snapshotMinorConsent: string[] = [];
        if (record.minor_consent_under_10) snapshotMinorConsent.push("UNDER_10");
        if (record.minor_consent_10_to_20) snapshotMinorConsent.push("10_TO_20");
        if (record.minor_consent_none) snapshotMinorConsent.push("NONE");

        // Build data_sources array from boolean flags
        const snapshotDataSources: { source: string }[] = [];
        if (record.data_source_direct) snapshotDataSources.push({ source: "DIRECT" });
        if (record.data_source_indirect) snapshotDataSources.push({ source: "INDIRECT" });

        const payload = {
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
            personal_data_items: record.personal_data_items?.map((t: string) => ({ type: t })),
            data_categories: record.data_categories?.map((c: string) => ({ category: c })),
            data_types: record.data_types?.map((t: string) => ({ type: t })),
            collection_methods: record.collection_method ? [{ method: record.collection_method }] : [],
            data_sources: snapshotDataSources.length > 0 ? snapshotDataSources : undefined,
            minor_consent_types: snapshotMinorConsent.length > 0 ? snapshotMinorConsent : undefined,
            legal_basis: record.legal_basis,
            exemption_usage: record.exemption_usage,
            has_cross_border_transfer: record.has_cross_border_transfer,
            transfer_country: record.transfer_country,
            transfer_in_group: record.transfer_company,
            transfer_method: record.transfer_method,
            transfer_protection_standard: record.transfer_protection_standard,
            transfer_exception: record.transfer_exception,
            retention_value: record.retention_value,
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

    // ─── Data Processor Handlers ──────────────────────────────────────────────
    const fetchFullProcessorRecord = async (id: string): Promise<RopaProcessorRecord | null> => {
        setIsLoading(true);
        try {
            // Data Owners call /owner/.../processor-section
            // Processors call /processor/.../section
            const data = user?.role === "OWNER"
                ? await ropaService.getOwnerProcessorSection(id)
                : await ropaService.getProcessorSection(id);

            // Simpler mapping for processor for now
            const normalized: RopaProcessorRecord = {
                ...data,
                id: data.document_id,
                ropaId: data.document_id,
                documentName: data.title || "",
                status: data.status === "DONE" ? RopaStatus.Processing : RopaStatus.Draft,
            };
            return normalized;
        } catch (error) {
            console.error("Failed to fetch full processor record:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const saveProcessorRecord = async (record: Partial<RopaProcessorRecord>): Promise<RopaProcessorRecord> => {
        const saved = await ropaService.saveProcessorDraft(record.id!, record);
        await refresh();
        return saved;
    };

    const getProcessorById = (id: string) => processorRecords.find(r => r.id === id);

    const submitDpSection = async (id: string) => {
        await ropaService.submitProcessorSection(id, {});
        await refresh();
    };

    const deleteProcessorRecord = async (id: string) => {
        // delete logic
        await refresh();
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
            executiveDashboardData,
            ownerDashboardData,
            saveRecord,
            getById,
            fetchFullOwnerRecord,
            submitDoSection,
            sendToDpo,
            saveRiskAssessment,
            deleteRecord,
            assignProcessor,
            saveProcessorRecord,
            getProcessorById,
            fetchFullProcessorRecord,
            submitDpSection,
            deleteProcessorRecord,
            requestDelete,
            createOwnerSnapshot,
            fetchOwnerSnapshot,
            refresh,
            fetchExecutiveData,
            isLoading,
            stats,
            getDashboardStats,
            getExecutiveStats
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