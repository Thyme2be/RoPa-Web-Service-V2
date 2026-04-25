"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ExecutiveDashboardResponse, RiskByDepartment } from "@/types/executive";
import { executiveService } from "@/services/executiveService";
import { useAuth } from "./AuthContext";
import { withToast } from "@/lib/toastHelper";

interface ExecutiveContextType {
    executiveDashboardData: ExecutiveDashboardResponse | null;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    currentPeriod: string;
    setCurrentPeriod: (p: string) => void;
    refresh: (period?: string) => Promise<void>;
    fetchExecutiveData: (period?: string, department?: string) => Promise<void>;
    getExecutiveStats: (dept?: string) => {
        total: number;
        draft: number;
        pending: number;
        underReview: number;
        approved: number;
        risk: { low: number; medium: number; high: number };
    };
}

const ExecutiveContext = createContext<ExecutiveContextType | undefined>(undefined);

export function ExecutiveProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [executiveDashboardData, setExecutiveDashboardData] = useState<ExecutiveDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState("all");

    const clearError = useCallback(() => setError(null), []);

    const fetchExecutiveData = useCallback(async (period: string = "all", department?: string) => {
        if (!isAuthenticated || user?.role !== "EXECUTIVE") return;
        setIsLoading(true);
        setError(null);
        setCurrentPeriod(period);
        try {
            const data = await executiveService.getExecutiveDashboard(period, department);
            setExecutiveDashboardData(data);
        } catch (error: any) {
            console.error("Failed to fetch executive data:", error);
            setError(error.response?.data?.detail || "ไม่สามารถโหลดข้อมูลสถิติผู้บริหารได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    const refresh = useCallback(async (period?: string) => {
        if (!isAuthenticated || user?.role !== "EXECUTIVE") return;
        const targetPeriod = period || currentPeriod;
        await fetchExecutiveData(targetPeriod);
    }, [isAuthenticated, user, currentPeriod, fetchExecutiveData]);

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
            error,
            clearError,
            fetchExecutiveData,
            getExecutiveStats,
            refresh,
            currentPeriod,
            setCurrentPeriod
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
