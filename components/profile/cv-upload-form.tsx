"use client";

import React, { useRef, useState } from "react";

import { Upload04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

interface CVUploadFormProps {
  onCVChange: () => Promise<void>;
}

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function CVUploadForm({ onCVChange }: CVUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);

    const file = e.target.files?.[0];
    if (file === undefined) {
      return;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Unsupported file type. Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setSelectedFile(file);
  }

  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  const handleUpload = async () => {
    if (selectedFile === null) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/employee/cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to upload CV. Please try again.";
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const json = (await res.json()) as { error?: string };
          if (json.error !== undefined) {
            message = json.error;
          }
        } catch {
          // ignore parse errors
        }
        setError(message);
        return;
      }

      setSuccess("CV uploaded successfully!");
      setSelectedFile(null);
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = "";
      }
      await onCVChange();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <button
        type="button"
        onClick={handleDropZoneClick}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon icon={Upload04Icon} className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Drop your CV here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX — Max 5 MB</p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select CV file"
      />

      {/* Selected file */}
      {selectedFile !== null && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <Button
            onClick={() => {
              void handleUpload();
            }}
            disabled={isUploading}
            size="lg"
          >
            {isUploading ? "Uploading\u2026" : "Upload CV"}
          </Button>
        </div>
      )}

      {/* Error */}
      {error !== null && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Success */}
      {success !== null && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300">
          {success}
        </div>
      )}
    </div>
  );
}
