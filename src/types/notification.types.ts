import type { ID } from "./common.types";

export type NotificationType =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "SUCCESS"
  | "ORDER"
  | "STOCK"
  | "PAYMENT"
  | "SYSTEM";

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
