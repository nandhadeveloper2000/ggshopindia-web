"use client";

import { useState } from "react";
import { MinusCircle, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";
import type { AttributeTemplate, TemplateGroup } from "@/types/attribute-template.types";

interface SpecRow {
  label: string;
  value: string;
}
/** One expandable section: either a free-text block or a label/value spec table. */
interface Section {
  title: string;
  text?: string;
  rows?: SpecRow[];
}

/**
 * True for dynamic fields that hold an image URL — rendered in the gallery, never
 * as a spec row. Detected by key name (any *image* field) or an image / Cloudinary
 * URL value, so templates that declare image fields as plain text (e.g. earbuds:
 * thumbnailimage, secondimage, …) don't leak URLs into the spec tables.
 */
function isImageField(key: string, value: string): boolean {
  if (/image/i.test(key)) return true;
  const v = value.trim().toLowerCase();
  return /res\.cloudinary\.com/.test(v) || /^https?:\/\/\S+\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/.test(v);
}

/** Group definitions for the "Product Details" tab: [display label, dynamic-field key]. */
const DETAIL_GROUPS: Array<{ title: string; fields: Array<[string, string]> }> = [
  {
    title: "Display",
    fields: [
      ["Display Size", "size"],
      ["Resolution", "resolution"],
      ["Resolution Type", "resolutiontype"],
      ["Display Type", "displaytype"],
      ["Other Display Features", "otherdisplayfeatures"],
    ],
  },
  {
    title: "Camera",
    fields: [
      ["Primary Camera", "primarycamera"],
      ["Primary Camera Features", "primarycamerafeatures"],
      ["Primary Camera Available", "primarycameraavailable"],
      ["Secondary Camera", "secondarycamer"],
      ["Secondary Camera Features", "secondarycamerfeatures"],
      ["Secondary Camera Available", "secondarycameraavailable"],
    ],
  },
  {
    title: "Performance & OS",
    fields: [
      ["Processor Brand", "processorbrand"],
      ["Processor Type", "processortype"],
      ["Processor Core", "processcore"],
      ["Primary Clock Speed", "primaryclockspeed"],
      ["Secondary Clock Speed", "secondaryclockspeed"],
      ["Operating System", "operatingsystem"],
    ],
  },
  {
    title: "Memory & Storage",
    fields: [
      ["RAM", "ram"],
      ["Internal Storage", "internalstorage"],
    ],
  },
  {
    title: "Battery & Power",
    fields: [
      ["Battery Capacity", "batterycapacity"],
      ["Battery Type", "batterytype"],
      ["Charging Power", "chargingpower"],
    ],
  },
  {
    title: "Connectivity",
    fields: [
      ["Network Type", "networktype"],
      ["Supported Networks", "supported Networks"],
      ["Operating Frequency", "operatingfrequency"],
      ["Wi-Fi", "wifi"],
      ["Wi-Fi Version", "wifiversion"],
      ["Audio Jack", "audiojack"],
    ],
  },
  {
    title: "Multimedia",
    fields: [
      ["FM Radio", "fmradio"],
      ["FM Radio Recording", "fmradiorecording"],
      ["Flash", "flash"],
      ["Audio Formats", "audioformats"],
      ["Video Formats", "videoformats"],
    ],
  },
  {
    title: "General",
    fields: [
      ["Generic Name", "genericname"],
      ["Colour", "color"],
      ["Net Quantity", "netquantity"],
      ["Country of Origin", "countryoforigin"],
    ],
  },
];

const WARRANTY_FIELDS: Array<[string, string]> = [
  ["Warranty Summary", "Warranty Summary"],
  ["Covered in Warranty", "Covered in Warranty"],
  ["Not Covered in Warranty", "Not Covered in Warranty"],
  ["Warranty Service Type", "Warranty Service Type"],
];

const MANUFACTURER_FIELDS: Array<[string, string]> = [
  ["Manufacturer", "nameandaddressofthemanufacturer"],
  ["Packer", "nameandaddressofthepacker"],
  ["Country of Origin", "countryoforigin"],
];

/** Clean a raw value; drops the redundant word for the RAM row ("6 GB RAM" → "6 GB"). */
function cleanValue(label: string, value: string): string {
  const v = value.trim();
  return label === "RAM" ? v.replace(/\s*RAM\s*$/i, "").trim() : v;
}

/** Keys never shown as a spec row (rendered elsewhere or intentionally hidden). */
const HIDDEN_KEYS = new Set(["sku", "itemname", "description"]);

/** Every dynamic-field key already claimed by an explicit group above. */
const KNOWN_KEYS = new Set<string>([
  ...DETAIL_GROUPS.flatMap((g) => g.fields.map(([, key]) => key)),
  ...WARRANTY_FIELDS.map(([, key]) => key),
  ...MANUFACTURER_FIELDS.map(([, key]) => key),
]);

/** "primaryClockSpeed" / "net_quantity" → "Primary Clock Speed" / "Net Quantity". */
function humanize(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function buildSections(product: Product): {
  details: Section[];
  warranty: Section[];
  manufacturer: Section[];
} {
  const df = product.dynamicFields ?? {};
  const get = (key: string) => (df[key] ?? "").toString().trim();

  const details: Section[] = [];

  // Lead with the marketing description if present.
  const desc = get("description");
  if (desc) details.push({ title: "Description", text: desc });

  for (const g of DETAIL_GROUPS) {
    const rows = g.fields
      .map(([label, key]) => ({ label, value: cleanValue(label, get(key)) }))
      .filter((r) => r.value);
    if (rows.length) details.push({ title: g.title, rows });
  }

  // Catch-all: any non-image, non-hidden dynamic field not already grouped, so a
  // field an admin adds later is surfaced instead of being silently dropped.
  const otherRows = Object.entries(df)
    .filter(([, value]) => value?.toString().trim())
    .filter(([key, value]) => !KNOWN_KEYS.has(key) && !HIDDEN_KEYS.has(key) && !isImageField(key, value.toString()))
    .map(([key, value]) => ({ label: humanize(key), value: value.toString().trim() }));
  if (otherRows.length) details.push({ title: "Other", rows: otherRows });

  // Any structured "Product Information" rows the admin added, appended as a group.
  const infoRows = (product.productInformation ?? [])
    .filter((f) => f.label?.trim() && f.value?.trim())
    .map((f) => ({ label: f.label.trim(), value: f.value.trim() }));
  if (infoRows.length) details.push({ title: "Additional Information", rows: infoRows });

  const toTextSections = (defs: Array<[string, string]>): Section[] =>
    defs.map(([title, key]) => ({ title, text: get(key) })).filter((s) => s.text);

  return {
    details,
    warranty: toTextSections(WARRANTY_FIELDS),
    manufacturer: toTextSections(MANUFACTURER_FIELDS),
  };
}

/**
 * Build the tabbed spec sections from the product's own attribute template, so
 * every product type is organised like its template (Product-Details groups →
 * accordion sections; Warranty / Manufacturer Info tabs) instead of a hardcoded
 * smartphone layout. Image/variation sections and file fields are skipped, and
 * repeated field keys are de-duplicated.
 */
function buildSectionsFromTemplate(
  product: Product,
  template: AttributeTemplate,
): { details: Section[]; warranty: Section[]; manufacturer: Section[] } {
  const df = product.dynamicFields ?? {};
  const get = (key: string) => (df[key] ?? "").toString().trim();

  const rowsFor = (group: TemplateGroup): SpecRow[] => {
    const seen = new Set<string>();
    const out: SpecRow[] = [];
    for (const f of group.fields ?? []) {
      if (f.active === false || !f.key || seen.has(f.key)) continue;
      seen.add(f.key);
      const value = cleanValue(f.label ?? "", get(f.key));
      if (!value || f.inputType === "file" || isImageField(f.key, value)) continue;
      out.push({ label: (f.label || humanize(f.key)).trim(), value });
    }
    return out;
  };

  const sections = (template.sections ?? []).filter((s) => s.active !== false);
  const is = (re: RegExp) => (s: { headingName: string }) => re.test(s.headingName ?? "");
  const isImages = is(/image/i);
  const isVariations = is(/variation/i);
  const isWarranty = is(/warrant/i);
  const isManufacturer = is(/manufact/i);

  // Product Details tab: every section that isn't images/variations/warranty/manufacturer.
  const details: Section[] = [];
  const desc = get("description");
  if (desc) details.push({ title: "Description", text: desc });

  for (const s of sections.filter(
    (s) => !isImages(s) && !isVariations(s) && !isWarranty(s) && !isManufacturer(s),
  )) {
    for (const g of (s.groups ?? []).filter((g) => g.active !== false)) {
      const rows = rowsFor(g).filter((r) => r.label.toLowerCase() !== "description");
      if (rows.length) details.push({ title: g.groupName?.trim() || s.headingName, rows });
    }
  }

  const infoRows = (product.productInformation ?? [])
    .filter((f) => f.label?.trim() && f.value?.trim())
    .map((f) => ({ label: f.label.trim(), value: f.value.trim() }));
  if (infoRows.length) details.push({ title: "Additional Information", rows: infoRows });

  // Warranty / Manufacturer tabs: flatten each matching section's groups into one
  // section, de-duplicating by label.
  const flatten = (match: (s: { headingName: string }) => boolean, title: string): Section[] => {
    const seen = new Set<string>();
    const rows = sections
      .filter(match)
      .flatMap((s) => (s.groups ?? []).filter((g) => g.active !== false).flatMap(rowsFor))
      .filter((r) => !seen.has(r.label) && (seen.add(r.label), true));
    return rows.length ? [{ title, rows }] : [];
  };

  return {
    details,
    warranty: flatten(isWarranty, "Warranty"),
    manufacturer: flatten(isManufacturer, "Manufacturer Info"),
  };
}

/** Apple-style expandable list on the left + a sticky product image on the right. */
function DetailPanel({ sections, image, alt }: { sections: Section[]; image?: string; alt: string }) {
  // Single-open accordion: opening one section collapses the previously open one
  // (-1 = all collapsed). First section starts open.
  const [openIdx, setOpenIdx] = useState(0);
  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? -1 : i));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-2.5">
        {sections.map((s, i) => {
          const isOpen = openIdx === i;
          const panelId = `spec-panel-${i}`;
          const headerId = `spec-header-${i}`;
          return (
            <div
              key={s.title}
              className={cn(
                "overflow-hidden rounded-2xl border transition-colors duration-200",
                isOpen ? "border-border bg-muted/60" : "border-transparent bg-muted/40 hover:bg-muted/60",
              )}
            >
              <button
                id={headerId}
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                {isOpen ? (
                  <MinusCircle aria-hidden className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <PlusCircle aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className="text-[15px] font-semibold">{s.title}</span>
              </button>
              {/* Animated reveal: grid-rows 0fr→1fr gives a smooth auto-height slide. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={cn(
                  "grid transition-all duration-300 ease-out motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div
                    className={cn(
                      "px-4 pb-4 pl-11 transition-transform duration-300 ease-out motion-reduce:transform-none",
                      isOpen ? "translate-y-0" : "translate-y-1",
                    )}
                  >
                    {s.text ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{s.text}</p>
                    ) : (
                      <dl className="divide-y divide-border/70">
                        {(s.rows ?? []).map((r) => (
                          <div key={r.label} className="grid grid-cols-[minmax(0,150px)_1fr] gap-3 py-2 text-sm">
                            <dt className="text-foreground/70">{r.label}</dt>
                            <dd className="font-medium text-foreground">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky product image (Apple-style) */}
      <div className="hidden lg:block">
        {image && (
          <div className="sticky top-20 flex items-center justify-center rounded-2xl bg-muted/30 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={alt} className="max-h-[520px] w-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "Product information" section shown below the buy box: Apple-style expandable
 * spec tags on the left with the product image on the right, split across the
 * Product Details / Warranty / Manufacturer Info tabs. All content is derived
 * from the product's dynamic fields, so tabs with no data are hidden.
 */
export function ProductSpecs({
  product,
  image,
  template,
}: {
  product: Product;
  image?: string;
  template?: AttributeTemplate | null;
}) {
  const { details, warranty, manufacturer } = template?.sections?.length
    ? buildSectionsFromTemplate(product, template)
    : buildSections(product);
  const tabs = [
    { key: "details", label: "Product Details", sections: details },
    { key: "warranty", label: "Warranty", sections: warranty },
    { key: "manufacturer", label: "Manufacturer Info", sections: manufacturer },
  ].filter((t) => t.sections.length);

  if (!tabs.length) return null;

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="mb-5 text-lg font-semibold tracking-tight sm:text-xl">Product information</h2>
      <Tabs defaultValue={tabs[0].key}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="rounded-full border px-4 py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-6">
            <DetailPanel sections={t.sections} image={image} alt={product.itemName} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
