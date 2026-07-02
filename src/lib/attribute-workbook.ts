import type {
  AttributeTemplate,
  TemplateField,
  TemplateSection,
} from "@/types/attribute-template.types";

const HEADERS = [
  "Section/Tab Name",
  "Group Name",
  "Field Name",
  "Field Key",
  "Input Type",
  "Placeholder",
  "Options",
  "Unit Options",
  "Sort",
  "Required",
  "Add More",
  "Has Unit",
  "Active",
] as const;

function slugKey(label: string): string {
  return (label || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function truthy(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1";
}

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

function fieldRow(section: TemplateSection, group: { groupName: string }, f: TemplateField) {
  return {
    "Section/Tab Name": section.headingName,
    "Group Name": group.groupName,
    "Field Name": f.label ?? "",
    "Field Key": f.key ?? "",
    "Input Type": f.inputType ?? "text",
    Placeholder: f.placeholder ?? "",
    Options: (f.options ?? []).join(" | "),
    "Unit Options": f.unit ?? "",
    Sort: f.sortOrder ?? "",
    Required: f.required ? "yes" : "no",
    "Add More": f.addMore ? "yes" : "no",
    "Has Unit": f.hasUnit ? "yes" : "no",
    Active: f.active === false ? "no" : "yes",
  } as Record<string, string | number>;
}

// Excel sheet names: max 31 chars, no []:*?/\, and must be unique.
function sheetNamer() {
  const used = new Set<string>();
  return (name: string) => {
    let base = (name || "Sheet").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 28) || "Sheet";
    let out = base;
    let i = 1;
    while (used.has(out.toLowerCase())) out = `${base.slice(0, 25)} ${++i}`;
    used.add(out.toLowerCase());
    return out;
  };
}

/**
 * Download the whole template as a multi-sheet workbook — one sheet per
 * section/tab, matching the reference field-workbook format.
 */
export async function exportTemplateWorkbook(
  template: Pick<AttributeTemplate, "sections">,
  fileName = "attribute-template.xlsx"
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const nameFor = sheetNamer();
  const sections = template.sections ?? [];

  if (sections.length === 0) {
    const starter = [
      {
        "Section/Tab Name": "Product Details",
        "Group Name": "Basic Info",
        "Field Name": "Item Name",
        "Field Key": "itemname",
        "Input Type": "text",
        Placeholder: "",
        Options: "",
        "Unit Options": "",
        Sort: 1,
        Required: "yes",
        "Add More": "no",
        "Has Unit": "no",
        Active: "yes",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(starter, { header: HEADERS as unknown as string[] });
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, fileName);
    return;
  }

  for (const s of sections) {
    const rows: Record<string, string | number>[] = [];
    for (const g of s.groups ?? []) {
      const fields = g.fields ?? [];
      if (fields.length === 0) {
        rows.push({ "Section/Tab Name": s.headingName, "Group Name": g.groupName });
        continue;
      }
      for (const f of fields) rows.push(fieldRow(s, g, f));
    }
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Section/Tab Name": s.headingName }], {
      header: HEADERS as unknown as string[],
    });
    XLSX.utils.book_append_sheet(wb, ws, nameFor(s.headingName));
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * Parse an uploaded workbook (all sheets) into a section -> group -> field tree.
 * The section comes from the "Section/Tab Name" column, falling back to the
 * sheet name — so both multi-sheet and single-sheet workbooks import fully.
 */
export async function parseTemplateWorkbook(file: File): Promise<TemplateSection[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sections: TemplateSection[] = [];
  const sectionByName = new Map<string, TemplateSection>();

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: "" });
    for (const row of rows) {
      const label = cell(row, "Field Name", "Label", "Field");
      if (!label) continue;

      const sectionName =
        cell(row, "Section/Tab Name", "Section", "Section Name", "Tab") || sheetName || "Product Details";
      const groupName = cell(row, "Group Name", "Group") || "General";

      let section = sectionByName.get(sectionName);
      if (!section) {
        section = { headingName: sectionName, active: true, sortOrder: sections.length + 1, groups: [] };
        sections.push(section);
        sectionByName.set(sectionName, section);
      }
      let group = section.groups.find((g) => g.groupName === groupName);
      if (!group) {
        group = { groupName, active: true, sortOrder: section.groups.length + 1, fields: [] };
        section.groups.push(group);
      }

      const optionsRaw = cell(row, "Options");
      const options = optionsRaw ? optionsRaw.split(/[|,\n]/).map((o) => o.trim()).filter(Boolean) : [];
      const unit = cell(row, "Unit Options", "Unit");
      const sortRaw = cell(row, "Sort", "Sort Order");

      const field: TemplateField = {
        label,
        key: cell(row, "Field Key", "Key") || slugKey(label),
        inputType: cell(row, "Input Type", "Type") || "text",
        placeholder: cell(row, "Placeholder"),
        options,
        unit,
        sortOrder: sortRaw ? Number(sortRaw) || group.fields.length + 1 : group.fields.length + 1,
        required: truthy(cell(row, "Required")),
        addMore: truthy(cell(row, "Add More", "AddMore")),
        hasUnit: cell(row, "Has Unit") ? truthy(cell(row, "Has Unit")) : unit !== "",
        active: cell(row, "Active").toLowerCase() !== "no" && cell(row, "Active").toLowerCase() !== "false",
      };
      group.fields.push(field);
    }
  }

  return sections;
}
