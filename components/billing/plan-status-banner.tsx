import Link from "next/link";

interface PlanStatusBannerProps {
  planKey: string;
  planName: string;
  subscriptionStatus: "active" | "expired" | "cancelled" | null;
  subscriptionExpiresAt: Date | null;
  isPaid: boolean;
}

export function PlanStatusBanner({
  planKey,
  planName,
  subscriptionStatus,
  subscriptionExpiresAt,
  isPaid,
}: PlanStatusBannerProps) {
  if (subscriptionStatus === null || planKey === "free") {
    return (
      <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-foreground">
          You are currently on the Free Plan. Upgrade for more features.
        </p>
      </div>
    );
  }

  if (subscriptionStatus === "active" && isPaid && subscriptionExpiresAt !== null) {
    const daysUntilExpiry = Math.ceil(
      (subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const formattedDate = subscriptionExpiresAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return daysUntilExpiry <= 7 ? (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Your plan expires on {formattedDate}. Renew to keep paid features.
          </p>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            Renew Plan
          </Link>
        </div>
      </div>
    ) : (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-900 dark:bg-green-950/50">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Your {planName} plan is active until {formattedDate}.
        </p>
      </div>
    );
  }

  if (subscriptionStatus === "expired" || subscriptionStatus === "cancelled") {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Your {planName} plan has expired. Paid features are disabled, but your credits remain in
            your wallet.
          </p>
          <Link
            href="#"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:outline-none"
          >
            Renew Plan
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
