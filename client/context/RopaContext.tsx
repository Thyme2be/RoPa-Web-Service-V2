"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { OwnerRecord } from "@/types/dataOwner";
import { RopaProcessorRecord } from "@/types/dataProcessor";
import { ropaService } from "@/services/ropaService";
import { api } from "@/lib/api";
import { RopaStatus, CollectionMethod, RetentionUnit } from "@/types/enums";
import { useAuth } from "./AuthContext";

interface RopaContextType {
    records: OwnerRecord[];
    processorRecords: RopaProcessorRecord[];
    executiveDashboardData: any | null;
    ownerDashboardData: any | null;
    
    // Data Owner Actions
    saveRecord: (record: Partial<OwnerRecord>) => Promise<OwnerRecord>;
    getById: (id: string) => OwnerRecord | undefined;
    fetchFullOwnerRecord: (id: string) => Promise<OwnerRecord | null>;
    submitDoSection: (id: string) => Promise<void>;
    sendToDpo: (id: string) => Promise<void>;
    saveRiskAssessment: (id: string, risk: any) => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
    requestDelete: (id: string, reason: string) => Promise<void>;
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
    const [processorRecords, setProcessorRecords] = useState<RopaProcessorRecord[]>([]);
    const [executiveDashboardData, setExecutiveDashboardData] = useState<any | null>(null);
    const [ownerDashboardData, setOwnerDashboardData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        setIsLoading(true);
        try {
            // Fetch based on role
            if (user.role === "OWNER") {
                try {
                const activeDocs = await ropaService.getOwnerActiveTable();
                
                // Normalize backend format to frontend OwnerRecord
                const normalized = activeDocs.map((item: any) => ({
                    id: item.document_id,
                    documentName: item.title, // Page prefix it with ID anyway
                    title: item.title,
                    processorCompany: item.dp_company,
                    dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString("th-TH") : "—",
                    assignedProcessor: item.dp_name ? {
                        name: item.dp_name,
                        assignedDate: item.created_at,
                        documentTitle: item.title
                    } : undefined,
                    processingStatus: {
                        doStatus: item.owner_status.code === "DO_DONE" ? "done" : "pending",
                        dpStatus: item.processor_status.code === "DP_DONE" ? "done" : "pending"
                    },
                    status: RopaStatus.Processing,
                    workflow: "processing"
                }));
                setRecords(normalized);

                    const ownerStats = await ropaService.getOwnerDashboard();
                    setOwnerDashboardData(ownerStats);
                } catch (err) {
                    console.error("Owner data fetch failed:", err);
                }
            }

            if (user.role === "PROCESSOR") {
                try {
                const assignedDocs = await ropaService.getProcessorAssignedTable();
                
                // Normalize for processor records
                const normalized = assignedDocs.map((item: any) => ({
                    id: item.document_id, // Page uses record.id
                    ropaId: item.document_id,
                    documentName: item.title,
                    title: item.owner_title || "คุณ",
                    firstName: item.owner_first_name || item.owner_name || "—",
                    lastName: item.owner_last_name || "",
                    dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString("th-TH") : "—",
                    assignedProcessor: {
                        assignedDate: item.assigned_at ? new Date(item.assigned_at).toLocaleDateString("th-TH") : "—"
                    },
                    processingStatus: {
                        doStatus: item.owner_status.code === "DO_DONE" ? "done" : "pending",
                        dpStatus: item.processor_status.code === "DP_DONE" ? "done" : "pending"
                    },
                    status: item.processor_status.code === "DP_DONE" ? RopaStatus.Processing : RopaStatus.Draft
                }));
                setProcessorRecords(normalized as any);
                setRecords(normalized as any); // Some processor pages might still use 'records'
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
        withProcessor: records.filter(r => r.assignedProcessor).length
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
            delayed: d.overdue_destruction_count,
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
            total: 0, processing: 0, sentDpo: 0, approved: 0, destroyed: 0,
            risk: { low: 0, medium: 0, high: 0 }
        };

        // If specific department is requested, we might need to find it in the list
        // Note: The new backend API returns lists for risk_by_department and sensitive_docs_by_department
        return {
            total: executiveDashboardData.ropa_status_overview.total,
            processing: executiveDashboardData.ropa_status_overview.under_review,
            sentDpo: executiveDashboardData.ropa_status_overview.pending,
            approved: executiveDashboardData.ropa_status_overview.completed,
            destroyed: 0, 
            risk: {
                low: executiveDashboardData.ropa_status_overview.draft, // Placeholder mapping
                medium: 0,
                high: 0
            }
        };
    };

    // ─── Data Owner Handlers ──────────────────────────────────────────────────
    const fetchFullOwnerRecord = async (id: string): Promise<OwnerRecord | null> => {
        setIsLoading(true);
        try {
            const data = await ropaService.getOwnerDocumentSection(id);
            // Normalization mapping
            const normalized: OwnerRecord = {
                id: data.document_id,
                documentName: data.title_prefix || "", // Backend doesn't have document_name in section but we can map
                title: data.title_prefix || "",
                firstName: data.first_name || "",
                lastName: data.last_name || "",
                address: data.address || "",
                email: data.email || "",
                phoneNumber: data.phone || "",
                rightsEmail: data.contact_email || "",
                rightsPhone: data.company_phone || "",
                dataSubjectName: data.data_owner_name || "",
                processingActivity: data.processing_activity || "",
                purpose: data.purpose_of_processing || "",
                personalData: data.personal_data_items?.map((i: any) => i.type).join(", ") || "",
                dataCategories: data.data_categories?.map((i: any) => i.category) || [],
                dataType: data.data_types?.map((i: any) => i.type) || [],
                storedDataTypes: data.personal_data_items?.map((i: any) => i.type) || [],
                storedDataTypesOther: data.personal_data_items?.find((i: any) => i.other_description)?.other_description || "",
                collectionMethod: (data.collection_methods?.[0]?.method as any) || CollectionMethod.OnlineForm,
                dataSource: {
                    direct: data.data_sources?.some((i: any) => i.source === "DIRECT") || false,
                    indirect: data.data_sources?.some((i: any) => i.source === "INDIRECT") || false,
                },
                legalBasis: data.legal_basis || "",
                minorConsent: {
                    under10: data.minor_consent_types?.includes("UNDER_10") || false,
                    age10to20: data.minor_consent_types?.includes("AGE_10_20") || false,
                    none: data.minor_consent_types?.includes("NONE") || false,
                },
                internationalTransfer: {
                    isTransfer: data.has_cross_border_transfer || false,
                    country: data.transfer_country,
                    companyName: data.transfer_in_group,
                    transferMethod: data.transfer_method,
                    protectionStandard: data.transfer_protection_standard,
                    exception: data.transfer_exception,
                },
                retention: {
                    storageType: data.storage_types?.[0]?.type || CollectionMethod.SoftFile,
                    method: data.storage_methods?.map((m: any) => m.method) || [],
                    duration: data.retention_value || 0,
                    unit: data.retention_unit || RetentionUnit.Year,
                    accessControl: data.access_control_policy || "",
                    deletionMethod: data.deletion_method || "",
                },
                exemptionDisclosure: data.exemption_usage || "",
                securityMeasures: {
                    organizational: data.org_measures,
                    technical: data.technical_measures,
                    physical: data.physical_measures,
                    accessControl: data.access_control_measures,
                    responsibility: data.responsibility_measures,
                    audit: data.audit_measures,
                },
                status: data.status === "DONE" ? RopaStatus.Processing : RopaStatus.Draft,
                workflow: "processing"
            };

            // Fetch deletion info
            try {
                const delReq = await ropaService.getDeletionRequest(id);
                normalized.deletionStatus = delReq.status === "APPROVED" ? "DELETED" : "DELETE_PENDING";
                normalized.deletionRequest = {
                    id: delReq.id,
                    status: delReq.status,
                    ownerReason: delReq.owner_reason,
                    dpoDecision: delReq.dpo_decision,
                    dpoReason: delReq.dpo_reason,
                    requestedAt: delReq.requested_at,
                    decidedAt: delReq.decided_at,
                };
            } catch (e) {
                // If 404, no deletion request yet
                normalized.deletionStatus = null;
                normalized.deletionRequest = undefined;
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
        const payload = {
            title_prefix: record.title,
            first_name: record.firstName,
            last_name: record.lastName,
            address: record.address,
            email: record.email,
            phone: record.phoneNumber,
            contact_email: record.rightsEmail,
            company_phone: record.rightsPhone,
            data_owner_name: record.dataSubjectName,
            processing_activity: record.processingActivity,
            purpose_of_processing: record.purpose,
            // Sub-tables handling would usually be more complex if backend expects objects
            // For now, map simple strings back to objects if that's what backend wants
            personal_data_items: record.storedDataTypes?.map(t => ({ type: t })),
            data_categories: record.dataCategories?.map(c => ({ category: c })),
            data_types: (Array.isArray(record.dataType) ? record.dataType : [record.dataType]).map(t => ({ type: t })),
            legal_basis: record.legalBasis,
            has_cross_border_transfer: record.internationalTransfer?.isTransfer,
            transfer_country: record.internationalTransfer?.country,
            transfer_in_group: record.internationalTransfer?.companyName,
            transfer_method: record.internationalTransfer?.transferMethod,
            transfer_protection_standard: record.internationalTransfer?.protectionStandard,
            transfer_exception: record.internationalTransfer?.exception,
            retention_value: record.retention?.duration,
            retention_unit: record.retention?.unit,
            access_control_policy: record.retention?.accessControl,
            deletion_method: record.retention?.deletionMethod,
            org_measures: record.securityMeasures?.organizational,
            technical_measures: record.securityMeasures?.technical,
            physical_measures: record.securityMeasures?.physical,
            access_control_measures: record.securityMeasures?.accessControl,
            responsibility_measures: record.securityMeasures?.responsibility,
            audit_measures: record.securityMeasures?.audit,
        };

        const response = await ropaService.saveOwnerDraft(record.id, payload);
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

    // ─── Data Processor Handlers ──────────────────────────────────────────────
    const fetchFullProcessorRecord = async (id: string): Promise<RopaProcessorRecord | null> => {
        setIsLoading(true);
        try {
            const data = await ropaService.getProcessorSection(id);
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
