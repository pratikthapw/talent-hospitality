import { AuditLogTable } from "@/components/admin/audit-log-table";

export const metadata = {
  title: "Audit Log - Admin - THP",
};

export default function AuditLogPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Audit Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all sensitive admin actions and verification changes across the platform.
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
