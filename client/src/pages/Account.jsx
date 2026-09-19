import apiFetch from "../services/apiFetch";
import { useEffect, useRef, useState } from "react";
import {
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  LogOut,
  LoaderCircle,
  ShoppingBag,
  ChevronRight,
  Camera,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Account = () => {
  const { user, logout } = useAuth();

  const fileInputRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profileImage: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // =====================================================
  // LOAD PROFILE
  // =====================================================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError("");

        const response = await apiFetch(
          "/api/users/profile"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load profile"
          );
        }

        setProfile({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          location: data.user?.location || "",
          bio: data.user?.bio || "",
          profileImage: data.user?.profileImage || "",
        });
      } catch (error) {
        console.error(
          "Load profile error:",
          error
        );

        setProfileError(error.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // =====================================================
  // LOAD ORDERS
  // =====================================================
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");

        const response = await apiFetch(
          "/api/orders/my-orders"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load your orders"
          );
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error(
          "Load orders error:",
          error
        );

        setOrdersError(error.message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  // =====================================================
  // HANDLE PROFILE INPUT
  // =====================================================
  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value,
    }));

    setProfileMessage("");
    setProfileError("");
  };

  // =====================================================
  // HANDLE PROFILE IMAGE SELECTION
  // =====================================================
  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfileMessage("");
    setProfileError("");

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setProfileError(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setProfileError(
        "Profile image must be 5MB or smaller."
      );

      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("profileImage", file);

      const response = await apiFetch(
        "/api/uploads/profile-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to upload profile image"
        );
      }

      setProfile((previousProfile) => ({
        ...previousProfile,
        profileImage:
          data.profileImage ||
          previousProfile.profileImage,
      }));

      setProfileMessage(
        "Profile image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Profile image upload error:",
        error
      );

      setProfileError(
        error.message ||
          "Unable to upload profile image"
      );
    } finally {
      setUploadingImage(false);

      // Allow selecting the same file again
      event.target.value = "";
    }
  };

  // =====================================================
  // OPEN FILE PICKER
  // =====================================================
  const handleChooseImage = () => {
    if (uploadingImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileMessage("");

      const response = await apiFetch(
        "/api/users/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update profile"
        );
      }

      setProfile({
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        location: data.user?.location || "",
        bio: data.user?.bio || "",
        profileImage:
          data.user?.profileImage ||
          profile.profileImage ||
          "",
      });

      setProfileMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // PAYMENT STATUS CLASS
  // =====================================================
  const getPaymentStatusClass = (status) => {
    if (status === "paid") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "failed") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "refunded") {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  // =====================================================
  // ORDER STATUS CLASS
  // =====================================================
  const getOrderStatusClass = (status) => {
    if (status === "delivered") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "cancelled") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "shipped") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === "processing") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }

    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const profileInitial =
    profile.name?.charAt(0)?.toUpperCase() ||
    user?.name?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Account
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                My Account
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage your profile and keep track of your orders.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =====================================================
            PROFILE SECTION
        ===================================================== */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h2 className="text-xl font-bold text-gray-950">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update your personal information and profile details.
            </p>
          </div>

          {loadingProfile ? (
            <div className="p-10 text-center">
              <LoaderCircle
                size={30}
                className="mx-auto animate-spin text-gray-700"
              />

              <p className="mt-4 text-sm text-gray-500">
                Loading your profile...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSaveProfile}
              className="p-5 sm:p-6"
            >
              {/* Profile preview */}
              <div className="mb-8 flex flex-col gap-5 border-b border-gray-100 pb-7 sm:flex-row sm:items-center">
                <div className="relative">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name || "Profile"}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-950 text-2xl font-bold text-white ring-4 ring-gray-100">
                      {profileInitial}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleChooseImage}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Change profile image"
                  >
                    {uploadingImage ? (
                      <LoaderCircle
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-950">
                    {profile.name || "Your Profile"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Upload a JPG, PNG, or WEBP image up to 5MB.
                  </p>

                  <button
                    type="button"
                    onClick={handleChooseImage}
                    disabled={uploadingImage}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingImage ? (
                      <>
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        Change Photo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {profileError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {profileMessage}
                </div>
              )}

              {/* Form fields */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={profile.name}
                      onChange={handleProfileChange}
                      required
                      maxLength={100}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Location
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={profile.location}
                      onChange={handleProfileChange}
                      maxLength={200}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="e.g. Ibadan, Oyo State"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="bio"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Bio
                  </label>

                  <textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleProfileChange}
                    maxLength={500}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Tell us a little about yourself..."
                  />

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {profile.bio.length}/500
                  </p>
                </div>
              </div>

              {/* Account type */}
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 text-gray-600"
                  />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Account Type
                    </p>

                    <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                      {user?.role || "Buyer"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    savingProfile ||
                    uploadingImage
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {savingProfile ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* =====================================================
            ACCOUNT OVERVIEW + ORDERS
        ===================================================== */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile summary */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name || "Profile"}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-950 text-xl font-bold text-white">
                  {profileInitial}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-950">
                  {profile.name ||
                    user?.name ||
                    "User"}
                </h2>

                <p className="truncate text-sm text-gray-500">
                  {profile.email ||
                    user?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-start gap-3">
                <User
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.name ||
                      "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {profile.email ||
                      "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.phone ||
                      "Not added"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.location ||
                      "Not added"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Account type
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                    {user?.role || "Buyer"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* =====================================================
              ORDERS
          ===================================================== */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  My Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View your recent purchases and order status.
                </p>
              </div>

              <div className="hidden rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 sm:block">
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </div>
            </div>

            {loadingOrders ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <LoaderCircle
                  size={32}
                  className="mx-auto animate-spin text-gray-700"
                />

                <p className="mt-4 text-sm text-gray-500">
                  Loading your orders...
                </p>
              </div>
            ) : ordersError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-red-600">
                  {ordersError}
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <ShoppingBag
                    size={25}
                    className="text-gray-600"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-950">
                  No orders yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  When you purchase something on Vendora,
                  your orders will appear here.
                </p>

                <Link
                  to="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <ShoppingBag size={17} />
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package
                            size={18}
                            className="text-gray-700"
                          />

                          <p className="text-sm font-bold text-gray-950">
                            {order.orderNumber}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Ordered on{" "}
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-gray-950">
                          ₦
                          {Number(
                            order.total || 0
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.items?.length ||
                            0}{" "}
                          {order.items?.length === 1
                            ? "product"
                            : "products"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        Payment:{" "}
                        {order.paymentStatus}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        Order:{" "}
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Delivery to
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {order.deliveryAddress?.city},{" "}
                            {order.deliveryAddress?.state}
                          </p>
                        </div>

                        <Link
                          to={`/account/orders/${order._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                          View Order
                          <ChevronRight
                            size={16}
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Account;