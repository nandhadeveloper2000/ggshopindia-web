/**
 * Excel (xlsx/xls/csv) import & export for the Models catalog.
 *
 * Export writes one sheet per brand (each tab named after the brand) containing
 * that brand's existing models plus a ready-to-fill row — so the download
 * doubles as a bulk-upload sheet with the old data included. Import reads every
 * sheet and forward-fills Category/Brand down blank rows, so the user only needs
 * to type model names beneath the pre-filled row.
 */

/** One model row as it appears in the workbook (all human-readable names). */
export interface ModelWorkbookRow {
  category: string;
  brand: string;
  name: string;
  modelNumber: string;
  active: boolean;
}

/** One worksheet (tab) of the exported workbook. */
export interface ModelSheet {
  sheetName: string;
  rows: ModelWorkbookRow[];
}

const HEADERS = ["Category", "Brand", "Model", "Model Number", "Status"] as const;

// Shown when a sheet has no rows, so the file still works as a template.
const SAMPLE_ROW: ModelWorkbookRow = {
  category: "Mobiles",
  brand: "Samsung",
  name: "Galaxy S26",
  modelNumber: "SAM-GALAXY-XXXX",
  active: true,
};

/** Case-insensitive cell lookup across possible header aliases. */
function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
    if (found !== undefined) {
      const v = String(row[found] ?? "").trim();
      if (v !== "") return v;
    }
  }
  return "";
}

function isInactive(value: string): boolean {
  const s = value.trim().toLowerCase();
  return s === "inactive" || s === "no" || s === "false" || s === "0" || s === "disabled";
}

function toSheetData(rows: ModelWorkbookRow[]) {
  const source = rows.length > 0 ? rows : [SAMPLE_ROW];
  return source.map((r) => ({
    Category: r.category,
    Brand: r.brand,
    Model: r.name,
    "Model Number": r.modelNumber,
    Status: r.active ? "Active" : "Inactive",
  }));
}

// Excel sheet names: max 31 chars, no []:*?/\, and must be unique.
function sheetNamer() {
  const used = new Set<string>();
  return (name: string) => {
    const base = (name || "Sheet").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 28) || "Sheet";
    let out = base;
    let i = 1;
    while (used.has(out.toLowerCase())) out = `${base.slice(0, 25)} ${++i}`;
    used.add(out.toLowerCase());
    return out;
  };
}

/** Build and download a multi-sheet workbook (one tab per brand sheet). */
export async function exportModelsWorkbook(
  sheets: ModelSheet[],
  fileName = "models.xlsx"
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const nameFor = sheetNamer();
  const safeSheets = sheets.length > 0 ? sheets : [{ sheetName: "Models", rows: [] as ModelWorkbookRow[] }];

  for (const s of safeSheets) {
    const ws = XLSX.utils.json_to_sheet(toSheetData(s.rows), { header: HEADERS as unknown as string[] });
    ws["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, nameFor(s.sheetName || "Models"));
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * Parse an uploaded workbook (all sheets) into model rows. Rows without a model
 * name are skipped. Column headers are matched case-insensitively with common
 * aliases so hand-made sheets import too.
 */
export async function parseModelsWorkbook(file: File): Promise<ModelWorkbookRow[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const out: ModelWorkbookRow[] = [];
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      defval: "",
    });
    // Forward-fill Category/Brand: once set, the value carries down to later rows
    // that leave those cells blank. So a template with a single pre-filled row
    // lets the user just type model names beneath it and upload.
    let lastCategory = "";
    let lastBrand = "";
    for (const row of rows) {
      const rowCategory = cell(row, "Category", "Category Name");
      const rowBrand = cell(row, "Brand", "Brand Name");
      if (rowCategory) lastCategory = rowCategory;
      if (rowBrand) lastBrand = rowBrand;

      const name = cell(row, "Model", "Model Name", "Name");
      if (!name) continue;

      const status = cell(row, "Status", "Active");
      out.push({
        category: lastCategory,
        brand: lastBrand,
        name,
        modelNumber: cell(row, "Model Number", "ModelNumber", "Number", "SKU"),
        active: status === "" ? true : !isInactive(status),
      });
    }
  }
  return out;
}
