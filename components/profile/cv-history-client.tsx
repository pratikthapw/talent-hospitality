"use client";

import { useCallback, useEffect, useState } from "react";

import { CVHistoryList } from "@/components/profile/cv-history-list";
import type { CVHistoryEntry } from "@/components/profile/cv-history-list";

export function CVHistoryClient() {
  const [history, setHistory] = useState<CVHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/cv/history");
      if (!res.ok) {
        setError("Failed to load CV history.");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const data = (await res.json()) as { history: CVHistoryEntry[] };
      setHistory(data.history);
      setError(null);
    } catch {
      setError("Something went wrong while loading your CV history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Loading CV history…</p>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
        {error}
      </div>
    );
  }

  return <CVHistoryList history={history} />;
}
