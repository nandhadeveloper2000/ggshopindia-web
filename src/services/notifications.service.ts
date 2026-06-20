import { apiRequest } from "./_helpers";
import type { Notification } from "@/types/notification.types";
import type { ID } from "@/types/common.types";

export const notificationsService = {
  list: () => apiRequest<Notification[]>({ url: "/notifications" }),
  markRead: (id: ID) => apiRequest<Notification>({ method: "PATCH", url: `/notifications/${id}/read` }),
  markAllRead: () => apiRequest<void>({ method: "POST", url: "/notifications/read-all" }),
  remove: (id: ID) => apiRequest<void>({ method: "DELETE", url: `/notifications/${id}` }),
};
