import {
  Form,
  useNavigation,
  useActionData,
  redirect,
  type ActionFunctionArgs,
} from "react-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import groundly_logo from "../../../assets/images/Groundly-logo.png";
import { apiRequest, ApiError } from "../../../shared/api/httpClient"; // adjust to match your actual path
import { useAuthStore } from "../../../shared/store/authStore";

interface SetInitialPasswordRequest {
  new_password: string;
}

interface ActionData {
  error?: string;
}

export async function setPasswordAction({
  request,
}: ActionFunctionArgs): Promise<ActionData | Response> {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return redirect("/login");
  }

  try {
    await apiRequest<void>("/password/set-initial-password", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: password } satisfies SetInitialPasswordRequest),
    });


    return redirect("/user-dashboard");
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Failed to set password. Please try again." };
  }
}

export default function SetPassword() {
  const navigation = useNavigation();
  const actionData = useActionData() as ActionData | undefined;
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          {actionData?.error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={14} />
              {actionData.error}
            </div>
          )}

          <Form method="post" replace className="space-y-3.5">
            {/* New password */}
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

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 pr-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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