import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Boxes,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/products/my-products`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products");
      }

      setProducts(data.products || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(productId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/products/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete product");
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product._id !== productId
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setDeletingId("");
    }
  };

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.status === "active"
  ).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-gray-200" />
            <div className="mt-3 h-4 w-80 rounded bg-gray-200" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-gray-200"
                />
              ))}
            </div>

            <div className="mt-8 h-96 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Package size={17} />
              <span>Seller Dashboard</span>
              <span>/</span>
              <span className="text-gray-700">Products</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              My Products
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Manage the products in your Vendora store.
            </p>
          </div>

          <Link
            to="/seller/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            <Plus size={19} className="text-white" />
            <span className="text-white">Add Product</span>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalProducts}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <ShoppingBag size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Products
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {activeProducts}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalStock.toLocaleString()}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Boxes size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Out of Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {outOfStockProducts}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertCircle size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!error && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
              <Package size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No products yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your store does not have any products yet. Add
              your first product to start selling on Vendora.
            </p>

            <Link
              to="/seller/products/add"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus size={18} />
              Add Your First Product
            </Link>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Desktop table header */}
            <div className="hidden border-b border-gray-200 bg-gray-50 px-6 py-4 md:grid md:grid-cols-[minmax(0,2fr)_120px_130px_120px_150px] md:items-center md:gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Product
              </p>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Price
              </p>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Category
              </p>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock
              </p>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {products.map((product) => {
                const stock = Number(product.stock || 0);
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={product._id}
                    className="p-5 transition hover:bg-gray-50 sm:p-6"
                  >
                    {/* Desktop */}
                    <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_120px_130px_120px_150px] md:items-center md:gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-500">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-gray-900">
                            {product.title}
                          </h2>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                            {product.description ||
                              "No product description available."}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          ₦{Number(product.price).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {product.category}
                        </span>
                      </div>

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isOutOfStock
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {stock.toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {isOutOfStock
                            ? "Out of stock"
                            : "Available"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/seller/products/edit/${product._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
                        >
                          <Pencil size={15} />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product._id)
                          }
                          disabled={
                            deletingId === product._id
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-500">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={25} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="font-bold text-gray-900">
                              {product.title}
                            </h2>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                product.status === "active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {product.status}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                            {product.description ||
                              "No product description available."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Price
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            ₦
                            {Number(
                              product.price
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Category
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {product.category}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Stock
                          </p>

                          <p
                            className={`mt-1 font-bold ${
                              isOutOfStock
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {stock.toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Status
                          </p>

                          <p className="mt-1 font-semibold capitalize text-gray-900">
                            {product.status}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Link
                          to={`/seller/products/edit/${product._id}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          <Pencil size={17} />
                          Edit Product
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product._id)
                          }
                          disabled={
                            deletingId === product._id
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={17} />

                          {deletingId === product._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    {/* Mobile status */}
                    <div className="mt-4 md:hidden">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          product.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            product.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />

                        {product.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer information */}
        {products.length > 0 && (
          <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
            <p>
              Showing {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
            </p>

            <Link
              to="/seller/products/add"
              className="font-semibold text-gray-700 hover:text-gray-900"
            >
              Add another product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;