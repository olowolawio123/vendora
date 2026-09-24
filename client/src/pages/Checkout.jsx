import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import apiFetch from "../services/apiFetch";
import { useAuth } from "../context/AuthContext";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] =
    useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] =
    useState(false);
  const [couponError, setCouponError] = useState("");

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (user?.name) {
      setAddress((previous) => ({
        ...previous,
        fullName:
          previous.fullName || user.name,
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/api/cart");

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }

          throw new Error(
            data.message || "Unable to load cart"
          );
        }

        const loadedCart = data.cart;

        const validItems = Array.isArray(
          loadedCart?.items
        )
          ? loadedCart.items.filter(
              (item) => item?.product
            )
          : [];

        if (
          loadedCart &&
          validItems.length !==
            (loadedCart.items?.length || 0)
        ) {
          setCart({
            ...loadedCart,
            items: validItems,
          });

          setError(
            "Some products in your cart are no longer available and have been removed."
          );
        } else {
          setCart(loadedCart);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const validCartItems = useMemo(() => {
    if (!cart?.items) {
      return [];
    }

    return cart.items.filter(
      (item) => item?.product
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return validCartItems.reduce(
      (total, item) => {
        return (
          total +
          Number(item.product.price || 0) *
            Number(item.quantity || 0)
        );
      },
      0
    );
  }, [validCartItems]);

  const discountAmount = useMemo(() => {
    if (!coupon) {
      return 0;
    }

    const discountValue = Number(
      coupon.discountValue || 0
    );

    let discount = 0;

    if (
      coupon.discountType === "percentage"
    ) {
      discount =
        (subtotal * discountValue) / 100;

      if (
        coupon.maximumDiscountAmount !==
          null &&
        coupon.maximumDiscountAmount !==
          undefined
      ) {
        discount = Math.min(
          discount,
          Number(
            coupon.maximumDiscountAmount
          )
        );
      }
    }

    if (
      coupon.discountType === "fixed"
    ) {
      discount = discountValue;
    }

    return Math.min(
      Math.max(discount, 0),
      subtotal
    );
  }, [coupon, subtotal]);

  const finalTotal = Math.max(
    0,
    subtotal - discountAmount
  );

  const totalItems = useMemo(() => {
    return validCartItems.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity || 0)
        );
      },
      0
    );
  }, [validCartItems]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponError(
        "Please enter a coupon code."
      );
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await apiFetch(
        "/api/coupons/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            subtotal,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid coupon code."
        );
      }

      setCoupon(data.coupon);
      setCouponCode(data.coupon.code);
      setCouponError("");
    } catch (error) {
      setCoupon(null);
      setCouponError(error.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleContinue = async (event) => {
    event.preventDefault();

    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.address.trim() ||
      !address.city.trim() ||
      !address.state.trim()
    ) {
      setError(
        "Please complete all delivery details."
      );
      return;
    }

    if (!validCartItems.length) {
      setError(
        "Your cart has no available products. Please return to your cart and add an available product."
      );
      return;
    }

    try {
      setProcessingPayment(true);
      setError("");

      /*
        STEP 1:
        Create the pending order.
      */
      const orderResponse = await apiFetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...address,

            /*
              Coupon information is sent to the
              backend so the backend can apply
              the discount securely.
            */
            couponCode: coupon?.code || null,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Unable to create order"
        );
      }

      const orderId =
        orderData.order._id;

      /*
        STEP 2:
        Ask our backend to initialize Paystack.
      */
      const paymentResponse =
        await apiFetch(
          `/api/orders/${orderId}/pay`,
          {
            method: "POST",
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message ||
            "Unable to initialize payment"
        );
      }

      /*
        STEP 3:
        Redirect customer to Paystack.
      */
      if (
        !paymentData.payment
          ?.authorizationUrl
      ) {
        throw new Error(
          "Paystack did not return a payment URL."
        );
      }

      window.location.href =
        paymentData.payment.authorizationUrl;
    } catch (error) {
      setError(error.message);
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

              <p className="text-sm text-gray-500">
                Loading your checkout...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">
              Unable to load checkout
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <Link
              to="/cart"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <ArrowLeft size={17} />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!validCartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <Package
              size={42}
              className="mx-auto text-gray-400"
            />

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              No available products
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Products that are no longer available
              have been removed from your checkout.
            </p>

            <Link
              to="/cart"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <ArrowLeft size={17} />
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Cart
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your order and provide your
            delivery details.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* Left side */}
          <div className="space-y-6">

            {/* Progress */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
                  1
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    Delivery details
                  </p>

                  <p className="text-xs text-gray-500">
                    Tell us where your order should
                    be delivered
                  </p>
                </div>

                <div className="ml-auto">
                  <CheckCircle
                    size={20}
                    className="text-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Delivery form */}
            <form
              onSubmit={handleContinue}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <MapPin
                    size={20}
                    className="text-gray-800"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-950">
                    Delivery address
                  </h2>

                  <p className="text-sm text-gray-500">
                    Enter the address for this order.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Street address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    value={address.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="House number, street name, landmark..."
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="e.g. Ibadan"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="e.g. Oyo"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processingPayment}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingPayment ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Preparing payment...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Continue to Payment
                  </>
                )}
              </button>
            </form>

            {/* Security */}
            <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <ShieldCheck
                  size={20}
                  className="text-gray-800"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Secure checkout
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your payment will be processed
                  securely. Vendora will verify
                  payment before an order is confirmed.
                </p>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="font-semibold text-gray-950">
                  Order summary
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <CreditCard
                size={21}
                className="text-gray-500"
              />
            </div>

            <div className="mt-5 space-y-4">
              {validCartItems.map((item) => {
                const product = item.product;

                return (
                  <div
                    key={product._id}
                    className="flex gap-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package
                            size={20}
                            className="text-gray-400"
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {product.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ₦
                        {(
                          Number(
                            product.price || 0
                          ) *
                          Number(
                            item.quantity || 0
                          )
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2">
                <Tag
                  size={18}
                  className="text-gray-700"
                />

                <h3 className="text-sm font-semibold text-gray-900">
                  Coupon / Promo Code
                </h3>
              </div>

              {!coupon ? (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(
                          event.target.value.toUpperCase()
                        );
                        setCouponError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm uppercase outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    />

                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="shrink-0 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {couponLoading ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  {couponError && (
                    <p className="mt-2 text-xs text-red-600">
                      {couponError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <CheckCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-green-600"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-green-800">
                          {coupon.code}
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          {coupon.discountType ===
                          "percentage"
                            ? `${coupon.discountValue}% discount`
                            : `₦${Number(
                                coupon.discountValue
                              ).toLocaleString()} discount`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleRemoveCoupon
                      }
                      className="rounded-lg p-1 text-green-700 transition hover:bg-green-100"
                      aria-label="Remove coupon"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-100 pt-5">

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              {coupon && discountAmount > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-green-600">
                    Coupon discount
                  </span>

                  <span className="font-semibold text-green-600">
                    -₦
                    {discountAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Delivery
                </span>

                <span className="font-medium text-gray-900">
                  Calculated later
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-base font-semibold text-gray-950">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-950">
                  ₦{finalTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;