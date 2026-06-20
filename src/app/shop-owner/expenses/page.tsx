"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CrudManagementPage, InfoRow } from "@/components/common/CrudManagementPage";
import { GenericForm } from "@/components/forms/GenericForm";
import { expensesService, type Expense } from "@/services/expenses.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  expenseDate: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().min(0),
  paymentMethod: z.string().min(1),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["expenses"], queryFn: expensesService.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["expenses"] });

  return (
    <CrudManagementPage<Expense & { isActive?: boolean }>
      title="Expenses"
      description="Track operational expenses by category."
      rows={data as (Expense & { isActive?: boolean })[]}
      searchKeys={["category", "referenceNo"]}
      columns={[
        { key: "expenseDate", header: "Date", render: (r) => formatDate(r.expenseDate) },
        { key: "category", header: "Category" },
        { key: "amount", header: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
        { key: "paymentMethod", header: "Method" },
        { key: "referenceNo", header: "Reference" },
      ]}
      showStatus={false}
      formTitle="Expense"
      formContent={(record, close) => (
        <GenericForm<Values>
          schema={schema}
          defaultValues={{
            expenseDate: record?.expenseDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            category: record?.category ?? "",
            amount: record?.amount ?? 0,
            paymentMethod: record?.paymentMethod ?? "CASH",
            referenceNo: record?.referenceNo ?? "",
            notes: record?.notes ?? "",
          }}
          fields={[
            { name: "expenseDate", label: "Date", type: "date" },
            {
              name: "category",
              label: "Category",
              type: "select",
              options: [
                { label: "Rent", value: "Rent" },
                { label: "Utilities", value: "Utilities" },
                { label: "Salaries", value: "Salaries" },
                { label: "Maintenance", value: "Maintenance" },
                { label: "Marketing", value: "Marketing" },
                { label: "Other", value: "Other" },
              ],
            },
            { name: "amount", label: "Amount", type: "number" },
            {
              name: "paymentMethod",
              label: "Payment Method",
              type: "select",
              options: [
                { label: "Cash", value: "CASH" },
                { label: "UPI", value: "UPI" },
                { label: "Card", value: "CARD" },
                { label: "Bank Transfer", value: "BANK_TRANSFER" },
              ],
            },
            { name: "referenceNo", label: "Reference No" },
            { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
          ]}
          onSubmit={async (values) => {
            if (record) await expensesService.update(record.id, values);
            else await expensesService.create(values);
            invalidate();
          }}
          onCancel={close}
        />
      )}
      viewContent={(r) => (
        <>
          <InfoRow label="Date" value={formatDate(r.expenseDate)} />
          <InfoRow label="Category" value={r.category} />
          <InfoRow label="Amount" value={formatCurrency(r.amount)} />
          <InfoRow label="Method" value={r.paymentMethod} />
          <InfoRow label="Reference" value={r.referenceNo} />
          <InfoRow label="Notes" value={r.notes} />
        </>
      )}
      onDelete={async (r) => {
        await expensesService.remove(r.id);
        invalidate();
      }}
    />
  );
}
