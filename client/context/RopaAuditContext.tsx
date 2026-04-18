"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { OwnerRecord } from "@/types/dataOwner";
import { RopaProcessorRecord } from "@/types/dataProcessor";
import { mockOwnerRecords, mockProcessorRecords } from "@/lib/ropaMockRecords";
import { RopaStatus, DataType } from "@/types/enums";

/**
 * RopaAuditContext
 * This is our private context for the Audit/DPO workflow.
 * It uses the 'ropaMockRecords' as its primary data source.
 */

interface RopaAuditContextType {
    records: OwnerRecord[];
    processorRecords: RopaProcessorRecord[];
    getDashboardStats: () => any;
    getExecutiveStats: (dept?: string) => any;
    saveRecord: (record: Partial<OwnerRecord>) => OwnerRecord;
    getById: (id: string) => OwnerRecord | undefined;
    handleReturnForEdit: (id: string, workflow: any, status: RopaStatus) => void;
}

const RopaAuditContext = createContext<RopaAuditContextType | undefined>(undefined);

export function RopaAuditProvider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<OwnerRecord[]>([]);
    const [processorRecords, setProcessorRecords] = useState<RopaProcessorRecord[]>([]);

    useEffect(() => {
        // Initializing with our Ropa-specific mock data
        setRecords(mockOwnerRecords);
        setProcessorRecords(mockProcessorRecords);
    }, []);

    const saveRecord = (record: Partial<OwnerRecord>): OwnerRecord => {
        const index = records.findIndex(r => r.id === record.id);
        let saved: OwnerRecord;
        let updated: OwnerRecord[];
        const now = new Date().toLocaleString("th-TH");

        if (index > -1) {
            updated = [...records];
            saved = { ...updated[index], ...record, updatedDate: now } as OwnerRecord;
            updated[index] = saved;
        } else {
            saved = {
                ...record,
                id: record.id || Math.random().toString(36).substr(2, 9),
                dateCreated: now,
                updatedDate: now,
                status: record.status || RopaStatus.Draft,
                workflow: record.workflow || "processing"
            } as OwnerRecord;
            updated = [saved, ...records];
        }
        setRecords(updated);
        return saved;
    };

    const getById = (id: string) => records.find(r => r.id === id);

    const handleReturnForEdit = (id: string, workflow: any, status: RopaStatus) => {
        const record = getById(id);
        if (record) {
            saveRecord({ ...record, workflow, status });
        }
    };

    const getDashboardStats = () => {
        const nonDrafts = records.filter(r => r.status !== RopaStatus.Draft);
        const processing = records.filter(r => r.workflow === "processing");
        const sentDpo = records.filter(r => r.workflow === "sent_dpo");
        
        const risk = {
            low: nonDrafts.filter(r => r.riskAssessment?.level === "ต่ำ").length,
            medium: nonDrafts.filter(r => r.riskAssessment?.level === "ปานกลาง").length,
            high: nonDrafts.filter(r => r.riskAssessment?.level === "สูง").length,
        };

        return {
            totalDocs: nonDrafts.length,
            docsToEdit: {
                owner: processing.filter(r => r.processingStatus?.doStatus !== "done").length,
                processor: processing.filter(r => r.processingStatus?.dpStatus !== "done").length
            },
            risk: {
                ...risk,
                total: risk.low + risk.medium + risk.high
            },
            pendingDpo: {
                store: sentDpo.filter(r => r.status === RopaStatus.ReviewPending).length,
                destroy: sentDpo.filter(r => r.status === RopaStatus.DeletePending).length
            },
            approved: records.filter(r => r.workflow === "approved").length,
            sensitive: nonDrafts.filter(r => {
                if (Array.isArray(r.dataType)) return r.dataType.includes(DataType.Sensitive);
                return r.dataType === DataType.Sensitive;
            }).length,
            delayed: 0,
            annualCheck: { reviewed: 0, notReviewed: nonDrafts.length },
            dueDestroy: records.filter(r => r.workflow === "approved").length,
            destroyed: records.filter(r => r.workflow === "destroyed").length
        };
    };

    const getExecutiveStats = (dept?: string) => {
        const filtered = dept ? records.filter(r => r.department === dept) : records;
        const nonDrafts = filtered.filter(r => r.status !== RopaStatus.Draft);

        return {
            total: nonDrafts.length,
            processing: filtered.filter(r => r.workflow === "processing").length,
            sentDpo: filtered.filter(r => r.workflow === "sent_dpo").length,
            approved: filtered.filter(r => r.workflow === "approved").length,
            destroyed: filtered.filter(r => r.workflow === "destroyed").length,
            risk: {
                low: nonDrafts.filter(r => r.riskAssessment?.level === "ต่ำ").length,
                medium: nonDrafts.filter(r => r.riskAssessment?.level === "ปานกลาง").length,
                high: nonDrafts.filter(r => r.riskAssessment?.level === "สูง").length,
            }
        };
    };

    return (
        <RopaAuditContext.Provider value={{
            records,
            processorRecords,
            saveRecord,
            getById,
            handleReturnForEdit,
            getDashboardStats,
            getExecutiveStats
        }}>
            {children}
        </RopaAuditContext.Provider>
    );
}

export function useRopaAudit() {
    const context = useContext(RopaAuditContext);
    if (!context) {
        throw new Error("useRopaAudit must be used within a RopaAuditProvider");
    }
    return context;
}
