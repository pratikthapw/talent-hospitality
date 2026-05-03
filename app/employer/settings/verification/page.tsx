import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

export const metadata = {
  title: "Verification - Employer - THP",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  pending_review: {
    label: "Pending Review",
    description:
      "Your Employer Profile is under review by the THP team. You will be notified once Employer Verification is complete.",
    badgeClass: "bg-muted text-muted-foreground ring-ring/20",
  },
  verified: {
    label: "Verified",
    description:
      "Your Employer Profile has been verified. You can now publish jobs and access paid features on the platform.",
    badgeClass: "bg-primary/15 text-primary ring-primary/20",
  },
  rejected: {
    label: "Rejected",
    description:
      "Your Employer Verification was not approved at this time. Review the notes below for more information and contact support if you have questions.",
    badgeClass: "bg-destructive/15 text-destructive ring-destructive/20",
  },
};

export default async function EmployerVerificationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/sign-in");
  }

  const employer = await getEmployerByUserId(session.user.id);

  if (!employer) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Employer Verification
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Employer Verification status determines your ability to publish jobs.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No Employer Profile found. Please complete the onboarding process to set up your
            Employer Profile.
          </p>
        </div>
      </div>
    );
  }

  const status = employer.verificationStatus as string;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_review;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Employer Verification
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Employer Verification status determines your ability to publish jobs on the platform.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
            <p className="mt-1 text-lg font-semibold text-foreground">{employer.companyName}</p>
            <p className="text-xs text-muted-foreground capitalize">{employer.companyType}</p>
          </div>
          {employer.verifiedAt && (
            <p className="text-xs text-muted-foreground">
              Verified:{" "}
              {new Date(employer.verifiedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        <hr className="my-4 border-border" />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Employer Verification Status
          </h3>
          <span
            className={`mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.badgeClass}`}
          >
            {config.label}
          </span>
        </div>

        <p className="mt-3 text-sm text-foreground">{config.description}</p>

        {employer.verificationNotes !== null && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Review Notes from Admin</p>
            <p className="mt-1 text-sm text-foreground">{employer.verificationNotes}</p>
          </div>
        )}

        {status === "pending_review" && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              Your Employer Profile is currently being reviewed. This typically takes 1-2 business
              days. You do not need to take any action at this stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
