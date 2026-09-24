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
  Star,
  Send,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const OrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewForms, setReviewForms] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState({});
  const [reviewMessages, setReviewMessages] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [alreadyReviewed, setAlreadyReviewed] = useState({});

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

  const getProductId = (item) => {
    if (!item?.product) {
      return "";
    }

    if (typeof item.product === "object") {
      return (
        item.product._id ||
        item.product.id ||
        ""
      );
    }

    return item.product;
  };

  const getReviewForm = (productId) => {
    return (
      reviewForms[productId] || {
        rating: 0,
        comment: "",
      }
    );
  };

  const updateReviewRating = (
    productId,
    rating
  ) => {
    setReviewForms((current) => ({
      ...current,
      [productId]: {
        ...getReviewForm(productId),
        rating,
      },
    }));

    setReviewErrors((current) => ({
      ...current,
      [productId]: "",
    }));
  };

  const updateReviewComment = (
    productId,
    comment
  ) => {
    setReviewForms((current) => ({
      ...current,
      [productId]: {
        ...getReviewForm(productId),
        comment,
      },
    }));

    setReviewErrors((current) => ({
      ...current,
      [productId]: "",
    }));
  };

  const submitReview = async (item) => {
    const productId = getProductId(item);

    if (!productId) {
      setReviewErrors((current) => ({
        ...current,
        [productId]:
          "Product information is missing.",
      }));

      return;
    }

    const form = getReviewForm(productId);

    if (!form.rating) {
      setReviewErrors((current) => ({
        ...current,
        [productId]:
          "Please select a rating before submitting.",
      }));

      return;
    }

    setReviewSubmitting((current) => ({
      ...current,
      [productId]: true,
    }));

    setReviewErrors((current) => ({
      ...current,
      [productId]: "",
    }));

    setReviewMessages((current) => ({
      ...current,
      [productId]: "",
    }));

    try {
      const response = await apiFetch(
        "/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            productId,
            rating: form.rating,
            comment: form.comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        /*
         * The backend returns 409 when this buyer
         * has already reviewed this product.
         *
         * We handle that here instead of displaying
         * the message as a red error.
         */
        if (
          response.status === 409 ||
          data.message ===
            "You have already reviewed this product"
        ) {
          setAlreadyReviewed((current) => ({
            ...current,
            [productId]: true,
          }));

          setReviewErrors((current) => ({
            ...current,
            [productId]: "",
          }));

          return;
        }

        throw new Error(
          data.message || "Unable to submit review"
        );
      }

      setReviewMessages((current) => ({
        ...current,
        [productId]:
          "Review submitted successfully.",
      }));

      setReviewForms((current) => ({
        ...current,
        [productId]: {
          rating: 0,
          comment: "",
        },
      }));
    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      setReviewErrors((current) => ({
        ...current,
        [productId]: error.message,
      }));
    } finally {
      setReviewSubmitting((current) => ({
        ...current,
        [productId]: false,
      }));
    }
  };

  const renderReviewStars = (
    productId,
    selectedRating
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() =>
              updateReviewRating(
                productId,
                rating
              )
            }
            disabled={
              reviewSubmitting[productId]
            }
            aria-label={`Rate ${rating} out of 5`}
            className="rounded-md p-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              size={24}
              fill={
                rating <= selectedRating
                  ? "currentColor"
                  : "none"
              }
              className={
                rating <= selectedRating
                  ? "text-yellow-500"
                  : "text-gray-300"
              }
            />
          </button>
        ))}
      </div>
    );
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

  const canReview =
    order.paymentStatus === "paid" &&
    order.orderStatus === "delivered";

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
                {order.items?.map((item, index) => {
                  const statusStyles =
                    getStatusStyles(
                      item.status
                    );

                  const StatusIcon =
                    statusStyles.icon;

                  const productId =
                    getProductId(item);

                  const reviewForm =
                    getReviewForm(
                      productId
                    );

                  const isSubmitting =
                    reviewSubmitting[
                      productId
                    ];

                  const reviewMessage =
                    reviewMessages[
                      productId
                    ];

                  const reviewError =
                    reviewErrors[
                      productId
                    ];

                  const hasAlreadyReviewed =
                    alreadyReviewed[
                      productId
                    ];

                  return (
                    <div
                      key={
                        productId ||
                        item._id ||
                        index
                      }
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

                      {/* REVIEW */}
                      {canReview &&
                        productId && (
                          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                <Star
                                  size={19}
                                  className="text-gray-700"
                                />
                              </div>

                              <div>
                                <h3 className="font-bold text-gray-950">
                                  Review this product
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  Share your experience
                                  with other Vendora
                                  buyers.
                                </p>
                              </div>
                            </div>

                            {/* Already reviewed */}
                            {hasAlreadyReviewed ? (
                              <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <CheckCircle2
                                  size={20}
                                  className="mt-0.5 shrink-0 text-blue-600"
                                />

                                <div>
                                  <p className="font-semibold text-blue-900">
                                    You've already reviewed
                                    this product
                                  </p>

                                  <p className="mt-1 text-sm text-blue-700">
                                    Thank you for sharing
                                    your experience with
                                    other Vendora buyers.
                                  </p>
                                </div>
                              </div>
                            ) : reviewMessage ? (
                              <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                                <CheckCircle2
                                  size={19}
                                  className="mt-0.5 shrink-0"
                                />

                                <div>
                                  <p className="font-semibold">
                                    Review submitted
                                  </p>

                                  <p className="mt-1">
                                    Your review has been
                                    added successfully.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mt-5">
                                  <p className="mb-2 text-sm font-semibold text-gray-900">
                                    Your rating
                                  </p>

                                  {renderReviewStars(
                                    productId,
                                    reviewForm.rating
                                  )}

                                  {reviewForm.rating > 0 && (
                                    <p className="mt-2 text-xs text-gray-500">
                                      You selected{" "}
                                      {
                                        reviewForm.rating
                                      }{" "}
                                      out of 5
                                    </p>
                                  )}
                                </div>

                                <div className="mt-5">
                                  <label
                                    htmlFor={`review-${productId}`}
                                    className="mb-2 block text-sm font-semibold text-gray-900"
                                  >
                                    Your review
                                  </label>

                                  <textarea
                                    id={`review-${productId}`}
                                    value={
                                      reviewForm.comment
                                    }
                                    onChange={(event) =>
                                      updateReviewComment(
                                        productId,
                                        event.target
                                          .value
                                      )
                                    }
                                    disabled={
                                      isSubmitting
                                    }
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Tell other buyers about your experience with this product..."
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  />

                                  <p className="mt-1 text-right text-xs text-gray-400">
                                    {
                                      reviewForm.comment
                                        .length
                                    }{" "}
                                    / 1000
                                  </p>
                                </div>

                                {reviewError && (
                                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {reviewError}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    submitReview(
                                      item
                                    )
                                  }
                                  disabled={
                                    isSubmitting ||
                                    !reviewForm.rating
                                  }
                                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <LoaderCircle
                                        size={18}
                                        className="animate-spin"
                                      />
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <Send size={17} />
                                      Submit Review
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        )}
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

            {!canReview && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs leading-5 text-gray-400">
                  Reviews become available after your
                  paid order has been delivered.
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