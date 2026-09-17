import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Package,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const searchFromUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/products`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load products"
          );
        }

        setProducts(data.products || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.title?.toLowerCase().includes(normalizedSearch) ||
        product.description
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch) ||
        product.seller?.storeName
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const handleSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSearchParams({});
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-3 h-5 w-80 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-square animate-pulse bg-gray-100" />

                <div className="space-y-3 p-5">
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

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Package className="text-red-600" size={25} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Unable to load products
          </h1>

          <p className="mt-2 text-gray-500">{error}</p>

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

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, categories or sellers..."
                className="h-13 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-28 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
              />

              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 rounded-lg bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* TOP CONTROLS */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}{" "}
              available
            </p>
          </div>

          {/* CATEGORY FILTER */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-gray-600">
              <SlidersHorizontal size={17} />
              Category
            </div>

            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category
                      ? "bg-gray-950 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NO PRODUCTS */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package size={28} className="text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950">
              No products available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              There are currently no active products on Vendora.
              Check back later as sellers add new products.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search size={27} className="text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950">
              No matching products
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              We couldn't find products matching your current
              search or category filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* PRODUCT GRID */
          <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product._id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
              >

                {/* IMAGE */}
                <Link
                  to={`/product/${product._id}`}
                  className="relative block aspect-square overflow-hidden bg-gray-100"
                >
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                      <Package size={42} strokeWidth={1.4} />

                      <span className="mt-2 text-xs font-medium">
                        No image available
                      </span>
                    </div>
                  )}

                  {/* CATEGORY BADGE */}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                    {product.category || "Product"}
                  </span>

                  {/* STOCK */}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                      Only {product.stock} left
                    </span>
                  )}

                  {product.stock === 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white">
                      Out of stock
                    </span>
                  )}
                </Link>

                {/* PRODUCT INFO */}
                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/product/${product._id}`}
                      className="min-w-0"
                    >
                      <h3 className="truncate text-base font-semibold text-gray-950 transition group-hover:text-gray-600">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
                      <Star
                        size={14}
                        fill="currentColor"
                        className="text-gray-400"
                      />
                      {Number(product.rating || 0).toFixed(1)}
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                    {product.description}
                  </p>

                  {/* PRICE */}
                  <div className="mt-4">
                    <span className="text-xl font-bold tracking-tight text-gray-950">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                  </div>

                  {/* SELLER */}
                  <div className="mt-4 border-t border-gray-100 pt-4">

                    <p className="truncate text-xs font-semibold text-gray-700">
                      {product.seller?.storeName || "Vendora Seller"}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={13} />

                      <span className="truncate">
                        {product.seller?.location || "Location not specified"}
                      </span>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <Link
  to={`/product/${product._id}`}
  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
>
  <span className="text-white">View Product</span>
  <ArrowRight size={16} className="text-white" />
</Link>
                </div>
                
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Products;