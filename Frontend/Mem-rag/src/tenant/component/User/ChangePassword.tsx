import { Form, useNavigation } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import groundly_logo from "../../../assets/images/Groundly-logo.png";

export default function SetPassword() {
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
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            You're using a temporary password. Choose a new one to continue.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <Form method="post" replace className="space-y-3.5">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              <p className="mt-1.5 text-xs text-neutral-400">
                Must be at least 8 characters.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Updating…" : "Continue"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}