import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
    setMessage("");
  };

  const getPasswordStrength = () => {
    const password = formData.password;

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const passwordStrength = getPasswordStrength();

  const getStrengthText = () => {
    if (!formData.password) return "";
    if (passwordStrength <= 2) return "Weak password";
    if (passwordStrength <= 4) return "Good password";
    return "Strong password";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone) {
      setError("Please enter your Nigerian phone number.");
      return;
    }

    if (passwordStrength < 5) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        name,
        email,
        phone,
        password: formData.password,
      });

      /*
       * Registration now requires email verification.
       * The backend sends a 6-digit verification code
       * through Resend.
       */
      if (data.requiresEmailVerification) {
        navigate(
          `/verify-email?email=${encodeURIComponent(email)}`
        );
        return;
      }

      /*
       * Fallback in case the backend returns a normal
       * successful registration response.
       */
      setMessage(
        data.message || "Account created successfully."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      setError(
        error.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:grid-cols-2">
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
                Marketplace
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Create your account and start buying.
              </h2>

              <p className="mt-5 text-base leading-7 text-gray-400">
                Join Vendora to discover products from
                sellers and manage your purchases in one
                secure place.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck
                size={20}
                className="text-gray-300"
              />

              <span className="text-sm text-gray-300">
                Secure account authentication
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Store
                size={20}
                className="text-gray-300"
              />

              <span className="text-sm text-gray-300">
                Buy from marketplace sellers
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <Store size={21} />
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-950">
                    Vendora
                  </p>

                  <p className="text-xs text-gray-500">
                    Buy. Sell. Connect.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Create a Vendora account to start shopping.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Full name
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
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Nigerian phone number
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
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    required
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-500">
                  Use a Nigerian mobile number.
                </p>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
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

                {formData.password && (
                  <div className="mt-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= passwordStrength
                              ? "bg-gray-900"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {getStrengthText()}
                    </p>
                  </div>
                )}

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Use at least 8 characters with uppercase,
                  lowercase, a number and a special character.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
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

              {/* Messages */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-gray-950 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;