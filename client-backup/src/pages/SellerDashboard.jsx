import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Wallet,
  Star,
  Plus,
  ArrowRight,
  Store,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SellerDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Products",
      value: "0",
      description: "Products in your store",
      icon: Package,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Orders",
      value: "0",
      description: "Orders received",
      icon: ShoppingBag,
      iconStyle: "bg-purple-50 text-purple-600",
    },
    {
      title: "Sales",
      value: "₦0",
      description: "Total sales",
      icon: Wallet,
      iconStyle: "bg-green-50 text-green-600",
    },
    {
      title: "Rating",
      value: "0.0",
      description: "Average store rating",
      icon: Star,
      iconStyle: "bg-yellow-50 text-yellow-600",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Seller Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Welcome, {user?.name || "Seller"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
              Manage your Vendora store, products and sales from
              one place.
            </p>
          </div>

          <Link
            to="/seller/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            <Plus size={18} className="text-white" />
            <span className="text-white">Add Product</span>
          </Link>
        </div>

        {/* Store overview */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-gray-900 shadow-sm">
          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Store size={17} />
                  <span>Your Store</span>
                </div>

                <h2 className="mt-3 text-2xl font-bold text-white">
                  Grow your business on Vendora
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Add products to your store and start reaching
                  customers on Vendora.
                </p>
              </div>

              <Link
                to="/seller/products"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                Manage Products
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Package size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Manage Products
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Add new products, update your listings and manage
              your available stock.
            </p>

            <Link
              to="/seller/products"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
            >
              View products
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <ShoppingBag size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Manage Orders
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Keep track of customer orders and manage your
              fulfilment workflow.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 inline-flex cursor-not-allowed items-center gap-2 text-sm font-semibold text-gray-400"
            >
              Orders coming soon
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Settings size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Store Settings
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Update your store information and configure your
              seller account.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 inline-flex cursor-not-allowed items-center gap-2 text-sm font-semibold text-gray-400"
            >
              Settings coming soon
            </button>
          </div>
        </div>

        {/* Getting started */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gray-500">
              GETTING STARTED
            </p>

            <h2 className="mt-2 text-xl font-bold text-gray-900">
              Start building your store
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Your seller account is ready. Add your first
              product to begin building your Vendora store.
            </p>

            <Link
              to="/seller/products/add"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <Plus size={18} className="text-white" />
              <span className="text-white">
                Add Your First Product
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;