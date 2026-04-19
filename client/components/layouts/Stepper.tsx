"use client";

interface Step {
    id: number;
    label: string;
}

const ownerSteps: Step[] = [
    { id: 1, label: "ผู้บันทึก" },
    { id: 2, label: "ช่องทาง" },
    { id: 3, label: "กิจกรรม" },
    { id: 4, label: "ประเภทข้อมูล" },
    { id: 5, label: "การจัดเก็บ" },
    { id: 6, label: "ความยินยอม" },
    { id: 7, label: "มาตรการ" },
];

const processorSteps: Step[] = [
    { id: 1, label: "ผู้บันทึก" },
    { id: 2, label: "กิจกรรม" },
    { id: 3, label: "ประเภทข้อมูล" },
    { id: 4, label: "การจัดเก็บ" },
    { id: 5, label: "ความยินยอม" },
    { id: 6, label: "มาตรการ" },
];

export default function Stepper({ 
    completedSteps = [], 
    variant = "owner" 
}: { 
    completedSteps?: number[];
    variant?: "owner" | "processor";
}) {
    const isProcessor = variant === "processor";
    const steps = isProcessor ? processorSteps : ownerSteps;
    const primaryColorClass = isProcessor ? "bg-[#00666E]" : "bg-primary";
    const shadowColorClass = isProcessor ? "shadow-[#00666E]/20" : "shadow-red-200";
    const textColorClass = isProcessor ? "text-[#00666E]" : "text-primary";

    return (
        <div className="flex items-center justify-between py-12 px-8 mb-4 relative overflow-hidden">
            {/* Background Decorative Line */}
            <div className="absolute top-[70px] left-[10%] right-[10%] h-[1px] bg-[#E5E2E1] -translate-y-1/2"></div>

            <div className="flex justify-between w-full relative z-10 px-10">
                {steps.map((step) => {
                    const isStepComplete = completedSteps.includes(step.id);

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-4 w-28">
                            {/* Step Rounded Square */}
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-3 border-white ${isStepComplete
                                    ? `${primaryColorClass} text-white shadow-lg ${shadowColorClass}`
                                    : "bg-[#E8E8E8] text-[#5C403D]"
                                    }`}
                            >
                                {step.id}
                            </div>

                            {/* Label */}
                            <span
                                className={`text-[13px] font-bold tracking-tight transition-colors text-center leading-tight whitespace-nowrap ${isStepComplete ? textColorClass : "text-[#5C403D]"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
