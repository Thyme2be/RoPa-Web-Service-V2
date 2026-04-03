"use client";

import React from "react";

export default function LogoutButton() {
    const handleLogout = () => {
        // Add logout logic here (e.g., clear session, redirect)
        console.log("Logging out...");
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
