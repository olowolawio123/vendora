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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [processingPayment, setProcessingPayment] = useState(false);

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
        fullName: previous.fullName || user.name,
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/cart`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }

          throw new Error(data.message || "Unable to load cart");
        }

        setCart(data.cart);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }, [cart]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
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
    setError("Please complete all delivery details.");
    return;
  }

  try {
    setProcessingPayment(true);
    setError("");

    /*
      STEP 1:
      Create the pending order.
    */
    const orderResponse = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(address),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(
        orderData.message || "Unable to create order"
      );
    }

    const orderId = orderData.order._id;

    /*
      STEP 2:
      Ask our backend to initialize Paystack.
    */
    const paymentResponse = await fetch(
      `${API_URL}/api/orders/${orderId}/pay`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const paymentData = await paymentResponse.json();

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
    if (!paymentData.payment?.authorizationUrl) {
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

            <p className="mt-2 text-sm text-red-600">{error}</p>

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

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <Package
              size={42}
              className="mx-auto text-gray-400"
            />

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Add products to your cart before proceeding to checkout.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Browse Products
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
            Review your order and provide your delivery details.
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
                    Tell us where your order should be delivered
                  </p>
                </div>

                <div className="ml-auto">
                  <CheckCircle size={20} className="text-green-600" />
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
                  <MapPin size={20} className="text-gray-800" />
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
                <ShieldCheck size={20} className="text-gray-800" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Secure checkout
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your payment will be processed securely. Vendora will
                  verify payment before an order is confirmed.
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
                  {totalItems === 1 ? "item" : "items"}
                </p>
              </div>

              <CreditCard size={21} className="text-gray-500" />
            </div>

            <div className="mt-5 space-y-4">
              {cart.items.map((item) => {
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
                          product.price * item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>

                <span className="font-medium text-gray-900">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Delivery</span>

                <span className="font-medium text-gray-900">
                  Calculated later
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-base font-semibold text-gray-950">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-950">
                  ₦{subtotal.toLocaleString()}
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