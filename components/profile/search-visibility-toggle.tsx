"use client";

import { useState } from "react";

import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  EyeIcon,
  InformationCircleIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

interface SearchVisibilityToggleProps {
  searchVisible: boolean;
  verificationStatus: string;
  isEligible: boolean;
  explanation: string;
}

type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

const STATUS_BADGE: Record<
  string,
  { label: string; classes: string; icon: typeof CheckmarkCircle01Icon }
> = {
  verified: {
    label: "Verified",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300",
    icon: CheckmarkCircle01Icon,
  },
  pending_review: {
    label: "Under Review",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    icon: InformationCircleIcon,
  },
  unverified: {
    label: "Not Verified",
    classes: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Cancel01Icon,
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300",
    icon: Cancel01Icon,
  },
};

export function SearchVisibilityToggle({
  searchVisible: initialVisible,
  verificationStatus: initialStatus,
  isEligible: initialEligible,
  explanation: initialExplanation,
}: SearchVisibilityToggleProps) {
  const [searchVisible, setSearchVisible] = useState(initialVisible);
  const [verificationStatus] = useState(initialStatus);
  const [explanation, setExplanation] = useState(initialExplanation);
  const [isEligible, setIsEligible] = useState(initialEligible);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badge = STATUS_BADGE[verificationStatus] ?? STATUS_BADGE.unverified;

  async function handleToggle(newValue: boolean) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/employee/search-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchVisible: newValue }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const data = (await res.json()) as {
        searchVisible: boolean;
        verificationStatus: string;
        isEligible: boolean;
        explanation: string;
      };

      setSearchVisible(data.searchVisible);
      setExplanation(data.explanation);
      setIsEligible(data.isEligible);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const showVisibilityWarning =
    searchVisible && verificationStatus !== "verified";

  return (
    <div className="space-y-6">
      {/* Main toggle card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          {/* Title row */}
          <div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={EyeIcon}
                className="h-5 w-5 text-primary"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Appear in Employer Candidate Search
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Let employers discover and reach out to you through candidate search. You can still apply to jobs directly either way.
            </p>
          </div>

          {/* Toggle + status row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Toggle switch */}
            <label className="flex cursor-pointer items-center gap-3">
              <span className="relative inline-flex h-6 w-11 shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={searchVisible}
                  disabled={isLoading}
                  onChange={(e) => {
                    void handleToggle(e.target.checked);
                  }}
                />
                <span
                  className={cn(
                    "inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                    searchVisible
                      ? "bg-primary"
                      : "bg-muted",
                    isLoading && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                      searchVisible ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </span>
              </span>
              <span className="text-sm font-medium text-foreground">
                {searchVisible ? "Visible to employers" : "Hidden from employers"}
              </span>
            </label>

            {/* Verification status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                badge.classes,
              )}
            >
              <HugeiconsIcon icon={badge.icon} className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          </div>

          {/* Explanation text */}
          <p className="text-sm text-muted-foreground">{explanation}</p>

          {/* Error message */}
          {error !== null && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/50">
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
              />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Info callout: not verified but visibility enabled */}
      {showVisibilityWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/50">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
              <HugeiconsIcon
                icon={ViewOffIcon}
                className="h-4 w-4 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Your profile remains hidden
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Even with visibility enabled, employers won&apos;t find you in candidate search until your profile is verified. Verification is required before you can appear in search results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility status card */}
      <div
        className={cn(
          "rounded-lg border p-5 shadow-sm",
          isEligible
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50"
            : "border-border bg-muted/30",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isEligible
                ? "bg-green-100 dark:bg-green-900/60"
                : "bg-muted",
            )}
          >
            <HugeiconsIcon
              icon={isEligible ? CheckmarkCircle01Icon : Cancel01Icon}
              className={cn(
                "h-4 w-4",
                isEligible
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground",
              )}
            />
          </div>
          <div>
            <h3
              className={cn(
                "text-sm font-semibold",
                isEligible
                  ? "text-green-800 dark:text-green-200"
                  : "text-foreground",
              )}
            >
              {isEligible
                ? "You appear in candidate search"
                : "Not appearing in candidate search"}
            </h3>
            <p
              className={cn(
                "mt-0.5 text-xs",
                isEligible
                  ? "text-green-700 dark:text-green-300"
                  : "text-muted-foreground",
              )}
            >
              {isEligible
                ? "Employers can discover your profile and reach out to you."
                : verificationStatus === "verified"
                  ? "Enable the toggle above to let employers find you."
                  : "Get verified and enable visibility to appear in search."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
