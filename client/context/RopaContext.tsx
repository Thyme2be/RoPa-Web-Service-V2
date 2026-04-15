"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { OwnerRecord } from "@/types/dataOwner";
import { RopaStatus } from "@/types/enums";
import {
    getRecords,
    saveRecord as storeSave,
    deleteRecord as storeDelete,
    updateStatus as storeUpdateStatus,
    assignProcessor as storeAssignProcessor,
} from "@/lib/ropaStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RopaContextValue {
    records: OwnerRecord[];
    refresh: () => void;
    saveRecord: (record: Partial<OwnerRecord>) => OwnerRecord;
    deleteRecord: (id: string) => void;
    updateStatus: (id: string, status: RopaStatus) => void;
    assignProcessor: (recordId: string, processorName: string, documentTitle: string) => void;
    getByStatus: (status: RopaStatus) => OwnerRecord[];
    getById: (id: string) => OwnerRecord | undefined;
    // Computed stats
    stats: {
        total: number;
        active: number;
        submitted: number;
        rejected: number;
        draft: number;
        withSuggestions: number;
        withProcessor: number;
    };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const RopaContext = createContext<RopaContextValue | null>(null);

export function RopaProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<OwnerRecord[]>([]);

    const refresh = useCallback(() => {
        setRecords(getRecords());
    }, []);

    // Load on mount
    useEffect(() => {
        refresh();
    }, [refresh]);

    const saveRecord = useCallback((record: Partial<OwnerRecord>): OwnerRecord => {
        const saved = storeSave(record);
        refresh();
        return saved;
    }, [refresh]);

    const deleteRecord = useCallback((id: string) => {
        storeDelete(id);
        refresh();
    }, [refresh]);

    const updateStatus = useCallback((id: string, status: RopaStatus) => {
        storeUpdateStatus(id, status);
        refresh();
    }, [refresh]);

    const assignProcessor = useCallback((recordId: string, processorName: string, documentTitle: string) => {
        storeAssignProcessor(recordId, processorName, documentTitle);
        refresh();
    }, [refresh]);

    const getByStatus = useCallback((status: RopaStatus) => {
        return records.filter(r => r.status === status);
    }, [records]);

    const getById = useCallback((id: string) => {
        return records.find(r => r.id === id);
    }, [records]);

    const stats = {
        total: records.length,
        active: records.filter(r => r.status === RopaStatus.Active).length,
        submitted: records.filter(r => r.status === RopaStatus.Submitted).length,
        rejected: records.filter(r => r.status === RopaStatus.Rejected).length,
        draft: records.filter(r => r.status === RopaStatus.Draft).length,
        withSuggestions: records.filter(r => r.suggestions && r.suggestions.length > 0).length,
        withProcessor: records.filter(r => r.assignedProcessor).length,
    };

    return (
        <RopaContext.Provider value={{
            records,
            refresh,
            saveRecord,
            deleteRecord,
            updateStatus,
            assignProcessor,
            getByStatus,
            getById,
            stats,
        }}>
            {children}
        </RopaContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRopa() {
    const ctx = useContext(RopaContext);
    if (!ctx) throw new Error("useRopa must be used within RopaProvider");
    return ctx;
}
