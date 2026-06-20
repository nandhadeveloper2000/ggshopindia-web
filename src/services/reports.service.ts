import { apiRequest } from "./_helpers";
import type { ReportFilters, ReportSummary, ChartPoint } from "@/types/report.types";

export const reportsService = {
  summary: (filters?: ReportFilters) => apiRequest<ReportSummary>({ url: "/reports/summary", params: filters }),
  sales: (filters?: ReportFilters) => apiRequest<ChartPoint[]>({ url: "/reports/sales", params: filters }),
  purchases: (filters?: ReportFilters) => apiRequest<ChartPoint[]>({ url: "/reports/purchases", params: filters }),
  stockValue: (filters?: ReportFilters) => apiRequest<ChartPoint[]>({ url: "/reports/stock-value", params: filters }),
  orderStatus: () => apiRequest<ChartPoint[]>({ url: "/reports/order-status" }),
};
