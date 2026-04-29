"use client";

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  companyType: "company" | "individual";
  verificationStatus: "pending_review" | "verified" | "rejected";
  verificationNotes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationUpdatedAt: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Review",
    className:
      "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-400/20",
  },
  verified: {
    label: "Verified",
    className:
      "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-400/20",
  },
};

export function formatDate(dateStr: string | null): string {
  if (dateStr === null) {
    return "—";
  }
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LoadingState() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-8 text-center text-muted-foreground">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="mt-2 text-sm font-medium">Loading Employer Profiles...</p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="text-sm text-destructive">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-sm text-destructive underline hover:no-underline"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-8 text-center text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-3 opacity-40"
        >
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
        <p className="font-medium text-foreground">No Employer Profiles</p>
        <p className="mt-1 text-xs">
          Employer Profiles will appear here when Users complete the onboarding process.
        </p>
      </div>
    </div>
  );
}

export function EmployerTableRow({
  employer,
  submitting,
  onAction,
}: {
  employer: EmployerProfile;
  submitting: string | null;
  onAction: (employer: EmployerProfile, action: "verified" | "rejected" | "pending_review") => void;
}) {
  const statusConfig = STATUS_CONFIG[employer.verificationStatus] ?? STATUS_CONFIG.pending_review;

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="p-4">
        <p className="font-medium text-foreground">{employer.companyName}</p>
        {employer.verificationNotes !== null && (
          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
            {employer.verificationNotes}
          </p>
        )}
      </td>
      <td className="p-4">
        <span className="text-xs text-muted-foreground capitalize">{employer.companyType}</span>
      </td>
      <td className="p-4">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </td>
      <td className="p-4 text-xs whitespace-nowrap text-muted-foreground">
        {formatDate(employer.verifiedAt)}
      </td>
      <td className="p-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {employer.verificationStatus !== "verified" && (
            <button
              type="button"
              onClick={() => {
                onAction(employer, "verified");
              }}
              disabled={submitting === employer.userId}
              className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Verify
            </button>
          )}
          {employer.verificationStatus !== "rejected" && (
            <button
              type="button"
              onClick={() => {
                onAction(employer, "rejected");
              }}
              disabled={submitting === employer.userId}
              className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          )}
          {employer.verificationStatus !== "pending_review" && (
            <button
              type="button"
              onClick={() => {
                onAction(employer, "pending_review");
              }}
              disabled={submitting === employer.userId}
              className="inline-flex items-center rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              Move to Review
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ActionModal({
  actionModal,
  modalNotes,
  modalError,
  submitting,
  onNotesChange,
  onConfirm,
  onCancel,
}: {
  actionModal: {
    employer: EmployerProfile;
    action: "verified" | "rejected" | "pending_review";
  };
  modalNotes: string;
  modalError: string | null;
  submitting: string | null;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const action = actionModal.action;
  let title: string;
  let description: string;
  let buttonClass: string;
  if (action === "verified") {
    title = "Verify Employer";
    description = `Confirm that '${actionModal.employer.companyName}' should be verified. They will be able to publish jobs immediately.`;
    buttonClass = "bg-emerald-600 hover:bg-emerald-700";
  } else if (action === "rejected") {
    title = "Reject Employer";
    description = `Reject '${actionModal.employer.companyName}'. They will not be able to publish jobs.`;
    buttonClass = "bg-red-600 hover:bg-red-700";
  } else {
    title = "Move to Review";
    description = `Move '${actionModal.employer.companyName}' back to pending review.`;
    buttonClass = "bg-amber-600 hover:bg-amber-700";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-4">
          <label htmlFor="verification-notes" className="block text-sm font-medium text-foreground">
            Notes (optional)
          </label>
          <textarea
            id="verification-notes"
            rows={3}
            className="mt-1 block w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
            placeholder={
              actionModal.action === "rejected"
                ? "Reason for rejection..."
                : "Verification notes..."
            }
            value={modalNotes}
            onChange={(e) => {
              onNotesChange(e.target.value);
            }}
          />
        </div>

        {modalError !== null && <p className="mt-3 text-sm text-destructive">{modalError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting === actionModal.employer.userId}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {submitting === actionModal.employer.userId ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
