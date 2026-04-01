type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

export default function Checkbox({ label, ...props }: Props) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    {...props}
                    className="peer appearance-none h-5 w-5 border-none rounded-md focus:ring-4 focus:ring-primary/10 checked:bg-primary transition-all cursor-pointer bg-[#F6F3F2] shadow-sm"
                />
                <svg
                    className="absolute h-3 w-3 text-white pointer-events-none stroke-[4px] opacity-0 peer-checked:opacity-100 transition-opacity"
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