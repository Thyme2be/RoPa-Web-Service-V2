"use client";

const steps = [
    { id: 1, label: "ผู้บันทึก" },
    { id: 2, label: "กิจกรรม" },
    { id: 3, label: "ประเภทข้อมูล" },
    { id: 4, label: "การจัดเก็บ" },
    { id: 5, label: "ความยินยอม" },
    { id: 6, label: "มาตรการ" },
];

export default function Stepper({ completedSteps = [] }: { completedSteps?: number[] }) {
    return (
        <div className="flex items-center justify-between py-12 px-8 mb-4 relative overflow-hidden">
            {/* Background Decorative Line */}
            <div className="absolute top-[70px] left-[10%] right-[10%] h-[1px] bg-[#E5E2E1] -translate-y-1/2"></div>

            <div className="flex justify-between w-full max-w-5xl mx-auto relative z-10">
                {steps.map((step) => {
                    const isStepComplete = completedSteps.includes(step.id);

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-4 w-28">
                            {/* Step Rounded Square */}
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-3 border-white ${isStepComplete
                                    ? "bg-primary text-white shadow-lg shadow-red-200"
                                    : "bg-[#E8E8E8] text-[#5C403D]"
                                    }`}
                            >
                                {isStepComplete ? (
                                    <span className="material-symbols-outlined text-[20px] font-black">check</span>
                                ) : (
                                    step.id
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={`text-[13px] font-bold tracking-tight transition-colors text-center leading-tight whitespace-nowrap ${isStepComplete ? "text-primary" : "text-[#5C403D]"
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
