"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        // ลบ token ออกจาก localStorage
        localStorage.removeItem("token");
        // ย้ายหน้าไปยัง login ทันที
        router.push("/login");
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-3 bg-logout-gradient p-2 rounded-2xl shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95 duration-200 text-white"
        >
            <span className="material-symbols-outlined font-bold">logout</span>
            <span className="text-[16px] font-bold tracking-tight text-white">
                ออกจากระบบ
            </span>
        </button>
    );
}
