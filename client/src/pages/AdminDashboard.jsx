import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Store,
  Users,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const AdminDashboard = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPendingSellers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/sellers/admin/pending`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load seller applications"
        );
      }

      setSellers(data.sellers || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const handleApprove = async (sellerId) => {
    try {
      setActionLoading(sellerId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/sellers/admin/${sellerId}/approve`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to approve seller"
        );
      }

      setSellers((previousSellers) =>
        previousSellers.filter(
          (seller) => seller._id !== sellerId
        )
      );

      setMessage("Seller approved successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this seller application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(sellerId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/sellers/admin/${sellerId}/reject`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reject seller"
        );
      }

      setSellers((previousSellers) =>
        previousSellers.filter(
          (seller) => seller._id !== sellerId
        )
      );

      setMessage("Seller application rejected.");
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
              <ShieldCheck size={17} />
              Admin
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Manage Vendora seller applications and platform activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPendingSellers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending Sellers
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {sellers.length}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Seller Management
                </p>

                <p className="mt-2 text-lg font-bold text-gray-900">
                  Applications
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Store size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Platform
                </p>

                <p className="mt-2 text-lg font-bold text-gray-900">
                  Vendora
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <Users size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* Seller applications */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-bold text-gray-900">
              Pending Seller Applications
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review applications before giving users seller access.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <CheckCircle size={26} />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                No pending applications
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                There are currently no seller applications waiting for
                review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sellers.map((seller) => {
                const isProcessing =
                  actionLoading === seller._id;

                return (
                  <div
                    key={seller._id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                          <Store size={21} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-gray-900">
                            {seller.storeName}
                          </h3>

                          <p className="mt-1 text-sm text-gray-600">
                            Applicant:{" "}
                            <span className="font-medium text-gray-900">
                              {seller.user?.name || "Unknown user"}
                            </span>
                          </p>

                          <p className="mt-1 break-all text-sm text-gray-500">
                            {seller.user?.email || "No email"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {seller.phone && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {seller.phone}
                              </span>
                            )}

                            {seller.location && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {seller.location}
                              </span>
                            )}

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          </div>

                          {seller.description && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                              {seller.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleReject(seller._id)
                          }
                          disabled={isProcessing}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          <XCircle size={17} />
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(seller._id)
                          }
                          disabled={isProcessing}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          <CheckCircle size={17} />
                          {isProcessing
                            ? "Processing..."
                            : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;