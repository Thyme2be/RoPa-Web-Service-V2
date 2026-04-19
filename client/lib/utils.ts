export function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

export function parseDateStr(dateStr: string | undefined | null): number {
    if (!dateStr || dateStr === "-") return 0;
    
    // 1. Strictly parse "DD/MM/YYYY" or "DD/MM/YYYY, HH:mm"
    try {
        const [datePart, timePart] = dateStr.split(", ");
        const sections = datePart.split(/[\/\-]/); // Support both / and -
        if (sections.length !== 3) {
            // Check if it's already an ISO string from a date input (YYYY-MM-DD)
            const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (isoMatch) {
                const [, y, m, d] = isoMatch.map(Number);
                return new Date(y, m - 1, d).getTime();
            }
            return 0;
        }
        
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
