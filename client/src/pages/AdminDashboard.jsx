import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Store,
  Users,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Package,
  ShoppingCart,
  UserCog,
  Ban,
  UserCheck,
  Trash2,
  MessageSquare,
  Mail,
} from "lucide-react";

import apiFetch from "../services/apiFetch";

const AdminDashboard = () => {
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingSellers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState("");
  const [userActionLoading, setUserActionLoading] =
    useState("");
  const [supportActionLoading, setSupportActionLoading] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // LOAD ADMIN STATS
  // =====================================================
  const loadStats = async () => {
    const response = await apiFetch("/api/admin/stats");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load admin statistics"
      );
    }

    setStats(
      data.stats || {
        totalUsers: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingSellers: 0,
      }
    );
  };

  // =====================================================
  // LOAD PENDING SELLERS
  // =====================================================
  const loadPendingSellers = async () => {
    const response = await apiFetch(
      "/api/sellers/admin/pending"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load seller applications"
      );
    }

    setSellers(data.sellers || []);
  };

  // =====================================================
  // LOAD ALL USERS
  // =====================================================
  const loadUsers = async () => {
    try {
      setUsersLoading(true);

      const response = await apiFetch(
        "/api/admin/users"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load users"
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // =====================================================
  // LOAD SUPPORT REQUESTS
  // =====================================================
  const loadSupportRequests = async () => {
    try {
      setSupportLoading(true);

      const response = await apiFetch(
        "/api/support"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load support requests"
        );
      }

      setSupportRequests(
        data.supportRequests || []
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSupportLoading(false);
    }
  };

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await Promise.all([
        loadStats(),
        loadPendingSellers(),
        loadUsers(),
        loadSupportRequests(),
      ]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================================
  // APPROVE SELLER
  // =====================================================
  const handleApprove = async (sellerId) => {
    try {
      setActionLoading(sellerId);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/sellers/admin/${sellerId}/approve`,
        {
          method: "PATCH",
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

      setStats((previousStats) => ({
        ...previousStats,
        pendingSellers: Math.max(
          0,
          previousStats.pendingSellers - 1
        ),
        totalSellers:
          previousStats.totalSellers + 1,
      }));

      setMessage("Seller approved successfully.");

      await loadUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // REJECT SELLER
  // =====================================================
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

      const response = await apiFetch(
        `/api/sellers/admin/${sellerId}/reject`,
        {
          method: "PATCH",
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

      setStats((previousStats) => ({
        ...previousStats,
        pendingSellers: Math.max(
          0,
          previousStats.pendingSellers - 1
        ),
      }));

      setMessage("Seller application rejected.");
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // CHANGE USER ROLE
  // =====================================================
  const handleRoleChange = async (userId, role) => {
    try {
      setUserActionLoading(userId);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update user role"
        );
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                role: data.user.role,
                status: data.user.status,
              }
            : user
        )
      );

      setMessage("User role updated successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setUserActionLoading("");
    }
  };

  // =====================================================
  // CHANGE USER STATUS
  // =====================================================
  const handleStatusChange = async (
    userId,
    status
  ) => {
    const action =
      status === "suspended"
        ? "suspend"
        : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUserActionLoading(userId);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update user status"
        );
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: data.user.status,
              }
            : user
        )
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUserActionLoading("");
    }
  };

  // =====================================================
  // DELETE USER
  // =====================================================
  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this user? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setUserActionLoading(userId);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/admin/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete user"
        );
      }

      setUsers((previousUsers) =>
        previousUsers.filter(
          (user) => user._id !== userId
        )
      );

      setStats((previousStats) => ({
        ...previousStats,
        totalUsers: Math.max(
          0,
          previousStats.totalUsers - 1
        ),
      }));

      setMessage("User deleted successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setUserActionLoading("");
    }
  };

  // =====================================================
  // CHANGE SUPPORT REQUEST STATUS
  // =====================================================
  const handleSupportStatusChange = async (
    supportRequestId,
    status
  ) => {
    try {
      setSupportActionLoading(
        supportRequestId
      );
      setError("");
      setMessage("");

      const response = await apiFetch(
        `/api/support/${supportRequestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update support request status"
        );
      }

      setSupportRequests(
        (previousRequests) =>
          previousRequests.map((request) =>
            request._id === supportRequestId
              ? {
                  ...request,
                  status: data.supportRequest.status,
                }
              : request
          )
      );

      setMessage(
        "Support request status updated successfully."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSupportActionLoading("");
    }
  };

  // =====================================================
  // FORMAT SUPPORT REQUEST DATE
  // =====================================================
  const formatSupportDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}
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
              Manage Vendora users, sellers, products,
              orders and platform activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            MESSAGES
        ===================================================== */}
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

        {/* =====================================================
            PLATFORM STATS
        ===================================================== */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* USERS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "—" : stats.totalUsers}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users size={22} />
              </div>
            </div>
          </div>

          {/* SELLERS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Sellers
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "—" : stats.totalSellers}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Store size={22} />
              </div>
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "—" : stats.totalProducts}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <Package size={22} />
              </div>
            </div>
          </div>

          {/* ORDERS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "—" : stats.totalOrders}
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <ShoppingCart size={22} />
              </div>
            </div>
          </div>

          {/* PENDING SELLERS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending Sellers
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading
                    ? "—"
                    : stats.pendingSellers}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            USER MANAGEMENT
        ===================================================== */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UserCog
                    size={20}
                    className="text-gray-700"
                  />

                  <h2 className="text-lg font-bold text-gray-900">
                    User Management
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Manage Vendora accounts, roles and
                  account status.
                </p>
              </div>

              <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {users.length} users
              </span>
            </div>
          </div>

          {usersLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users
                size={30}
                className="mx-auto text-gray-400"
              />

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No users found
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => {
                const isProcessing =
                  userActionLoading === user._id;

                return (
                  <div
                    key={user._id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      {/* USER INFORMATION */}
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-900">
                            {user.name}
                          </h3>

                          <p className="mt-1 break-all text-sm text-gray-500">
                            {user.email}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                              {user.role}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                user.status ===
                                "suspended"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-green-50 text-green-700"
                              }`}
                            >
                              {user.status ||
                                "active"}
                            </span>

                            {user.phone && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* USER ACTIONS */}
                      <div className="flex flex-col gap-3 xl:min-w-[520px]">

                        {/* ROLE */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <label
                            htmlFor={`role-${user._id}`}
                            className="text-sm font-medium text-gray-600 sm:w-20"
                          >
                            Role
                          </label>

                          <select
                            id={`role-${user._id}`}
                            value={user.role}
                            disabled={isProcessing}
                            onChange={(event) =>
                              handleRoleChange(
                                user._id,
                                event.target.value
                              )
                            }
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="buyer">
                              Buyer
                            </option>

                            <option value="seller">
                              Seller
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col gap-2 sm:flex-row">

                          {user.status ===
                          "suspended" ? (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleStatusChange(
                                  user._id,
                                  "active"
                                )
                              }
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <UserCheck
                                size={16}
                              />

                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleStatusChange(
                                  user._id,
                                  "suspended"
                                )
                              }
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Ban size={16} />

                              Suspend
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleDeleteUser(
                                user._id
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />

                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================
            SELLER APPLICATIONS
        ===================================================== */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Pending Seller Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review applications before giving
                  users seller access.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <Clock size={14} />

                {sellers.length} pending
              </div>
            </div>
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
                There are currently no seller
                applications waiting for review.
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
                              {seller.user?.name ||
                                "Unknown user"}
                            </span>
                          </p>

                          <p className="mt-1 break-all text-sm text-gray-500">
                            {seller.user?.email ||
                              "No email"}
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
                            handleReject(
                              seller._id
                            )
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
                            handleApprove(
                              seller._id
                            )
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

        {/* =====================================================
            SUPPORT REQUESTS
        ===================================================== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare
                    size={20}
                    className="text-gray-700"
                  />

                  <h2 className="text-lg font-bold text-gray-900">
                    Support Requests
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  View and manage customer support
                  requests submitted through the Vendora
                  Help Center.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                  {supportRequests.length} requests
                </span>

                <button
                  type="button"
                  onClick={loadSupportRequests}
                  disabled={supportLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      supportLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>
              </div>
            </div>
          </div>

          {supportLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : supportRequests.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <MessageSquare size={26} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No support requests
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                There are currently no customer support
                requests to review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {supportRequests.map((request) => {
                const isSupportProcessing =
                  supportActionLoading ===
                  request._id;

                return (
                  <div
                    key={request._id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5">

                      {/* REQUEST HEADER */}
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                            <MessageSquare size={19} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900">
                              {request.subject}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Users size={14} />
                                {request.name}
                              </span>

                              <span className="text-gray-300">
                                |
                              </span>

                              <span className="inline-flex items-center gap-1.5 break-all text-sm text-gray-500">
                                <Mail size={14} />
                                {request.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            {request.category}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                              request.status ===
                              "resolved"
                                ? "bg-green-50 text-green-700"
                                : request.status ===
                                  "in-progress"
                                ? "bg-amber-50 text-amber-700"
                                : request.status ===
                                  "closed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {request.status ||
                              "open"}
                          </span>
                        </div>
                      </div>

                      {/* MESSAGE */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Customer message
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {request.message}
                        </p>
                      </div>

                      {/* SUPPORT STATUS CONTROL */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Support status
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Update the status after reviewing
                              this request.
                            </p>
                          </div>

                          <select
                            value={
                              request.status ||
                              "open"
                            }
                            disabled={
                              isSupportProcessing
                            }
                            onChange={(event) =>
                              handleSupportStatusChange(
                                request._id,
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
                          >
                            <option value="open">
                              Open
                            </option>

                            <option value="in-progress">
                              In Progress
                            </option>

                            <option value="resolved">
                              Resolved
                            </option>

                            <option value="closed">
                              Closed
                            </option>
                          </select>
                        </div>

                        {isSupportProcessing && (
                          <p className="mt-2 text-xs font-medium text-gray-500">
                            Updating status...
                          </p>
                        )}
                      </div>

                      {/* REQUEST META */}
                      <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          Request ID:{" "}
                          <span className="font-medium text-gray-700">
                            {request._id}
                          </span>
                        </span>

                        <span>
                          Submitted:{" "}
                          <span className="font-medium text-gray-700">
                            {formatSupportDate(
                              request.createdAt
                            )}
                          </span>
                        </span>
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