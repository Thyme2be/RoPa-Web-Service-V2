"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { OwnerRecord } from "@/types/dataOwner";
import { RopaProcessorRecord } from "@/types/dataProcessor";
import { ropaStore } from "@/lib/ropaStore";
import { mockOwnerRecords, mockProcessorRecords } from "@/lib/mockRecords";
import { RopaStatus } from "@/types/enums";

// SSR-Safe UUID Helper
const generateId = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface RopaContextType {
    records: OwnerRecord[];
    processorRecords: RopaProcessorRecord[];
    
    // Data Owner Actions
    saveRecord: (record: Partial<OwnerRecord>) => OwnerRecord;
    getById: (id: string) => OwnerRecord | undefined;
    submitDoSection: (id: string) => void;
    sendToDpo: (id: string) => void;
    saveRiskAssessment: (id: string, risk: any) => void;
    deleteRecord: (id: string) => void;
    requestDelete: (id: string) => void;
    assignProcessor: (recordId: string, name: string, title: string) => void;

    // Data Processor Actions
    saveProcessorRecord: (record: Partial<RopaProcessorRecord>) => RopaProcessorRecord;
    getProcessorById: (id: string) => RopaProcessorRecord | undefined;
    submitDpSection: (id: string) => void;
    deleteProcessorRecord: (id: string) => void;

    // Refresh data
    refresh: () => void;
    stats: {
        total: number;
        withProcessor: number;
    };
}

const RopaContext = createContext<RopaContextType | undefined>(undefined);

export function RopaProvider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<OwnerRecord[]>([]);
    const [processorRecords, setProcessorRecords] = useState<RopaProcessorRecord[]>([]);

    useEffect(() => {
        // Initialize from store
        const savedRecords = ropaStore.getRecords();
        if (savedRecords.length === 0) {
            // Load mocks if first time
            setRecords(mockOwnerRecords);
            ropaStore.saveRecords(mockOwnerRecords);
        } else {
            setRecords(savedRecords);
        }

        const savedProcessorRecords = ropaStore.getProcessorRecords();
        if (savedProcessorRecords.length === 0) {
            setProcessorRecords(mockProcessorRecords);
            ropaStore.saveProcessorRecords(mockProcessorRecords);
        } else {
            setProcessorRecords(savedProcessorRecords);
        }
    }, []);

    const refresh = () => {
        setRecords(ropaStore.getRecords());
        setProcessorRecords(ropaStore.getProcessorRecords());
    };

    const stats = {
        total: records.length,
        withProcessor: records.filter(r => r.assignedProcessor).length
    };

    // ─── Data Owner Handlers ──────────────────────────────────────────────────
    const saveRecord = (record: Partial<OwnerRecord>): OwnerRecord => {
        const current = ropaStore.getRecords();
        const index = current.findIndex(r => r.id === record.id);
        
        let saved: OwnerRecord;
        let updated: OwnerRecord[];
        const now = new Date().toLocaleString("th-TH");
        
        if (index > -1) {
            updated = [...current];
            saved = { ...updated[index], ...record, updatedDate: now, lastUpdated: now } as OwnerRecord;
            updated[index] = saved;
        } else {
            saved = {
                ...record,
                id: record.id || generateId(),
                dateCreated: now,
                updatedDate: now,
                lastUpdated: now,
                status: record.status || RopaStatus.Draft,
                workflow: record.workflow || "processing"
            } as OwnerRecord;
            updated = [saved, ...current];
        }
        
        ropaStore.saveRecords(updated);
        setRecords(updated);
        return saved;
    };

    const getById = (id: string) => {
        return records.find(r => r.id === id);
    };

    const assignProcessor = (recordId: string, processorName: string, documentTitle: string) => {
        const record = getById(recordId);
        if (!record) return;

        // 1. Update Owner Record
        const updatedRecord = {
            ...record,
            status: RopaStatus.Processing,
            documentName: documentTitle, // DO is source of truth
            assignedProcessor: {
                name: processorName,
                assignedDate: new Date().toLocaleDateString("th-TH"),
                documentTitle: documentTitle,
                processorStatus: "รอดำเนินการ"
            } as any
        };
        saveRecord(updatedRecord);

        // 2. Sync to Processor Records (the "separate but linked" part)
        const currentPr = ropaStore.getProcessorRecords();
        const existingPrIndex = currentPr.findIndex(p => p.id === recordId);
        
        let updatedPrList;
        if (existingPrIndex > -1) {
            updatedPrList = [...currentPr];
            updatedPrList[existingPrIndex] = {
                ...updatedPrList[existingPrIndex],
                documentName: documentTitle,
                processorName: processorName,
                status: RopaStatus.Draft // Still draft for the processor to start
            };
        } else {
            const newPr: RopaProcessorRecord = {
                id: recordId, // Share ID for linking
                documentName: documentTitle,
                processorName: processorName,
                status: RopaStatus.Draft,
                // Initialize empty fields for DP to fill
                title: "", firstName: "", lastName: "", address: "", email: "", phoneNumber: "",
                controllerName: "", processingActivity: "", purpose: "", personalData: "",
                // ... rest will be populated by DP form ...
            } as any;
            updatedPrList = [newPr, ...currentPr];
        }

        ropaStore.saveProcessorRecords(updatedPrList);
        setProcessorRecords(updatedPrList);
    };

    const submitDoSection = (id: string) => {
        const record = getById(id);
        if (record) {
            saveRecord({ 
                ...record, 
                processingStatus: { ...record.processingStatus, doStatus: "done" } as any
            });
        }
    };

    const sendToDpo = (id: string) => {
        const record = getById(id);
        if (record) {
            saveRecord({ ...record, workflow: "sent_dpo", status: RopaStatus.ReviewPending });
        }
    };

    const saveRiskAssessment = (id: string, risk: any) => {
        const record = getById(id);
        if (record) {
            saveRecord({ ...record, riskAssessment: risk });
        }
    };

    const requestDelete = (id: string) => {
        const record = getById(id);
        if (record) {
            saveRecord({ ...record, workflow: "sent_dpo", status: RopaStatus.DeletePending });
        }
    };

    const deleteRecord = (id: string) => {
        const updated = records.filter(r => r.id !== id);
        ropaStore.saveRecords(updated);
        setRecords(updated);
    };

    // ─── Data Processor Handlers ──────────────────────────────────────────────
    const saveProcessorRecord = (record: Partial<RopaProcessorRecord>): RopaProcessorRecord => {
        const current = ropaStore.getProcessorRecords();
        const index = current.findIndex(r => r.id === record.id);
        
        let saved: RopaProcessorRecord;
        let updated: RopaProcessorRecord[];
        const now = new Date().toLocaleString("th-TH");
        
        if (index > -1) {
            updated = [...current];
            saved = { ...updated[index], ...record, lastUpdated: now, updatedDate: now } as RopaProcessorRecord;
            updated[index] = saved;
        } else {
            saved = {
                ...record,
                id: record.id || generateId(),
                ropaId: record.ropaId || record.id || generateId(),
                status: record.status || RopaStatus.Draft,
                updatedDate: now,
                lastUpdated: now
            } as RopaProcessorRecord;
            updated = [saved, ...current];
        }
        
        ropaStore.saveProcessorRecords(updated);
        setProcessorRecords(updated);
        return saved;
    };

    const getProcessorById = (id: string) => {
        return processorRecords.find(r => r.id === id);
    };

    const submitDpSection = (id: string) => {
        // 1. Update the companion record status if it exists
        const dr = processorRecords.find(p => p.id === id);
        if (dr) {
            saveProcessorRecord({ ...dr, status: RopaStatus.ReviewPending });
        }

        // 2. Update the main Owner record status
        const mainRecord = records.find(r => r.id === id);
        if (mainRecord) {
            const updatedMain = {
                ...mainRecord,
                processingStatus: { ...mainRecord.processingStatus, dpStatus: "done" } as any,
                assignedProcessor: { ...mainRecord.assignedProcessor, processorStatus: "เสร็จสมบูรณ์" } as any
            };
            saveRecord(updatedMain);
        }
    };

    const deleteProcessorRecord = (id: string) => {
        const updated = processorRecords.filter(r => r.id !== id);
        ropaStore.saveProcessorRecords(updated);
        setProcessorRecords(updated);
    };

    return (
        <RopaContext.Provider value={{
            records,
            processorRecords,
            saveRecord,
            getById,
            submitDoSection,
            sendToDpo,
            saveRiskAssessment,
            deleteRecord,
            assignProcessor,
            saveProcessorRecord,
            getProcessorById,
            submitDpSection,
            deleteProcessorRecord,
            requestDelete,
            refresh,
            stats
        }}>
            {children}
        </RopaContext.Provider>
    );
}

// Named export for useRopa hook
export function useRopa() {
    const context = useContext(RopaContext);
    if (!context) {
        throw new Error("useRopa must be used within a RopaProvider");
    }
    return context;
}

// Default export for RopaProvider as a fallback for some transpilers
export default RopaProvider;
