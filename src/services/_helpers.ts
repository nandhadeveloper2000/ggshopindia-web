export { apiRequest } from "@/lib/axios";

/** Minimal shape of a Spring-style paginated response body (the envelope's `.data`). */
export interface PagedResult<T> {
  content?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  first?: boolean;
}

/**
 * Fetches every page of a paginated endpoint and returns the concatenated
 * content. Loops until the server reports the last page, so the full dataset
 * is returned even when it exceeds the server's max page size (which caps how
 * many rows a single request may return). Used by admin list views that
 * filter/paginate on the client and therefore need every row loaded.
 *
 * @param fetchPage requests one page; the server may cap `size` lower than asked.
 * @param pageSize  rows requested per round-trip.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PagedResult<T> | undefined>,
  pageSize = 500,
): Promise<T[]> {
  const all: T[] = [];
  const MAX_PAGES = 1000; // hard safety stop against a misreporting server
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchPage(page, pageSize);
    const content = res?.content ?? [];
    all.push(...content);
    if (content.length === 0 || res?.last === true) break;

    const totalPages = res?.totalPages;
    if (typeof totalPages === "number") {
      if (page + 1 >= totalPages) break;
    } else if (content.length < (res?.size ?? pageSize)) {
      // No paging metadata available: a short page means we've reached the end.
      break;
    }
  }
  return all;
}
