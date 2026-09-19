import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Store,
  MapPin,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import apiFetch from "../services/apiFetch";

const SellerSettings = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(
          "/api/sellers/me"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load seller profile"
          );
        }

        const seller = data.seller;

        setForm({
          storeName: seller?.storeName || "",
          description: seller?.description || "",
          phone: seller?.phone || "",
          location: seller?.location || "",
        });
      } catch (error) {
        console.error(
          "Load seller settings error:",
          error
        );

        toast.error(
          error.message ||
            "Unable to load store settings"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSellerProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        "/api/sellers/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeName: form.storeName.trim(),
            description: form.description.trim(),
            phone: form.phone.trim(),
            location: form.location.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update store settings"
        );
      }

      const seller = data.seller;

      setForm({
        storeName: seller?.storeName || "",
        description: seller?.description || "",
        phone: seller?.phone || "",
        location: seller?.location || "",
      });

      toast.success(
        "Store settings updated successfully"
      );
    } catch (error) {
      console.error(
        "Update seller settings error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to update store settings"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <div className="mx-auto flex min-h-[500px] max-w-4xl items-center justify-center px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading store settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Store size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Store Settings
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Update your store information and keep
                your seller profile up to date.
              </p>
            </div>
          </div>
        </div>

        {/* Settings form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-bold text-gray-900">
              Store Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This information will be used on your
              public Vendora store.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">

            {/* Store name */}
            <div>
              <label
                htmlFor="storeName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Store Name
              </label>

              <div className="relative">
                <Store
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  value={form.storeName}
                  onChange={handleChange}
                  placeholder="Enter your store name"
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Store Description
              </label>

              <div className="relative">
                <FileText
                  size={18}
                  className="pointer-events-none absolute left-3 top-3.5 text-gray-400"
                />

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your store"
                  rows={5}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/500
              </p>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  maxLength={30}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Store Location
              </label>

              <div className="relative">
                <MapPin
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Ibadan, Oyo State"
                  maxLength={150}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs leading-5 text-gray-500">
              Changes are saved to your seller profile.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerSettings;