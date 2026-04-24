import { api } from "@/lib/api";

export const processorService = {
    getProcessorAssignedTable: async (page = 1, limit = 3) => {
        const response = await api.get("/processor/tables/assigned", { params: { page, limit } });
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

    submitProcessorSection: async (documentId: string, payload: any) => {
        const response = await api.post(`/processor/documents/${documentId}/section/submit`, payload);
        return response.data;
    },

    dispatchProcessorSection: async (documentId: string) => {
        const response = await api.post(`/processor/documents/${documentId}/section/dispatch`);
        return response.data;
    },

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
