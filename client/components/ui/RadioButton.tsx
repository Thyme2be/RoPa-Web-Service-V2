import React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    alignRight?: boolean;
};

export default function RadioButton({ label, alignRight, ...props }: Props) {
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        if (props.checked && props.onChange) {
            e.preventDefault(); // Stop native radio selection
            const event = {
                target: {
                    name: props.name,
                    value: "",
                    type: "radio",
                    checked: false
                }
            } as any;
            props.onChange(event);
        }
    };

    return (
        <label className={cn(
            "flex items-center gap-3 cursor-pointer group select-none py-3 px-4 bg-[#F6F3F2] border border-gray-100 rounded-xl transition-all hover:bg-white hover:border-primary/30 shadow-sm has-[:checked]:bg-white has-[:checked]:border-primary has-[:checked]:ring-4 has-[:checked]:ring-primary/5",
            alignRight ? "flex-row-reverse justify-between" : "",
            props.disabled && "opacity-100 cursor-not-allowed pointer-events-none"
        )}>
            <span className={cn(
                "text-sm font-semibold text-black leading-tight group-hover:text-primary transition-colors peer-checked:text-black",
                alignRight ? "peer-checked:text-black" : "peer-checked:text-black"
            )}>
                {label}
            </span>
            <div className="relative flex items-center justify-center w-5 h-5">
                <input
                    type="radio"
                    {...props}
                    onClick={handleClick}
                    className="peer appearance-none h-5 w-5 border border-gray-300 rounded-full checked:border-primary checked:border-[6px] transition-all cursor-pointer bg-white disabled:bg-gray-100"
                />
            </div>
        </label>
    );
}
