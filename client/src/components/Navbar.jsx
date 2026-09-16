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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        credentials: "include",
      });

      if (!response.ok) {
        setCartCount(0);
        return;
      }

      const data = await response.json();

      const count = (data.cart?.items || []).reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );

      setCartCount(count);
    } catch (error) {
      console.error("Unable to load cart count:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();
  }, [user]);

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );
    };
  }, [user]);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCartCount(0);
      setAccountOpen(false);
      setMobileOpen(false);
      navigate("/products");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
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

          <div className="hidden items-center gap-1 lg:flex">
            <Link
              to="/products"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Products
            </Link>

            <Link
              to="/become-a-seller"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <Store size={17} />
              Sell
            </Link>

            {/* CART */}
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative rounded-lg p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
              aria-label="Shopping cart"
            >
              <ShoppingCart
                size={21}
                strokeWidth={1.9}
              />

              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <div className="relative ml-1">
              <button
                type="button"
                onClick={() =>
                  setAccountOpen(!accountOpen)
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <User size={17} className="text-gray-700" />
                </div>

                <div className="hidden text-left xl:block">
                  <p className="max-w-28 truncate text-xs font-semibold text-gray-900">
                    {user ? user.name : "Account"}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    {user ? "My account" : "Sign in"}
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

                      {user.role === "seller" && (
                        <Link
                          to="/seller"
                          onClick={closeMenus}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard size={17} />
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
                          Sign in to manage your account.
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

          {/* MOBILE */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => navigate("/cart")}
              aria-label="Shopping cart"
              className="relative rounded-lg p-2.5 text-gray-600 hover:bg-gray-100"
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={
                mobileOpen ? "Close menu" : "Open menu"
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

        {mobileOpen && (
          <div className="border-t border-gray-100 py-4 lg:hidden">
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
              <Link
                to="/products"
                onClick={closeMenus}
                className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Products
              </Link>

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
                  <Link
                    to="/account"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <User size={18} />
                    My Account
                  </Link>

                  {user.role === "seller" && (
                    <Link
                      to="/seller"
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard size={18} />
                      Seller Dashboard
                    </Link>
                  )}

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