import { useState } from "react";
import {
  Store,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const BecomeSeller = () => {
  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    phone: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/sellers/become",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit application"
        );
      }

      setMessage(data.message);

      setFormData({
        storeName: "",
        description: "",
        phone: "",
        location: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Store size={17} />
          <span>Vendora</span>
          <span>/</span>
          <span className="text-gray-700">Become a Seller</span>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* Information panel */}
          <div className="rounded-2xl bg-gray-900 p-7 text-white shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Store size={25} />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Start selling on Vendora
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
              Create your store and start showcasing your products
              to customers on Vendora.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Store size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Create your store
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    Give your store a name and tell customers what
                    you sell.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <FileText size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Add your store information
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    Provide your contact details and location so
                    customers can learn more about your business.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Start managing your products
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    Once your seller application is accepted, you
                    can manage your products from your seller
                    dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Seller application
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Tell us a little about the store you want to create.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              {/* Store name */}
              <div>
                <label
                  htmlFor="storeName"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Store name
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
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Enter your store name"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Store description
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="pointer-events-none absolute left-3 top-3.5 text-gray-400"
                  />

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell buyers about your store"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  A clear description helps customers understand
                  what your store offers.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Phone number
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
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
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
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Ibadan"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Application could not be submitted
                    </p>

                    <p className="mt-1 text-sm leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Application submitted
                    </p>

                    <p className="mt-1 text-sm leading-5 text-green-700">
                      {message}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    Apply to become a seller
                    <ArrowRight size={18} className="text-white" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-gray-500">
                By submitting this application, you are providing
                information about the store you want to operate on
                Vendora.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;