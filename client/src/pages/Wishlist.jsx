import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MapPin,
  ShoppingBag,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getWishlist,
  removeFromWishlist,
} from "../services/wishlistService";

const Wishlist = () => {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem("vendora_token");

      if (!token) {
        toast.info("Please login to view your wishlist.");
        navigate("/login");
        return;
      }

      try {
        const data = await getWishlist();
        setWishlist(data.wishlist || []);
      } catch (error) {
        console.error("Load wishlist error:", error);

        if (
          error.message === "Authentication required" ||
          error.message === "Invalid or expired authentication token"
        ) {
          localStorage.removeItem("vendora_token");
          toast.error("Please login again.");
          navigate("/login");
          return;
        }

        toast.error(error.message || "Unable to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [navigate]);

  const handleRemove = async (productId) => {
    if (removingId) {
      return;
    }

    setRemovingId(productId);

    try {
      await removeFromWishlist(productId);

      setWishlist((previous) =>
        previous.filter(
          (product) => product._id !== productId
        )
      );

      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Remove wishlist error:", error);
      toast.error(
        error.message || "Unable to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-square animate-pulse bg-gray-200" />

                <div className="space-y-3 p-4">
                  <div className="h-5 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
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
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-white">
              <Heart size={21} fill="currentColor" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                My Wishlist
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {wishlist.length === 0
                  ? "Products you save will appear here."
                  : `${wishlist.length} ${
                      wishlist.length === 1
                        ? "product"
                        : "products"
                    } saved`}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Heart size={34} className="text-gray-400" />
            </div>

            <h2 className="mt-6 text-xl font-semibold text-gray-950">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Save products you love and come back to them
              whenever you are ready to buy.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Browse Products
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          /* Wishlist Products */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((product) => {
              const image =
                product.images?.[0] ||
                "https://placehold.co/600x600?text=Vendora";

              const sellerName =
                product.seller?.storeName ||
                "Vendora Seller";

              const sellerLocation =
                product.seller?.location || "";

              const isRemoving =
                removingId === product._id;

              return (
                <div
                  key={product._id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image */}
                  <Link
                    to={`/product/${product._id}`}
                    className="relative block aspect-square overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-950 shadow-sm backdrop-blur">
                      <Heart
                        size={17}
                        fill="currentColor"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link
                      to={`/product/${product._id}`}
                      className="block"
                    >
                      <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold text-gray-950 transition hover:text-gray-600">
                        {product.title}
                      </h2>
                    </Link>

                    <p className="mt-2 text-lg font-bold text-gray-950">
                      ₦
                      {Number(product.price || 0).toLocaleString()}
                    </p>

                    {/* Seller */}
                    <div className="mt-3 space-y-1">
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <ShoppingBag
                          size={15}
                          className="shrink-0"
                        />
                        <span className="truncate">
                          {sellerName}
                        </span>
                      </p>

                      {sellerLocation && (
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin
                            size={14}
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {sellerLocation}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                      <Link
                        to={`/product/${product._id}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        View Product
                        <ArrowRight size={16} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(product._id)
                        }
                        disabled={isRemoving}
                        aria-label="Remove from wishlist"
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${
                          isRemoving
                            ? "cursor-wait opacity-50"
                            : ""
                        }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;