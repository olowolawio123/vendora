import apiFetch from "../services/apiFetch";
import { useEffect, useState } from "react";
import {
  Package,
  User,
  Mail,
  ShieldCheck,
  LogOut,
  LoaderCircle,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const Account = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");

        const response = await apiFetch("/api/orders/my-orders");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your orders"
          );
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error("Load orders error:", error);
        setOrdersError(error.message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatusClass = (status) => {
    if (status === "paid") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "failed") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "refunded") {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  const getOrderStatusClass = (status) => {
    if (status === "delivered") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "cancelled") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "shipped") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === "processing") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }

    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Account
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                My Account
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage your account and keep track of your orders.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Account overview */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile card */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-950 text-xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-950">
                  {user?.name || "User"}
                </h2>

                <p className="truncate text-sm text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-start gap-3">
                <User
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {user?.name || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {user?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Account type
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                    {user?.role || "Buyer"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Orders */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  My Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View your recent purchases and order status.
                </p>
              </div>

              <div className="hidden rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 sm:block">
                {orders.length}{" "}
                {orders.length === 1 ? "order" : "orders"}
              </div>
            </div>

            {loadingOrders ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <LoaderCircle
                  size={32}
                  className="mx-auto animate-spin text-gray-700"
                />

                <p className="mt-4 text-sm text-gray-500">
                  Loading your orders...
                </p>
              </div>
            ) : ordersError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-red-600">
                  {ordersError}
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <ShoppingBag
                    size={25}
                    className="text-gray-600"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-950">
                  No orders yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  When you purchase something on Vendora,
                  your orders will appear here.
                </p>

                <Link
                  to="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <ShoppingBag size={17} />
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package
                            size={18}
                            className="text-gray-700"
                          />

                          <p className="text-sm font-bold text-gray-950">
                            {order.orderNumber}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Ordered on{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-gray-950">
                          ₦
                          {Number(
                            order.total || 0
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.items?.length || 0}{" "}
                          {order.items?.length === 1
                            ? "product"
                            : "products"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        Payment:{" "}
                        {order.paymentStatus}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        Order:{" "}
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Delivery to
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {order.deliveryAddress?.city},{" "}
                            {order.deliveryAddress?.state}
                          </p>
                        </div>

                        <Link
                          to={`/account/orders/${order._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                          View Order
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Account;