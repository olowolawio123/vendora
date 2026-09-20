import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  LoaderCircle,
  CheckCircle2,
  Truck,
  Clock3,
  XCircle,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const OrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `/api/orders/${orderId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load order"
          );
        }

        setOrder(data.order);
      } catch (error) {
        console.error(
          "Load order error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatStatus = (status) => {
    if (!status) return "";

    return status
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "pending":
        return {
          wrapper:
            "border-yellow-200 bg-yellow-50 text-yellow-700",
          icon: Clock3,
        };

      case "processing":
        return {
          wrapper:
            "border-blue-200 bg-blue-50 text-blue-700",
          icon: Package,
        };

      case "shipped":
        return {
          wrapper:
            "border-indigo-200 bg-indigo-50 text-indigo-700",
          icon: Truck,
        };

      case "delivered":
        return {
          wrapper:
            "border-green-200 bg-green-50 text-green-700",
          icon: CheckCircle2,
        };

      case "cancelled":
        return {
          wrapper:
            "border-red-200 bg-red-50 text-red-700",
          icon: XCircle,
        };

      default:
        return {
          wrapper:
            "border-gray-200 bg-gray-50 text-gray-600",
          icon: Package,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-gray-700"
          />

          <p className="mt-4 text-sm text-gray-500">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-950">
            Unable to load order
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <Link
            to="/account"
            className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to My Account
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          to="/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Back to My Orders
        </Link>

        {/* Header */}
        <div className="mt-7 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Order details
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-950">
              {order.orderNumber}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Ordered on{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              Payment:{" "}
              {formatStatus(
                order.paymentStatus
              )}
            </span>

            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              Order:{" "}
              {formatStatus(
                order.orderStatus
              )}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div className="space-y-6">
            {/* Products */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <Package
                    size={20}
                    className="text-gray-700"
                  />

                  <h2 className="text-lg font-bold text-gray-950">
                    Items in this order
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => {
                  const statusStyles =
                    getStatusStyles(
                      item.status
                    );

                  const StatusIcon =
                    statusStyles.icon;

                  return (
                    <div
                      key={item.product}
                      className="p-6"
                    >
                      <div className="flex gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package
                                size={25}
                                className="text-gray-400"
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-950">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Quantity:{" "}
                            {item.quantity}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            ₦
                            {Number(
                              item.price || 0
                            ).toLocaleString()}{" "}
                            each
                          </p>

                          {item.seller && (
                            <p className="mt-2 text-xs text-gray-400">
                              Sold by{" "}
                              {
                                item.seller
                                  .storeName
                              }
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-gray-950">
                            ₦
                            {Number(
                              item.subtotal ||
                                0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Product status */}
                      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Delivery status
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              The seller's latest
                              update for this
                              product.
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles.wrapper}`}
                          >
                            <StatusIcon
                              size={15}
                            />

                            {formatStatus(
                              item.status
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin
                  size={20}
                  className="text-gray-700"
                />

                <h2 className="text-lg font-bold text-gray-950">
                  Delivery address
                </h2>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-5">
                <p className="font-semibold text-gray-950">
                  {
                    order.deliveryAddress
                      ?.fullName
                  }
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {
                    order.deliveryAddress
                      ?.address
                  }
                  <br />
                  {
                    order.deliveryAddress
                      ?.city
                  }
                  ,{" "}
                  {
                    order.deliveryAddress
                      ?.state
                  }
                  <br />
                  {
                    order.deliveryAddress
                      ?.phone
                  }
                </p>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CreditCard
                size={20}
                className="text-gray-700"
              />

              <h2 className="text-lg font-bold text-gray-950">
                Order summary
              </h2>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  ₦
                  {Number(
                    order.subtotal || 0
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Delivery
                </span>

                <span className="font-medium text-gray-900">
                  {order.deliveryFee > 0
                    ? `₦${Number(
                        order.deliveryFee
                      ).toLocaleString()}`
                    : "Free"}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-gray-950">
                    Total
                  </span>

                  <span className="text-xl font-bold text-gray-950">
                    ₦
                    {Number(
                      order.total || 0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {order.paymentReference && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Payment reference
                </p>

                <p className="mt-2 break-all text-xs text-gray-500">
                  {order.paymentReference}
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;