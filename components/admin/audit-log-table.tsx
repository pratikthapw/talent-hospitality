"use client";

import { useEffect, useState } from "react";

interface AuditLogEntry {
  id: string;
  actorId: string;
  targetType: string;
  targetId: string;
  action: string;
  details: string | null;
  createdAt: string;
}

function formatAction(action: string): string {
  return action.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

function formatTargetType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Sample initial data for MVP preview
const SAMPLE_DATA: AuditLogEntry[] = [
  {
    id: "log_1",
    actorId: "usr_admin_429",
    targetType: "employer profile",
    targetId: "emp_8821a",
    action: "verified_status_granted",
    details: "Verified business registration docs.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log_2",
    actorId: "usr_admin_102",
    targetType: "employee",
    targetId: "ee_99b32",
    action: "suspension_applied",
    details: "Suspended due to multiple no-shows.",
    createdAt: new Date(Date.now() - 3_600_000 * 2).toISOString(),
  },
];

export function AuditLogTable() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        // Mock fetch latency
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 800);
        });

        // In MVP, the audit log is fetched from an API endpoint
        // Using sample data for layout preview
        setEntries(SAMPLE_DATA);
        setError(null);
      } catch {
        setError("Failed to load audit log entries");
      } finally {
        setLoading(false);
      }
    }
    void fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="mt-2 text-sm font-medium">Loading audit log...</p>
        </div>
      </div>
    );
  }

  if (typeof error === "string" && error.length > 0) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="mt-3 text-sm text-destructive underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="font-medium text-foreground">No audit log entries</p>
          <p className="mt-1 text-xs">Sensitive admin actions will appear here when they occur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                Action
              </th>
              <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                Target
              </th>
              <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                Actor
              </th>
              <th className="p-4 text-left font-medium text-muted-foreground">Details</th>
              <th className="p-4 text-right font-medium whitespace-nowrap text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="transition-colors hover:bg-muted/30">
                <td className="p-4">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-primary/20 ring-inset">
                    {formatAction(entry.action)}
                  </span>
                </td>
                <td className="p-4 font-medium text-foreground">
                  {formatTargetType(entry.targetType)}{" "}
                  <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
                    #{entry.targetId.slice(0, 8)}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {entry.actorId.slice(0, 8)}
                </td>
                <td className="max-w-xs truncate p-4 text-muted-foreground">
                  {typeof entry.details === "string" && entry.details.length > 0 ? (
                    <span title={entry.details}>
                      {entry.details.length > 50
                        ? entry.details.slice(0, 50) + "..."
                        : entry.details}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="p-4 text-right text-xs whitespace-nowrap text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
