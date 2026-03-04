export function generateCSV(
    data: Record<string, string | number>[],
    columns: { key: string; label: string }[]
): string {
    const BOM = "\uFEFF"
    const header = columns.map(c => `"${c.label}"`).join(";")
    const rows = data.map(row =>
        columns.map(c => {
            const val = row[c.key]
            if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`
            return val ?? ""
        }).join(";")
    )
    return BOM + [header, ...rows].join("\r\n")
}

export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
