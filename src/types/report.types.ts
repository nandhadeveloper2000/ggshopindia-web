export interface ReportSummary {
  totalSales?: number;
  totalPurchases?: number;
  totalExpenses?: number;
  totalRevenue?: number;
  netProfit?: number;
  totalOrders?: number;
  pendingOrders?: number;
  lowStockCount?: number;
  stockValue?: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ReportFilters {
  shopId?: string | number;
  fromDate?: string;
  toDate?: string;
  status?: string;
}
