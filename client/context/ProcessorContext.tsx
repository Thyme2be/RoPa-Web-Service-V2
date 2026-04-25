"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { RopaProcessorRecord, ProcessorAssignedTableItem } from "@/types/dataProcessor";
import { OwnerSnapshotTableItem } from "@/types/dataOwner";
import { processorService } from "@/services/processorService";
import { ownerService } from "@/services/ownerService";
import { useAuth } from "./AuthContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { withToast } from "@/lib/toastHelper";

interface ProcessorContextType {
    processorRecords: RopaProcessorRecord[];
    processorSnapshots: OwnerSnapshotTableItem[];
    processorAssignedRecords: ProcessorAssignedTableItem[];
    processorAssignedMeta: { total: number; page: number; limit: number; total_pages: number };
    isLoading: boolean;
    error: string | null;
    clearError: () => void;

    fetchProcessorAssignedTable: (page?: number, limit?: number, search?: string) => Promise<void>;
    fetchFullProcessorRecord: (id: string) => Promise<RopaProcessorRecord | null>;
    saveProcessorRecord: (record: Partial<RopaProcessorRecord>, idOverride?: string) => Promise<RopaProcessorRecord>;
    submitDpSection: (id: string, data?: any) => Promise<void>;
    dispatchDpSection: (id: string) => Promise<void>;
    deleteProcessorRecord: (snapshotId: string) => Promise<void>;
    fetchProcessorSnapshot: (snapshotId: string) => Promise<RopaProcessorRecord | null>;
    getProcessorById: (id: string) => RopaProcessorRecord | undefined;
    refresh: () => Promise<void>;
}

const ProcessorContext = createContext<ProcessorContextType | undefined>(undefined);

export function ProcessorProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [processorRecords, setProcessorRecords] = useState<RopaProcessorRecord[]>([]);
    const [processorSnapshots, setProcessorSnapshots] = useState<OwnerSnapshotTableItem[]>([]);
    const [processorAssignedRecords, setProcessorAssignedRecords] = useState<ProcessorAssignedTableItem[]>([]);
    const [processorAssignedMeta, setProcessorAssignedMeta] = useState({ total: 0, page: 1, limit: 3, total_pages: 1 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const fetchProcessorAssignedTable = useCallback(async (page = 1, limit = 3, search = "") => {
        setIsLoading(true);
        try {
            const res = await processorService.getProcessorAssignedTable(page, limit, search);
            const itemsWithId = res.items.map((item: any) => ({
                ...item,
                id: item.document_id
            }));
            setProcessorAssignedRecords(itemsWithId);
            setProcessorAssignedMeta(res.meta);
        } catch (err: any) {
            setError(err.message || "Failed to fetch assigned table");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        if (user.role !== "PROCESSOR") return;

        setIsLoading(true);
        setError(null);
        try {
            const assignedDocs = await processorService.getProcessorAssignedTable();
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
                full_name: item.do_name,
                title_prefix: item.owner_title || "",
                first_name: item.owner_first_name || "",
                last_name: item.owner_last_name || "",
                due_date: item.due_date,
                updated_at: item.updated_at,
                assigned_processor: {
                    assigned_date: item.received_at
                },
                processing_status: {
                    do_status: "pending",
                    dp_status: item.status?.code === "CHECK_DONE" ? "done" : "pending"
                },
                processor_status: item.status,
                is_sent: item.is_sent,
                status: isDraft ? SectionStatus.DRAFT : (item.status?.code === "CHECK_DONE" ? RopaStatus.COMPLETED : RopaStatus.IN_PROGRESS)
            });

            const normalizedActive = activeDocs.map(item => mapItem(item, false));
            const normalizedDrafts = draftDocs.map(item => mapItem(item, true));
            const snapshots = await processorService.getProcessorSnapshots();

            const allNormalized = [...normalizedActive, ...normalizedDrafts];
            setProcessorRecords(allNormalized as any);
            setProcessorSnapshots(snapshots);
        } catch (err: any) {
            console.error("Processor data fetch failed:", err);
            setError(err.response?.data?.detail || "ไม่สามารถโหลดข้อมูลผู้ประมวลผลได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const normalizeProcessorData = (data: any) => {
        if (!data) return data;
        const suggestions = (data.feedbacks || []).map((f: any) => ({
            section_id: `dp-${f.section_number}`,
            comment: f.comment,
            date: f.created_at
        }));

        return {
            ...data,
            suggestions,
            personal_data_items: data.personal_data_items?.map((item: any) => typeof item === 'object' ? item.type : item),
            data_categories: data.data_categories?.map((item: any) => typeof item === 'object' ? item.category : item),
            data_types: data.data_types?.map((item: any) => typeof item === 'object' ? item.type : item),
            collection_methods: data.collection_methods?.map((item: any) => typeof item === 'object' ? item.method : item),
            data_sources: data.data_sources?.map((item: any) => typeof item === 'object' ? item.source : item),
            storage_methods: data.storage_methods?.map((item: any) => typeof item === 'object' ? item.method : item),
            storage_types: data.storage_types?.map((item: any) => typeof item === 'object' ? item.type : item),
        };
    };

    const fetchFullProcessorRecord = async (id: string): Promise<RopaProcessorRecord | null> => {
        if (!id || !user || !user.role) return null;
        setIsLoading(true);
        try {
            const data = user.role === "OWNER"
                ? await ownerService.getOwnerProcessorSection(id)
                : await processorService.getProcessorSection(id);

            const normalizedData = normalizeProcessorData(data);
            const normalized: RopaProcessorRecord = {
                ...normalizedData,
                id: normalizedData.document_id,
                ropaId: normalizedData.document_id,
                documentName: normalizedData.title || "",
                status: normalizedData.status === "SUBMITTED" ? RopaStatus.Processing : RopaStatus.Draft,
            };

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
            personal_data_items: data.personal_data_items?.map((item: any) => typeof item === 'string' ? { type: item } : item),
            data_categories: data.data_categories?.map((item: any) => typeof item === 'string' ? { category: item } : item),
            data_types: data.data_types?.map((item: any) => typeof item === 'string' ? { type: item } : item),
            collection_methods: data.collection_methods?.map((item: any) => typeof item === 'string' ? { method: item } : item),
            data_sources: data.data_sources?.map((item: any) => typeof item === 'string' ? { source: item } : item),
            storage_methods: data.storage_methods?.map((item: any) => typeof item === 'string' ? { method: item } : item),
            storage_types: data.storage_types?.map((item: any) => typeof item === 'string' ? { type: item } : item),
            data_source_other: data.data_source_other,
            retention_value: (data.retention_value !== undefined && data.retention_value !== null && String(data.retention_value) !== "")
                ? parseInt(String(data.retention_value), 10) : undefined,
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
        if (!targetId) throw new Error("Missing ID");
        const payload = mapToProcessorPayload(record);
        
        return await withToast(
             (async () => {
                 const saved = await processorService.saveProcessorDraft(targetId, payload);
                 try { await processorService.saveProcessorSnapshot(targetId, payload); } catch (e) {}
                 await refresh();
                 return normalizeProcessorData(saved);
             })(),
             { loading: 'กำลังบันทึกฉบับร่าง...', success: 'บันทึกฉบับร่างสำเร็จ!' }
        );
    };

    const submitDpSection = async (id: string, data: any = {}) => {
        const payload = mapToProcessorPayload(data);
        await withToast(
            (async () => {
                 await processorService.submitProcessorSection(id, payload);
                 await fetchProcessorAssignedTable(processorAssignedMeta.page, processorAssignedMeta.limit);
                 await refresh();
            })(),
            { loading: 'กำลังส่งข้อมูล...', success: 'ส่งข้อมูลส่วนนี้สำเร็จ!' }
        );
    };

    const dispatchDpSection = async (id: string) => {
        await withToast(
            (async () => {
                 await processorService.dispatchProcessorSection(id);
                 await fetchProcessorAssignedTable(processorAssignedMeta.page, processorAssignedMeta.limit);
                 await refresh();
            })(),
            { loading: 'กำลังส่งข้อมูล...', success: 'ส่งข้อมูลสำเร็จ!' }
        );
    };

    const getProcessorById = (id: string) => processorRecords.find(r => r.id === id);

    const deleteProcessorRecord = async (snapshotId: string) => {
        await withToast(
            (async () => {
                 await processorService.deleteProcessorSnapshot(snapshotId);
                 await refresh();
            })(),
            { loading: 'กำลังลบ...', success: 'ลบข้อมูลสำเร็จ!' }
        );
    };

    const fetchProcessorSnapshot = async (snapshotId: string): Promise<RopaProcessorRecord | null> => {
        setIsLoading(true);
        try {
            const snapshot = await processorService.getProcessorSnapshot(snapshotId);
            return normalizeProcessorData({
                 ...snapshot.data,
                 document_id: snapshot.document_id,
                 title: snapshot.title,
            });
        } catch (error) {
            console.error("Failed to fetch processor snapshot:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProcessorContext.Provider value={{
            processorRecords,
            processorSnapshots,
            processorAssignedRecords,
            processorAssignedMeta,
            isLoading,
            error,
            clearError,
            fetchProcessorAssignedTable,
            fetchFullProcessorRecord,
            saveProcessorRecord,
            submitDpSection,
            dispatchDpSection,
            deleteProcessorRecord,
            fetchProcessorSnapshot,
            getProcessorById,
            refresh
        }}>
            {children}
        </ProcessorContext.Provider>
    );
}

export const useProcessor = () => {
    const context = useContext(ProcessorContext);
    if (!context) throw new Error("useProcessor must be used within ProcessorProvider");
    return context;
};
