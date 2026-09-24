import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Account from "./pages/Account";
import BecomeSeller from "./pages/BecomeSeller";
import SellerDashboard from "./pages/SellerDashboard";
import AddProduct from "./pages/AddProduct";
import SellerProducts from "./pages/SellerProducts";
import EditProduct from "./pages/EditProduct";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Navbar from "./components/Navbar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentCallback from "./pages/PaymentCallback";
import OrderDetails from "./pages/OrderDetails";
import AdminDashboard from "./pages/AdminDashboard";
import SellerOrders from "./pages/SellerOrders";
import SellerStore from "./pages/SellerStore";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import SellerSettings from "./pages/SellerSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HelpCenter from "./pages/HelpCenter";
import ContactSupport from "./pages/ContactSupport";
import MySupportRequests from "./pages/MySupportRequests";
import Messages from "./pages/Messages";
import Footer from "./components/Footer";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("vendora_theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vendora_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vendora_theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((current) => !current);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
        <Navbar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <main className="min-h-[calc(100vh-80px)]">
          <Routes>
            {/* LOGIN */}
            <Route path="/login" element={<Login />} />

            {/* FORGOT PASSWORD */}
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            {/* REGISTER */}
            <Route path="/register" element={<Register />} />

            {/* VERIFY EMAIL */}
            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            {/* RESET PASSWORD */}
            <Route
              path="/reset-password"
              element={<ResetPassword />}
            />

            {/* HELP CENTER */}
            <Route
              path="/help-center"
              element={<HelpCenter />}
            />

            <Route
              path="/contact-support"
              element={<ContactSupport />}
            />

            <Route
              path="/my-support-requests"
              element={<MySupportRequests />}
            />

            {/* PRODUCTS */}
            <Route
              path="/products"
              element={<Products />}
            />

            {/* PRODUCT DETAILS */}
            <Route
              path="/product/:productId"
              element={<ProductDetails />}
            />

            {/* CART */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />

            {/* WISHLIST */}
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            {/* CHECKOUT */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            {/* PAYMENT CALLBACK */}
            <Route
              path="/payment/callback"
              element={<PaymentCallback />}
            />

            {/* SELLER SETTINGS */}
            <Route
              path="/seller/settings"
              element={
                <ProtectedRoute>
                  <SellerSettings />
                </ProtectedRoute>
              }
            />

            {/* NOTIFICATIONS */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* MESSAGES */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* SELLER ORDERS */}
            <Route
              path="/seller/orders"
              element={
                <RoleProtectedRoute allowedRoles={["seller"]}>
                  <SellerOrders />
                </RoleProtectedRoute>
              }
            />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* PUBLIC SELLER STORE */}
            <Route
              path="/seller/:sellerId"
              element={<SellerStore />}
            />

            {/* BUYER ACCOUNT */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            {/* ORDER DETAILS */}
            <Route
              path="/account/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            {/* BECOME A SELLER */}
            <Route
              path="/become-a-seller"
              element={
                <ProtectedRoute>
                  <BecomeSeller />
                </ProtectedRoute>
              }
            />

            {/* SELLER DASHBOARD */}
            <Route
              path="/seller"
              element={
                <RoleProtectedRoute allowedRoles={["seller"]}>
                  <SellerDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* SELLER PRODUCTS */}
            <Route
              path="/seller/products"
              element={
                <RoleProtectedRoute allowedRoles={["seller"]}>
                  <SellerProducts />
                </RoleProtectedRoute>
              }
            />

            {/* ADD PRODUCT */}
            <Route
              path="/seller/products/add"
              element={
                <RoleProtectedRoute allowedRoles={["seller"]}>
                  <AddProduct />
                </RoleProtectedRoute>
              }
            />

            {/* EDIT PRODUCT */}
            <Route
              path="/seller/products/edit/:productId"
              element={
                <RoleProtectedRoute allowedRoles={["seller"]}>
                  <EditProduct />
                </RoleProtectedRoute>
              }
            />

            {/* DEFAULT */}
            <Route
              path="/"
              element={
                <Navigate
                  to="/products"
                  replace
                />
              }
            />

            {/* UNKNOWN ROUTES */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/products"
                  replace
                />
              }
            />
          </Routes>
        </main>
         <Footer />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      </div>
    </BrowserRouter>
  );
}

export default App;