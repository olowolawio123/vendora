import { Link } from "react-router-dom";
import {
  ShoppingBag,
  CircleHelp,
  Mail,
  User,
  Heart,
  ShieldCheck,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white transition-colors duration-200 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* TOP SECTION */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* BRAND */}
          <div>
            <Link
              to="/products"
              className="inline-flex flex-col"
            >
              <span className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                Vendora
              </span>

              <span className="mt-1 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                Buy. Sell. Connect.
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-600 dark:text-gray-400">
              A trusted marketplace where buyers and sellers
              can connect, discover products, and trade with
              confidence.
            </p>
          </div>

          {/* MARKETPLACE */}
          <div>
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
              Marketplace
            </h3>

            <div className="mt-4 space-y-3">
              <Link
                to="/products"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <ShoppingBag size={16} />
                Products
              </Link>

              <Link
                to="/become-a-seller"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <User size={16} />
                Become a Seller
              </Link>

              <Link
                to="/wishlist"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <Heart size={16} />
                Wishlist
              </Link>
            </div>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
              Support
            </h3>

            <div className="mt-4 space-y-3">
              <Link
                to="/help-center"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <CircleHelp size={16} />
                Help Center
              </Link>

              <Link
                to="/contact-support"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <Mail size={16} />
                Contact Support
              </Link>

              <Link
                to="/my-support-requests"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <ShieldCheck size={16} />
                My Support Requests
              </Link>
            </div>
          </div>

          {/* ACCOUNT */}
          <div>
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
              Account
            </h3>

            <div className="mt-4 space-y-3">
              <Link
                to="/account"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <User size={16} />
                My Account
              </Link>

              <Link
                to="/cart"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                <ShoppingBag size={16} />
                Shopping Cart
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Vendora. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              to="/help-center"
              className="text-xs text-gray-500 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
            >
              Help
            </Link>

            <span className="text-gray-300 dark:text-gray-700">
              |
            </span>

            <Link
              to="/contact-support"
              className="text-xs text-gray-500 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;