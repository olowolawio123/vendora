import apiFetch from "./apiFetch";

export const getNotifications = async () => {
  const response = await apiFetch("/api/notifications");

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to load notifications"
    );
  }

  return data;
};

export const getUnreadNotificationCount = async () => {
  const response = await apiFetch(
    "/api/notifications/unread-count"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load notification count"
    );
  }

  return data;
};

export const markNotificationAsRead = async (
  notificationId
) => {
  const response = await apiFetch(
    `/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to mark notification as read"
    );
  }

  return data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiFetch(
    "/api/notifications/read-all",
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to mark notifications as read"
    );
  }

  return data;
};

export const deleteNotification = async (
  notificationId
) => {
  const response = await apiFetch(
    `/api/notifications/${notificationId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to delete notification"
    );
  }

  return data;
};