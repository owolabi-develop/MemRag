import { Form, Link, useNavigation } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import groundly_logo from "../../assets/images/Groundly-logo.png";

export default function Register() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={groundly_logo} alt="Groundly" className="h-20 w-20" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Get started with Groundly in a few seconds
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <Form method="post" replace className="space-y-3.5">
            {/* First / Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@company.com"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 pr-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>

            {/* Divider */}
            {/* <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-neutral-400">or</span>
              </div>
            </div> */}

            {/* Google */}
            {/* <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <GoogleMark />
              Continue with Google
            </button> */}
          </Form>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// function GoogleMark() {
//   return (
//     <svg width="16" height="16" viewBox="0 0 24 24" className="text-neutral-700">
//       <path
//         fill="currentColor"
//         d="M12 11v2.8h6.5c-.3 1.7-2.1 5-6.5 5-3.9 0-7-3.2-7-7.1s3.1-7.1 7-7.1c2.2 0 3.7.9 4.5 1.7l3-2.9C17.6 1 15 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"
//       />
//     </svg>
//   );
// }