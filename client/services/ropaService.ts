import { api } from "@/lib/api";

export const ropaService = {
    // ─── Executive ───────────────────────────────────────────────────────────
    getExecutiveDashboard: async (period: string = "all", department?: string) => {
        const params = new URLSearchParams({ period });
        if (department) params.append("department", department);
        const response = await api.get(`/dashboard/executive?${params.toString()}`);
        return response.data;
    },

    // ─── Data Owner ──────────────────────────────────────────────────────────
    getOwnerDashboard: async () => {
        const response = await api.get("/owner/dashboard");
        return response.data;
    },

    getOwnerActiveTable: async () => {
        const response = await api.get("/owner/tables/active");
        return response.data;
    },

    getOwnerSentTable: async () => {
        const response = await api.get("/owner/tables/sent-to-dpo");
        return response.data;
    },

    getOwnerApprovedTable: async () => {
        const response = await api.get("/owner/tables/approved");
        return response.data;
    },

    getOwnerDestroyedTable: async () => {
        const response = await api.get("/owner/tables/destroyed");
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

    submitOwnerSection: async (id: string) => {
        const response = await api.post(`/owner/documents/${id}/section/submit`);
        return response.data;
    },

    sendToDpo: async (id: string, payload: { due_date?: string; priority?: string }) => {
        const response = await api.post(`/owner/documents/${id}/send-to-dpo`, payload);
        return response.data;
    },

    createDocument: async (data: { title: string; assigned_processor_id: string; due_date: string; processor_company: string; description?: string }) => {
        const response = await api.post("/owner/documents", data);
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

    // ─── Data Processor ──────────────────────────────────────────────────────
    getProcessorAssignedTable: async () => {
        const response = await api.get("/processor/tables/assigned");
        return response.data;
    },

    getProcessorDraftsTable: async () => {
        const response = await api.get("/processor/tables/drafts");
        return response.data;
    },

    getProcessorDocuments: async () => {
        // Compatibility for RopaContext
        const assigned = await ropaService.getProcessorAssignedTable();
        return { active: assigned };
    },

    getProcessorSection: async (documentId: string) => {
        const response = await api.get(`/processor/documents/${documentId}/section`);
        return response.data;
    },

    saveProcessorDraft: async (documentId: string, data: any) => {
        const response = await api.patch(`/processor/documents/${documentId}/section`, data);
        return response.data;
    },

    submitProcessorSection: async (documentId: string, data: any) => {
        const response = await api.post(`/processor/documents/${documentId}/section/submit`, data);
        return response.data;
    }
};
