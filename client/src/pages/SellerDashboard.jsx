import { useEffect, useState } from "react";
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
  Clock3,
  Banknote,
  Receipt,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ArrowDownToLine,
  History,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";
import apiFetch from "../services/apiFetch";

const SellerDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [earningsLoading, setEarningsLoading] =
    useState(true);

  const [payoutLoading, setPayoutLoading] =
    useState(false);

  const [banksLoading, setBanksLoading] =
    useState(false);

  const [withdrawalLoading, setWithdrawalLoading] =
    useState(true);

  const [withdrawalSubmitting, setWithdrawalSubmitting] =
    useState(false);

  const [withdrawalCancelling, setWithdrawalCancelling] =
    useState(false);

  const [banks, setBanks] = useState([]);

  const [payout, setPayout] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    verified: false,
    verifiedAt: null,
  });

  const [payoutForm, setPayoutForm] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
  });

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    sales: 0,
    rating: 0,
  });

  const [earnings, setEarnings] = useState({
    totalGross: 0,
    totalCommission: 0,
    totalNet: 0,
    pendingAmount: 0,
    availableAmount: 0,
    withdrawalPendingAmount: 0,
    withdrawnAmount: 0,
    cancelledAmount: 0,
    refundedAmount: 0,
  });

  const [withdrawalBalance, setWithdrawalBalance] =
    useState({
      availableAmount: 0,
      pendingWithdrawalAmount: 0,
      withdrawnAmount: 0,
    });

  const [withdrawalAmount, setWithdrawalAmount] =
    useState("");

  const [withdrawalHistory, setWithdrawalHistory] =
    useState([]);

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          productsResponse,
          dashboardResponse,
        ] = await Promise.all([
          apiFetch("/api/products/my-products", {
            method: "GET",
          }),

          apiFetch("/api/orders/seller-dashboard", {
            method: "GET",
          }),
        ]);

        const productsData =
          await productsResponse.json();

        const dashboardData =
          await dashboardResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.message ||
              "Unable to load products"
          );
        }

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardData.message ||
              "Unable to load dashboard"
          );
        }

        setStats({
          products: productsData.count || 0,
          orders:
            dashboardData.stats?.orders || 0,
          sales:
            dashboardData.stats?.sales || 0,
          rating:
            dashboardData.stats?.rating || 0,
        });

        setRecentOrders(
          dashboardData.recentOrders || []
        );
      } catch (error) {
        console.error(
          "Seller dashboard error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load seller dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setEarningsLoading(true);

        const response = await apiFetch(
          "/api/sellers/earnings",
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load seller earnings"
          );
        }

        setEarnings({
          totalGross:
            data.summary?.totalGross || 0,

          totalCommission:
            data.summary?.totalCommission || 0,

          totalNet:
            data.summary?.totalNet || 0,

          pendingAmount:
            data.summary?.pendingAmount || 0,

          availableAmount:
            data.summary?.availableAmount || 0,

          withdrawalPendingAmount:
            data.summary
              ?.withdrawalPendingAmount || 0,

          withdrawnAmount:
            data.summary?.withdrawnAmount || 0,

          cancelledAmount:
            data.summary?.cancelledAmount || 0,

          refundedAmount:
            data.summary?.refundedAmount || 0,
        });
      } catch (error) {
        console.error(
          "Seller earnings error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load seller earnings"
        );
      } finally {
        setEarningsLoading(false);
      }
    };

    loadEarnings();
  }, []);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        setBanksLoading(true);

        const response = await apiFetch(
          "/api/orders/seller-payout/banks",
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load banks"
          );
        }

        setBanks(data.banks || []);
      } catch (error) {
        console.error(
          "Seller payout banks error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load banks"
        );
      } finally {
        setBanksLoading(false);
      }
    };

    loadBanks();
  }, []);

  useEffect(() => {
    const loadWithdrawalData = async () => {
      try {
        setWithdrawalLoading(true);

        const [
          balanceResponse,
          historyResponse,
        ] = await Promise.all([
          apiFetch(
            "/api/orders/seller-withdrawal/balance",
            {
              method: "GET",
            }
          ),

          apiFetch(
            "/api/orders/seller-withdrawal/history",
            {
              method: "GET",
            }
          ),
        ]);

        const balanceData =
          await balanceResponse.json();

        const historyData =
          await historyResponse.json();

        if (!balanceResponse.ok) {
          throw new Error(
            balanceData.message ||
              "Unable to load withdrawal balance"
          );
        }

        if (!historyResponse.ok) {
          throw new Error(
            historyData.message ||
              "Unable to load withdrawal history"
          );
        }

        setWithdrawalBalance({
          availableAmount:
            Number(
              balanceData.balance?.available
            ) || 0,

          pendingWithdrawalAmount:
            Number(
              balanceData.balance?.pendingWithdrawal
            ) || 0,

          withdrawnAmount:
            Number(
              balanceData.balance?.withdrawn
            ) || 0,
        });

        setWithdrawalHistory(
          historyData.withdrawals || []
        );
      } catch (error) {
        console.error(
          "Seller withdrawal data error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load withdrawal information"
        );
      } finally {
        setWithdrawalLoading(false);
      }
    };

    loadWithdrawalData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getWithdrawalStatusClass = (
    status
  ) => {
    switch (status) {
      case "successful":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "reversed":
        return "bg-orange-100 text-orange-700";

      case "cancelled":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getWithdrawalStatusLabel = (
    status
  ) => {
    switch (status) {
      case "successful":
        return "Successful";

      case "processing":
        return "Processing";

      case "pending":
        return "Pending";

      case "failed":
        return "Failed";

      case "reversed":
        return "Reversed";

      case "cancelled":
        return "Cancelled";

      default:
        return status || "Unknown";
    }
  };

  const handlePayoutChange = (event) => {
    const { name, value } = event.target;

    if (name === "bankCode") {
      const selectedBank = banks.find(
        (bank) => bank.code === value
      );

      setPayoutForm((previous) => ({
        ...previous,
        bankCode: value,
        bankName: selectedBank?.name || "",
      }));

      return;
    }

    setPayoutForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleVerifyPayout = async (event) => {
    event.preventDefault();

    if (!payoutForm.bankCode) {
      toast.error("Please select your bank");
      return;
    }

    if (!payoutForm.accountNumber) {
      toast.error(
        "Please enter your account number"
      );
      return;
    }

    if (
      !/^\d{10}$/.test(
        payoutForm.accountNumber.trim()
      )
    ) {
      toast.error(
        "Enter a valid 10-digit Nigerian bank account number"
      );
      return;
    }

    try {
      setPayoutLoading(true);

      const response = await apiFetch(
        "/api/orders/seller-payout/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bankCode:
              payoutForm.bankCode,
            bankName:
              payoutForm.bankName,
            accountNumber:
              payoutForm.accountNumber.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to verify bank account"
        );
      }

      setPayout(data.payout);

      setPayoutForm({
        bankCode:
          data.payout?.bankCode || "",

        bankName:
          data.payout?.bankName || "",

        accountNumber:
          data.payout?.accountNumber || "",
      });

      toast.success(
        "Bank account verified successfully"
      );
    } catch (error) {
      console.error(
        "Seller payout verification error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to verify bank account"
      );
    } finally {
      setPayoutLoading(false);
    }
  };

  const refreshWithdrawalData = async () => {
    try {
      const [
        balanceResponse,
        historyResponse,
      ] = await Promise.all([
        apiFetch(
          "/api/orders/seller-withdrawal/balance",
          {
            method: "GET",
          }
        ),

        apiFetch(
          "/api/orders/seller-withdrawal/history",
          {
            method: "GET",
          }
        ),
      ]);

      const balanceData =
        await balanceResponse.json();

      const historyData =
        await historyResponse.json();

      if (!balanceResponse.ok) {
        throw new Error(
          balanceData.message ||
            "Unable to refresh withdrawal balance"
        );
      }

      if (!historyResponse.ok) {
        throw new Error(
          historyData.message ||
            "Unable to refresh withdrawal history"
        );
      }

      setWithdrawalBalance({
        availableAmount:
          Number(
            balanceData.balance
              ?.availableAmount
          ) || 0,

        pendingWithdrawalAmount:
          Number(
            balanceData.balance
              ?.pendingWithdrawalAmount
          ) || 0,

        withdrawnAmount:
          Number(
            balanceData.balance
              ?.withdrawnAmount
          ) || 0,
      });

      setWithdrawalHistory(
        historyData.withdrawals || []
      );
    } catch (error) {
      console.error(
        "Refresh withdrawal data error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to refresh withdrawal information"
      );
    }
  };

  const handleWithdrawAll = () => {
    if (
      withdrawalBalance.availableAmount <= 0
    ) {
      toast.error(
        "You do not have an available balance to withdraw"
      );
      return;
    }

    setWithdrawalAmount(
      String(
        withdrawalBalance.availableAmount
      )
    );
  };

  const handleWithdrawalRequest = async (
    event
  ) => {
    event.preventDefault();

    const amount = Number(
      withdrawalAmount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Enter a valid withdrawal amount"
      );
      return;
    }

    if (
      amount >
      withdrawalBalance.availableAmount
    ) {
      toast.error(
        "Withdrawal amount exceeds your available balance"
      );
      return;
    }

    if (!payout.verified) {
      toast.error(
        "Please verify your payout account first"
      );
      return;
    }

    try {
      setWithdrawalSubmitting(true);

      const response = await apiFetch(
        "/api/orders/seller-withdrawal/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to request withdrawal"
        );
      }

      toast.success(
        data.message ||
          "Withdrawal request submitted successfully"
      );

      setWithdrawalAmount("");

      await refreshWithdrawalData();
    } catch (error) {
      console.error(
        "Seller withdrawal request error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to request withdrawal"
      );
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async () => {
    try {
      setWithdrawalCancelling(true);

      const response = await apiFetch(
        "/api/orders/seller-withdrawal/cancel",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to cancel withdrawal"
        );
      }

      toast.success(
        data.message ||
          "Withdrawal cancelled successfully"
      );

      await refreshWithdrawalData();
    } catch (error) {
      console.error(
        "Cancel withdrawal error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to cancel withdrawal"
      );
    } finally {
      setWithdrawalCancelling(false);
    }
  };

  const statCards = [
    {
      title: "Products",
      value: loading
        ? "..."
        : stats.products,
      description:
        "Products in your store",
      icon: Package,
      iconStyle:
        "bg-blue-50 text-blue-600",
    },
    {
      title: "Orders",
      value: loading
        ? "..."
        : stats.orders,
      description:
        "Orders containing your products",
      icon: ShoppingBag,
      iconStyle:
        "bg-purple-50 text-purple-600",
    },
    {
      title: "Sales",
      value: loading
        ? "..."
        : formatCurrency(stats.sales),
      description:
        "Paid sales from your products",
      icon: Wallet,
      iconStyle:
        "bg-green-50 text-green-600",
    },
    {
      title: "Rating",
      value: loading
        ? "..."
        : Number(
            stats.rating || 0
          ).toFixed(1),
      description:
        "Average store rating",
      icon: Star,
      iconStyle:
        "bg-yellow-50 text-yellow-600",
    },
  ];

  const financeCards = [
    {
      title: "Pending Earnings",
      value: earningsLoading
        ? "..."
        : formatCurrency(
            earnings.pendingAmount
          ),
      description:
        "Earnings waiting to become available",
      icon: Clock3,
      iconStyle:
        "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Available Earnings",
      value: earningsLoading
        ? "..."
        : formatCurrency(
            earnings.availableAmount
          ),
      description:
        "Earnings available for withdrawal",
      icon: Banknote,
      iconStyle:
        "bg-green-50 text-green-600",
    },
    {
      title: "Vendora Commission",
      value: earningsLoading
        ? "..."
        : formatCurrency(
            earnings.totalCommission
          ),
      description:
        "Commission deducted from your sales",
      icon: Receipt,
      iconStyle:
        "bg-blue-50 text-blue-600",
    },
  ];

  const hasPendingWithdrawal =
    withdrawalHistory.some(
      (withdrawal) =>
        withdrawal.status ===
          "pending" ||
        withdrawal.status ===
          "processing"
    );

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
              Welcome,{" "}
              {user?.name || "Seller"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
              Manage your Vendora store,
              products and sales from one
              place.
            </p>
          </div>

          <Link
            to="/seller/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Product
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
                  Add products to your store
                  and start reaching customers
                  on Vendora.
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
          {statCards.map((stat) => {
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

        {/* Earnings & Finance */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Earnings & Finance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track your seller earnings and
                available balance.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            {financeCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconStyle}`}
                    >
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-gray-500">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total net earnings
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {earningsLoading
                    ? "..."
                    : formatCurrency(
                        earnings.totalNet
                      )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Withdrawn
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900 sm:text-right">
                  {earningsLoading
                    ? "..."
                    : formatCurrency(
                        earnings.withdrawnAmount
                      )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet & Withdrawals */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Wallet size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Wallet & Withdrawals
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Manage your available seller
                    balance and withdrawal requests.
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Seller finance
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">

            {/* Wallet summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Available Balance
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {withdrawalLoading
                        ? "..."
                        : formatCurrency(
                            withdrawalBalance.availableAmount
                          )}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-600">
                    <Banknote size={21} />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-green-700">
                  Funds currently available
                  for withdrawal.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">
                      Pending Withdrawal
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {withdrawalLoading
                        ? "..."
                        : formatCurrency(
                            withdrawalBalance.pendingWithdrawalAmount
                          )}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-yellow-600">
                    <Clock3 size={21} />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-yellow-700">
                  Funds currently reserved for
                  a withdrawal.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Withdrawn
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {withdrawalLoading
                        ? "..."
                        : formatCurrency(
                            withdrawalBalance.withdrawnAmount
                          )}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-600">
                    <ArrowDownToLine
                      size={21}
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-500">
                  Total amount successfully
                  withdrawn.
                </p>
              </div>
            </div>

            {/* Withdrawal form */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-base font-bold text-gray-900">
                  Request Withdrawal
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Withdraw your available seller
                  earnings to your verified payout
                  account.
                </p>
              </div>

              <div className="p-5">
                {!payout.verified ? (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-yellow-700"
                      />

                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          Verify your payout account
                          first
                        </p>

                        <p className="mt-1 text-sm leading-6 text-yellow-700">
                          You need a verified Nigerian
                          bank account before you can
                          request a withdrawal.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hasPendingWithdrawal ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Clock3
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-700"
                        />

                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Withdrawal already in
                            progress
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-700">
                            You currently have a pending
                            or processing withdrawal.
                          </p>
                        </div>
                      </div>

                      {withdrawalHistory.some(
                        (withdrawal) =>
                          withdrawal.status ===
                          "pending"
                      ) && (
                        <button
                          type="button"
                          onClick={
                            handleCancelWithdrawal
                          }
                          disabled={
                            withdrawalCancelling
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {withdrawalCancelling ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <XCircle
                              size={17}
                            />
                          )}

                          {withdrawalCancelling
                            ? "Cancelling..."
                            : "Cancel Withdrawal"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={
                      handleWithdrawalRequest
                    }
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="withdrawal-amount"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Withdrawal Amount
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                            ₦
                          </span>

                          <input
                            id="withdrawal-amount"
                            type="number"
                            min="1"
                            step="1"
                            value={
                              withdrawalAmount
                            }
                            onChange={(event) =>
                              setWithdrawalAmount(
                                event.target
                                  .value
                              )
                            }
                            placeholder="Enter amount"
                            disabled={
                              withdrawalSubmitting ||
                              withdrawalLoading
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleWithdrawAll
                          }
                          disabled={
                            withdrawalSubmitting ||
                            withdrawalLoading ||
                            withdrawalBalance.availableAmount <=
                              0
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Withdraw All
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Available balance:{" "}
                        <span className="font-semibold text-gray-700">
                          {withdrawalLoading
                            ? "..."
                            : formatCurrency(
                                withdrawalBalance.availableAmount
                              )}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck
                          size={19}
                          className="mt-0.5 shrink-0 text-gray-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Payout destination
                          </p>

                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            {payout.accountName}
                          </p>

                          <p className="text-sm text-gray-500">
                            {payout.bankName} ·{" "}
                            {payout.accountNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        withdrawalSubmitting ||
                        withdrawalLoading ||
                        !payout.verified ||
                        withdrawalBalance.availableAmount <=
                          0
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {withdrawalSubmitting ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine
                            size={18}
                          />
                          Request Withdrawal
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Withdrawal history */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
              <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <History
                    size={19}
                    className="text-gray-600"
                  />

                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Withdrawal History
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      View your previous withdrawal
                      requests and their status.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-gray-400">
                  {withdrawalHistory.length}{" "}
                  {withdrawalHistory.length === 1
                    ? "record"
                    : "records"}
                </span>
              </div>

              {withdrawalLoading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-gray-500">
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Loading withdrawal history...
                </div>
              ) : withdrawalHistory.length ===
                0 ? (
                <div className="px-5 py-10 text-center">
                  <History
                    size={30}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    No withdrawals yet
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Your withdrawal requests will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {withdrawalHistory.map(
                    (withdrawal) => (
                      <div
                        key={
                          withdrawal._id ||
                          withdrawal.id ||
                          withdrawal.transferReference
                        }
                        className="px-5 py-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-bold text-gray-900">
                                {formatCurrency(
                                  withdrawal.amount
                                )}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getWithdrawalStatusClass(
                                  withdrawal.status
                                )}`}
                              >
                                {getWithdrawalStatusLabel(
                                  withdrawal.status
                                )}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              Requested{" "}
                              {formatDateTime(
                                withdrawal.createdAt
                              )}
                            </p>

                            {withdrawal.bankName && (
                              <p className="mt-1 text-sm text-gray-500">
                                {withdrawal.bankName}{" "}
                                ·{" "}
                                {withdrawal.accountNumber
                                  ? `••••${String(
                                      withdrawal.accountNumber
                                    ).slice(-4)}`
                                  : "Bank account"}
                              </p>
                            )}

                            {withdrawal.failureReason && (
                              <p className="mt-2 text-sm text-red-600">
                                {withdrawal.failureReason}
                              </p>
                            )}

                            {withdrawal.transferReference && (
                              <p className="mt-2 break-all text-xs text-gray-400">
                                Reference:{" "}
                                {
                                  withdrawal.transferReference
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-start gap-2 lg:items-end">
                            {withdrawal.completedAt && (
                              <p className="text-xs text-gray-500">
                                Completed{" "}
                                {formatDate(
                                  withdrawal.completedAt
                                )}
                              </p>
                            )}

                            {withdrawal.status ===
                              "pending" && (
                              <button
                                type="button"
                                onClick={
                                  handleCancelWithdrawal
                                }
                                disabled={
                                  withdrawalCancelling
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {withdrawalCancelling ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <XCircle
                                    size={16}
                                  />
                                )}

                                {withdrawalCancelling
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payout Account */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Building2 size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Payout Account
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Add and verify the Nigerian bank
                  account where your seller earnings
                  will be paid.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {payout.verified ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2
                        size={21}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Verified payout account
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {payout.accountName}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {payout.bankName} ·{" "}
                        {payout.accountNumber}
                      </p>

                      {payout.verifiedAt && (
                        <p className="mt-2 text-xs text-gray-500">
                          Verified on{" "}
                          {formatDate(
                            payout.verifiedAt
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPayout({
                        bankCode: "",
                        bankName: "",
                        accountNumber: "",
                        accountName: "",
                        verified: false,
                        verifiedAt: null,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Change account
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleVerifyPayout}
                className="space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="payout-bank"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Bank
                    </label>

                    <select
                      id="payout-bank"
                      name="bankCode"
                      value={
                        payoutForm.bankCode
                      }
                      onChange={
                        handlePayoutChange
                      }
                      disabled={
                        banksLoading ||
                        payoutLoading
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                    >
                      <option value="">
                        {banksLoading
                          ? "Loading banks..."
                          : "Select your bank"}
                      </option>

                      {banks.map((bank) => (
                        <option
                          key={`${bank.code}-${bank.name}`}
                          value={bank.code}
                        >
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="payout-account-number"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Account Number
                    </label>

                    <input
                      id="payout-account-number"
                      name="accountNumber"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={
                        payoutForm.accountNumber
                      }
                      onChange={
                        handlePayoutChange
                      }
                      placeholder="Enter 10-digit account number"
                      disabled={payoutLoading}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-gray-600"
                    />

                    <p className="text-sm leading-6 text-gray-600">
                      Vendora verifies your account
                      directly through Paystack. The
                      account name returned by your bank
                      will be used for future payouts.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    payoutLoading ||
                    banksLoading
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <ShieldCheck size={18} />

                  {payoutLoading
                    ? "Verifying account..."
                    : "Verify Bank Account"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Recent orders containing your
                products.
              </p>
            </div>

            <Link
              to="/seller/orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
            >
              View All
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Loading recent orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <ShoppingBag
                size={28}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No orders yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Orders containing your products
                will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Order #
                      {String(
                        order.id
                      ).slice(-8)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {order.buyer?.name ||
                        "Customer"}{" "}
                      ·{" "}
                      {formatDate(
                        order.createdAt
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(
                          order.total
                        )}
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${
                          order.paymentStatus ===
                          "paid"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {order.paymentStatus ===
                        "paid"
                          ? "Paid"
                          : "Payment pending"}
                      </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                      {order.orderStatus ||
                        "pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* Manage Products */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Package size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Manage Products
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Add new products, update your
              listings and manage your available
              stock.
            </p>

            <Link
              to="/seller/products"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
            >
              View products
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Manage Orders */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <ShoppingBag size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Manage Orders
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Keep track of customer orders and
              manage your fulfilment workflow.
            </p>

            <Link
              to="/seller/orders"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
            >
              Manage orders
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Store Settings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Settings size={21} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              Store Settings
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Update your store information and
              configure your seller account.
            </p>

            <Link
              to="/seller/settings"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
            >
              Open store settings
              <ArrowRight size={16} />
            </Link>
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
              Your seller account is ready. Add
              your first product to begin building
              your Vendora store.
            </p>

            <Link
              to="/seller/products/add"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <Plus size={18} />
              Add Your First Product
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerDashboard;