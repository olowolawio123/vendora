import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Star,
  Package,
  Minus,
  Plus,
  ShoppingCart,
  ShieldCheck,
  Store,
  LoaderCircle,
  CheckCircle,
} from "lucide-react";
import apiFetch from "../services/apiFetch";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/products/${productId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load product"
          );
        }

        setProduct(data.product);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity((current) => current + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const handleAddToCart = async () => {
    setError("");
    setCartMessage("");

    if (!user) {
      navigate("/login", {
        state: {
          from: `/product/${productId}`,
        },
      });

      return;
    }

    setAddingToCart(true);

    try {
      const response = await apiFetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to add product to cart"
        );
      }

      setCartMessage(
        `${quantity} ${
          quantity === 1 ? "item" : "items"
        } added to your cart.`
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-gray-200" />

            <div className="space-y-5 py-4">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Package size={28} className="text-red-600" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Unable to load product
          </h1>

          <p className="mt-2 text-gray-500">{error}</p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package size={28} className="text-gray-500" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Product not found
          </h1>

          <p className="mt-2 text-gray-500">
            This product may have been removed or is no longer available.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock === 0;
  const productRating = Number(product.rating || 0);
  const sellerRating = Number(product.seller?.rating || 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* IMAGE SECTION */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {product.images?.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <Package size={70} strokeWidth={1.2} />

                  <p className="mt-4 text-sm font-medium">
                    No product image available
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Product images will appear here
                  </p>
                </div>
              )}

              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                {product.category}
              </span>

              {!isOutOfStock && product.stock <= 5 && (
                <span className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                  Only {product.stock} left
                </span>
              )}

              {isOutOfStock && (
                <span className="absolute right-4 top-4 rounded-full bg-gray-950 px-4 py-2 text-xs font-semibold text-white">
                  Out of Stock
                </span>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {product.images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="flex flex-col">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {product.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {product.title}
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Star
                  size={18}
                  fill="currentColor"
                  className="text-gray-500"
                />

                <span className="text-sm font-semibold text-gray-800">
                  {productRating.toFixed(1)}
                </span>
              </div>

              <span className="text-sm text-gray-400">
                {product.totalReviews || 0} reviews
              </span>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight text-gray-950">
                ₦{Number(product.price).toLocaleString()}
              </p>
            </div>

            <div className="mt-7 border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-950">
                Description
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                {product.description}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm">
              <Package size={17} className="text-gray-500" />

              {isOutOfStock ? (
                <span className="font-semibold text-gray-700">
                  Currently out of stock
                </span>
              ) : (
                <span className="text-gray-600">
                  <strong className="text-gray-900">
                    {product.stock}
                  </strong>{" "}
                  available in stock
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || addingToCart}
                    className="flex h-11 w-11 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="flex h-11 w-12 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >= product.stock || addingToCart
                    }
                    className="flex h-11 w-11 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* CART MESSAGE */}
            {cartMessage && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle size={19} className="shrink-0" />
                <span>{cartMessage}</span>
              </div>
            )}

            {/* CART ERROR */}
            {error && product && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ADD TO CART */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {addingToCart ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart size={19} />

                  {isOutOfStock
                    ? "Out of Stock"
                    : `Add ${quantity} to Cart`}
                </>
              )}
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="shrink-0 text-gray-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Vendora marketplace
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Shop through Vendora's marketplace system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Package
                    size={20}
                    className="shrink-0 text-gray-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Product availability
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Stock information is provided by the seller.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SELLER SECTION */}
        <section className="mt-14 border-t border-gray-200 pt-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Store size={25} className="text-gray-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sold by
                  </p>

                  {product.seller?._id ? (
                    <Link
                      to={`/seller/${product.seller._id}`}
                      className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-gray-950 transition hover:text-gray-600"
                    >
                      {product.seller?.storeName ||
                        "Vendora Seller"}

                      <Store size={18} />
                    </Link>
                  ) : (
                    <h2 className="mt-1 text-xl font-bold text-gray-950">
                      {product.seller?.storeName ||
                        "Vendora Seller"}
                    </h2>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} />
                      {product.seller?.location ||
                        "Location not specified"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Star
                        size={15}
                        fill="currentColor"
                        className="text-gray-500"
                      />
                      {sellerRating.toFixed(1)} seller rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-sm leading-6 text-gray-500">
                  Visit this seller's store to view their available
                  products and store information.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-950 p-6 text-white">
              <ShieldCheck size={25} />

              <h3 className="mt-4 text-lg font-bold">
                Shop with confidence
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-300">
                Vendora is being built with seller verification,
                secure payments, reviews and reporting tools to
                help create a safer marketplace.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProductDetails;