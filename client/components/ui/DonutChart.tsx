/**
 * DonutChart — universal SVG donut chart.
 *
 * Two display modes via `variant` prop:
 *  - "large"  (default) – big chart, multiline center label, used in RopaStatusCard / RiskAnalysisCard
 *  - "card"             – self-contained card with title, legend, and white background,
 *                         replaces the old RiskDonutChart used in the DO dashboard
 */

export interface DonutData {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: DonutData[];
    /** Multiline center label (split on \n). Used in "large" variant. */
    totalLabel?: string;
    centerValue?: string;
    size?: number;
    strokeWidth?: number;
    /** "large" renders only the SVG + center label.
     *  "card" renders a full self-contained card (replaces RiskDonutChart). */
    variant?: "large" | "card";
    /** Card variant only: card title */
    title?: string;
    /** Card variant only: overrides center total count */
    total?: number;
}

function DonutSVG({
    data,
    totalLabel,
    centerValue,
    size,
    strokeWidth,
    total,
}: {
    data: DonutData[];
    totalLabel?: string;
    centerValue?: string;
    size: number;
    strokeWidth: number;
    total?: number;
}) {
    const computedTotal = total ?? data.reduce((acc, item) => acc + item.value, 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div
            className="relative flex items-center justify-center shrink-0"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#F6F3F2"
                    strokeWidth={strokeWidth}
                />
                {data.map((item, index) => {
                    const percentage = (item.value / computedTotal) * 100;
                    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
                    const offset = accumulatedOffset;
                    accumulatedOffset += (percentage / 100) * circumference;
                    return (
                        <circle
                            key={index}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                            className="transition-all duration-500 ease-in-out"
                        />
                    );
                })}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                {totalLabel ? (
                    <div className="text-[13px] font-black text-[#1B1C1C] leading-tight flex flex-col items-center">
                        {totalLabel.split("\n").map((line, i) => (
                            <span key={i}>{line}</span>
                        ))}
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-bold text-[#5F5E5E] leading-tight">
                            จากเอกสารทั้งหมด
                        </p>
                        <p className="text-xl font-black text-[#1B1C1C] tracking-tighter">
                            {computedTotal} ฉบับ
                        </p>
                    </>
                )}
                {centerValue && (
                    <span className="text-[11px] font-bold text-neutral-400 mt-1">
                        {centerValue}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function DonutChart({
    data,
    totalLabel,
    centerValue,
    size = 200,
    strokeWidth = 25,
    variant = "large",
    title,
    total,
}: DonutChartProps) {
    if (variant === "card") {
        const cardSize = 180;
        const cardStroke = 25;
        return (
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E2E1]/50 p-8 h-full flex flex-col items-center">
                {title && (
                    <div className="w-full text-left mb-6">
                        <h3 className="text-base font-black text-[#1B1C1C] tracking-tight">
                            {title}
                        </h3>
                    </div>
                )}
                <div className="mb-8">
                    <DonutSVG
                        data={data}
                        size={cardSize}
                        strokeWidth={cardStroke}
                        total={total}
                    />
                </div>
                <div className="w-full grid grid-cols-1 gap-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs font-bold text-[#5F5E5E]">
                                    {item.label}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-[#1B1C1C] tracking-tight">
                                {item.value} ฉบับ
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default: "large" variant — just the SVG + center
    return (
        <DonutSVG
            data={data}
            totalLabel={totalLabel}
            centerValue={centerValue}
            size={size}
            strokeWidth={strokeWidth}
            total={total}
        />
    );
}
