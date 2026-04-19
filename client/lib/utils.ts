export function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

export function parseDateStr(dateStr: string | undefined | null): number {
    if (!dateStr || dateStr === "-") return 0;
    
    try {
        // 1. Check for ISO format YYYY-MM-DD first (standard for DB/state)
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:, (\d{2}):(\d{2}))?$/);
        if (isoMatch) {
            const y = parseInt(isoMatch[1], 10);
            const m = parseInt(isoMatch[2], 10);
            const d = parseInt(isoMatch[3], 10);
            const hStr = isoMatch[4];
            const minStr = isoMatch[5];

            if (hStr !== undefined && minStr !== undefined) {
                const h = parseInt(hStr, 10);
                const min = parseInt(minStr, 10);
                return new Date(y, m - 1, d, h, min).getTime();
            }
            return new Date(y, m - 1, d).getTime();
        }

        // 2. Parse "DD/MM/YYYY" or "DD/MM/YYYY, HH:mm" (common Thai/UI input)
        const [datePart, timePart] = dateStr.split(", ");
        const sections = datePart.split(/[\/\-]/); // Support both / and -
        
        if (sections.length === 3) {
            const [d, m, yStr] = sections;
            let y = parseInt(yStr, 10);
            
            // Handle Buddhist Era (BE)
            if (y > 2400) y -= 543;
            // Handle 2-digit years
            if (y < 100) y += 2000;
            
            const mIdx = parseInt(m, 10) - 1;
            const day = parseInt(d, 10);

            if (timePart) {
                const [h, min] = timePart.split(":").map(Number);
                return new Date(y, mIdx, day, h, min).getTime();
            }
            return new Date(y, mIdx, day).getTime();
        }
        
        return 0;
    } catch (e) {
        return 0;
    }
}

export function formatDateThai(dateStr: string | undefined | null): string {
    const timestamp = parseDateStr(dateStr);
    if (!timestamp) return "-";
    
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yearBE = d.getFullYear() + 543;
    
    return `${day}/${month}/${yearBE}`;
}
