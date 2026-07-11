import { Form, Link, useNavigation } from "react-router";
import { ArrowLeft } from "lucide-react";
import groundly_logo from "../../assets/images/Groundly-logo.png";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex max-h-screen items-center justify-center">
      <div className="w-full max-w-sm m-16">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={groundly_logo} alt="Groundly" className="h-20 w-20" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <Form method="post" replace className="space-y-3.5">
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending link…" : "Send reset link"}
            </button>
          </Form>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 hover:underline"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}