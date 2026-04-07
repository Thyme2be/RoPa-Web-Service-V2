"use client";

import React from "react";

export default function CompleteButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-xl font-black text-[16px] shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all"
        >
            เสร็จสิ้น
        </button>
    );
}
