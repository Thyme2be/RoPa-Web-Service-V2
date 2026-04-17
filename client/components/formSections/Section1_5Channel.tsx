"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Section1_5ChannelProps {
    form: any;
    handleChange: (e: any) => void;
    errors: any;
    disabled?: boolean;
}

export default function Section1_5Channel({ form, handleChange, errors, disabled }: Section1_5ChannelProps) {
    return (
        <section className="bg-white rounded-[32px] p-10 shadow-sm border border-[#E5E2E1]/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
                </div>
                <h2 className="text-[24px] font-black text-[#1B1C1C] tracking-tight">ช่องทางที่ได้มาซึ่งข้อมูล</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-[17px] font-bold text-[#5C403D]">แหล่งที่มาของข้อมูล</label>
                    <div className="flex flex-col gap-3">
                        <label className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                            form.dataSource?.direct ? "bg-primary/5 border-primary shadow-sm" : "bg-[#FAFAFA] border-[#E5E2E1] hover:border-primary/30"
                        )}>
                            <input
                                type="checkbox"
                                name="dataSource.direct"
                                checked={!!form.dataSource?.direct}
                                onChange={handleChange}
                                disabled={disabled}
                                className="w-5 h-5 accent-primary"
                            />
                            <span className="font-bold text-[#1B1C1C]">ได้มาโดยตรง (Direct Collection)</span>
                        </label>

                        <label className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                            form.dataSource?.indirect ? "bg-primary/5 border-primary shadow-sm" : "bg-[#FAFAFA] border-[#E5E2E1] hover:border-primary/30"
                        )}>
                            <input
                                type="checkbox"
                                name="dataSource.indirect"
                                checked={!!form.dataSource?.indirect}
                                onChange={handleChange}
                                disabled={disabled}
                                className="w-5 h-5 accent-primary"
                            />
                            <span className="font-bold text-[#1B1C1C]">ได้มาโดยอ้อม (Indirect Collection)</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[17px] font-bold text-[#5C403D]">รายละเอียดช่องทาง</label>
                    <textarea
                        name="channelDetails"
                        value={form.channelDetails || ""}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder="ระบุรายละเอียดช่องทางที่ได้รับข้อมูล..."
                        className="w-full h-32 bg-[#FAFAFA] border border-[#E5E2E1] rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                </div>
            </div>
        </section>
    );
}
