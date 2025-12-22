import React from "react";

export const extractCodeString = (node: any): any => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractCodeString).join("");
    if (React.isValidElement(node))
        return extractCodeString((node.props as any).children);
    if (typeof node === "object" && node !== null && "props" in node)
        return extractCodeString(node.props.children);
    if (node == null) return "";
    return String(node);
};

export function parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < csv.length; ++i) {
        const char = csv[i];
        const next = csv[i + 1];

        if (char === '"' && insideQuotes && next === '"') {
            value += '"';
            ++i; // skip next quote
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            row.push(value);
            value = "";
        } else if ((char === "\n" || char === "\r") && !insideQuotes) {
            if (value || row.length) row.push(value);
            if (row.length) rows.push(row);
            row = [];
            value = "";
            if (char === "\r" && next === "\n") ++i;
        } else {
            value += char;
        }
    }
    if (value || row.length) {
        row.push(value);
        rows.push(row);
    }
    return rows.filter((r) => r.length > 1 || r[0] !== "");
}
