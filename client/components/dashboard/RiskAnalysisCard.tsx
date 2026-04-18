"use client";

import Select from "@/components/ui/Select";
import DonutChart, { DonutData } from "@/components/ui/DonutChart";

interface RiskAnalysisCardProps {
    data: DonutData[];
    totalDocuments: number;
    departments: { label: string; value: string }[];
    selectedDept: string;
    onDeptChange: (dept: string) => void;
}

export default function RiskAnalysisCard({
    data,
    totalDocuments,
    departments,
    selectedDept,
    onDeptChange,
}: RiskAnalysisCardProps) {
    return (
        <div className="bg-white rounded-[48px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F6F3F2] flex flex-col">
            <h3 className="text-[18px] font-black text-[#1B1C1C] tracking-tight leading-snug mb-8">
                ความเสี่ยงของเอกสารทั้งหมด โดยแสดงผลแต่ละแผนก
            </h3>

            {/* Department Selector — uses shared Select UI */}
            <Select
                label="แผนก"
                name="department"
                value={selectedDept}
                options={departments}
                onChange={(e) => onDeptChange(e.target.value)}
                rounding="2xl"
                bgColor="white"
                labelClassName="text-black"
            />

            {/* Chart + Legend */}
            <div className="flex items-center justify-between px-4 mt-10">
                <DonutChart
                    data={data}
                    totalLabel={`จากเอกสารทั้งหมด\n${totalDocuments} ฉบับ`}
                    size={180}
                    strokeWidth={25}
                />
                <div className="space-y-4 shrink-0">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-10">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3.5 h-3.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[14.5px] font-bold text-[#5F5E5E]">
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-black text-[#1B1C1C]">
                                    {item.value}
                                </span>
                                <span className="text-[13px] text-neutral-400 font-bold">
                                    ฉบับ
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
