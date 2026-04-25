import { api } from "@/lib/api";
import { ExecutiveDashboardResponse } from "@/types/executive";

export const executiveService = {
    getExecutiveDashboard: async (period: string = "all", department?: string): Promise<ExecutiveDashboardResponse> => {
        const params = new URLSearchParams({ period });
        if (department) params.append("department", department);
        const response = await api.get(`/dashboard/executive?${params.toString()}`);
        return response.data;
    },
};
