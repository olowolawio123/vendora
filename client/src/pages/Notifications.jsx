import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Load notifications error:", error);
      toast.error(
        error.message || "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }

      if (notification.order?._id) {
        navigate(
          `/account/orders/${notification.order._id}`
        );
      }
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to update notification"
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setActionLoading(true);

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to update notifications"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (
    event,
    notificationId
  ) => {
    event.stopPropagation();

    try {
      setActionLoading(true);

      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter(
          (item) => item._id !== notificationId
        )
      );

      if (notification && !notification.isRead) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }

      toast.success("Notification deleted");
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to delete notification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getNotificationIcon = (type) => {
    if (
      type === "order_placed" ||
      type === "payment_successful" ||
      type === "order_processing" ||
      type === "order_shipped" ||
      type === "order_delivered" ||
      type === "order_cancelled"
    ) {
      return <Package size={20} />;
    }

    return <Bell size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Bell
                  size={24}
                  className="text-gray-800"
                />

                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Stay updated on your orders and account
                activity.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck size={17} />
              )}

              Mark all as read
            </button>
          )}
        </div>

        {/* Unread count */}
        {!loading && unreadCount > 0 && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            You have{" "}
            <span className="font-semibold">
              {unreadCount}
            </span>{" "}
            unread{" "}
            {unreadCount === 1
              ? "notification"
              : "notifications"}
            .
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2
                size={22}
                className="animate-spin"
              />
              <span>Loading notifications...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Bell size={30} />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No notifications yet
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              When there is an update about your orders
              or account, it will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Continue shopping
            </button>
          </div>
        )}

        {/* Notifications */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleNotificationClick(
                    notification
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    handleNotificationClick(
                      notification
                    );
                  }
                }}
                className={`group relative cursor-pointer rounded-xl border p-4 transition sm:p-5 ${
                  notification.isRead
                    ? "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    : "border-blue-200 bg-blue-50/60 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getNotificationIcon(
                      notification.type
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pr-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`text-sm sm:text-base ${
                          notification.isRead
                            ? "font-medium text-gray-800"
                            : "font-semibold text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h2>

                      {!notification.isRead && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(
                        notification.createdAt
                      )}
                    </p>

                    {notification.order?._id && (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        View order
                      </p>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(event) =>
                      handleDelete(
                        event,
                        notification._id
                      )
                    }
                    disabled={actionLoading}
                    className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;