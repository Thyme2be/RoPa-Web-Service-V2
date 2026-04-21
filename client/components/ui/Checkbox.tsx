import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    themeColor?: string;
};

export default function Checkbox({ label, themeColor = "#ED393C", ...props }: Props) {
    const { checked, ...rest } = props;
    const isChecked = !!checked;

    return (
        <label className={cn(
            "flex items-center gap-3 cursor-pointer group select-none transition-all",
            props.disabled && "opacity-80 cursor-not-allowed pointer-events-none"
        )}>
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={isChecked}
                    {...rest}
                    className={cn(
                        "peer appearance-none h-5 w-5 border rounded-md transition-all cursor-pointer shadow-sm disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-50",
                        isChecked ? "bg-red-500 border-red-500" : "bg-white border-[#9CA3AF] hover:border-[#CEC4C2]"
                    )}
                    style={isChecked ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                />
                <svg
                    className={cn(
                        "absolute h-3.5 w-3.5 pointer-events-none stroke-[4px] opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100",
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            {label && (
                <span className={cn(
                    "text-[13px] font-bold transition-colors tracking-tight",
                    props.checked ? "text-[#1B1C1C]" : "text-[#5C403D]",
                    props.disabled && "text-gray-400 font-medium"
                )}>
                    {label}
                </span>
            )}
        </label>
    );
}