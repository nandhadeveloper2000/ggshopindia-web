"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageField } from "@/components/common/MultiImageField";

export interface VariantRowData {
  images?: string[];
  status?: string;
  details?: string;
  sku?: string;
  externalProductId?: string;
  externalProductIdType?: string;
  itemCondition?: string;
}

export interface VariationsState {
  /** Selected variation-type field keys. */
  selected: string[];
  /** typeKey -> list of values (e.g. color -> [black, white]). */
  values: Record<string, string[]>;
  /** comboKey -> per-variant row data. */
  rows: Record<string, VariantRowData>;
}

export const emptyVariations: VariationsState = { selected: [], values: {}, rows: {} };

const STATUS_OPTIONS = ["Available", "Unavailable"];
const comboKey = (combo: Record<string, string>) =>
  Object.entries(combo)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");

function buildCombos(selected: string[], values: Record<string, string[]>): Record<string, string>[] {
  const active = selected.filter((k) => (values[k]?.filter(Boolean).length ?? 0) > 0);
  if (active.length === 0) return [];
  let acc: Record<string, string>[] = [{}];
  for (const key of active) {
    const vals = (values[key] ?? []).filter(Boolean);
    const next: Record<string, string>[] = [];
    for (const a of acc) for (const v of vals) next.push({ ...a, [key]: v });
    acc = next;
  }
  return acc;
}

/** Turn the builder state into a flat, serialisable variant payload. */
export function toVariantPayload(fields: Field[], value: VariationsState) {
  const combos = buildCombos(value.selected, value.values);
  return {
    types: value.selected.map((k) => ({ key: k, label: fields.find((f) => f.key === k)?.label ?? k })),
    values: value.values,
    rows: combos.map((combo) => ({ combo, ...(value.rows[comboKey(combo)] ?? {}) })),
  };
}

interface Field {
  key: string;
  label: string;
}

export function VariationsBuilder({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: VariationsState;
  onChange: (v: VariationsState) => void;
}) {
  const [bulkStatus, setBulkStatus] = useState("Available");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const activeTypes = value.selected.filter((k) => (value.values[k]?.filter(Boolean).length ?? 0) > 0);
  const combos = useMemo(() => buildCombos(value.selected, value.values), [value.selected, value.values]);
  const labelOf = (key: string) => fields.find((f) => f.key === key)?.label ?? key;

  const toggleType = (key: string) => {
    const next = value.selected.includes(key)
      ? value.selected.filter((k) => k !== key)
      : [...value.selected, key];
    onChange({ ...value, selected: next });
  };
  const addValue = (key: string, raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const cur = value.values[key] ?? [];
    if (cur.includes(v)) return;
    onChange({ ...value, values: { ...value.values, [key]: [...cur, v] } });
  };
  const removeValue = (key: string, v: string) =>
    onChange({ ...value, values: { ...value.values, [key]: (value.values[key] ?? []).filter((x) => x !== v) } });
  const setRow = (key: string, patch: Partial<VariantRowData>) =>
    onChange({ ...value, rows: { ...value.rows, [key]: { ...value.rows[key], ...patch } } });

  const applyBulkStatus = () => {
    const rows = { ...value.rows };
    combos.forEach((c) => {
      const k = comboKey(c);
      if (selectedRows.size === 0 || selectedRows.has(k)) rows[k] = { ...rows[k], status: bulkStatus };
    });
    onChange({ ...value, rows });
  };

  return (
    <div className="space-y-4">
      {/* Choose variation types */}
      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-semibold">Choose Variation type:</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {fields.map((f) => (
            <label key={f.key} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={value.selected.includes(f.key)} onCheckedChange={() => toggleType(f.key)} />
              {f.label}
            </label>
          ))}
          {fields.length === 0 && <span className="text-sm text-muted-foreground">No variation fields in this section.</span>}
        </div>
      </div>

      {/* Value lists for each selected type */}
      {value.selected.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-semibold">List all of your variants for the variation types below.</p>
            <p className="text-xs text-muted-foreground">
              List every value that exists (e.g. colours Black and White). Rows are generated from all combinations.
            </p>
          </div>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            {value.selected.map((key) => (
              <ValueAdder
                key={key}
                label={labelOf(key)}
                values={value.values[key] ?? []}
                onAdd={(v) => addValue(key, v)}
                onRemove={(v) => removeValue(key, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generated variant rows */}
      {combos.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Variation rows are created automatically from the values above. Upload each child image, set status, and
            complete per-variant identifiers before saving.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
              {selectedRows.size === 0 ? "No rows selected. Bulk status applies to all rows." : `${selectedRows.size} selected`}
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={applyBulkStatus}>
              Apply Status
            </Button>
            <span className="text-xs text-muted-foreground">{combos.length} variation(s)</span>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">
                    <Checkbox
                      checked={selectedRows.size > 0 && selectedRows.size === combos.length}
                      onCheckedChange={(v) =>
                        setSelectedRows(v ? new Set(combos.map(comboKey)) : new Set())
                      }
                    />
                  </th>
                  <th className="px-2 py-2 text-left">Variant</th>
                  <th className="px-2 py-2 text-left">Images</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Variant Details</th>
                  {activeTypes.map((k) => (
                    <th key={k} className="px-2 py-2 text-left">
                      {labelOf(k)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-left">SKU</th>
                  <th className="px-2 py-2 text-left">External Product ID</th>
                  <th className="px-2 py-2 text-left">Ext. ID Type</th>
                  <th className="px-2 py-2 text-left">Item Condition</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => {
                  const k = comboKey(combo);
                  const row = value.rows[k] ?? {};
                  const summary = activeTypes.map((t) => `${labelOf(t)}: ${combo[t]}`).join(", ");
                  return (
                    <tr key={k} className="border-t align-top">
                      <td className="px-2 py-2">
                        <Checkbox
                          checked={selectedRows.has(k)}
                          onCheckedChange={(v) =>
                            setSelectedRows((prev) => {
                              const n = new Set(prev);
                              if (v) n.add(k);
                              else n.delete(k);
                              return n;
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2 text-xs font-medium">{summary}</td>
                      <td className="px-2 py-2">
                        <MultiImageField value={row.images ?? []} onChange={(imgs) => setRow(k, { images: imgs })} />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.status ?? "Available"}
                          onChange={(e) => setRow(k, { status: e.target.value })}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <textarea
                          value={row.details ?? ""}
                          onChange={(e) => setRow(k, { details: e.target.value })}
                          placeholder="Notes, bundle info…"
                          rows={2}
                          className="min-w-40 rounded-md border bg-background px-2 py-1 text-sm"
                        />
                      </td>
                      {activeTypes.map((t) => (
                        <td key={t} className="px-2 py-2 text-xs">
                          {combo[t]}
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <Input value={row.sku ?? ""} onChange={(e) => setRow(k, { sku: e.target.value })} placeholder="SKU" className="h-8 min-w-28" />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.externalProductId ?? ""}
                          onChange={(e) => setRow(k, { externalProductId: e.target.value })}
                          placeholder="e.g. 714532…"
                          className="h-8 min-w-32"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.externalProductIdType ?? ""}
                          onChange={(e) => setRow(k, { externalProductIdType: e.target.value })}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="ASIN">ASIN</option>
                          <option value="UPC">UPC</option>
                          <option value="EAN">EAN</option>
                          <option value="GTIN">GTIN</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.itemCondition ?? ""}
                          onChange={(e) => setRow(k, { itemCondition: e.target.value })}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="New">New</option>
                          <option value="Renewed">Renewed</option>
                          <option value="Refurbished">Refurbished</option>
                          <option value="Used">Used</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ValueAdder({
  label,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [input, setInput] = useState("");
  const submit = () => {
    onAdd(input);
    setInput("");
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="button" onClick={submit}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs">
              {v}
              <button type="button" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
