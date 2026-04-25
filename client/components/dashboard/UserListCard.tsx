"use client";

import React, { useState } from "react";

interface UserListCardProps {
    data: any;
}

export default function UserListCard({ data }: UserListCardProps) {
    const [activeTab, setActiveTab] = useState("คนในบริษัท");

    const itemsToDisplay = data.hasTabs ? data.tabData[activeTab] : data.items;

    // Calculate total dynamically if tabs exist, otherwise use data.total
    const currentTotal = data.hasTabs
        ? itemsToDisplay.reduce((sum: number, item: any) => sum + item.count, 0)
        : data.total;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col h-full min-h-[400px]">
            {/* Header Series */}
            <div className="flex flex-col mb-6 space-y-3">
                {/* Title Row */}
                <div className="flex justify-between items-start gap-4">
                    <h4 className="text-[17px] font-bold text-neutral-900 leading-snug">{data.title}</h4>

                    <div className="flex items-center gap-2 shrink-0">
                        {data.hasTabs && (
                            <div className="flex gap-2 mr-1">
                                <button
                                    onClick={() => setActiveTab("คนในบริษัท")}
                                    className={`h-7 px-3 text-[12px] font-bold transition-all rounded-md border cursor-pointer ${activeTab === "คนในบริษัท"
                                        ? "bg-[#ED393C] text-white border-[#ED393C] shadow-sm"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}
                                >
                                    คนในบริษัท
                                </button>
                                <button
                                    onClick={() => setActiveTab("คนนอกบริษัท")}
                                    className={`h-7 px-3 text-[12px] font-bold transition-all rounded-md border cursor-pointer ${activeTab === "คนนอกบริษัท"
                                        ? "bg-[#ED393C] text-white border-[#ED393C] shadow-sm"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"}`}
                                >
                                    คนนอกบริษัท
                                </button>
                            </div>
                        )}
                        <div className="px-3 py-1 bg-surface-container rounded-md border border-neutral-200 shadow-sm min-w-[60px] text-center">
                            <span className="text-sm font-bold text-neutral-700">{currentTotal} คน</span>
                        </div>
                    </div>
                </div>

                {/* Subtitle Row */}
                <div>
                    <p className="text-sm text-[#5C403D] font-medium">
                        {data.hasTabs && activeTab === "คนนอกบริษัท" ? "แบ่งตามบริษัท" : data.subtitle}
                    </p>
                </div>
            </div>

            {/* List Array */}
            <div className="flex-1 flex flex-col gap-2">
                {itemsToDisplay.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors shadow-sm bg-white">
                        <span className="text-[14px] font-bold text-neutral-800">{item.name}</span>
                        <span className="text-[14px] font-medium text-neutral-500">{item.count} คน</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
