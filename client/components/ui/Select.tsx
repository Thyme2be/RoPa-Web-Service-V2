type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { label: string; value: string }[];
    required?: boolean;
    containerClassName?: string;
};

export default function Select({ label, options, required, containerClassName, ...props }: Props) {
    return (
        <div className={`space-y-2 ${containerClassName || ""}`}>
            {label && (
                <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}
            <select
                {...props}
                className="w-full h-11 border-none rounded-xl px-4 py-2 text-sm bg-[#F6F3F2] text-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm appearance-none bg-[url('https://api.iconify.design/heroicons:chevron-down-20-solid.svg?color=%23ED393C')] bg-[length:22px_22px] bg-[right_12px_center] bg-no-repeat font-medium"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}