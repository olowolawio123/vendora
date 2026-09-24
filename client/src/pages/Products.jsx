import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Package,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../services/wishlistService";

const API_URL = import.meta.env.VITE_API_URL;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState({});

  const [searchParams, setSearchParams] = useSearchParams();

  // --------------------------------------------------
  // URL FILTER VALUES
  // --------------------------------------------------

  const searchFromUrl = searchParams.get("search") || "";
  const categoryFromUrl = searchParams.get("category") || "All";
  const minPriceFromUrl = searchParams.get("minPrice") || "";
  const maxPriceFromUrl = searchParams.get("maxPrice") || "";
  const inStockFromUrl = searchParams.get("inStock") === "true";
  const sortFromUrl = searchParams.get("sort") || "newest";
  const pageFromUrl = Math.max(
    Number(searchParams.get("page")) || 1,
    1
  );

  // --------------------------------------------------
  // LOCAL FORM STATE
  // --------------------------------------------------

  const [search, setSearch] = useState(searchFromUrl);
  const [minPrice, setMinPrice] = useState(minPriceFromUrl);
  const [maxPrice, setMaxPrice] = useState(maxPriceFromUrl);
  const [inStock, setInStock] = useState(inStockFromUrl);
  const [sort, setSort] = useState(sortFromUrl);

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  // --------------------------------------------------
  // SYNC FORM WITH URL
  // --------------------------------------------------

  useEffect(() => {
    setSearch(searchFromUrl);
    setMinPrice(minPriceFromUrl);
    setMaxPrice(maxPriceFromUrl);
    setInStock(inStockFromUrl);
    setSort(sortFromUrl);
    setCurrentPage(pageFromUrl);
  }, [
    searchFromUrl,
    minPriceFromUrl,
    maxPriceFromUrl,
    inStockFromUrl,
    sortFromUrl,
    pageFromUrl,
  ]);

  // --------------------------------------------------
  // LOAD CATEGORIES
  // --------------------------------------------------

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/products?limit=100`
        );

        const data = await response.json();

        if (!response.ok) {
          return;
        }

        const uniqueCategories = [
          ...new Set(
            (data.products || [])
              .map((product) => product.category)
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b));

        setCategories(["All", ...uniqueCategories]);
      } catch (error) {
        console.error("Load categories error:", error);
      }
    };

    loadCategories();
  }, []);

  // --------------------------------------------------
  // LOAD PRODUCTS
  // --------------------------------------------------

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (searchFromUrl.trim()) {
          params.set("search", searchFromUrl.trim());
        }

        if (categoryFromUrl !== "All") {
          params.set("category", categoryFromUrl);
        }

        if (minPriceFromUrl) {
          params.set("minPrice", minPriceFromUrl);
        }

        if (maxPriceFromUrl) {
          params.set("maxPrice", maxPriceFromUrl);
        }

        if (inStockFromUrl) {
          params.set("inStock", "true");
        }

        if (sortFromUrl) {
          params.set("sort", sortFromUrl);
        }

        params.set("page", pageFromUrl);
        params.set("limit", "20");

        const response = await fetch(
          `${API_URL}/api/products?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load products"
          );
        }

        setProducts(data.products || []);
        setTotalProducts(data.totalProducts || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
      } catch (error) {
        console.error("Load products error:", error);
        setError(error.message || "Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    searchFromUrl,
    categoryFromUrl,
    minPriceFromUrl,
    maxPriceFromUrl,
    inStockFromUrl,
    sortFromUrl,
    pageFromUrl,
  ]);

  // --------------------------------------------------
  // LOAD WISHLIST
  // --------------------------------------------------

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem("vendora_token");

      if (!token) {
        return;
      }

      try {
        const data = await getWishlist();

        const ids = new Set(
          (data.wishlist || []).map((product) =>
            product._id?.toString()
          )
        );

        setWishlistIds(ids);
      } catch (error) {
        console.error("Load wishlist error:", error);
      }
    };

    loadWishlist();
  }, []);

  // --------------------------------------------------
  // WISHLIST TOGGLE
  // --------------------------------------------------

  const handleWishlistToggle = async (productId) => {
    const token = localStorage.getItem("vendora_token");

    if (!token) {
      toast.info("Please login to use your wishlist.");
      return;
    }

    if (wishlistLoading[productId]) {
      return;
    }

    setWishlistLoading((previous) => ({
      ...previous,
      [productId]: true,
    }));

    const isWishlisted = wishlistIds.has(productId);

    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.delete(productId);
          return updated;
        });

        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.add(productId);
          return updated;
        });

        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);

      if (
        error.message === "Authentication required" ||
        error.message === "Invalid or expired authentication token"
      ) {
        toast.error("Please login again.");
      } else {
        toast.error(
          error.message || "Unable to update wishlist"
        );
      }
    } finally {
      setWishlistLoading((previous) => ({
        ...previous,
        [productId]: false,
      }));
    }
  };

  // --------------------------------------------------
  // UPDATE URL FILTERS
  // --------------------------------------------------

  const updateFilters = ({
    searchValue = search,
    categoryValue = categoryFromUrl,
    minPriceValue = minPrice,
    maxPriceValue = maxPrice,
    inStockValue = inStock,
    sortValue = sort,
    pageValue = 1,
  } = {}) => {
    const params = {};

    if (searchValue.trim()) {
      params.search = searchValue.trim();
    }

    if (categoryValue && categoryValue !== "All") {
      params.category = categoryValue;
    }

    if (minPriceValue) {
      params.minPrice = minPriceValue;
    }

    if (maxPriceValue) {
      params.maxPrice = maxPriceValue;
    }

    if (inStockValue) {
      params.inStock = "true";
    }

    if (sortValue && sortValue !== "newest") {
      params.sort = sortValue;
    }

    if (pageValue > 1) {
      params.page = String(pageValue);
    }

    setSearchParams(params);
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const handleSearch = (event) => {
    event.preventDefault();

    updateFilters({
      searchValue: search,
      pageValue: 1,
    });
  };

  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------

  const handleCategoryChange = (category) => {
    updateFilters({
      categoryValue: category,
      pageValue: 1,
    });
  };

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  const handleSortChange = (event) => {
    const value = event.target.value;

    setSort(value);

    updateFilters({
      sortValue: value,
      pageValue: 1,
    });
  };

  // --------------------------------------------------
  // PRICE FILTER
  // --------------------------------------------------

  const handlePriceFilter = (event) => {
    event.preventDefault();

    const min = minPrice
      ? Number(minPrice)
      : null;

    const max = maxPrice
      ? Number(maxPrice)
      : null;

    if (
      min !== null &&
      (!Number.isFinite(min) || min < 0)
    ) {
      toast.error("Enter a valid minimum price.");
      return;
    }

    if (
      max !== null &&
      (!Number.isFinite(max) || max < 0)
    ) {
      toast.error("Enter a valid maximum price.");
      return;
    }

    if (
      min !== null &&
      max !== null &&
      min > max
    ) {
      toast.error(
        "Minimum price cannot be greater than maximum price."
      );
      return;
    }

    updateFilters({
      minPriceValue: minPrice,
      maxPriceValue: maxPrice,
      pageValue: 1,
    });
  };

  // --------------------------------------------------
  // STOCK FILTER
  // --------------------------------------------------

  const handleStockChange = (event) => {
    const value = event.target.checked;

    setInStock(value);

    updateFilters({
      inStockValue: value,
      pageValue: 1,
    });
  };

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("newest");

    setSearchParams({});
  };

  // --------------------------------------------------
  // ACTIVE FILTER CHECK
  // --------------------------------------------------

  const hasActiveFilters =
    searchFromUrl ||
    categoryFromUrl !== "All" ||
    minPriceFromUrl ||
    maxPriceFromUrl ||
    inStockFromUrl ||
    sortFromUrl !== "newest";

  // --------------------------------------------------
  // PAGE NAVIGATION
  // --------------------------------------------------

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    updateFilters({
      pageValue: page,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // PAGINATION NUMBERS
  // --------------------------------------------------

  const paginationPages = useMemo(() => {
    const pages = [];

    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />

            <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:rounded-2xl"
              >
                <div className="aspect-[4/3] animate-pulse bg-gray-100 sm:aspect-square" />

                <div className="space-y-3 p-3 sm:p-5">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />

                  <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Package
              className="text-red-600"
              size={25}
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Unable to load products
          </h1>

          <p className="mt-2 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HERO */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Vendora Marketplace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Discover products you'll love
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Explore products from sellers on Vendora and find
              something that fits what you're looking for.
            </p>
          </div>

          {/* SEARCH */}
          <form
            onSubmit={handleSearch}
            className="mt-8 max-w-3xl"
          >
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products, categories or sellers..."
                  className="h-13 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-28 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");

                      updateFilters({
                        searchValue: "",
                        pageValue: 1,
                      });
                    }}
                    aria-label="Clear search"
                    className="absolute right-28 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="absolute bottom-1.5 right-1.5 top-1.5 rounded-lg bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* FILTER HEADER */}
        <div className="border-b border-gray-200 pb-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-950">
                Products
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {totalProducts}{" "}
                {totalProducts === 1
                  ? "product"
                  : "products"}{" "}
                available
              </p>
            </div>

            {/* SORT */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="sort"
                className="text-sm font-medium text-gray-600"
              >
                Sort by
              </label>

              <select
                id="sort"
                value={sort}
                onChange={handleSortChange}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="rating">
                  Highest Rated
                </option>
              </select>
            </div>
          </div>

          {/* CATEGORY FILTER */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
              <SlidersHorizontal size={17} />
              Category
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(category)
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    categoryFromUrl === category
                      ? "bg-gray-950 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* ADVANCED FILTERS */}
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              {/* PRICE */}
              <form
                onSubmit={handlePriceFilter}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div>
                  <label
                    htmlFor="minPrice"
                    className="mb-1.5 block text-xs font-semibold text-gray-600"
                  >
                    Minimum price
                  </label>

                  <input
                    id="minPrice"
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) =>
                      setMinPrice(event.target.value)
                    }
                    placeholder="₦0"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 sm:w-36"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxPrice"
                    className="mb-1.5 block text-xs font-semibold text-gray-600"
                  >
                    Maximum price
                  </label>

                  <input
                    id="maxPrice"
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) =>
                      setMaxPrice(event.target.value)
                    }
                    placeholder="₦100,000"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 sm:w-36"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Apply Price
                </button>
              </form>

              {/* STOCK */}
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={handleStockChange}
                  className="h-4 w-4 rounded border-gray-300 text-gray-950 focus:ring-gray-400"
                />

                <span>
                  Show only products in stock
                </span>
              </label>

            </div>
          </div>

          {/* ACTIVE FILTERS */}
          {hasActiveFilters && (
            <div className="mt-5 flex flex-wrap items-center gap-2">

              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Active filters:
              </span>

              {searchFromUrl && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  Search: {searchFromUrl}
                </span>
              )}

              {categoryFromUrl !== "All" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  Category: {categoryFromUrl}
                </span>
              )}

              {minPriceFromUrl && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  Min: ₦
                  {Number(minPriceFromUrl).toLocaleString()}
                </span>
              )}

              {maxPriceFromUrl && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  Max: ₦
                  {Number(maxPriceFromUrl).toLocaleString()}
                </span>
              )}

              {inStockFromUrl && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  In stock
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
              >
                <X size={14} />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* NO PRODUCTS */}
        {products.length === 0 ? (
          <div className="py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package
                size={28}
                className="text-gray-500"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950">
              {hasActiveFilters
                ? "No matching products"
                : "No products available"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {hasActiveFilters
                ? "We couldn't find products matching your current filters."
                : "There are currently no active products on Vendora. Check back later as sellers add new products."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-6 sm:pt-8 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const isWishlisted = wishlistIds.has(
                  product._id
                );

                const isWishlistLoading =
                  wishlistLoading[product._id];

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl sm:rounded-2xl"
                  >
                    {/* IMAGE */}
                    <div className="relative">
                      <Link
                        to={`/product/${product._id}`}
                        className="relative block aspect-[4/3] overflow-hidden bg-gray-100 sm:aspect-square"
                      >
                        {product.images?.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                            <Package
                              size={34}
                              strokeWidth={1.4}
                              className="sm:h-[42px] sm:w-[42px]"
                            />

                            <span className="mt-2 text-[10px] font-medium sm:text-xs">
                              No image available
                            </span>
                          </div>
                        )}

                        {/* CATEGORY */}
                        <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">
                          {product.category || "Product"}
                        </span>

                        {/* STOCK */}
                        {product.stock > 0 &&
                          product.stock <= 5 && (
                            <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow-sm backdrop-blur sm:right-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">
                              Only {product.stock} left
                            </span>
                          )}

                        {product.stock === 0 && (
                          <span className="absolute right-2 top-2 rounded-full bg-gray-950 px-2 py-1 text-[10px] font-semibold text-white sm:right-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">
                            Out of stock
                          </span>
                        )}
                      </Link>

                      {/* WISHLIST BUTTON */}
                      <button
                        type="button"
                        onClick={() =>
                          handleWishlistToggle(
                            product._id
                          )
                        }
                        disabled={isWishlistLoading}
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition sm:bottom-3 sm:right-3 sm:h-10 sm:w-10 ${
                          isWishlisted
                            ? "border-gray-950 bg-gray-950 text-white"
                            : "border-gray-200 bg-white/95 text-gray-700 hover:border-gray-300 hover:bg-white hover:text-gray-950"
                        } ${
                          isWishlistLoading
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        <Heart
                          size={16}
                          fill={
                            isWishlisted
                              ? "currentColor"
                              : "none"
                          }
                          className="sm:h-[18px] sm:w-[18px]"
                        />
                      </button>
                    </div>

                    {/* PRODUCT INFO */}
                    <div className="p-3 sm:p-5">

                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${product._id}`}
                          className="min-w-0"
                        >
                          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-950 transition group-hover:text-gray-600 sm:min-h-12 sm:text-base sm:leading-6">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-gray-500 sm:gap-1 sm:text-xs">
                          <Star
                            size={12}
                            fill={
                              Number(product.rating || 0) > 0
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              Number(product.rating || 0) > 0
                                ? "text-yellow-500 sm:h-[14px] sm:w-[14px]"
                                : "text-gray-400 sm:h-[14px] sm:w-[14px]"
                            }
                          />

                          {Number(
                            product.rating || 0
                          ).toFixed(1)}
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      <p className="mt-2 hidden line-clamp-2 min-h-10 text-sm leading-5 text-gray-500 sm:block">
                        {product.description}
                      </p>

                      {/* PRICE */}
                      <div className="mt-2 sm:mt-4">
                        <span className="text-base font-bold tracking-tight text-gray-950 sm:text-xl">
                          ₦
                          {Number(
                            product.price
                          ).toLocaleString()}
                        </span>
                      </div>

                      {/* SELLER */}
                      <div className="mt-3 border-t border-gray-100 pt-3 sm:mt-4 sm:pt-4">
                        <p className="truncate text-[10px] font-semibold text-gray-700 sm:text-xs">
                          {product.seller?.storeName ||
                            "Vendora Seller"}
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 sm:gap-1.5 sm:text-xs">
                          <MapPin
                            size={11}
                            className="shrink-0 sm:h-[13px] sm:w-[13px]"
                          />

                          <span className="truncate">
                            {product.seller?.location ||
                              "Location not specified"}
                          </span>
                        </div>
                      </div>

                      {/* BUTTON */}
                      <Link
                        to={`/product/${product._id}`}
                        className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-semibold text-white transition sm:mt-5 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm ${
                          product.stock === 0
                            ? "bg-gray-600 hover:bg-gray-700"
                            : "bg-gray-950 hover:bg-gray-800"
                        }`}
                      >
                        <span className="truncate text-white">
                          {product.stock === 0
                            ? "View Product · Out of Stock"
                            : "View Product"}
                        </span>

                        <ArrowRight
                          size={14}
                          className="shrink-0 text-white sm:h-4 sm:w-4"
                        />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">

                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-900">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-2">

                  {/* PREVIOUS */}
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(currentPage - 1)
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />

                    <span className="hidden sm:inline">
                      Previous
                    </span>
                  </button>

                  {/* PAGE NUMBERS */}
                  <div className="flex items-center gap-1">
                    {paginationPages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                          page === currentPage
                            ? "bg-gray-950 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* NEXT */}
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">
                      Next
                    </span>

                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Products;