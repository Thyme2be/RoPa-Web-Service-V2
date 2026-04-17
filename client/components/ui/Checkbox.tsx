import React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

export default function Checkbox({ label, ...props }: Props) {
    return (
        <label className={cn(
            "flex items-center gap-3 cursor-pointer group select-none",
            props.disabled && "opacity-100 cursor-not-allowed pointer-events-none"
        )}>
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    {...props}
                    className="peer appearance-none h-5 w-5 border border-[#CEC4C2] rounded-md focus:ring-4 focus:ring-primary/10 checked:bg-white checked:border-primary transition-all cursor-pointer bg-white shadow-sm disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
                <svg
                    className="absolute h-3 w-3 text-primary pointer-events-none stroke-[4px] opacity-0 peer-checked:opacity-100 transition-opacity"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <span className="text-[13px] font-medium text-black leading-tight group-hover:text-on-surface transition-colors">
                {label}
            </span>
        </label>
    );
}