"use client";

import React from "react";

export default function CompleteButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-10 py-2.5 bg-logout-gradient text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all text-[14px] tracking-wide"
        >
            เสร็จสิ้น
        </button>
    );
}
