import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Package,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const API_URL = import.meta.env.VITE_API_URL;

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingProduct, setUpdatingProduct] = useState("");
  const [removingProduct, setRemovingProduct] = useState("");
  const [error, setError] = useState("");

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

        throw new Error(data.message || "Unable to load cart");
      }

      setCart(data.cart);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      return;
    }

    setUpdatingProduct(productId);
    setError("");

    try {
  const response = await apiFetch(`/api/cart/item/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quantity,
    }),
  });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update cart"
        );
      }

      await loadCart();
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingProduct("");
    }
  };

  const removeItem = async (productId) => {
    setRemovingProduct(productId);
    setError("");

   try {
  const response = await apiFetch(`/api/cart/item/${productId}`, {
    method: "DELETE",
  });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to remove product"
        );
      }

      await loadCart();
    } catch (error) {
      setError(error.message);
    } finally {
      setRemovingProduct("");
    }
  };

  const subtotal = useMemo(() => {
    if (!cart?.items) {
      return 0;
    }

    return cart.items.reduce((total, item) => {
      if (!item.product) {
        return total;
      }

      return (
        total +
        Number(item.product.price || 0) * Number(item.quantity || 0)
      );
    }, 0);
  }, [cart]);

  const itemCount = useMemo(() => {
    if (!cart?.items) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-gray-200" />

                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShoppingCart size={28} className="text-red-600" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Unable to load cart
          </h1>

          <p className="mt-2 text-gray-500">{error}</p>

          <button
            type="button"
            onClick={loadCart}
            className="mt-6 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const cartItems = cart?.items || [];

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <ShoppingCart size={34} className="text-gray-500" />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-950">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            You haven't added anything to your cart yet. Explore
            Vendora and find something you like.
          </p>

          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Browse Products
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Continue Shopping
        </Link>

        <div className="mt-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Vendora Cart
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Your Shopping Cart
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* CART ITEMS */}
            <section className="space-y-4 lg:col-span-2">
              {cartItems.map((item) => {
                const product = item.product;

                if (!product) {
                  return null;
                }

                const isUpdating =
                  updatingProduct === product._id;

                const isRemoving =
                  removingProduct === product._id;

                const itemTotal =
                  Number(product.price || 0) *
                  Number(item.quantity || 0);

                return (
                  <article
                    key={product._id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex gap-4 sm:gap-5">
                      {/* PRODUCT IMAGE */}
                      <Link
                        to={`/product/${product._id}`}
                        className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-36"
                      >
                        {product.images?.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Package size={35} />
                          </div>
                        )}
                      </Link>

                      {/* PRODUCT INFO */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={`/product/${product._id}`}
                              className="block"
                            >
                              <h2 className="truncate text-base font-bold text-gray-950 hover:text-gray-600 sm:text-lg">
                                {product.title}
                              </h2>
                            </Link>

                            <p className="mt-1 truncate text-xs text-gray-500">
                              {product.seller?.storeName ||
                                "Vendora Seller"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(product._id)
                            }
                            disabled={isRemoving || isUpdating}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Remove ${product.title}`}
                          >
                            {isRemoving ? (
                              <LoaderCircle
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>

                        <div className="mt-3">
                          <p className="text-lg font-bold text-gray-950">
                            ₦
                            {Number(
                              product.price
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          {/* QUANTITY */}
                          <div className="flex items-center rounded-xl border border-gray-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  product._id,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                item.quantity <= 1 ||
                                isUpdating ||
                                isRemoving
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus size={16} />
                            </button>

                            <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900">
                              {isUpdating ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin text-gray-500"
                                />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  product._id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >= product.stock ||
                                isUpdating ||
                                isRemoving
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* ITEM TOTAL */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Item total
                            </p>

                            <p className="mt-1 text-base font-bold text-gray-950">
                              ₦{itemTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.quantity >= product.stock &&
                      product.stock > 0 && (
                        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                          Maximum available quantity reached.
                        </p>
                      )}
                  </article>
                );
              })}
            </section>

            {/* ORDER SUMMARY */}
            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-bold text-gray-950">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-gray-900">
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Delivery
                  </span>

                  <span className="font-medium text-gray-500">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-2xl font-bold tracking-tight text-gray-950">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Proceed to Checkout
                <ArrowRight size={17} />
              </button>

              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="text-xs leading-5 text-gray-500">
                  Your payment will be processed through Vendora's
                  secure checkout system.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;