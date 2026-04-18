"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const [isLoading, setIsLoading] = React.useState(false);
    const API_BASE_URL = "https://ropa-web-service-v2.onrender.com";

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            // Always clear storage and redirect even if API fails
            localStorage.removeItem("token");
            router.push("/login");
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
