import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process your password reset request."
        );
      }

      setMessage(
        data.message ||
          "If an account exists with this email, a reset code has been sent."
      );

      // Give the success message a moment to display,
      // then take the user to the code entry page.
      setTimeout(() => {
        navigate(
          `/reset-password?email=${encodeURIComponent(
            cleanEmail
          )}`
        );
      }, 1200);
    } catch (error) {
      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 px-3 py-6 sm:px-4 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl">

          {/* Header */}
          <div className="bg-gray-950 px-6 py-8 text-white sm:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-950">
                <Store size={23} />
              </div>

              <div>
                <p className="text-xl font-bold">
                  Vendora
                </p>

                <p className="text-xs text-gray-400">
                  Buy. Sell. Connect.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                Account recovery
              </p>

              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Forgot your password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Enter your email address and we'll send you
                a 6-digit code to reset your password.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-7 sm:px-10 sm:py-10">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setMessage("");
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <p className="text-sm leading-6 text-green-800">
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound size={18} />

                {loading
                  ? "Sending code..."
                  : "Send reset code"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-gray-600"
                />

                <p className="text-xs leading-5 text-gray-600">
                  Your password reset code will expire after
                  10 minutes.
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-gray-100 pt-6">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-950"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;