import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
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
  MessageSquare,
} from "lucide-react";
import apiFetch from "../services/apiFetch";
import { createConversation } from "../services/messageService";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedProductsLoading, setRelatedProductsLoading] =
    useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reviewSummary, setReviewSummary] = useState({
    rating: 0,
    totalReviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [startingConversation, setStartingConversation] =
    useState(false);
  const [error, setError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const relatedProductsRef = useRef(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedImageIndex(0);

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

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await fetch(
          `${API_URL}/api/reviews/product/${productId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load reviews"
          );
        }

        setReviews(data.reviews || []);

        setReviewSummary({
          rating: Number(data.rating || 0),
          totalReviews: Number(data.totalReviews || 0),
        });
      } catch (error) {
        console.error("Load reviews error:", error);
        setReviewsError(error.message);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  useEffect(() => {
    const loadRelatedProducts = async () => {
      if (!product?.category) {
        setRelatedProducts([]);
        setRelatedProductsLoading(false);
        return;
      }

      try {
        setRelatedProductsLoading(true);

        const params = new URLSearchParams();

        params.set("category", product.category);
        params.set("limit", "12");

        const response = await fetch(
          `${API_URL}/api/products?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load related products"
          );
        }

        const related = (data.products || [])
          .filter(
            (item) =>
              item._id?.toString() !==
              product._id?.toString()
          )
          .slice(0, 12);

        setRelatedProducts(related);
      } catch (error) {
        console.error(
          "Load related products error:",
          error
        );

        setRelatedProducts([]);
      } finally {
        setRelatedProductsLoading(false);
      }
    };

    loadRelatedProducts();
  }, [product]);

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

  const handleMessageSeller = async () => {
    setError("");

    if (!user) {
      navigate("/login", {
        state: {
          from: `/product/${productId}`,
        },
      });

      return;
    }

    if (!product?.seller?._id) {
      setError(
        "This seller is currently unavailable for messaging."
      );

      return;
    }

    try {
      setStartingConversation(true);

      const data = await createConversation(
        product._id,
        product.seller._id
      );

      const conversationId =
        data?.conversation?._id;

      if (!conversationId) {
        throw new Error(
          "Unable to open the conversation"
        );
      }

      navigate(
        `/messages?conversation=${conversationId}`
      );
    } catch (error) {
      console.error(
        "Start conversation error:",
        error
      );

      setError(
        error.message ||
          "Unable to start conversation"
      );
    } finally {
      setStartingConversation(false);
    }
  };

  const formatReviewDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={
              star <= Number(rating || 0)
                ? "currentColor"
                : "none"
            }
            className={
              star <= Number(rating || 0)
                ? "text-yellow-500"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const getRatingCount = (rating) => {
    return reviews.filter(
      (review) => Number(review.rating) === rating
    ).length;
  };

  const showPreviousImage = () => {
    if (!product?.images?.length) return;

    setSelectedImageIndex((current) =>
      current === 0
        ? product.images.length - 1
        : current - 1
    );
  };

  const showNextImage = () => {
    if (!product?.images?.length) return;

    setSelectedImageIndex((current) =>
      current === product.images.length - 1
        ? 0
        : current + 1
    );
  };

  const scrollRelatedProducts = (direction) => {
    if (!relatedProductsRef.current) return;

    const amount =
      relatedProductsRef.current.clientWidth * 0.85;

    relatedProductsRef.current.scrollBy({
      left:
        direction === "right"
          ? amount
          : -amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-2 lg:gap-10">
            <div className="aspect-square animate-pulse rounded-xl bg-gray-200 sm:rounded-2xl" />

            <div className="space-y-4 py-2 sm:space-y-5 sm:py-4">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200 sm:h-10" />
              <div className="h-7 w-40 animate-pulse rounded bg-gray-200 sm:h-8" />
              <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
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
    return null;
  }

  const isOutOfStock = product.stock === 0;

  const productRating =
    reviewSummary.totalReviews > 0
      ? reviewSummary.rating
      : Number(product.rating || 0);

  const totalReviews =
    reviewSummary.totalReviews > 0
      ? reviewSummary.totalReviews
      : Number(product.totalReviews || 0);

  const sellerRating = Number(
    product.seller?.rating || 0
  );

  const productImages = product.images || [];

  const selectedImage =
    productImages[selectedImageIndex] ||
    productImages[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* BACK TO PRODUCTS */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-2 lg:gap-14">
          {/* IMAGE SECTION */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white sm:rounded-2xl">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gray-100 px-4 text-center text-gray-400">
                  <Package
                    size={56}
                    strokeWidth={1.2}
                    className="sm:h-[70px] sm:w-[70px]"
                  />

                  <p className="mt-4 text-sm font-medium">
                    No product image available
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Product images will appear here
                  </p>
                </div>
              )}

              {/* CATEGORY */}
              <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs">
                {product.category}
              </span>

              {/* LOW STOCK */}
              {!isOutOfStock && product.stock <= 5 && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur sm:right-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs">
                  Only {product.stock} left
                </span>
              )}

              {/* OUT OF STOCK */}
              {isOutOfStock && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-gray-950 px-3 py-1.5 text-[11px] font-semibold text-white sm:right-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs">
                  Out of Stock
                </span>
              )}

              {/* IMAGE CAROUSEL ARROWS */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Previous product image"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md transition hover:bg-white sm:left-3 sm:h-11 sm:w-11"
                  >
                    <ArrowLeft
                      size={17}
                      className="sm:h-5 sm:w-5"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Next product image"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md transition hover:bg-white sm:right-3 sm:h-11 sm:w-11"
                  >
                    <ArrowRight
                      size={17}
                      className="sm:h-5 sm:w-5"
                    />
                  </button>

                  {/* IMAGE COUNTER */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-950/80 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur sm:bottom-4 sm:px-3 sm:py-1.5 sm:text-xs">
                    {selectedImageIndex + 1} /{" "}
                    {productImages.length}
                  </div>
                </>
              )}
            </div>

            {/* IMAGE THUMBNAILS */}
            {productImages.length > 1 && (
              <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2 sm:mt-4 sm:gap-3">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() =>
                      setSelectedImageIndex(index)
                    }
                    aria-label={`View product image ${
                      index + 1
                    }`}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white transition sm:h-20 sm:w-20 ${
                      selectedImageIndex === index
                        ? "border-2 border-gray-950"
                        : "border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* IMAGE DOTS */}
            {productImages.length > 1 && (
              <div className="mt-2.5 flex justify-center gap-1.5 sm:mt-3">
                {productImages.map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() =>
                      setSelectedImageIndex(index)
                    }
                    aria-label={`Go to image ${
                      index + 1
                    }`}
                    className={`h-1.5 rounded-full transition-all sm:h-2 ${
                      selectedImageIndex === index
                        ? "w-5 bg-gray-950 sm:w-6"
                        : "w-1.5 bg-gray-300 sm:w-2"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-sm">
              {product.category}
            </p>

            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-gray-950 sm:text-4xl">
              {product.title}
            </h1>

            {/* RATING */}
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-4 sm:gap-4">
              <div className="flex items-center gap-2">
                {renderStars(productRating, 17)}

                <span className="text-sm font-semibold text-gray-800">
                  {productRating.toFixed(1)}
                </span>
              </div>

              <span className="text-sm text-gray-400">
                {totalReviews}{" "}
                {totalReviews === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>

            {/* PRICE */}
            <div className="mt-4 sm:mt-6">
              <p className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                ₦{Number(product.price).toLocaleString()}
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-5 border-t border-gray-200 pt-5 sm:mt-7 sm:pt-6">
              <h2 className="text-sm font-semibold text-gray-950">
                Description
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600 sm:mt-3 sm:leading-7">
                {product.description}
              </p>
            </div>

            {/* STOCK */}
            <div className="mt-5 flex items-center gap-2 text-sm sm:mt-6">
              <Package
                size={17}
                className="shrink-0 text-gray-500"
              />

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

            {/* QUANTITY */}
            {!isOutOfStock && (
              <div className="mt-5 sm:mt-6">
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={
                      quantity <= 1 ||
                      addingToCart
                    }
                    className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="flex h-10 w-11 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900 sm:h-11 sm:w-12">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >= product.stock ||
                      addingToCart
                    }
                    className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* CART SUCCESS MESSAGE */}
            {cartMessage && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-700 sm:mt-5 sm:px-4">
                <CheckCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>{cartMessage}</span>
              </div>
            )}

            {/* ERROR */}
            {error && product && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:mt-5 sm:px-4">
                {error}
              </div>
            )}

            {/* ADD TO CART */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                isOutOfStock || addingToCart
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:mt-6 sm:px-6 sm:py-4"
            >
              {addingToCart ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />

                  {isOutOfStock
                    ? "Out of Stock"
                    : `Add ${quantity} to Cart`}
                </>
              )}
            </button>

            {/* MESSAGE SELLER */}
            <button
              type="button"
              onClick={handleMessageSeller}
              disabled={startingConversation}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-3 sm:px-6 sm:py-4"
            >
              {startingConversation ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Opening Conversation...
                </>
              ) : (
                <>
                  <MessageSquare size={18} />
                  Message Seller
                </>
              )}
            </button>

            {/* PRODUCT TRUST INFORMATION */}
            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4">
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
                      Shop through Vendora's marketplace
                      system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4">
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
                      Stock information is provided by the
                      seller.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SELLER SECTION */}
        <section className="mt-10 border-t border-gray-200 pt-8 sm:mt-14 sm:pt-10">
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 lg:col-span-2">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:h-14 sm:w-14">
                  <Store
                    size={23}
                    className="text-gray-600 sm:h-[25px] sm:w-[25px]"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
                    Sold by
                  </p>

                  {product.seller?._id ? (
                    <Link
                      to={`/seller/${product.seller._id}`}
                      className="mt-1 inline-flex max-w-full items-center gap-2 text-lg font-bold text-gray-950 transition hover:text-gray-600 sm:text-xl"
                    >
                      <span className="truncate">
                        {product.seller?.storeName ||
                          "Vendora Seller"}
                      </span>

                      <Store
                        size={17}
                        className="shrink-0 sm:h-[18px] sm:w-[18px]"
                      />
                    </Link>
                  ) : (
                    <h2 className="mt-1 text-lg font-bold text-gray-950 sm:text-xl">
                      {product.seller?.storeName ||
                        "Vendora Seller"}
                    </h2>
                  )}

                  <div className="mt-2 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin
                        size={15}
                        className="shrink-0"
                      />

                      <span className="truncate">
                        {product.seller?.location ||
                          "Location not specified"}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Star
                        size={15}
                        fill="currentColor"
                        className={
                          sellerRating > 0
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }
                      />

                      {sellerRating.toFixed(1)} seller rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 sm:mt-6 sm:pt-5">
                <p className="text-sm leading-6 text-gray-500">
                  Visit this seller's store to view their
                  available products and store information.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-950 p-5 text-white sm:rounded-2xl sm:p-6">
              <ShieldCheck size={25} />

              <h3 className="mt-3 text-lg font-bold sm:mt-4">
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

        {/* REVIEWS */}
        <section className="mt-10 border-t border-gray-200 pt-8 sm:mt-14 sm:pt-10">
          <div className="flex items-start gap-3">
            <MessageSquare
              size={21}
              className="mt-0.5 shrink-0 text-gray-700 sm:h-[22px] sm:w-[22px]"
            />

            <div>
              <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Customer reviews
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Reviews from buyers who purchased this product.
              </p>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:mt-8 sm:rounded-2xl sm:p-8">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />

                Loading reviews...
              </div>
            </div>
          ) : reviewsError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:mt-8 sm:rounded-2xl sm:p-6">
              {reviewsError}
            </div>
          ) : (
            <>
              {/* REVIEW SUMMARY */}
              <div className="mt-6 grid gap-5 rounded-xl border border-gray-200 bg-white p-4 sm:mt-8 sm:gap-6 sm:rounded-2xl sm:p-6 md:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                  <p className="text-4xl font-bold text-gray-950 sm:text-5xl">
                    {productRating.toFixed(1)}
                  </p>

                  <div className="mt-2 sm:mt-3">
                    {renderStars(productRating, 18)}
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Based on {totalReviews}{" "}
                    {totalReviews === 1
                      ? "review"
                      : "reviews"}
                  </p>
                </div>

                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count =
                      getRatingCount(rating);

                    const percentage =
                      reviews.length > 0
                        ? Math.round(
                            (count /
                              reviews.length) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={rating}
                        className="flex items-center gap-2.5 sm:gap-3"
                      >
                        <span className="w-11 shrink-0 text-xs text-gray-600 sm:w-12 sm:text-sm">
                          {rating} star
                        </span>

                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-yellow-400 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <span className="w-7 text-right text-xs text-gray-400 sm:w-8">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NO REVIEWS */}
              {reviews.length === 0 ? (
                <div className="mt-5 rounded-xl border border-gray-200 bg-white p-8 text-center sm:mt-6 sm:rounded-2xl sm:p-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <MessageSquare
                      size={24}
                      className="text-gray-500"
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-950">
                    No reviews yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Be the first buyer to review this product.
                  </p>
                </div>
              ) : (
                /* REVIEW LIST */
                <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white sm:mt-6 sm:rounded-2xl">
                  <div className="divide-y divide-gray-100">
                    {reviews.map((review) => (
                      <article
                        key={review._id}
                        className="p-4 sm:p-6"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 sm:h-10 sm:w-10">
                                {(
                                  review.buyer?.name ||
                                  "Buyer"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-950">
                                  {review.buyer?.name ||
                                    "Verified buyer"}
                                </p>

                                <div className="mt-1">
                                  {renderStars(
                                    review.rating,
                                    14
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 sm:text-right">
                            {formatReviewDate(
                              review.createdAt
                            )}
                          </p>
                        </div>

                        {review.comment && (
                          <p className="mt-4 text-sm leading-6 text-gray-600 sm:mt-5 sm:leading-7">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* RELATED PRODUCTS CAROUSEL */}
        {!relatedProductsLoading &&
          relatedProducts.length > 0 && (
            <section className="mt-10 border-t border-gray-200 pt-8 sm:mt-12 sm:pt-10">
              <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Related Products
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                    You may also like these products from the same category.
                  </p>
                </div>

                {/* DESKTOP CONTROLS */}
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() =>
                      scrollRelatedProducts("left")
                    }
                    aria-label="Previous related products"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollRelatedProducts("right")
                    }
                    aria-label="Next related products"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ArrowRight size={18} />
                  </button>

                  <Link
                    to={`/products?category=${encodeURIComponent(
                      product.category
                    )}`}
                    className="ml-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View More
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div
                ref={relatedProductsRef}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-4 sm:gap-4"
              >
                {relatedProducts.map((item) => {
                  const itemRating = Number(
                    item.rating || 0
                  );

                  const itemStock = Number(
                    item.stock || 0
                  );

                  return (
                    <Link
                      key={item._id}
                      to={`/product/${item._id}`}
                      className="group w-[76%] shrink-0 snap-start overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md sm:w-[44%] lg:w-[calc(25%-12px)]"
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Package size={34} />
                          </div>
                        )}
                      </div>

                      <div className="p-3 sm:p-4">
                        <p className="mb-1 text-[11px] text-gray-500 sm:text-xs">
                          {item.category}
                        </p>

                        <h3 className="line-clamp-2 min-h-9 text-sm font-semibold leading-5 text-gray-900 sm:min-h-10 sm:text-base">
                          {item.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-1">
                          <Star
                            size={13}
                            fill={
                              itemRating > 0
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              itemRating > 0
                                ? "text-yellow-500"
                                : "text-gray-400"
                            }
                          />

                          <span className="text-[11px] text-gray-600 sm:text-xs">
                            {itemRating > 0
                              ? itemRating.toFixed(1)
                              : "No rating"}
                          </span>
                        </div>

                        <p className="mt-2 text-base font-bold text-gray-900 sm:text-lg">
                          ₦
                          {Number(
                            item.price || 0
                          ).toLocaleString()}
                        </p>

                        <div className="mt-2.5 sm:mt-3">
                          {itemStock > 0 ? (
                            <span className="text-[11px] font-medium text-green-600 sm:text-xs">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* MOBILE CONTROLS */}
              <div className="mt-3 flex items-center justify-between sm:hidden">
                <Link
                  to={`/products?category=${encodeURIComponent(
                    product.category
                  )}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  View More
                  <ArrowRight size={16} />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      scrollRelatedProducts("left")
                    }
                    aria-label="Previous related products"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
                  >
                    <ArrowLeft size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollRelatedProducts("right")
                    }
                    aria-label="Next related products"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </section>
          )}
      </div>
    </main>
  );
};

export default ProductDetails;