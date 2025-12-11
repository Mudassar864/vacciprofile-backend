// Lightweight CSV helper without extra dependencies.
// Converts an array of plain objects to CSV and sends it with proper headers.
const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  // Escape quotes and wrap when needed
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";

  // Build header set across all rows
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const lines = [];
  lines.push(headers.join(","));

  for (const row of rows) {
    const line = headers
      .map((h) => escapeCsv(row?.[h]))
      .join(",");
    lines.push(line);
  }

  return lines.join("\n");
};

const sendCsv = (res, filename, rows) => {
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`
  );
  res.status(200).send(csv);
};

module.exports = { toCsv, sendCsv };



