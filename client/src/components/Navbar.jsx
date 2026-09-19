import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Store,
  LogOut,
  LayoutDashboard,
  Heart,
  Bell,
  CheckCheck,
  Trash2,
  CircleHelp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiFetch from "../services/apiFetch";
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

const API_URL = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const response = await apiFetch("/api/cart");

      if (!response.ok) {
        console.error(
          "Cart count request failed:",
          response.status
        );

        setCartCount(0);
        return;
      }

      const data = await response.json();

      const count = (data.cart?.items || []).reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      setCartCount(count);
    } catch (error) {
      console.error(
        "Unable to load cart count:",
        error
      );

      setCartCount(0);
    }
  };

  const loadNotificationCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const data =
        await getUnreadNotificationCount();

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(
        "Unable to load notification count:",
        error
      );

      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(
        "Unable to load notifications:",
        error
      );
    }
  };

  useEffect(() => {
    loadCartCount();
  }, [user]);

  useEffect(() => {
    loadNotificationCount();
  }, [user]);

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartCount();
    };

    window.addEventListener(
      "cartUpdated",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );
    };
  }, [user]);

  useEffect(() => {
    const handleNotificationUpdated = () => {
      loadNotificationCount();

      if (notificationOpen) {
        loadNotifications();
      }
    };

    window.addEventListener(
      "notificationUpdated",
      handleNotificationUpdated
    );

    return () => {
      window.removeEventListener(
        "notificationUpdated",
        handleNotificationUpdated
      );
    };
  }, [user, notificationOpen]);

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;

    setNotificationOpen(nextState);
    setAccountOpen(false);

    if (nextState) {
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (
    notification
  ) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(
          notification._id
        );

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }

      setNotificationOpen(false);

      if (notification.order?._id) {
        navigate(
          `/account/orders/${notification.order._id}`
        );
      }
    } catch (error) {
      console.error(
        "Unable to open notification:",
        error
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Unable to mark notifications as read:",
        error
      );
    }
  };

  const handleDeleteNotification = async (
    event,
    notificationId
  ) => {
    event.stopPropagation();

    try {
      const notification =
        notifications.find(
          (item) =>
            item._id === notificationId
        );

      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter(
          (item) =>
            item._id !== notificationId
        )
      );

      if (
        notification &&
        !notification.isRead
      ) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }
    } catch (error) {
      console.error(
        "Unable to delete notification:",
        error
      );
    }
  };

  const formatNotificationTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    return date.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      navigate("/products");
      return;
    }

    navigate(
      `/products?search=${encodeURIComponent(
        query
      )}`
    );

    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();

      setCartCount(0);
      setUnreadCount(0);
      setNotifications([]);

      setAccountOpen(false);
      setNotificationOpen(false);
      setMobileOpen(false);

      navigate("/products");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">

          {/* LOGO */}
          <Link
            to="/products"
            onClick={closeMenus}
            className="flex shrink-0 flex-col"
          >
            <span className="text-2xl font-bold tracking-tight text-gray-950">
              Vendora
            </span>

            <span className="text-[11px] font-medium tracking-wide text-gray-500">
              Buy. Sell. Connect.
            </span>
          </Link>

          {/* DESKTOP SEARCH */}
          <form
            onSubmit={handleSearch}
            className="hidden max-w-xl flex-1 md:flex"
          >
            <div className="relative w-full">
              <Search
                size={19}
                strokeWidth={2}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, brands and categories..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </form>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-1 lg:flex">

            <Link
              to="/products"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Products
            </Link>

            {/* HELP CENTER */}
            <Link
              to="/help-center"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <CircleHelp size={17} />
              Help
            </Link>

            <Link
              to="/become-a-seller"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <Store size={17} />
              Sell
            </Link>

            {/* WISHLIST */}
            <button
              type="button"
              onClick={() => navigate("/wishlist")}
              className="rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart
                size={21}
                strokeWidth={1.9}
              />
            </button>

            {/* NOTIFICATIONS */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={
                    handleNotificationToggle
                  }
                  className="relative rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell
                    size={21}
                    strokeWidth={1.9}
                  />

                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold text-white">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 top-12 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notifications
                        </h3>

                        {unreadCount > 0 && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {unreadCount} unread
                          </p>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={
                            handleMarkAllAsRead
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-950"
                        >
                          <CheckCheck
                            size={15}
                          />
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* NOTIFICATIONS */}
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <Bell
                            size={30}
                            className="mx-auto text-gray-300"
                          />

                          <p className="mt-3 text-sm font-medium text-gray-900">
                            No notifications
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            You're all caught up.
                          </p>
                        </div>
                      ) : (
                        notifications.map(
                          (notification) => (
                            <div
                              key={
                                notification._id
                              }
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                              className={`group cursor-pointer border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50 ${
                                !notification.isRead
                                  ? "bg-gray-50"
                                  : "bg-white"
                              }`}
                            >
                              <div className="flex gap-3">

                                <div className="mt-0.5 shrink-0">
                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                      notification.isRead
                                        ? "bg-gray-100"
                                        : "bg-gray-950"
                                    }`}
                                  >
                                    <Bell
                                      size={16}
                                      className={
                                        notification.isRead
                                          ? "text-gray-500"
                                          : "text-white"
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`text-sm ${
                                        notification.isRead
                                          ? "font-medium text-gray-700"
                                          : "font-semibold text-gray-950"
                                      }`}
                                    >
                                      {
                                        notification.title
                                      }
                                    </p>

                                    <button
                                      type="button"
                                      onClick={(
                                        event
                                      ) =>
                                        handleDeleteNotification(
                                          event,
                                          notification._id
                                        )
                                      }
                                      className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100"
                                      aria-label="Delete notification"
                                      title="Delete notification"
                                    >
                                      <Trash2
                                        size={14}
                                      />
                                    </button>
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-gray-600">
                                    {
                                      notification.message
                                    }
                                  </p>

                                  <p className="mt-1.5 text-[10px] text-gray-400">
                                    {formatNotificationTime(
                                      notification.createdAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    {/* FOOTER */}
                    <div className="border-t border-gray-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationOpen(
                            false
                          );
                          navigate(
                            "/notifications"
                          );
                        }}
                        className="w-full text-center text-xs font-semibold text-gray-700 hover:text-gray-950"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CART */}
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
              aria-label="Shopping cart"
              title="Shopping cart"
            >
              <ShoppingCart
                size={21}
                strokeWidth={1.9}
              />

              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold text-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </button>

            {/* ACCOUNT */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setNotificationOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <User
                    size={17}
                    className="text-gray-700"
                  />
                </div>

                <div className="hidden text-left xl:block">
                  <p className="max-w-28 truncate text-xs font-semibold text-gray-900">
                    {user
                      ? user.name
                      : "Account"}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    {user
                      ? "My account"
                      : "Sign in"}
                  </p>
                </div>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                  {user ? (
                    <>
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/account"
                        onClick={closeMenus}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={17} />
                        My Account
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={closeMenus}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart size={17} />
                        My Wishlist
                      </Link>

                      {/* MY SUPPORT REQUESTS */}
                      <Link
                        to="/my-support-requests"
                        onClick={closeMenus}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <CircleHelp size={17} />
                        My Support Requests
                      </Link>

                      {user.role === "seller" && (
                        <Link
                          to="/seller"
                          onClick={closeMenus}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard
                            size={17}
                          />
                          Seller Dashboard
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut size={17} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">
                          Welcome to Vendora
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Sign in to manage your
                          account.
                        </p>
                      </div>

                      <Link
                        to="/login"
                        onClick={closeMenus}
                        className="mx-3 flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                      >
                        Sign In
                      </Link>

                      <Link
                        to="/register"
                        onClick={closeMenus}
                        className="mx-3 mt-2 flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MOBILE HEADER */}
          <div className="flex items-center gap-1 lg:hidden">

            {/* MOBILE WISHLIST */}
            <button
              type="button"
              onClick={() =>
                navigate("/wishlist")
              }
              aria-label="Wishlist"
              title="Wishlist"
              className="rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <Heart size={21} />
            </button>

            {/* MOBILE NOTIFICATIONS */}
            {user && (
              <button
                type="button"
                onClick={
                  handleNotificationToggle
                }
                aria-label="Notifications"
                title="Notifications"
                className="relative rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
              >
                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* MOBILE CART */}
            <button
              type="button"
              onClick={() =>
                navigate("/cart")
              }
              aria-label="Shopping cart"
              title="Shopping cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <ShoppingCart
                size={21}
                strokeWidth={1.9}
              />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </button>

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() =>
                setMobileOpen(!mobileOpen)
              }
              aria-label={
                mobileOpen
                  ? "Close menu"
                  : "Open menu"
              }
              className="rounded-lg p-2.5 text-gray-700 hover:bg-gray-100"
            >
              {mobileOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE NOTIFICATIONS PANEL */}
        {notificationOpen && (
          <div className="border-t border-gray-100 bg-white py-3 lg:hidden">
            <div className="overflow-hidden rounded-xl border border-gray-200">

              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>

                  {unreadCount > 0 && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {unreadCount} unread
                    </p>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={
                      handleMarkAllAsRead
                    }
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600"
                  >
                    <CheckCheck size={15} />
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Bell
                      size={30}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-900">
                      No notifications
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      You're all caught up.
                    </p>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <div
                        key={notification._id}
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                        className={`border-b border-gray-100 px-4 py-3 ${
                          !notification.isRead
                            ? "bg-gray-50"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                notification.isRead
                                  ? "bg-gray-100"
                                  : "bg-gray-950"
                              }`}
                            >
                              <Bell
                                size={16}
                                className={
                                  notification.isRead
                                    ? "text-gray-500"
                                    : "text-white"
                                }
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm ${
                                notification.isRead
                                  ? "font-medium text-gray-700"
                                  : "font-semibold text-gray-950"
                              }`}
                            >
                              {
                                notification.title
                              }
                            </p>

                            <p className="mt-1 text-xs leading-5 text-gray-600">
                              {
                                notification.message
                              }
                            </p>

                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-[10px] text-gray-400">
                                {formatNotificationTime(
                                  notification.createdAt
                                )}
                              </p>

                              <button
                                type="button"
                                onClick={(
                                  event
                                ) =>
                                  handleDeleteNotification(
                                    event,
                                    notification._id
                                  )
                                }
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Delete notification"
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate(
                      "/notifications"
                    );
                  }}
                  className="w-full text-center text-xs font-semibold text-gray-700"
                >
                  View all notifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="border-t border-gray-100 py-4 lg:hidden">

            {/* MOBILE SEARCH */}
            <form
              onSubmit={handleSearch}
              className="mb-4"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search products..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </div>
            </form>

            <div className="space-y-1">

              {/* PRODUCTS */}
              <Link
                to="/products"
                onClick={closeMenus}
                className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Products
              </Link>

              {/* HELP CENTER */}
              <Link
                to="/help-center"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CircleHelp size={18} />
                Help Center
              </Link>

              {/* WISHLIST */}
              <Link
                to="/wishlist"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Heart size={18} />
                My Wishlist
              </Link>

              {/* NOTIFICATIONS */}
              {user && (
                <button
                  type="button"
                  onClick={
                    handleNotificationToggle
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <Bell size={18} />
                    Notifications
                  </span>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-gray-950 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* SELL */}
              <Link
                to="/become-a-seller"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Store size={18} />
                Become a Seller
              </Link>

              {user ? (
                <>
                  {/* ACCOUNT */}
                  <Link
                    to="/account"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <User size={18} />
                    My Account
                  </Link>

                  {/* MY SUPPORT REQUESTS */}
                  <Link
                    to="/my-support-requests"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <CircleHelp size={18} />
                    My Support Requests
                  </Link>

                  {/* SELLER DASHBOARD */}
                  {user.role === "seller" && (
                    <Link
                      to="/seller"
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard
                        size={18}
                      />
                      Seller Dashboard
                    </Link>
                  )}

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">

                  <Link
                    to="/login"
                    onClick={closeMenus}
                    className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenus}
                    className="flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;