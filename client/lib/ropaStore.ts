import { OwnerRecord } from "@/types/dataOwner";
import { RopaProcessorRecord } from "@/types/dataProcessor";

const OWNER_KEY = "ropa_records_v1";
const PROCESSOR_KEY = "ropa_processor_records_v1";

export const ropaStore = {
    // ─── Owner Records ────────────────────────────────────────────────────────
    getRecords: (): OwnerRecord[] => {
        if (typeof window === "undefined") return [];
        const saved = localStorage.getItem(OWNER_KEY);
        if (!saved) return [];
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse OwnerRecords", e);
            return [];
        }
    },

    saveRecords: (records: OwnerRecord[]) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(OWNER_KEY, JSON.stringify(records));
    },

    getById: (id: string): OwnerRecord | undefined => {
        return ropaStore.getRecords().find(r => r.id === id);
    },

    // ─── Processor Records ────────────────────────────────────────────────────
    getProcessorRecords: (): RopaProcessorRecord[] => {
        if (typeof window === "undefined") return [];
        const saved = localStorage.getItem(PROCESSOR_KEY);
        if (!saved) return [];
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse ProcessorRecords", e);
            return [];
        }
    },

    saveProcessorRecords: (records: RopaProcessorRecord[]) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(PROCESSOR_KEY, JSON.stringify(records));
    },

    getProcessorById: (id: string): RopaProcessorRecord | undefined => {
        return ropaStore.getProcessorRecords().find(r => r.id === id);
    }
};
