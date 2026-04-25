"use client";

import React from "react";
import Input from "./Input";
import Select from "./Select";

export interface FormField {
    name: string;
    label: string;
    type: "text" | "email" | "select" | "password";
    options?: { label: string; value: string }[];
    placeholder?: string;
    required?: boolean;
    colSpan?: 1 | 2;
}

interface ReusableFormProps {
    fields: FormField[];
    formData: Record<string, string>;
    onChange: (name: string, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    isLoading?: boolean;
}

import Button from "./Button";

export default function ReusableForm({
    fields,
    formData,
    onChange,
    onSubmit,
    submitLabel = "บันทึก",
    cancelLabel = "ยกเลิก",
    onCancel,
    isLoading = false,
}: ReusableFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {/* ... existing fields mapping ... */}
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className={`space-y-1.5 ${field.colSpan === 1 ? "col-span-1" : "col-span-2"}`}
                    >
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider ml-1">
                            {field.label} {field.required && <span className="text-primary">*</span>}
                        </label>
                        {field.type === "select" ? (
                            <div className="relative group">
                                <select
                                    value={formData[field.name] || ""}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                    required={field.required}
                                    className="w-full bg-[#F3F1F0] border-none rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>
                                        {field.placeholder || `เลือก${field.label}`}
                                    </option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none group-hover:text-primary transition-colors">
                                    expand_more
                                </span>
                            </div>
                        ) : (
                            <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.name] || ""}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                required={field.required}
                                className="bg-[#F3F1F0] border-none rounded-xl focus:ring-primary/20 h-11"
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-6">
                {onCancel && (
                    <Button
                        type="button"
                        onClick={onCancel}
                        isLoading={isLoading}
                        variant="ghost"
                        className="flex-1 h-12 rounded-2xl"
                    >
                        {cancelLabel}
                    </Button>
                )}
                <Button
                    type="submit"
                    isLoading={isLoading}
                    variant="primary"
                    className="flex-1 h-12 rounded-2xl"
                    loadingText="กำลังประมวลผล..."
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
