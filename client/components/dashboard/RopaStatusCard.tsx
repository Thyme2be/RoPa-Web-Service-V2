import DonutChart, { DonutData } from "@/components/ui/DonutChart";

interface RopaStatusCardProps {
    data: DonutData[];
}

export default function RopaStatusCard({ data }: RopaStatusCardProps) {
    return (
        <div className="bg-white rounded-[48px] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F6F3F2]">
            <div className="flex flex-col mb-12">
                <h2 className="text-[20px] font-black text-[#1B1C1C] tracking-tight mb-1">
                    สถานะเอกสาร ROPA
                </h2>
                <p className="text-[15px] text-neutral-400 font-bold uppercase tracking-wider">
                    แบ่งตามสถานะการดำเนินงานปัจจุบัน
                </p>
            </div>

            <div className="flex items-center justify-center gap-24">
                <DonutChart
                    data={data}
                    totalLabel={"จำนวนเอกสาร\nทั้งหมด"}
                    size={260}
                    strokeWidth={35}
                />

                <div className="grid grid-cols-1 gap-y-6">
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between w-[280px] group"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[17px] font-bold text-[#1B1C1C] opacity-80 group-hover:opacity-100 transition-opacity">
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="text-[18px] font-black text-[#1B1C1C]">
                                    {item.value.toLocaleString()}
                                </span>
                                <span className="text-[14px] text-neutral-400 font-bold">
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
