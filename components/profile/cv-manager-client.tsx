"use client";

/* eslint-disable max-lines, max-lines-per-function */

import React, { useCallback, useEffect, useState } from "react";

import {
  CheckmarkCircle01Icon,

  /* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  Clock01Icon,
  Edit02Icon,
  File02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CVBuilder } from "@/components/profile/cv-builder";
import { CVUploadForm } from "@/components/profile/cv-upload-form";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CVDocument {
  id: string;
  employeeProfileId: string;
  sourceType: "upload" | "builder";
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  builderContent: Record<string, unknown> | null;
  isActive: boolean;
  replacedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BuilderContent {
  summary?: string;
  workExperience?: unknown[];
  education?: unknown[];
  skills?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// eslint-disable-next-line complexity
function getBuilderSummary(cv: CVDocument): string {
  if (cv.builderContent === null) {
    return "Builder CV";
  }
  const content = cv.builderContent as BuilderContent;
  const parts: string[] = [];

  if (content.summary !== undefined && content.summary !== "") {
    parts.push(content.summary.slice(0, 80));
  }

  const expCount = content.workExperience?.length ?? 0;
  const eduCount = content.education?.length ?? 0;
  const skillCount = content.skills?.length ?? 0;

  if (expCount > 0) {
    parts.push(`${expCount} work ${expCount === 1 ? "entry" : "entries"}`);
  }
  if (eduCount > 0) {
    parts.push(`${eduCount} education ${eduCount === 1 ? "entry" : "entries"}`);
  }
  if (skillCount > 0) {
    parts.push(`${skillCount} ${skillCount === 1 ? "skill" : "skills"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Builder CV";
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

type Tab = "upload" | "builder";

export function CVManagerClient() {
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [activeCV, setActiveCV] = useState<CVDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const fetchCVs = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/cv");
      if (!res.ok) {
        setFetchError("Failed to load CVs.");
        return;
      }
      const data = (await res.json()) as {
        cvs: CVDocument[];
        activeCV: CVDocument | null;
      };
      setCvs(data.cvs);
      setActiveCV(data.activeCV);
      setFetchError(null);
    } catch {
      setFetchError("Something went wrong while loading your CVs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCVs();
  }, [fetchCVs]);

  const handleActivate = async (cvId: string) => {
    setActivatingId(cvId);
    try {
      const res = await fetch("/api/employee/cv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });

      if (!res.ok) {
        // Silently fail — user can try again
        return;
      }

      await fetchCVs();
    } catch {
      // Silently fail
    } finally {
      setActivatingId(null);
    }
  };

  /* ---- Loading State ---- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Loading your CVs\u2026</p>
      </div>
    );
  }

  /* ---- Error State ---- */

  if (fetchError !== null) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
        {fetchError}
      </div>
    );
  }

  /* ---- Inactive CVs ---- */

  const inactiveCVs = cvs.filter((cv) => !cv.isActive);

  /* ---- Render ---- */

  return (
    <div className="space-y-8">
      {/* Active CV Status */}
      {activeCV !== null ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-900 dark:bg-green-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/60">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                className="h-5 w-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Active CV
              </h2>
              <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                {activeCV.sourceType === "upload" ? (
                  <>
                    Uploaded: <span className="font-medium">{activeCV.fileName}</span>
                    {activeCV.fileSize !== null && (
                      <span className="ml-2">({formatFileSize(activeCV.fileSize)})</span>
                    )}
                  </>
                ) : (
                  getBuilderSummary(activeCV)
                )}
              </p>
            </div>
            <div className="hidden shrink-0 text-right text-xs text-green-600 sm:block dark:text-green-400">
              <div className="flex items-center justify-end gap-1">
                <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                {formatDate(activeCV.createdAt)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
              <HugeiconsIcon
                icon={File02Icon}
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                No Active CV
              </h2>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                Upload a CV or build one below to start applying for jobs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
            }}
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors " +
              (activeTab === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <HugeiconsIcon icon={Upload04Icon} className="h-4 w-4" />
            Upload CV
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("builder");
            }}
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors " +
              (activeTab === "builder"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <HugeiconsIcon icon={Edit02Icon} className="h-4 w-4" />
            Build CV
          </button>
        </div>

        {activeTab === "upload" ? (
          <CVUploadForm onCVChange={fetchCVs} />
        ) : (
          <CVBuilder onCVChange={fetchCVs} />
        )}
      </div>

      {/* CV History */}
      {inactiveCVs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Previous CVs</h2>

          <div className="space-y-3">
            {inactiveCVs.map((cv) => (
              <div
                key={cv.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon
                    icon={cv.sourceType === "upload" ? File02Icon : Edit02Icon}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {cv.sourceType === "upload" ? (cv.fileName ?? "Uploaded CV") : "Builder CV"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(cv.createdAt)}
                    {cv.fileSize !== null && (
                      <span className="ml-2">({formatFileSize(cv.fileSize)})</span>
                    )}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleActivate(cv.id);
                  }}
                  disabled={activatingId === cv.id}
                >
                  {activatingId === cv.id ? "Activating\u2026" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
