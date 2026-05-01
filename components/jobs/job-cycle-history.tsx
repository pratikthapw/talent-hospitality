"use client";

import React, { useState } from "react";

import { ArrowReloadHorizontalIcon, Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export interface JobCycleHistoryProps {
  cycles: {
    id: string;
    status: string;
    publishedAt: Date | string;
    expiresAt: Date | string;
    closedAt: Date | string | null;
    durationDays: number;
    costNpr: number;
    previousCycleId: string | null;
    createdAt: Date | string;
  }[];
  jobTitle: string;
  jobDraftId: string;
  onRepublish?: () => void;
}

const CYCLE_STATUS_BADGE: Record<string, string> = {
  active:
    "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300",
  expired:
    "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  closed:
    "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300",
  paused:
    "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
};

const CYCLE_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  closed: "Closed",
  paused: "Paused",
};

const DURATION_OPTIONS = [7, 14, 30] as const;

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatCost(costNpr: number): string {
  return `₹${costNpr.toLocaleString()}`;
}

export function JobCycleHistory({
  cycles,
  jobTitle,
  jobDraftId,
  onRepublish,
}: JobCycleHistoryProps) {
  // Sorted newest first — cycles may already be sorted, but ensure consistency
  const sorted = cycles.toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Posting Cycle History</h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posting cycles yet. Publish this job to create the first cycle.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((cycle, index) => (
            <CycleRow
              key={cycle.id}
              cycle={cycle}
              isCurrent={index === 0}
              cycleNumber={sorted.length - index}
              totalCycles={sorted.length}
              jobTitle={jobTitle}
              jobDraftId={jobDraftId}
              onRepublish={onRepublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CycleRowProps {
  cycle: JobCycleHistoryProps["cycles"][number];
  isCurrent: boolean;
  cycleNumber: number;
  totalCycles: number;
  jobTitle: string;
  jobDraftId: string;
  onRepublish?: () => void;
}

function CycleRow({
  cycle,
  isCurrent,
  cycleNumber,
  totalCycles,
  jobDraftId,
  onRepublish,
}: CycleRowProps) {
  const badgeClasses = CYCLE_STATUS_BADGE[cycle.status] ?? CYCLE_STATUS_BADGE.expired;
  const statusLabel = CYCLE_STATUS_LABEL[cycle.status] ?? cycle.status;
  const canRepublish = !isCurrent && (cycle.status === "expired" || cycle.status === "closed");

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCurrent
          ? "border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isCurrent
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isCurrent ? "Current Cycle" : `Cycle ${cycleNumber}`}
          </span>
          <span className={badgeClasses}>{statusLabel}</span>
          {cycle.previousCycleId !== null && (
            <span className="text-xs text-muted-foreground">Republished from prior cycle</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {totalCycles > 1 ? `of ${totalCycles} cycles` : ""}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        <Detail icon={Calendar03Icon} label="Published" value={formatDate(cycle.publishedAt)} />
        <Detail icon={Calendar03Icon} label="Expires" value={formatDate(cycle.expiresAt)} />
        <Detail icon={Clock01Icon} label="Duration" value={`${cycle.durationDays} days`} />
        <Detail icon={undefined} label="Cost" value={formatCost(cycle.costNpr)} />
      </div>

      {cycle.closedAt !== null && (
        <p className="mt-2 text-xs text-muted-foreground">Closed on {formatDate(cycle.closedAt)}</p>
      )}

      {canRepublish && (
        <div className="mt-3 border-t border-border pt-3">
          <RepublishControls jobDraftId={jobDraftId} onRepublish={onRepublish} />
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon?: IconSvgElement; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
        {icon !== undefined && (
          <HugeiconsIcon icon={icon} className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {value}
      </span>
    </div>
  );
}

function RepublishControls({
  jobDraftId,
  onRepublish,
}: {
  jobDraftId: string;
  onRepublish?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  async function handleRepublish(durationDays: number) {
    setIsLoading(true);
    setError(null);
    setSelectedDuration(durationDays);

    try {
      const res = await fetch(`/api/employer/jobs/${jobDraftId}/republish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays }),
      });

      const json = (await res.json()) as unknown;

      if (!res.ok) {
        const message =
          json !== null && typeof json === "object" && "error" in json
            ? String((json as { error: unknown }).error)
            : "Failed to republish job.";
        setError(message);
        return;
      }

      onRepublish?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedDuration(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Republish this job</span>
      </div>

      {error !== null && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        {DURATION_OPTIONS.map((days) => (
          <Button
            key={days}
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void handleRepublish(days)}
          >
            {isLoading && selectedDuration === days ? "Publishing…" : `${days} days`}
          </Button>
        ))}
      </div>
    </div>
  );
}
