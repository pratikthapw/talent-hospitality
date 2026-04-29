import { Wallet02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { getFullWalletHistory } from "@/lib/billing/credit-ledger";

interface WalletHistoryProps {
  employerProfileId: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  subscription_grant: { label: "Subscription Grant", color: "green" },
  signup_grant: { label: "Signup Grant", color: "green" },
  yearly_monthly_grant: { label: "Yearly Monthly Grant", color: "green" },
  top_up_purchase: { label: "Top-up Purchase", color: "blue" },
  admin_adjustment: { label: "Admin Adjustment", color: "amber" },
  admin_refund: { label: "Admin Refund", color: "red" },
};

function getBadgeClasses(color: string) {
  switch (color) {
    case "green": {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    case "blue": {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
    case "amber": {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    }
    case "red": {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    default: {
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }
}

/** Formats NPR minor units (paisa) to a readable NPR display string. */
function formatNprBalance(amountNpr: number): string {
  return `NPR ${(amountNpr / 100).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function WalletHistory({ employerProfileId }: WalletHistoryProps) {
  const history = await getFullWalletHistory(employerProfileId);

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Wallet History</h2>

      {history.length === 0 ? (
        <div className="py-8 text-center">
          <HugeiconsIcon
            icon={Wallet02Icon}
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
          />
          <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pr-4 pb-3 font-medium text-muted-foreground">Date</th>
                <th className="pr-4 pb-3 font-medium text-muted-foreground">Type</th>
                <th className="pr-4 pb-3 font-medium text-muted-foreground">Reason</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((entry) => {
                const config =
                  entry.sourceType in SOURCE_LABELS ? SOURCE_LABELS[entry.sourceType] : null;
                const badgeLabel = config?.label ?? entry.sourceType;
                const badgeClasses = getBadgeClasses(config?.color ?? "gray");
                const isPositive = entry.amountNpr > 0;
                const isZero = entry.amountNpr === 0;

                return (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("en-NP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="max-w-[300px] truncate py-3 pr-4 text-foreground">
                      {entry.reason}
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${
                        isPositive
                          ? "text-green-600"
                          : isZero
                            ? "text-muted-foreground"
                            : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatNprBalance(entry.amountNpr)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
