import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Star,
  Store,
  Package,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

function SellerStore() {
  const { sellerId } = useParams();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSellerStore = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/sellers/${sellerId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load seller store"
          );
        }

        setSeller(data.seller);
        setProducts(data.products || []);
      } catch (error) {
        console.error("Load seller store error:", error);
        toast.error(
          error.message || "Unable to load seller store"
        );
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      loadSellerStore();
    }
  }, [sellerId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderRating = (rating) => {
    const roundedRating = Math.round(rating || 0);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= roundedRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="min-h-[calc(100vh-80px)] bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-48 rounded-3xl bg-gray-200" />

            <div className="mt-6 h-8 w-64 rounded bg-gray-200" />

            <div className="mt-3 h-5 w-96 max-w-full rounded bg-gray-200" />

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="aspect-square bg-gray-200" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-5 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!seller) {
    return (
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <Store
            size={48}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Store not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            This seller store may no longer be available.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold !text-white transition-colors hover:bg-gray-800"
          >
            <ArrowLeft size={18} />
            Back to products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-80px)] bg-gray-50">
      {/* STORE HEADER */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white">
                <Store size={30} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {seller.storeName}
                  </h1>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Verified Seller
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Owned by {seller.ownerName}
                </p>

                {seller.location && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{seller.location}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  {renderRating(seller.rating)}

                  <span className="text-sm font-medium text-gray-700">
                    {Number(seller.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <Package size={20} className="text-gray-700" />
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {products.length}
                  </p>

                  <p className="text-xs text-gray-500">
                    Products
                  </p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-gray-200 sm:block" />

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <ShoppingBag
                    size={20}
                    className="text-gray-700"
                  />
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-900">
                    Active
                  </p>

                  <p className="text-xs text-gray-500">
                    Store status
                  </p>
                </div>
              </div>
            </div>
          </div>

          {seller.description && (
            <div className="mt-7 max-w-3xl">
              <p className="text-sm leading-7 text-gray-600">
                {seller.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Products from {seller.storeName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Browse available products from this store.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
            <Package
              size={48}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-lg font-semibold text-gray-900">
              No products available
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              This seller does not have any active products
              available right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package
                        size={42}
                        className="text-gray-300"
                      />
                    </div>
                  )}

                  {product.stock <= 0 && (
                    <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                      Out of stock
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {product.category}
                  </p>

                  <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-gray-900">
                    {product.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>

                    <span className="text-xs text-gray-500">
                      {product.stock > 0
                        ? `${product.stock} left`
                        : "Unavailable"}
                    </span>
                  </div>

                  {product.rating > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />

                      <span className="text-xs font-medium text-gray-700">
                        {Number(product.rating).toFixed(1)}
                      </span>

                      <span className="text-xs text-gray-400">
                        ({product.totalReviews || 0})
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SellerStore;