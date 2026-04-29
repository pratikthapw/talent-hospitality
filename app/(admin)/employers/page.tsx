import { EmployerVerificationQueue } from "@/components/admin/employer-verification-queue";

export const metadata = {
  title: "Employers - Admin - THP",
};

export default function EmployersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Employer Verification
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review employer records, manage Employer Verification status, and approve or reject hiring
          entities before they publish jobs.
        </p>
      </div>
      <EmployerVerificationQueue />
    </div>
  );
}
