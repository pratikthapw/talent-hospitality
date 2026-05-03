"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { JobDraftForm } from "@/components/jobs/job-draft-form";
import type { JobDraftFormData } from "@/components/jobs/job-draft-form";
import { JobStatusControls } from "@/components/jobs/job-status-controls";

interface EditJobHandlerProps {
  jobId: string;
  currentStatus: string;
  initialData: JobDraftFormData;
}

interface ErrorResponse {
  error?: string;
}

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "string"
  );
}

export function EditJobHandler({ jobId, currentStatus, initialData }: EditJobHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  async function handleSubmit(data: JobDraftFormData) {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let body: ErrorResponse | null = null;
        try {
          const json = (await res.json()) as unknown;
          if (isErrorResponse(json)) {
            body = json;
          }
        } catch {
          // ignore json parse errors
        }
        setError(body?.error ?? "Failed to update job. Please try again.");
        return;
      }

      setSuccessMessage("Job updated successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Status controls */}
      <JobStatusControls jobId={jobId} currentStatus={status} onStatusChange={handleStatusChange} />

      {/* Error display */}
      {error !== null && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Success display */}
      {successMessage !== null && (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {successMessage}
        </div>
      )}

      {/* Edit form */}
      <JobDraftForm onSubmit={handleSubmit} initialData={initialData} isLoading={isLoading} />
    </div>
  );
}
