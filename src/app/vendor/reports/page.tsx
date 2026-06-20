"use client";

import { useQuery } from "@tanstack/react-query";
import { ReportsPage } from "@/components/common/ReportsPage";
import { ChartCard } from "@/components/common/ChartCard";
import { PurchaseChart } from "@/components/dashboard/PurchaseChart";
import { reportsService } from "@/services/reports.service";

export default function VendorReportsPage() {
  const purchases = useQuery({ queryKey: ["report-purchases"], queryFn: () => reportsService.purchases() });
  return (
    <ReportsPage title="Vendor Reports" description="Your supply volume, payments and outstanding amounts" onApply={() => undefined}>
      <ChartCard title="Purchases supplied">
        <PurchaseChart data={purchases.data ?? []} />
      </ChartCard>
    </ReportsPage>
  );
}
