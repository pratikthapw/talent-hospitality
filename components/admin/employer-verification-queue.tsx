"use client";

import { useEffect, useState, useCallback } from "react";

import type { EmployerProfile } from "./employer-verification-queue-components";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  EmployerTableRow,
  ActionModal,
} from "./employer-verification-queue-components";

function parseEmployerResponse(value: unknown): {
  employers: EmployerProfile[];
} {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid response format");
  }
  const result: { employers: EmployerProfile[] } = { employers: [] };
  return Object.assign(result, value);
}

function parseErrorBody(value: unknown): { error?: string } {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const result: { error?: string } = {};
  return Object.assign(result, value);
}

export function EmployerVerificationQueue() {
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    employer: EmployerProfile;
    action: "verified" | "rejected" | "pending_review";
  } | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchEmployers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/employers");
      if (!res.ok) {
        throw new Error("Failed to load employer records");
      }
      const raw: unknown = await res.json();
      const data = parseEmployerResponse(raw);
      setEmployers(data.employers);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load employer records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployers();
  }, [fetchEmployers]);

  const handleTransition = useCallback(
    async (employer: EmployerProfile, newStatus: "verified" | "rejected" | "pending_review") => {
      setSubmitting(employer.userId);
      setModalError(null);

      try {
        const res = await fetch(`/api/admin/employers/${employer.userId}/verification`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            notes: modalNotes.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const raw: unknown = await res.json();
          const body = parseErrorBody(raw);
          throw new Error(body.error ?? "Verification update failed");
        }

        setActionModal(null);
        setModalNotes("");
        await fetchEmployers();
      } catch (error) {
        setModalError(error instanceof Error ? error.message : "Verification update failed");
      } finally {
        setSubmitting(null);
      }
    },
    [fetchEmployers, modalNotes],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error !== null) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setLoading(true);
          void fetchEmployers();
        }}
      />
    );
  }

  if (employers.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                  Company
                </th>
                <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                  Type
                </th>
                <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                  Verification Status
                </th>
                <th className="p-4 text-left font-medium whitespace-nowrap text-muted-foreground">
                  Verified
                </th>
                <th className="p-4 text-right font-medium whitespace-nowrap text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employers.map((employer) => (
                <EmployerTableRow
                  key={employer.id}
                  employer={employer}
                  submitting={submitting}
                  onAction={(emp, action) => {
                    setActionModal({ employer: emp, action });
                    setModalNotes("");
                    setModalError(null);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {actionModal !== null && (
        <ActionModal
          actionModal={actionModal}
          modalNotes={modalNotes}
          modalError={modalError}
          submitting={submitting}
          onNotesChange={setModalNotes}
          onConfirm={() => {
            void handleTransition(actionModal.employer, actionModal.action);
          }}
          onCancel={() => {
            setActionModal(null);
            setModalError(null);
          }}
        />
      )}
    </>
  );
}
