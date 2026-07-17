import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import groundly_logo from "../../assets/images/Groundly-logo.png";
import { apiFormRequest, ApiError } from "../../shared/api/httpClient";
import { useAuthStore } from "../../shared/store/authStore";
import type { TokenResponse } from "../../shared/types/type";

interface ActionData {
  error?: string;
}

export async function login_action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password" } satisfies ActionData;
  }

  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  let data: TokenResponse;
  try {
    data = await apiFormRequest<TokenResponse>("/token", body);
  } catch (err) {
  
    const message =
      err instanceof ApiError
        ? err.message
        : "Couldn't reach the server. Check your connection and try again.";
    return { error: message } satisfies ActionData;
  }
  useAuthStore.getState().setAuth(data.access_token, {
  email,
  is_active: true,
  is_superuser: false,
  role: data.role,
  invited: data.invited,
  status: data.status,
  first_name:data.first_name,
  last_name: data.last_name,
  must_change_password: data.must_change_password,
});

const redirectTo = data.must_change_password
  ? "/set-initial-password"
  : data.invited
    ? "/user-dashboard"
    : "/dashboard/overview";

return redirect(redirectTo);
}

export default function Login() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);
  const actionData = useActionData() as ActionData | undefined;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={groundly_logo} alt="Groundly" className="h-20 w-20" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Sign in to Groundly
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your details to access your workspace
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <Form method="post" replace className="space-y-3.5">
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {actionData.error}
              </div>
            )}

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
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

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
              {isSubmitting ? "Signing in…" : "Sign in"}
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
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-neutral-900 hover:underline">
            Create account
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