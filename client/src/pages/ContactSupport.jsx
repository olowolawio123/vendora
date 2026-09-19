import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Send,
  MessageSquare,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const ContactSupport = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await apiFetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to submit support request"
        );
      }

      setSubmitted(true);

      setFormData({
        name: "",
        email: "",
        category: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/help-center"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-700" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              Contact Support
            </h1>

            <p className="mt-2 text-gray-600">
              Tell us what you need help with and the Vendora support
              team will assist you.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Mail className="h-6 w-6 text-gray-700" />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Support request received
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
                Your support request has been submitted successfully.
                Our support team will review your request and get back
                to you.
              </p>

              <Link
                to="/help-center"
                className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Return to Help Center
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Issue category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">
                    Select an issue
                  </option>
                  <option value="Buying">Buying</option>
                  <option value="Orders & Payments">
                    Orders & Payments
                  </option>
                  <option value="Account & Login">
                    Account & Login
                  </option>
                  <option value="Selling">Selling</option>
                  <option value="Safety & Security">
                    Safety & Security
                  </option>
                  <option value="Returns & Refunds">
                    Returns & Refunds
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Briefly describe your issue"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder="Explain the issue you are experiencing..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />

                {submitting
                  ? "Submitting..."
                  : "Submit Support Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;