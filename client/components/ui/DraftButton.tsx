"use client";

export default function DraftButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-8 py-2.5 bg-background text-[#5C403D] font-bold rounded-2xl border-3 border-[#E5E2E1] hover:bg-[#E5E2E1] transition-all text-[14px] tracking-wide cursor-pointer"
        >
            บันทึกฉบับร่าง
        </button>
    );
}
