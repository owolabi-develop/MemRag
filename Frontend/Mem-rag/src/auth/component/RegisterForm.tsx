import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import groundly_logo from "../../assets/images/Groundly-logo.png";
import { registerUser } from "../../shared/api/register.api";
import { apiFormRequest, ApiError } from "../../shared/api/httpClient";
import { useAuthStore } from "../../shared/store/authStore";
import type { TokenResponse } from "../../shared/types/type";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface ActionData {
  error?: string;
  fieldErrors?: FieldErrors;
}

function validate(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: FieldErrors = {};

  if (!firstName) fieldErrors.firstName = "First name is required";
  if (!lastName) fieldErrors.lastName = "Last name is required";

  if (!email) {
    fieldErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address";
  }

  if (!password) {
    fieldErrors.password = "Password is required";
  } else if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters";
  }

  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords don't match";
  }

  return { firstName, lastName, email, password, fieldErrors };
}

export async function register_action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { firstName, lastName, email, password, fieldErrors } = validate(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors } satisfies ActionData;
  }

  try {
    await registerUser({ firstName, lastName, email, password });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
    return { error: message } satisfies ActionData;
  }
  try {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    const tokenData = await apiFormRequest<TokenResponse>("/token", body);

    useAuthStore.getState().setAuth(tokenData.access_token, {
      email,
      is_active: true,
      is_superuser: false,
      role:tokenData.role,
      status:tokenData.status,
      invited:tokenData.invited,
      first_name: firstName,
      last_name: lastName,
      must_change_password: tokenData.must_change_password,
    });

    return redirect(tokenData.must_change_password ? "/set-initial-password" : "/tenant");
  } catch {
    return redirect(`/login?registered=1&email=${encodeURIComponent(email)}`);
  }
}

function fieldClass(hasError?: boolean) {
  return `h-10 w-full rounded-lg border px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ${
    hasError ? "border-red-400" : "border-neutral-300"
  }`;
}

export default function RegisterPage() {
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const fieldErrors = actionData?.fieldErrors ?? {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <img src={groundly_logo} alt="Groundly" className="h-16 w-16" />
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Get started with Groundly in a few seconds.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <Form method="post" replace className="space-y-3.5">
            {actionData?.error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {actionData.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-neutral-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  className={fieldClass(Boolean(fieldErrors.firstName))}
                />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-neutral-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  className={fieldClass(Boolean(fieldErrors.lastName))}
                />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className={fieldClass(Boolean(fieldErrors.email))}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(fieldErrors.password)}
                className={fieldClass(Boolean(fieldErrors.password))}
              />
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-neutral-400">At least 8 characters</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-neutral-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className={fieldClass(Boolean(fieldErrors.confirmPassword))}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </Form>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}