export type CsvPrimitive = string | number | boolean | null | undefined;

/**
 * Wandelt Header + Datenzeilen in einen CSV-String um.
 * - Separator: Komma (,)
 * - Encoding: UTF-8 mit BOM (für Excel)
 */
export function toCsv(headers: string[], rows: CsvPrimitive[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");

  const lines = rows.map((row) =>
    row.map(escapeCsvValue).join(",")
  );

  const csvBody = [headerLine, ...lines].join("\n");

  // UTF-8 BOM für Excel-Kompatibilität
  return "\uFEFF" + csvBody;
}

function escapeCsvValue(value: CsvPrimitive): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Doppelte Anführungszeichen escapen
  if (str.includes('"')) {
    str = str.replace(/"/g, '""');
  }

  // Wenn Komma, Anführungszeichen oder Zeilenumbruch enthalten sind → in Anführungszeichen wrappen
  if (/[",\r\n]/.test(str)) {
    str = `"${str}"`;
  }

  return str;
}
