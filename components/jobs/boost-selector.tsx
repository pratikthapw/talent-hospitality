"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

type BoostType = "featured" | "urgent";
type BoostDuration = 3 | 7 | 14;

interface BoostOption {
  type: BoostType;
  label: string;
  description: string;
  cost: number;
  badge: string;
  badgeColor: string;
}

const BOOST_OPTIONS: BoostOption[] = [
  {
    type: "featured",
    label: "Featured",
    description: "Lifted ranking and visible emphasis on your listing.",
    cost: 300,
    badge: "Featured",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    type: "urgent",
    label: "Urgent",
    description: "Strongest ranking boost with urgency treatment and top placement.",
    cost: 600,
    badge: "Urgent",
    badgeColor: "bg-red-100 text-red-800",
  },
];

const DURATION_OPTIONS: { value: BoostDuration; label: string }[] = [
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
];

interface BoostResponse {
  message?: string;
  error?: string;
  boostId?: string;
  balanceNpr?: number;
}

function isBoostResponse(data: unknown): data is BoostResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as {
    message?: unknown;
    error?: unknown;
    boostId?: unknown;
    balanceNpr?: unknown;
  };
  const hasString = (key: "message" | "error" | "boostId") =>
    key in obj && typeof obj[key] === "string";
  const hasNumber = (key: "balanceNpr") => key in obj && typeof obj[key] === "number";
  return (
    hasString("message") || hasString("error") || hasString("boostId") || hasNumber("balanceNpr")
  );
}

export interface BoostSelectorProps {
  jobId: string;
  currentBalance: number;
  onSuccess?: (balanceNpr: number) => void;
}

export function BoostSelector({ jobId, currentBalance, onSuccess }: BoostSelectorProps) {
  const [selectedBoost, setSelectedBoost] = useState<BoostType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<BoostDuration>(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedOption = BOOST_OPTIONS.find((o) => o.type === selectedBoost);
  const canAfford = selectedOption ? currentBalance >= selectedOption.cost : true;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBoost) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/boosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostType: selectedBoost, durationDays: selectedDuration }),
      });

      const jsonRes = (await res.json()) as unknown;
      if (isBoostResponse(jsonRes)) {
        const data = jsonRes;

        if (!res.ok) {
          setError(data.error ?? "Failed to purchase boost.");
        } else {
          setSuccessMessage(data.message ?? "Boost applied!");
          if (onSuccess && typeof data.balanceNpr === "number") {
            onSuccess(data.balanceNpr);
          }

          setSelectedBoost(null);
        }
      } else {
        setError("Invalid response from server.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBoostSelect(type: BoostType) {
    setSelectedBoost(type);
    setError(null);
    setSuccessMessage(null);
  }

  function getButtonLabel() {
    if (isLoading) {
      return "Processing…";
    }
    if (selectedBoost) {
      return `Purchase ${selectedOption!.label} Boost`;
    }
    return "Select a boost";
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Boost Your Job</h2>
      <p className="text-sm text-muted-foreground">
        Increase your job&apos;s visibility in the public listing. Current balance:{" "}
        <span className="font-medium text-foreground">₹{currentBalance.toLocaleString()}</span>
      </p>

      {/* Boost type selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BOOST_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => {
              handleBoostSelect(option.type);
            }}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              selectedBoost === option.type
                ? "border-indigo-600 bg-indigo-50"
                : "border-border bg-background hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">{option.label}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${option.badgeColor}`}
              >
                {option.badge}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
            <p className="mt-2 text-lg font-bold text-foreground">
              ₹{option.cost.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Duration selector */}
      <div className="space-y-2">
        <label htmlFor="boost-duration" className="block text-sm font-medium text-foreground">
          Boost duration
        </label>
        <div className="flex gap-3">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => {
                setSelectedDuration(d.value);
              }}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                selectedDuration === d.value
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-border bg-background text-foreground hover:border-indigo-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insufficient balance warning */}
      {selectedBoost && !canAfford && (
        <p className="text-sm text-red-600">
          Insufficient balance. You need ₹{selectedOption!.cost.toLocaleString()} but have ₹
          {currentBalance.toLocaleString()}.
        </p>
      )}

      {/* Error message */}
      {error !== null && <p className="text-sm text-red-600">{error}</p>}

      {/* Success message */}
      {successMessage !== null && <p className="text-sm text-green-600">{successMessage}</p>}

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={!selectedBoost || isLoading || !canAfford} size="lg">
          {getButtonLabel()}
        </Button>
        {selectedBoost && (
          <p className="text-xs text-muted-foreground">
            ₹{selectedOption!.cost.toLocaleString()} will be deducted from your wallet.
          </p>
        )}
      </div>
    </form>
  );
}
