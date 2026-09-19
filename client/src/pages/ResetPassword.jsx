import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Store,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(
    searchParams.get("email") || ""
  );

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = () => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the 6-digit reset code.");
      return;
    }

    if (passwordStrength < 5) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            code: cleanCode,
            newPassword: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset your password."
        );
      }

      setSuccess(
        data.message ||
          "Password reset successfully. You can now log in."
      );

      setCode("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
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
                Reset your password
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Enter the 6-digit code sent to your email
                and create a new password.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-7 sm:px-10 sm:py-10">
            {success ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <p className="text-sm leading-6 text-green-800">
                    {success}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Store
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
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                      required
                    />
                  </div>
                </div>

                {/* Reset Code */}
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Password reset code
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => {
                        const value =
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                        setCode(value);
                        setError("");
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-4 text-center text-xl font-bold tracking-[0.4em] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                      required
                    />
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={14} />
                    The code expires after 10 minutes.
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {password && (
                    <p
                      className={`mt-2 text-xs ${
                        passwordStrength < 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength < 5
                        ? "Use at least 8 characters with uppercase, lowercase, number and special character."
                        : "Strong password"}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Resetting password..."
                    : "Reset password"}
                </button>
              </form>
            )}

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

export default ResetPassword;