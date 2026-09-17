import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import apiFetch from "../services/apiFetch";

const formatCurrency = (amount) => {
  return `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "failed":
      return "bg-red-100 text-red-700";

    case "refunded":
      return "bg-gray-100 text-gray-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "shipped":
      return "bg-purple-100 text-purple-700";

    case "delivered":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSellerOrders = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(
          "/api/orders/seller-orders",
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load seller orders"
          );
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error(
          "Seller orders error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load seller orders"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSellerOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/seller"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              Back to Seller Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">
              Seller Orders
            </h1>

            <p className="mt-1 text-gray-600">
              View orders containing your products.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2
                size={22}
                className="animate-spin"
              />
              Loading orders...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package
                size={28}
                className="text-gray-500"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-600">
              Orders containing your products will
              appear here after customers make
              purchases.
            </p>

            <Link
              to="/seller/products"
              className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Manage Products
            </Link>
          </div>
        )}

        {/* Orders */}
        {!loading && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Order header */}
                <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order number
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-gray-900">
                        {order.orderNumber}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        Payment:{" "}
                        {order.paymentStatus}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        Order:{" "}
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order details */}
                <div className="grid gap-6 px-5 py-6 md:grid-cols-3 sm:px-6">
                  {/* Buyer */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <User size={17} />
                      Buyer
                    </div>

                    <p className="text-sm text-gray-700">
                      {order.buyer?.name ||
                        "Customer"}
                    </p>

                    {order.buyer?.email && (
                      <p className="mt-1 text-xs text-gray-500">
                        {order.buyer.email}
                      </p>
                    )}

                    {order.buyer?.phone && (
                      <p className="mt-1 text-xs text-gray-500">
                        {order.buyer.phone}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Calendar size={17} />
                      Order date
                    </div>

                    <p className="text-sm text-gray-700">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Total */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <ShoppingBag size={17} />
                      Your order total
                    </div>

                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        order.total
                      )}
                    </p>
                  </div>
                </div>

                {/* Products */}
                <div className="border-t border-gray-200">
                  <div className="px-5 py-4 sm:px-6">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Products
                    </h3>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {order.items?.map(
                      (item, index) => (
                        <div
                          key={`${order.id}-${item.product}-${index}`}
                          className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                        >
                          {/* Image */}
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package
                                  size={24}
                                />
                              </div>
                            )}
                          </div>

                          {/* Product info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity:{" "}
                              {item.quantity}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Unit price:{" "}
                              {formatCurrency(
                                item.price
                              )}
                            </p>
                          </div>

                          {/* Subtotal */}
                          <div className="sm:text-right">
                            <p className="text-sm text-gray-500">
                              Subtotal
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {formatCurrency(
                                item.subtotal
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Delivery address */}
                {order.deliveryAddress && (
                  <div className="border-t border-gray-200 bg-gray-50 px-5 py-5 sm:px-6">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Delivery information
                    </h3>

                    <p className="mt-2 text-sm text-gray-600">
                      {
                        order.deliveryAddress
                          .fullName
                      }{" "}
                      ·{" "}
                      {
                        order.deliveryAddress
                          .phone
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {
                        order.deliveryAddress
                          .address
                      }
                      ,{" "}
                      {
                        order.deliveryAddress.city
                      }
                      ,{" "}
                      {
                        order.deliveryAddress.state
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;