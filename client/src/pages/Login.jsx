import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const {
    login,
    verifyLogin,
    resendLoginVerification,
  } = useAuth();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login verification state
  const [loginVerificationRequired, setLoginVerificationRequired] =
    useState(false);

  const [verificationEmail, setVerificationEmail] =
    useState("");

  const [verificationDisplayEmail, setVerificationDisplayEmail] =
    useState("");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [verificationLoading, setVerificationLoading] =
    useState(false);

  const [resendLoading, setResendLoading] =
    useState(false);

  const [resendCountdown, setResendCountdown] =
    useState(0);

  useEffect(() => {
    if (
      !loginVerificationRequired ||
      resendCountdown <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    resendCountdown,
    loginVerificationRequired,
  ]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
  };

  const redirectUser = (user) => {
    if (!user) {
      setError(
        "Login completed, but your account information could not be loaded."
      );
      return;
    }

    if (user.role === "seller") {
      navigate("/seller");
    } else if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/account");
    }
  };

  const startLoginVerification = (data) => {
    setLoginVerificationRequired(true);

    setVerificationEmail(
      data.verificationEmail || ""
    );

    setVerificationDisplayEmail(
      data.email || ""
    );

    setVerificationCode("");

    setResendCountdown(
      Number(data.resendAvailableIn) || 60
    );

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const identifier = formData.identifier.trim();

    if (!identifier) {
      setError(
        "Please enter your email or phone number."
      );
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await login({
        identifier,
        password: formData.password,
      });

      /*
       * Correct password, but this device needs
       * email verification before login is completed.
       */
      if (data.requiresLoginVerification) {
        startLoginVerification(data);
        return;
      }

      redirectUser(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCodeChange = (
    event
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setVerificationCode(value);
    setError("");
  };

  const handleVerifyLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!verificationCode) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    if (verificationCode.length !== 6) {
      setError(
        "The verification code must contain 6 digits."
      );
      return;
    }

    if (!verificationEmail) {
      setError(
        "Your verification session has expired. Please login again."
      );
      return;
    }

    setVerificationLoading(true);

    try {
      const data = await verifyLogin({
        email: verificationEmail,
        code: verificationCode,
      });

      redirectUser(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (
      resendLoading ||
      resendCountdown > 0 ||
      !verificationEmail
    ) {
      return;
    }

    setError("");
    setResendLoading(true);

    try {
      const data =
        await resendLoginVerification(
          verificationEmail
        );

      setVerificationDisplayEmail(
        data.email ||
          verificationDisplayEmail
      );

      setResendCountdown(
        Number(data.resendAvailableIn) || 60
      );

      setVerificationCode("");
    } catch (error) {
      setError(error.message);

      if (
        error.resendAvailableIn &&
        Number(error.resendAvailableIn) > 0
      ) {
        setResendCountdown(
          Number(error.resendAvailableIn)
        );
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLoginVerificationRequired(false);
    setVerificationEmail("");
    setVerificationDisplayEmail("");
    setVerificationCode("");
    setResendCountdown(0);
    setError("");
  };

  const handleGoogleSuccess = async (
    credentialResponse
  ) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error(
          "Google did not provide a valid login credential."
        );
      }

      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to login with Google."
        );
      }

      /*
       * Google login can also require the same
       * Vendora email verification.
       */
      if (data.requiresLoginVerification) {
        startLoginVerification(data);
        return;
      }

      redirectUser(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      "Google login was unsuccessful. Please try again."
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 px-3 py-6 sm:px-4 sm:py-10 lg:py-14">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl lg:grid-cols-2">
        {/* Left side */}
        <div className="hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
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

            <div className="mt-20 max-w-md">
              <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                Welcome back
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Your marketplace is waiting for you.
              </h2>

              <p className="mt-5 text-base leading-7 text-gray-400">
                Sign in to manage your orders, discover
                products and continue shopping on Vendora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck
              size={20}
              className="text-gray-300"
            />

            <span className="text-sm text-gray-300">
              Secure account authentication
            </span>
          </div>
        </div>

        {/* Login / Verification area */}
        <div className="w-full px-4 py-7 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <Store size={20} />
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-950">
                    Vendora
                  </p>

                  <p className="text-xs text-gray-500">
                    Buy. Sell. Connect.
                  </p>
                </div>
              </div>
            </div>

            {!loginVerificationRequired ? (
              <>
                <div className="mt-8 lg:mt-0">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                    Welcome back
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Login to your Vendora account.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-5 sm:mt-8"
                >
                  {/* Email or phone */}
                  <div>
                    <label
                      htmlFor="identifier"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Email or phone number
                    </label>

                    <div className="relative">
                      {formData.identifier.includes(
                        "@"
                      ) ? (
                        <Mail
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      ) : (
                        <Phone
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      )}

                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        value={
                          formData.identifier
                        }
                        onChange={handleChange}
                        placeholder="Email or 08012345678"
                        autoComplete="username"
                        className="w-full min-w-0 rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="shrink-0 text-xs font-semibold text-gray-700 hover:text-gray-950 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full min-w-0 rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Login */}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      googleLoading
                    }
                    className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Logging in..."
                      : "Login"}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />

                  <span className="shrink-0 text-xs font-medium text-gray-400">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Google Login */}
                <div className="w-full overflow-hidden">
                  {googleLoading ? (
                    <div className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-500">
                      Connecting to Google...
                    </div>
                  ) : (
                    <div className="flex w-full justify-center overflow-hidden">
                      <GoogleLogin
                        onSuccess={
                          handleGoogleSuccess
                        }
                        onError={
                          handleGoogleError
                        }
                        useOneTap={false}
                        theme="outline"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                        width="100%"
                      />
                    </div>
                  )}
                </div>

                <p className="mt-3 text-center text-xs leading-5 text-gray-400">
                  Sign in securely with your Google
                  account.
                </p>

                {/* Register */}
                <p className="mt-7 text-center text-sm leading-6 text-gray-500">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-gray-950 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              /* Login verification */
              <div className="mt-8 lg:mt-0">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="mb-7 flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
                >
                  <ArrowLeft size={17} />
                  Back to login
                </button>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <ShieldCheck size={23} />
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                  Verify your login
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  We sent a 6-digit verification code
                  to your email.
                </p>

                {verificationDisplayEmail && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <Mail
                      size={17}
                      className="shrink-0 text-gray-500"
                    />

                    <span className="break-all text-sm font-medium text-gray-700">
                      {verificationDisplayEmail}
                    </span>
                  </div>
                )}

                <form
                  onSubmit={
                    handleVerifyLogin
                  }
                  className="mt-7 space-y-5"
                >
                  <div>
                    <label
                      htmlFor="verificationCode"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Verification code
                    </label>

                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      value={verificationCode}
                      onChange={
                        handleVerificationCodeChange
                      }
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      autoFocus
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-center text-lg font-semibold tracking-[0.35em] text-gray-900 outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      verificationLoading ||
                      verificationCode.length !==
                        6
                    }
                    className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verificationLoading
                      ? "Verifying..."
                      : "Verify Login"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-gray-500">
                    Didn't receive the code?
                  </p>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={
                      resendLoading ||
                      resendCountdown > 0
                    }
                    className="mt-2 text-sm font-semibold text-gray-950 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                  >
                    {resendLoading
                      ? "Sending..."
                      : resendCountdown > 0
                      ? `Resend code in ${resendCountdown}s`
                      : "Resend code"}
                  </button>
                </div>

                <div className="mt-7 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-gray-600"
                    />

                    <p className="text-xs leading-5 text-gray-500">
                      For your security, Vendora may
                      require a verification code when
                      you sign in from a new device or
                      after your trusted login period
                      expires.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;