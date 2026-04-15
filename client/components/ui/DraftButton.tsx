"use client";

export default function DraftButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-8 h-[52px] bg-white text-[#5C403D] font-black rounded-xl border-2 border-[#E5E2E1] hover:bg-[#F6F3F2] transition-all text-[15px] shadow-sm cursor-pointer active:scale-95"
        >
            บันทึกฉบับร่าง
        </button>
    );
}
