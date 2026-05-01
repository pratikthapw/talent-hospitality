"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

export interface JobStatusControlsProps {
  jobId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

interface StatusResponse {
  status?: string;
  error?: string;
}

function isStatusResponse(data: unknown): data is StatusResponse {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("status" in data || "error" in data)
  );
}

export function JobStatusControls({
  jobId,
  currentStatus,
  onStatusChange,
}: JobStatusControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postStatusAction(action: "pause" | "resume" | "close") {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = (await res.json()) as unknown;

      if (!res.ok) {
        if (isStatusResponse(json)) {
          setError(json.error ?? "Failed to update job status.");
        } else {
          setError("Failed to update job status.");
        }
        return;
      }

      if (isStatusResponse(json) && json.status !== undefined) {
        onStatusChange?.(json.status);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePause() {
    void postStatusAction("pause");
  }

  function handleResume() {
    void postStatusAction("resume");
  }

  function handleClose() {
    void postStatusAction("close");
  }

  // No actionable controls for closed, draft, or expired jobs
  if (currentStatus === "closed" || currentStatus === "draft" || currentStatus === "expired") {
    return null;
  }

  return (
    <div className="space-y-3 border-b border-border pb-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Job Status</h2>

      {error !== null && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {currentStatus === "published" && (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isLoading}
              onClick={handlePause}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/50"
            >
              {isLoading ? "Pausing…" : "Pause Job"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={isLoading}
              onClick={handleClose}
            >
              {isLoading ? "Closing…" : "Close Job"}
            </Button>
          </>
        )}

        {currentStatus === "paused" && (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isLoading}
              onClick={handleResume}
              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/50"
            >
              {isLoading ? "Resuming…" : "Resume Job"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={isLoading}
              onClick={handleClose}
            >
              {isLoading ? "Closing…" : "Close Job"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
