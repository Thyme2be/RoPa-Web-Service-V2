"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ExecutiveDashboardResponse, RiskByDepartment } from "@/types/executive";
import { executiveService } from "@/services/executiveService";
import { useAuth } from "./AuthContext";
import { withToast } from "@/lib/toastHelper";

interface ExecutiveContextType {
    executiveDashboardData: ExecutiveDashboardResponse | null;
    isLoading: boolean;
    fetchExecutiveData: (period?: string, department?: string) => Promise<void>;
    getExecutiveStats: (dept?: string) => any;
    refresh: () => Promise<void>;
}

const ExecutiveContext = createContext<ExecutiveContextType | undefined>(undefined);

export function ExecutiveProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [executiveDashboardData, setExecutiveDashboardData] = useState<ExecutiveDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchExecutiveData = useCallback(async (period: string = "all", department?: string) => {
        setIsLoading(true);
        try {
            const data = await executiveService.getExecutiveDashboard(period, department);
            setExecutiveDashboardData(data);
        } catch (error) {
            console.error("Failed to fetch executive data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || user?.role !== "EXECUTIVE") return;
        await fetchExecutiveData();
    }, [isAuthenticated, user, fetchExecutiveData]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getExecutiveStats = useCallback((dept?: string) => {
        if (!executiveDashboardData) return {
            total: 0, draft: 0, pending: 0, underReview: 0, approved: 0,
            risk: { low: 0, medium: 0, high: 0 }
        };

        const d = executiveDashboardData;
        const riskByDept = d.risk_by_department || [];

        let low = 0, medium = 0, high = 0;
        if (dept) {
            const risk = riskByDept.find((r: RiskByDepartment) => r.department === dept);
            low = risk?.low || 0;
            medium = risk?.medium || 0;
            high = risk?.high || 0;
        } else {
            riskByDept.forEach((r: RiskByDepartment) => {
                low += r.low || 0;
                medium += r.medium || 0;
                high += r.high || 0;
            });
        }

        return {
            total: d.ropa_status_overview?.total || 0,
            draft: d.ropa_status_overview?.draft || 0,
            pending: d.ropa_status_overview?.pending || 0,
            underReview: d.ropa_status_overview?.under_review || 0,
            approved: d.ropa_status_overview?.completed || 0,
            risk: { low, medium, high }
        };
    }, [executiveDashboardData]);

    return (
        <ExecutiveContext.Provider value={{
            executiveDashboardData,
            isLoading,
            fetchExecutiveData,
            getExecutiveStats,
            refresh
        }}>
            {children}
        </ExecutiveContext.Provider>
    );
}

export const useExecutive = () => {
    const context = useContext(ExecutiveContext);
    if (!context) throw new Error("useExecutive must be used within ExecutiveProvider");
    return context;
};
