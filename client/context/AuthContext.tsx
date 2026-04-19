"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { UserRole } from "@/types/enums";

interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    title?: string;
    first_name?: string;
    last_name?: string;
    department?: string;
    company_name?: string;
    auditor_type?: string;
    status?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedRefresh = localStorage.getItem("refreshToken");
        if (savedToken) {
            setToken(savedToken);
            setRefreshToken(savedRefresh);
            loadUser(savedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadUser = async (authToken: string) => {
        try {
            const response = await api.get("/auth/me");
            const userData = response.data;
            setUser(userData);
            // Sync role to cookie for middleware using native document.cookie
            document.cookie = `userRole=${userData.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `token=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}`;

            // Redirect based on role if we are currently on the login page
            if (window.location.pathname === "/login" || window.location.pathname === "/") {
                if (userData.role === "OWNER") {
                    router.push("/data-owner/dashboard");
                } else if (userData.role === "EXECUTIVE") {
                    router.push("/executive/dashboard");
                } else if (userData.role === "PROCESSOR") {
                    router.push("/data-processor/management/processing");
                } else if (userData.role === "ADMIN") {
                    router.push("/admin/dashboard");
                } else if (userData.role === "AUDITOR") {
                    router.push("/auditor/tables");
                } else if (userData.role === "DPO") {
                    router.push("/dpo/dashboard");
                } else {
                    router.push("/data-owner/management");
                }
            }
        } catch (error) {
            console.error("Failed to load user:", error);
            // Final cleanup on failure
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userRole");

            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            setToken(null);
            setRefreshToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newRefresh: string) => {
        setIsLoading(true);
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefresh);
        document.cookie = `token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `refreshToken=${newRefresh}; path=/; max-age=${60 * 60 * 24 * 7}`;
        setToken(newToken);
        setRefreshToken(newRefresh);
        await loadUser(newToken);
    };

    const logout = async () => {
        try {
            if (refreshToken) {
                await api.post("/auth/logout", { refresh_token: refreshToken });
            }
        } catch (error) {
            console.error("Logout API failed (server-side):", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userRole");

            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            setToken(null);
            setRefreshToken(null);
            setUser(null);
            router.push("/login");
        }
    };

    const checkAuth = async () => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
            await loadUser(savedToken);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            refreshToken,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
