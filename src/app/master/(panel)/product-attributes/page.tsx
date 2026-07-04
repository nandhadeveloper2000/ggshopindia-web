"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  categoriesService,
  subCategoriesService,
  productTypesService,
} from "@/services/catalog.service";
import { attributeTemplatesService } from "@/services/attribute-templates.service";
import { exportTemplateWorkbook, parseTemplateWorkbook } from "@/lib/attribute-workbook";
import {
  FIELD_INPUT_TYPES,
  OPTION_INPUT_TYPES,
  type AttributeTemplate,
  type FieldInputType,
  type TemplateField,
  type TemplateSection,
} from "@/types/attribute-template.types";

const SUGGESTED_SECTIONS = ["Product Details", "Images", "Variations", "Warranty", "Manufacturer Info"];

/** Default section list a brand-new product type starts with (before any are saved). */
const buildDefaultSections = (): TemplateSection[] =>
  SUGGESTED_SECTIONS.map((name, i) => ({
    headingName: name,
    active: true,
    sortOrder: i + 1,
    groups: [],
  }));
const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const clone = (s: TemplateSection[]) => JSON.parse(JSON.stringify(s)) as TemplateSection[];

interface EditTarget {
  categoryId: string;
  subCategoryId: string;
  productTypeId: string;
}

export default function ProductAttributesPage() {
  const [mode, setMode] = useState<"list" | "builder" | "view">("list");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const openTarget = (t: AttributeTemplate, next: "builder" | "view") => {
    setEditTarget({
      categoryId: String(t.categoryId),
      subCategoryId: String(t.subCategoryId),
      productTypeId: String(t.productTypeId),
    });
    setMode(next);
  };

  if (mode === "builder" || mode === "view") {
    return (
      <TemplateBuilder
        initial={editTarget}
        readOnly={mode === "view"}
        onBack={() => {
          setEditTarget(null);
          setMode("list");
        }}
      />
    );
  }

  return (
    <TemplateList
      onCreate={() => {
        setEditTarget(null);
        setMode("builder");
      }}
      onView={(t) => openTarget(t, "view")}
      onEdit={(t) => openTarget(t, "builder")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* LIST                                                                */
/* ------------------------------------------------------------------ */

function haystack(t: AttributeTemplate): string {
  const parts: string[] = [t.productTypeName ?? "", t.categoryName ?? "", t.subCategoryName ?? ""];
  for (const s of t.sections ?? []) {
    parts.push(s.headingName);
    for (const g of s.groups ?? []) {
      parts.push(g.groupName);
      for (const f of g.fields ?? []) parts.push(f.label, f.key);
    }
  }
  return parts.join(" ").toLowerCase();
}

function TemplateList({
  onCreate,
  onView,
  onEdit,
}: {
  onCreate: () => void;
  onView: (t: AttributeTemplate) => void;
  onEdit: (t: AttributeTemplate) => void;
}) {
  const qc = useQueryClient();
  const { data: templates = [], isFetching } = useQuery({
    queryKey: ["attribute-templates"],
    queryFn: attributeTemplatesService.list,
  });
  const [search, setSearch] = useState("");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<AttributeTemplate | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["attribute-templates"] });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => haystack(t).includes(q));
  }, [templates, search]);

  const toggle = async (t: AttributeTemplate) => {
    try {
      await attributeTemplatesService.setActive(t.id!, !(t.active ?? true));
      refresh();
    } catch {
      toast.error("Could not update status");
    }
  };
  const remove = async (t: AttributeTemplate) => {
    if (!window.confirm(`Delete the field template for "${t.productTypeName ?? "this product type"}"?`)) return;
    try {
      await attributeTemplatesService.remove(t.id!);
      toast.success("Template deleted");
      refresh();
    } catch {
      toast.error("Delete failed");
    }
  };
  const download = (t: AttributeTemplate) =>
    exportTemplateWorkbook({ sections: t.sections ?? [] }, `${t.productTypeName ?? "template"}-fields.xlsx`).catch(() =>
      toast.error("Export failed")
    );
  const startUpload = (t: AttributeTemplate) => {
    uploadTarget.current = t;
    uploadRef.current?.click();
  };
  const doUpload = async (file?: File) => {
    const t = uploadTarget.current;
    if (!file || !t) return;
    try {
      const sections = await parseTemplateWorkbook(file);
      await attributeTemplatesService.save({
        categoryId: t.categoryId,
        subCategoryId: t.subCategoryId,
        productTypeId: t.productTypeId,
        sections,
        active: t.active ?? true,
      });
      toast.success("Workbook imported");
      refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      if (uploadRef.current) uploadRef.current.value = "";
      uploadTarget.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Product Attributes</h1>
          <p className="text-sm text-muted-foreground">
            One builder per product type — section headings, groups, and dynamic fields saved together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Product Type Fields
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product type, category path, section heading, group, or field"
            className="pl-9"
          />
        </div>
        <span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">Total: {filtered.length}</span>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => doUpload(e.target.files?.[0])}
      />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Product Type</th>
              <th className="px-4 py-3 text-center">Section Headings</th>
              <th className="px-4 py-3 text-center">Groups</th>
              <th className="px-4 py-3 text-center">Fields</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No field templates yet. Click “Create Product Type Fields”.
                </td>
              </tr>
            )}
            {filtered.map((t, i) => (
              <tr key={String(t.id)} className="border-t">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{t.productTypeName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[t.categoryName, t.subCategoryName].filter(Boolean).join(" / ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Pill>{t.sectionCount ?? t.sections?.length ?? 0}</Pill>
                </td>
                <td className="px-4 py-3 text-center">
                  <Pill>{t.groupCount ?? 0}</Pill>
                </td>
                <td className="px-4 py-3 text-center">
                  <Pill>{t.fieldCount ?? 0}</Pill>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={t.active ?? true} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn label="View" onClick={() => onView(t)}>
                      <Eye className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Edit" onClick={() => onEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Download workbook" onClick={() => download(t)}>
                      <Download className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Upload workbook" onClick={() => startUpload(t)}>
                      <Upload className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Toggle status" onClick={() => toggle(t)}>
                      <Power className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => remove(t)} destructive>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  destructive,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className={`h-8 w-8 ${destructive ? "text-destructive" : "text-muted-foreground"}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* BUILDER                                                             */
/* ------------------------------------------------------------------ */

function TemplateBuilder({
  initial,
  onBack,
  readOnly = false,
}: {
  initial: EditTarget | null;
  onBack: () => void;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const { data: subCategories = [] } = useQuery({ queryKey: ["sub-categories"], queryFn: subCategoriesService.list });
  const { data: productTypes = [] } = useQuery({ queryKey: ["product-types"], queryFn: productTypesService.list });

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId ?? "");
  const [productTypeId, setProductTypeId] = useState(initial?.productTypeId ?? "");

  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const subOptions = useMemo(
    () => subCategories.filter((s) => String(s.categoryId) === categoryId),
    [subCategories, categoryId]
  );
  const typeOptions = useMemo(
    () => productTypes.filter((p) => String(p.subCategoryId) === subCategoryId),
    [productTypes, subCategoryId]
  );
  const allSelected = Boolean(categoryId && subCategoryId && productTypeId);

  useEffect(() => {
    if (!allSelected) {
      setSections([]);
      setActiveSection(null);
      setActiveGroup(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    attributeTemplatesService
      .getBySelection(categoryId, subCategoryId, productTypeId)
      .then((tpl) => {
        if (cancelled) return;
        // New product type (no saved template) → start with the default sections.
        // In read-only View mode we never inject defaults — show only what exists.
        const loaded = tpl?.sections ?? [];
        const next = loaded.length > 0 ? loaded : readOnly ? [] : buildDefaultSections();
        setSections(next);
        setActiveSection(next.length > 0 ? 0 : null);
        setActiveGroup(null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load template");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allSelected, categoryId, subCategoryId, productTypeId, readOnly]);

  const totals = useMemo(() => {
    let groups = 0;
    let fields = 0;
    for (const s of sections) {
      groups += s.groups.length;
      for (const g of s.groups) fields += g.fields.length;
    }
    return { sections: sections.length, groups, fields };
  }, [sections]);

  const mutate = (fn: (draft: TemplateSection[]) => void) =>
    setSections((prev) => {
      const d = clone(prev);
      fn(d);
      return d;
    });

  const addSection = (name: string) => {
    const n = name.trim();
    if (!n) return;
    mutate((d) => d.push({ headingName: n, active: true, sortOrder: d.length + 1, groups: [] }));
    setActiveSection(sections.length);
    setActiveGroup(null);
  };
  const removeSection = (i: number) => {
    mutate((d) => d.splice(i, 1));
    setActiveSection(null);
    setActiveGroup(null);
  };

  const addGroup = (name: string) => {
    if (activeSection === null) return;
    const n = name.trim();
    if (!n) return;
    mutate((d) =>
      d[activeSection].groups.push({ groupName: n, active: true, sortOrder: d[activeSection].groups.length + 1, fields: [] })
    );
  };
  const removeGroup = (gi: number) => {
    if (activeSection === null) return;
    mutate((d) => d[activeSection].groups.splice(gi, 1));
    setActiveGroup(null);
  };

  const addField = () => {
    if (activeSection === null || activeGroup === null) return;
    mutate((d) => {
      const fields = d[activeSection].groups[activeGroup].fields;
      fields.push({
        label: "",
        key: "",
        inputType: "text",
        placeholder: "",
        options: [],
        unit: "",
        sortOrder: fields.length + 1,
        required: false,
        addMore: false,
        hasUnit: false,
        active: true,
      });
    });
  };
  const updateField = (fi: number, patch: Partial<TemplateField>) => {
    if (activeSection === null || activeGroup === null) return;
    mutate((d) => Object.assign(d[activeSection].groups[activeGroup].fields[fi], patch));
  };
  const removeField = (fi: number) => {
    if (activeSection === null || activeGroup === null) return;
    mutate((d) => d[activeSection].groups[activeGroup].fields.splice(fi, 1));
  };

  const handleSave = async () => {
    if (!allSelected) return;
    setSaving(true);
    try {
      await attributeTemplatesService.save({ categoryId, subCategoryId, productTypeId, sections, active: true });
      qc.invalidateQueries({ queryKey: ["attribute-templates"] });
      toast.success("Template saved");
      onBack(); // return to the list after saving
    } catch {
      toast.error("Could not save template");
      setSaving(false);
    }
  };

  const handleDownload = () =>
    exportTemplateWorkbook({ sections }, "attribute-template.xlsx").catch(() => toast.error("Export failed"));

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = await parseTemplateWorkbook(file);
      if (parsed.length === 0) {
        toast.error("No field rows found in the workbook");
        return;
      }
      setSections(parsed);
      setActiveSection(0);
      setActiveGroup(null);
      toast.success(`Imported ${parsed.length} section(s) from workbook`);
    } catch {
      toast.error("Could not read workbook");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const section = activeSection !== null ? sections[activeSection] : null;
  const group = section && activeGroup !== null ? section.groups[activeGroup] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back to list" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {readOnly ? "View" : initial ? "Edit" : "Create"} Product Type Fields
            </h1>
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? "Read-only view of the dynamic field template. Use Edit from the list to make changes."
                : "Build the dynamic field template for a category, sub-category and product type."}
            </p>
          </div>
        </div>
        {allSelected && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {totals.sections} Sections
            </span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {totals.fields} Fields
            </span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1 h-4 w-4" /> Download Workbook
            </Button>
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> Upload Workbook
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Template
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setSubCategoryId("");
              setProductTypeId("");
            }}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Subcategory</Label>
          <Select
            value={subCategoryId}
            onValueChange={(v) => {
              setSubCategoryId(v);
              setProductTypeId("");
            }}
            disabled={readOnly || !categoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder={categoryId ? "Select subcategory" : "Select category first"} />
            </SelectTrigger>
            <SelectContent>
              {subOptions.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase text-muted-foreground">Product Type</Label>
          <Select value={productTypeId} onValueChange={setProductTypeId} disabled={readOnly || !subCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={subCategoryId ? "Select product type" : "Select subcategory first"} />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((p) => (
                <SelectItem key={String(p.id)} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!allSelected && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Select a Category, Subcategory and Product Type to build its attribute template.
        </div>
      )}

      {allSelected && loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading template…
        </div>
      )}

      {allSelected && !loading && (
        <>
          <StepCard step="Step 1" title="Sections / Tabs" subtitle="Select the tab first, then continue with groups and fields.">
            {!readOnly && (
              <AddRow
                placeholder="Enter section name"
                onAdd={addSection}
                suggestions={SUGGESTED_SECTIONS}
                onAddSuggestion={addSection}
                suggestionLabel="Suggested Sections"
              />
            )}
            <div className="mt-3 overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Tab</th>
                    <th className="px-3 py-2 text-left">Section Name</th>
                    <th className="px-3 py-2 text-center">Groups</th>
                    <th className="px-3 py-2 text-center">Fields</th>
                    <th className="px-3 py-2 text-center">Active</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No sections yet. Add one above.
                      </td>
                    </tr>
                  )}
                  {sections.map((s, i) => {
                    const fieldCount = s.groups.reduce((a, g) => a + g.fields.length, 0);
                    const selected = activeSection === i;
                    return (
                      <tr key={i} className={selected ? "bg-primary/5" : "border-t"}>
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{s.headingName}</td>
                        <td className="px-3 py-2 text-center">{s.groups.length}</td>
                        <td className="px-3 py-2 text-center">{fieldCount}</td>
                        <td className="px-3 py-2 text-center">
                          <Checkbox
                            checked={s.active !== false}
                            disabled={readOnly}
                            onCheckedChange={(v) => mutate((d) => (d[i].active = Boolean(v)))}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={selected ? "default" : "outline"}
                              onClick={() => {
                                setActiveSection(i);
                                setActiveGroup(null);
                              }}
                            >
                              {selected ? "Selected" : "Open"}
                            </Button>
                            {!readOnly && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => removeSection(i)}
                                aria-label="Delete section"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </StepCard>

          {section && (
            <StepCard
              step="Step 2"
              title="Groups For Selected Section"
              subtitle={`Tab ${activeSection! + 1}: ${section.headingName}. Add groups, then open one to manage its fields.`}
            >
              {!readOnly && <AddRow placeholder="Enter group name" onAdd={addGroup} />}
              <div className="mt-3 overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">S.No</th>
                      <th className="px-3 py-2 text-left">Group Name</th>
                      <th className="px-3 py-2 text-center">Fields</th>
                      <th className="px-3 py-2 text-center">Active</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.groups.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                          No groups yet. Add one above.
                        </td>
                      </tr>
                    )}
                    {section.groups.map((g, gi) => {
                      const selected = activeGroup === gi;
                      return (
                        <tr key={gi} className={selected ? "bg-primary/5" : "border-t"}>
                          <td className="px-3 py-2">{gi + 1}</td>
                          <td className="px-3 py-2">
                            <Input
                              value={g.groupName}
                              disabled={readOnly}
                              onChange={(e) => mutate((d) => (d[activeSection!].groups[gi].groupName = e.target.value))}
                              className="h-8"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">{g.fields.length}</td>
                          <td className="px-3 py-2 text-center">
                            <Checkbox
                              checked={g.active !== false}
                              disabled={readOnly}
                              onCheckedChange={(v) => mutate((d) => (d[activeSection!].groups[gi].active = Boolean(v)))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => setActiveGroup(gi)}>
                                {selected ? "Selected" : "Open"}
                              </Button>
                              {!readOnly && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => removeGroup(gi)}
                                  aria-label="Delete group"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </StepCard>
          )}

          {section && group && (
            <StepCard
              step="Step 3"
              title="Dynamic Field Builder"
              subtitle={`${section.headingName} / ${group.groupName} — ${group.fields.length} field(s).`}
              actions={
                readOnly ? undefined : (
                  <Button size="sm" onClick={addField}>
                    <Plus className="mr-1 h-4 w-4" /> Add Field
                  </Button>
                )
              }
            >
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-xs uppercase text-primary-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Field Name</th>
                      <th className="px-2 py-2 text-left">Field Key</th>
                      <th className="px-2 py-2 text-left">Input Type</th>
                      <th className="px-2 py-2 text-left">Placeholder</th>
                      <th className="px-2 py-2 text-left">Options</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-center">Req</th>
                      <th className="px-2 py-2 text-center">Add+</th>
                      <th className="px-2 py-2 text-center">Active</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fields.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                          No fields yet. Click “Add Field” or upload a workbook.
                        </td>
                      </tr>
                    )}
                    {group.fields.map((f, fi) => {
                      const usesOptions = OPTION_INPUT_TYPES.includes(f.inputType as FieldInputType);
                      return (
                        <tr key={fi} className="border-t align-top">
                          <td className="px-2 py-2">{fi + 1}</td>
                          <td className="px-2 py-2">
                            <Input
                              value={f.label}
                              disabled={readOnly}
                              className="h-8 min-w-40"
                              onChange={(e) => {
                                const label = e.target.value;
                                updateField(fi, { label, key: f.key ? f.key : slug(label) });
                              }}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input value={f.key} disabled={readOnly} className="h-8 min-w-32" onChange={(e) => updateField(fi, { key: e.target.value })} />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={f.inputType}
                              disabled={readOnly}
                              onChange={(e) => updateField(fi, { inputType: e.target.value })}
                              className="h-8 rounded-md border bg-background px-2 text-sm disabled:opacity-60"
                            >
                              {FIELD_INPUT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={f.placeholder ?? ""}
                              disabled={readOnly}
                              className="h-8 min-w-32"
                              onChange={(e) => updateField(fi, { placeholder: e.target.value })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={(f.options ?? []).join(", ")}
                              disabled={readOnly || !usesOptions}
                              placeholder={usesOptions ? "a, b, c" : "—"}
                              className="h-8 min-w-40"
                              onChange={(e) =>
                                updateField(fi, {
                                  options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                                })
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={f.unit ?? ""}
                              disabled={readOnly}
                              className="h-8 min-w-20"
                              onChange={(e) => updateField(fi, { unit: e.target.value, hasUnit: e.target.value !== "" })}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Checkbox checked={!!f.required} disabled={readOnly} onCheckedChange={(v) => updateField(fi, { required: Boolean(v) })} />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Checkbox checked={!!f.addMore} disabled={readOnly} onCheckedChange={(v) => updateField(fi, { addMore: Boolean(v) })} />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Checkbox checked={f.active !== false} disabled={readOnly} onCheckedChange={(v) => updateField(fi, { active: Boolean(v) })} />
                          </td>
                          <td className="px-2 py-2 text-right">
                            {!readOnly && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => removeField(fi)}
                                aria-label="Delete field"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </StepCard>
          )}
        </>
      )}
    </div>
  );
}

function StepCard({
  step,
  title,
  subtitle,
  actions,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{step}</span>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function AddRow({
  placeholder,
  onAdd,
  suggestions,
  onAddSuggestion,
  suggestionLabel,
  extraAction,
}: {
  placeholder: string;
  onAdd: (name: string) => void;
  suggestions?: string[];
  onAddSuggestion?: (name: string) => void;
  suggestionLabel?: string;
  extraAction?: ReactNode;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    onAdd(value);
    setValue("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          className="h-9 max-w-xs"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button size="sm" onClick={submit}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
        {extraAction}
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs uppercase text-muted-foreground">{suggestionLabel}:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAddSuggestion?.(s)}
              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
