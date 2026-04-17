/**
 * ropaStore.ts
 * 
 * localStorage-backed CRUD store for OwnerRecord[].
 * All functions are designed to be easily swapped for API calls:
 *   getRecords()     → fetch('/api/ropa').then(r => r.json())
 *   saveRecord(r)    → fetch('/api/ropa', { method: 'POST', body: JSON.stringify(r) })
 *   deleteRecord(id) → fetch(`/api/ropa/${id}`, { method: 'DELETE' })
 */

import { OwnerRecord } from "@/types/dataOwner";
import { RopaStatus } from "@/types/enums";
import { mockOwnerRecords } from "@/lib/mockRecords";

const STORAGE_KEY = "ropa_owner_records_v4";

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
    const existing = getRecords();
    const numbers = existing
        .map(r => parseInt(r.id.split("-").pop() || "0", 10))
        .filter(n => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = String(max + 1).padStart(4, "0");
    const year = new Date().getFullYear();
    return `ROPA-${year}-${next}`;
}

function formatDate(): string {
    const now = new Date();
    return now.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).replace(",", ",");
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function getRecords(): OwnerRecord[] {
    if (typeof window === "undefined") return mockOwnerRecords;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // Robust check for empty or malformed storage
        if (!raw || raw.trim() === "") {
            // Seed with mock data on first load
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOwnerRecords));
            return mockOwnerRecords;
        }
        return JSON.parse(raw) as OwnerRecord[];
    } catch (e) {
        console.error("Failed to parse JSON from localStorage", e);
        return mockOwnerRecords;
    }
}

export function getRecordById(id: string): OwnerRecord | undefined {
    return getRecords().find(r => r.id === id);
}

export function getByStatus(status: RopaStatus): OwnerRecord[] {
    return getRecords().filter(r => r.status === status);
}

// ─── Write ───────────────────────────────────────────────────────────────────

export function saveRecord(record: Partial<OwnerRecord>): OwnerRecord {
    const records = getRecords();
    const now = formatDate();

    if (record.id) {
        // Update existing
        const idx = records.findIndex(r => r.id === record.id);
        if (idx !== -1) {
            const updated = { ...records[idx], ...record, updatedDate: now };
            records[idx] = updated as OwnerRecord;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            return updated as OwnerRecord;
        }
    }

    // Create new
    const newRecord: OwnerRecord = {
        ...(record as OwnerRecord),
        id: generateId(),
        dateCreated: now,
        updatedDate: now,
        status: record.status ?? RopaStatus.Draft,
    };
    records.unshift(newRecord); // Add to top of list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return newRecord;
}

export function deleteRecord(id: string): void {
    const records = getRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function updateStatus(id: string, status: RopaStatus): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
        records[idx].status = status;
        records[idx].updatedDate = formatDate();
        if (status === RopaStatus.Submitted) {
            records[idx].submittedDate = formatDate();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}

export function assignProcessor(
    recordId: string,
    processorName: string,
    documentTitle: string
): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx !== -1) {
        records[idx].assignedProcessor = {
            name: processorName,
            assignedDate: formatDate(),
            documentTitle,
            processorStatus: "รอดำเนินการ",
        };
        records[idx].updatedDate = formatDate();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}

export function resetToMockData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOwnerRecords));
}

// ─── Workflow Functions ───────────────────────────────────────────────────────

/** DO กดบันทึก — เปลี่ยน doStatus เป็น done */
export function submitDoSection(id: string): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
        records[idx].processingStatus = {
            ...(records[idx].processingStatus ?? { doStatus: "pending", dpStatus: "pending" }),
            doStatus: "done",
            doSubmittedDate: formatDate(),
        };
        records[idx].status = RopaStatus.Processing;
        records[idx].workflow = "processing";
        records[idx].updatedDate = formatDate();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}

/** ส่งเอกสารให้ DPO ตรวจสอบ */
export function sendToDpo(id: string): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
        records[idx].status = RopaStatus.ReviewPending;
        records[idx].workflow = "sent_dpo";
        records[idx].updatedDate = formatDate();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}

/** ส่งคำขอลบให้ DPO */
export function requestDelete(id: string): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
        records[idx].status = RopaStatus.DeletePending;
        records[idx].workflow = "delete_pending";
        records[idx].updatedDate = formatDate();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}

/** บันทึกการประเมินความเสี่ยง */
export function saveRiskAssessment(id: string, probability: number, impact: number): void {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
        const total = probability * impact;
        const level = total <= 6 ? "ต่ำ" : total <= 14 ? "ปานกลาง" : "สูง";
        records[idx].riskAssessment = {
            probability,
            impact,
            total,
            level,
            submittedDate: formatDate(),
        };
        records[idx].updatedDate = formatDate();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
}
