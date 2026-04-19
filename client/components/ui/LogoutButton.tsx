"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton() {
    const { logout } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-logout-gradient p-2 rounded-2xl shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95 duration-200 text-white disabled:opacity-50 cursor-pointer"
        >
            <span className="material-symbols-outlined font-bold">logout</span>
            <span className="text-[16px] font-bold tracking-tight text-white">
                {isLoading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </span>
        </button>
    );
}