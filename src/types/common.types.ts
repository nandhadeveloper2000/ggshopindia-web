export type ID = string | number;

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}
