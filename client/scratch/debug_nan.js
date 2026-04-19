
const dateStr = "2026-04-19";
const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:, (\d{2}):(\d{2}))?$/);
const parts = isoMatch.map(Number); 
console.log("Parts:", parts);
const [, y, m, d, h, min] = parts;
console.log(`y=${y}, m=${m}, d=${d}, h=${h}, min=${min}`);

if (h !== undefined && min !== undefined) {
    console.log("Entering time block");
    const result = new Date(y, m - 1, d, h, min);
    console.log("Result:", result.toString());
    console.log("Time:", result.getTime());
}
