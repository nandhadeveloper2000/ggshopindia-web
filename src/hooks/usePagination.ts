"use client";
import { useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  return { page, pageSize, setPage, setPageSize };
}
