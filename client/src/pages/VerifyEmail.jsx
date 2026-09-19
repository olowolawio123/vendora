import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiFetch from "../services/apiFetch";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(
    searchParams.get("email") || ""
  );
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCodeChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
    setError("");
    setMessage("");
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to verify your email."
        );
      }

      setMessage(
        data.message ||
          "Email verified successfully. You can now log in."
      );

      setCode("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(
        error.message || "Unable to verify your email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setResending(true);

    try {
      const response = await apiFetch(
        "/api/auth/resend-verification-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to resend the verification code."
        );
      }

      setMessage(
        data.message ||
          "A new verification code has been sent."
      );

      setCode("");
      setResendCooldown(60);
    } catch (error) {
      setError(
        error.message ||
          "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <ShieldCheck
                className="h-8 w-8 text-green-600"
                strokeWidth={2}
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Verify your email
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              We sent a 6-digit verification code to your
              email address. Enter the code below to verify
              your Vendora account.
            </p>
          </div>

          <form
            onSubmit={handleVerify}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  strokeWidth={1.8}
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
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="verificationCode"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Verification code
              </label>

              <input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />

              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Clock3 className="h-4 w-4" />
                <span>Code expires in 10 minutes</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2
                className="h-5 w-5"
                strokeWidth={2}
              />

              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6 text-center">
            <p className="mb-3 text-sm text-gray-600">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={
                resending ||
                loading ||
                resendCooldown > 0
              }
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-900 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  resending ? "animate-spin" : ""
                }`}
                strokeWidth={2}
              />

              {resending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend verification code"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Back to login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;