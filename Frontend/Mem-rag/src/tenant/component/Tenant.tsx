import {
  Form,
  useActionData,
  useNavigation,
  redirect,
  Navigate,
  type ActionFunctionArgs,
} from "react-router";
import groundly_logo from "../../assets/images/Groundly-logo.png";
import { createTenant } from "../../shared/api/tenant.api";
import { ApiError } from "../../shared/api/httpClient"; // adjust path to match
import { useAuthStore } from "../../shared/store/authStore";

export async function createTenantAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("tenantName") || "").trim();
  const description = String(formData.get("tenantDescription") || "").trim();

  if (!name) {
    return { error: "Organization name is required" };
  }

  // Actions run outside React's render tree, so pull straight from the store's state
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return redirect("/register");
  }

  try {
    await createTenant(
      { name, description: description || undefined },
      token
    );
    return redirect("/dashboard/overview");
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Failed to create workspace. Please try again." };
  }
}

export default function CreateTenant() {
  const navigation = useNavigation();
  const actionData = useActionData() as { error?: string } | undefined;
  const isSubmitting = navigation.state === "submitting";
  const token = useAuthStore((s) => s.accessToken);

  // No token → bounce to register
  if (!token) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={groundly_logo} alt="Groundly" className="h-20 w-20" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Set up your organization
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            This is your workspace. You can add departments later.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          {actionData?.error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {actionData.error}
            </p>
          )}

          <Form method="post" replace className="space-y-3.5">
            {/* Tenant name */}
            <div>
              <label
                htmlFor="tenantName"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Organization name
              </label>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                placeholder="Acme Inc."
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="tenantDescription"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Description
                <span className="ml-1 font-normal text-neutral-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="tenantDescription"
                name="tenantDescription"
                rows={3}
                placeholder="What does your organization do?"
                className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating workspace…" : "Create workspace"}
            </button>
          </Form>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Departments, teams, and members can be configured once your
          workspace is ready.
        </p>
      </div>
    </div>
  );
}