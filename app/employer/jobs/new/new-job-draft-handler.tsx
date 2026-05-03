"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { JobDraftForm } from "@/components/jobs/job-draft-form";
import type { JobDraftFormData } from "@/components/jobs/job-draft-form";

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

export function NewJobDraftHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(data: JobDraftFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
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
        setError(body?.error ?? "Failed to save draft. Please try again.");
        return;
      }

      router.push("/employer/jobs");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error !== null && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <JobDraftForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
