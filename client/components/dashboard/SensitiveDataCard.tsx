interface SensitiveItem {
    dept: string;
    count: number;
}

interface SensitiveDataCardProps {
    items: SensitiveItem[];
    totalCount: number;
}

export default function SensitiveDataCard({
    items,
    totalCount,
}: SensitiveDataCardProps) {
    return (
        <div className="bg-white rounded-[48px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F6F3F2] border-b-[8px] border-b-[#9747FF] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="p-3 bg-[#9747FF]/10 rounded-[20px]">
                    <span className="material-symbols-outlined text-[#9747FF] text-[28px]">
                        visibility_off
                    </span>
                </div>
                <span className="text-[14px] font-black text-[#71717A] uppercase tracking-widest">
                    เอกสารประเภทข้อมูลอ่อนไหว
                </span>
            </div>

            {/* List */}
            <div className="space-y-3 flex-1">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="bg-[#F8F9FA] rounded-[20px] px-6 py-4 flex justify-between items-center group hover:bg-[#9747FF]/5 transition-all cursor-pointer"
                    >
                        <span className="text-[15px] font-bold text-[#1B1C1C] group-hover:text-[#9747FF] transition-colors">
                            {item.dept}
                        </span>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[16px] font-black text-[#1B1C1C]">
                                {item.count}
                            </span>
                            <span className="text-[13px] text-neutral-400 font-bold uppercase">
                                ฉบับ
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Total */}
            <div className="mt-8 pt-6 border-t border-dashed border-neutral-200 flex justify-between items-center">
                <span className="text-[16px] font-black text-[#1B1C1C]">
                    รวมเอกสารข้อมูลอ่อนไหวทั้งหมด
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-[22px] font-black text-[#9747FF]">
                        {totalCount}
                    </span>
                    <span className="text-[14px] text-neutral-400 font-bold uppercase">
                        ฉบับ
                    </span>
                </div>
            </div>
        </div>
    );
}
