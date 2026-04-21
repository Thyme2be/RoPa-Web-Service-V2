import { api } from "@/lib/api";
import { 
  OwnerDashboardData, 
  ActiveTableItem, 
  SentToDpoTableItem, 
  ApprovedTableItem, 
  DestroyedTableItem,
  OwnerSnapshotTableItem
} from "@/types/dataOwner";
import { ExecutiveDashboardResponse } from "@/types/executive";
import { UserRead } from "@/types/dataOwner";

export const ropaService = {
    // ─── Executive ───────────────────────────────────────────────────────────
    getExecutiveDashboard: async (period: string = "all", department?: string): Promise<ExecutiveDashboardResponse> => {
        const params = new URLSearchParams({ period });
        if (department) params.append("department", department);
        const response = await api.get(`/dashboard/executive?${params.toString()}`);
        return response.data;
    },

    // ─── Data Owner ──────────────────────────────────────────────────────────
    getOwnerDashboard: async (period: string = "all"): Promise<OwnerDashboardData> => {
        const response = await api.get(`/dashboard/owner?period=${period}`);
        return response.data;
    },

    getOwnerActiveTable: async (): Promise<ActiveTableItem[]> => {
        const response = await api.get("/owner/tables/active");
        return response.data;
    },

    getOwnerSentTable: async (): Promise<SentToDpoTableItem[]> => {
        const response = await api.get("/owner/tables/sent-to-dpo");
        return response.data;
    },

    getOwnerApprovedTable: async (): Promise<ApprovedTableItem[]> => {
        const response = await api.get("/owner/tables/approved");
        return response.data;
    },

    getOwnerDestroyedTable: async (): Promise<DestroyedTableItem[]> => {
        const response = await api.get("/owner/tables/destroyed");
        return response.data;
    },

    getOwnerSnapshots: async (): Promise<OwnerSnapshotTableItem[]> => {
        const response = await api.get("/owner/snapshots");
        return response.data;
    },

    getOwnerSnapshot: async (id: string) => {
        const response = await api.get(`/owner/snapshots/${id}`);
        return response.data;
    },

    deleteOwnerSnapshot: async (id: string) => {
        const response = await api.delete(`/owner/snapshots/${id}`);
        return response.data;
    },

    getOwnerDocumentSection: async (id: string) => {
        const response = await api.get(`/owner/documents/${id}/section`);
        return response.data;
    },

    saveOwnerDraft: async (id: string, data: any) => {
        const response = await api.patch(`/owner/documents/${id}/section`, data);
        return response.data;
    },

    saveOwnerSnapshot: async (id: string, data: any) => {
        const response = await api.post(`/owner/documents/${id}/snapshot`, data);
        return response.data;
    },

    submitOwnerSection: async (id: string) => {
        const response = await api.post(`/owner/documents/${id}/section/submit`);
        return response.data;
    },

    sendToDpo: async (id: string, payload?: { dpo_id?: number }) => {
        // Updated payload to match backend schema (SendToDpoPayload)
        const response = await api.post(`/owner/documents/${id}/send-to-dpo`, payload || {});
        return response.data;
    },

    sendBackToDpo: async (id: string) => {
        const response = await api.post(`/owner/documents/${id}/send-back-to-dpo`);
        return response.data;
    },

    annualReview: async (id: string, payload?: { dpo_id?: number }) => {
        const response = await api.post(`/owner/documents/${id}/annual-review`, payload || {});
        return response.data;
    },

    createDocument: async (data: { 
        title: string; 
        due_date?: string; 
        processor_company?: string; 
        description?: string;
        assigned_processor_id?: number;
    }) => {
        const response = await api.post("/owner/documents", data);
        return response.data;
    },

    getProcessorCompanies: async (): Promise<string[]> => {
        const response = await api.get("/owner/processors/companies");
        // Ensure returning list of strings
        return response.data.companies || [];
    },

    checkProcessorAvailability: async (companyName: string): Promise<{ available: boolean; message?: string }> => {
        const response = await api.get(`/owner/processors/check-availability`, { params: { company_name: companyName } });
        return response.data;
    },
    
    requestDeletion: async (id: string, reason: string) => {
        const response = await api.post(`/owner/documents/${id}/deletion`, { owner_reason: reason });
        return response.data;
    },

    getDeletionRequest: async (id: string) => {
        const response = await api.get(`/owner/documents/${id}/deletion`);
        return response.data;
    },

    updateDoSuggestion: async (id: string, suggestion: string) => {
        const response = await api.patch(`/owner/documents/${id}/processor-section/suggestion`, { suggestion });
        return response.data;
    },

    submitFeedbackBatch: async (id: string, items: { section_number: number; field_name?: string; comment: string }[]) => {
        const response = await api.post(`/owner/documents/${id}/processor-section/feedback`, { items });
        return response.data;
    },

    getOwnerProcessorSection: async (documentId: string) => {
        const response = await api.get(`/owner/documents/${documentId}/processor-section`);
        return response.data;
    },

    // ─── Data Processor ──────────────────────────────────────────────────────
    getProcessorAssignedTable: async () => {
        const response = await api.get("/processor/tables/assigned");
        return response.data;
    },

    getProcessorDraftsTable: async () => {
        const response = await api.get("/processor/tables/drafts");
        return response.data;
    },

    getProcessorSection: async (documentId: string) => {
        const response = await api.get(`/processor/documents/${documentId}/section`);
        return response.data;
    },

    saveProcessorDraft: async (documentId: string, data: any) => {
        const response = await api.patch(`/processor/documents/${documentId}/section`, data);
        return response.data;
    },

    async submitProcessorSection(documentId: string, payload: any) {
        const response = await api.post(`/processor/documents/${documentId}/section/submit`, payload);
        return response.data;
    },

    async dispatchProcessorSection(documentId: string) {
        const response = await api.post(`/processor/documents/${documentId}/section/dispatch`);
        return response.data;
    },

    // ─── Data Processor Snapshots ──────────────────────────────────────────
    getProcessorSnapshots: async (): Promise<any[]> => {
        const response = await api.get("/processor/snapshots");
        return response.data;
    },

    getProcessorSnapshot: async (snapshotId: string) => {
        const response = await api.get(`/processor/snapshots/${snapshotId}`);
        return response.data;
    },

    saveProcessorSnapshot: async (documentId: string, data: any) => {
        const response = await api.post(`/processor/documents/${documentId}/snapshot`, data);
        return response.data;
    },

    deleteProcessorSnapshot: async (snapshotId: string) => {
        const response = await api.delete(`/processor/snapshots/${snapshotId}`);
        return response.data;
    },
};
