import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    themeColor?: string;
};

export default function Checkbox({ label, themeColor = "#ED393C", ...props }: Props) {
    return (
        <label className={cn(
            "flex items-center gap-3 cursor-pointer group select-none",
            props.disabled && "opacity-100 cursor-not-allowed pointer-events-none"
        )}>
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    {...props}
                    className="peer appearance-none h-5 w-5 border border-[#CEC4C2] rounded-md focus:ring-4 checked:bg-white transition-all cursor-pointer bg-white shadow-sm disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                    style={{ 
                        borderColor: props.checked ? themeColor : "#CEC4C2",
                        // @ts-ignore
                        "--tw-ring-color": `${themeColor}1A` 
                    }}
                />
                <svg
                    className="absolute h-3 w-3 pointer-events-none stroke-[4px] opacity-0 peer-checked:opacity-100 transition-opacity"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={themeColor}
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