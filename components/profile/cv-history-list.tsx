"use client";

import React from "react";

import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Edit02Icon,
  File02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CVHistoryEntry {
  id: string;
  sourceType: "upload" | "builder";
  fileName: string | null;
  fileSize: number | null;
  builderContent: Record<string, unknown> | null;
  isActive: boolean;
  replacedAt: string | null;
  retentionExpiresAt: string | null;
  createdAt: string;
  retentionStatus: "active" | "retained" | "expired" | "inactive";
}

interface CVHistoryListProps {
  history: CVHistoryEntry[];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRetentionLabel(status: CVHistoryEntry["retentionStatus"]): {
  label: string;
  className: string;
  icon: typeof File02Icon;
} {
  switch (status) {
    case "active": {
      return {
        label: "Active",
        className: "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40",
        icon: CheckmarkCircle01Icon,
      };
    }
    case "retained": {
      return {
        label: "Retained",
        className: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
        icon: Clock01Icon,
      };
    }
    case "expired": {
      return {
        label: "Expired",
        className: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40",
        icon: AlertCircleIcon,
      };
    }
    case "inactive": {
      return {
        label: "Inactive",
        className: "text-muted-foreground bg-muted",
        icon: File02Icon,
      };
    }
    default: {
      return {
        label: "Inactive",
        className: "text-muted-foreground bg-muted",
        icon: File02Icon,
      };
    }
  }
}

function daysRemaining(expiresAt: string | null): number | null {
  if (expiresAt === null) {
    return null;
  }
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CVHistoryList({ history }: CVHistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-12 text-center shadow-sm">
        <HugeiconsIcon icon={File02Icon} className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">No CV history yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">Upload or build a CV to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((cv) => {
        const statusInfo = getRetentionLabel(cv.retentionStatus);
        const remaining = daysRemaining(cv.retentionExpiresAt);

        return (
          <div
            key={cv.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 shadow-sm"
          >
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon
                icon={cv.sourceType === "upload" ? File02Icon : Edit02Icon}
                className="h-4 w-4 text-muted-foreground"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {cv.sourceType === "upload" ? (cv.fileName ?? "Uploaded CV") : "Builder CV"}
                </p>
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
                >
                  <HugeiconsIcon icon={statusInfo.icon} className="h-3 w-3" />
                  {statusInfo.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Created {formatDate(cv.createdAt)}
                {cv.fileSize !== null && (
                  <span className="ml-2">({formatFileSize(cv.fileSize)})</span>
                )}
                {cv.replacedAt !== null && (
                  <span className="ml-2">· Replaced {formatDate(cv.replacedAt)}</span>
                )}
              </p>
            </div>

            {/* Retention Info */}
            <div className="hidden shrink-0 text-right sm:block">
              {cv.retentionStatus === "retained" && remaining !== null && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {remaining} day{remaining !== 1 ? "s" : ""} remaining
                </p>
              )}
              {cv.retentionStatus === "expired" && cv.retentionExpiresAt !== null && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  Expired {formatDate(cv.retentionExpiresAt)}
                </p>
              )}
              {cv.retentionStatus === "active" && (
                <p className="text-xs text-green-600 dark:text-green-400">Current CV</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
