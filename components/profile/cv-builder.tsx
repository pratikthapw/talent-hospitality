"use client";

/* eslint-disable max-lines */

import React, { useState } from "react";

import { Delete02Icon, PlusSignCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CVBuilderProps {
  onCVChange: () => Promise<void>;
}

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

interface BuilderContent {
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const INPUT_BASE =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

const emptyWorkExperience = (): WorkExperience => ({
  id: crypto.randomUUID(),
  title: "",
  company: "",
  dates: "",
  description: "",
});

const emptyEducation = (): Education => ({
  id: crypto.randomUUID(),
  degree: "",
  institution: "",
  year: "",
});

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CVBuilder({ onCVChange }: CVBuilderProps) {
  const [summary, setSummary] = useState("");
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([emptyWorkExperience()]);
  const [education, setEducation] = useState<Education[]>([emptyEducation()]);
  const [skillsCsv, setSkillsCsv] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ---- Work Experience Handlers ---- */

  function updateWorkExperience(id: string, field: keyof WorkExperience, value: string) {
    setWorkExperience((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addWorkExperience() {
    setWorkExperience((prev) => [...prev, emptyWorkExperience()]);
  }

  function removeWorkExperience(id: string) {
    setWorkExperience((prev) => prev.filter((item) => item.id !== id));
  }

  /* ---- Education Handlers ---- */

  function updateEducation(id: string, field: keyof Education, value: string) {
    setEducation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addEducation() {
    setEducation((prev) => [...prev, emptyEducation()]);
  }

  function removeEducation(id: string) {
    setEducation((prev) => prev.filter((item) => item.id !== id));
  }

  /* ---- Save ---- */

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const content: BuilderContent = {
      summary: summary.trim(),
      workExperience: workExperience.map((w) => ({
        title: w.title.trim(),
        company: w.company.trim(),
        dates: w.dates.trim(),
        description: w.description.trim(),
      })),
      education: education.map((ed) => ({
        degree: ed.degree.trim(),
        institution: ed.institution.trim(),
        year: ed.year.trim(),
      })),
      skills: skillsCsv
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };

    try {
      const res = await fetch("/api/employee/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "builder", content }),
      });

      if (!res.ok) {
        let message = "Failed to save CV. Please try again.";
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

      setSuccess("CV saved successfully!");
      await onCVChange();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Render ---- */

  return (
    <form
      onSubmit={(e) => {
        void handleSave(e);
      }}
      className="space-y-8"
    >
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

      {/* Summary */}
      <section className="space-y-2">
        <label htmlFor="cv-summary" className="block text-sm font-medium text-foreground">
          Summary / Objective
        </label>
        <textarea
          id="cv-summary"
          rows={4}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
          }}
          placeholder="Write a brief summary about yourself and your career goals"
          className={INPUT_BASE + " resize-y"}
        />
      </section>

      {/* Work Experience */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Work Experience</h3>

        {workExperience.map((entry) => (
          <div
            key={entry.id}
            className="relative space-y-3 rounded-lg border border-border bg-muted/20 p-4"
          >
            {workExperience.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  removeWorkExperience(entry.id);
                }}
                className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove work experience entry"
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              </button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor={`we-title-${entry.id}`}
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Job Title
                </label>
                <input
                  id={`we-title-${entry.id}`}
                  type="text"
                  value={entry.title}
                  onChange={(e) => {
                    updateWorkExperience(entry.id, "title", e.target.value);
                  }}
                  placeholder="e.g., Front Desk Agent"
                  className={INPUT_BASE}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`we-company-${entry.id}`}
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Company
                </label>
                <input
                  id={`we-company-${entry.id}`}
                  type="text"
                  value={entry.company}
                  onChange={(e) => {
                    updateWorkExperience(entry.id, "company", e.target.value);
                  }}
                  placeholder="e.g., Hotel XYZ"
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`we-dates-${entry.id}`}
                className="block text-xs font-medium text-muted-foreground"
              >
                Dates
              </label>
              <input
                id={`we-dates-${entry.id}`}
                type="text"
                value={entry.dates}
                onChange={(e) => {
                  updateWorkExperience(entry.id, "dates", e.target.value);
                }}
                placeholder="e.g., Jan 2022 – Present"
                className={INPUT_BASE}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`we-desc-${entry.id}`}
                className="block text-xs font-medium text-muted-foreground"
              >
                Description
              </label>
              <textarea
                id={`we-desc-${entry.id}`}
                rows={3}
                value={entry.description}
                onChange={(e) => {
                  updateWorkExperience(entry.id, "description", e.target.value);
                }}
                placeholder="Describe your responsibilities and achievements"
                className={INPUT_BASE + " resize-y"}
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addWorkExperience}>
          <HugeiconsIcon icon={PlusSignCircleIcon} className="h-4 w-4" />
          Add Work Experience
        </Button>
      </section>

      {/* Education */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Education</h3>

        {education.map((entry) => (
          <div
            key={entry.id}
            className="relative space-y-3 rounded-lg border border-border bg-muted/20 p-4"
          >
            {education.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  removeEducation(entry.id);
                }}
                className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove education entry"
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              </button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor={`edu-degree-${entry.id}`}
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Degree / Certificate
                </label>
                <input
                  id={`edu-degree-${entry.id}`}
                  type="text"
                  value={entry.degree}
                  onChange={(e) => {
                    updateEducation(entry.id, "degree", e.target.value);
                  }}
                  placeholder="e.g., BHM in Hospitality"
                  className={INPUT_BASE}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`edu-inst-${entry.id}`}
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Institution
                </label>
                <input
                  id={`edu-inst-${entry.id}`}
                  type="text"
                  value={entry.institution}
                  onChange={(e) => {
                    updateEducation(entry.id, "institution", e.target.value);
                  }}
                  placeholder="e.g., Tribhuvan University"
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`edu-year-${entry.id}`}
                className="block text-xs font-medium text-muted-foreground"
              >
                Year
              </label>
              <input
                id={`edu-year-${entry.id}`}
                type="text"
                value={entry.year}
                onChange={(e) => {
                  updateEducation(entry.id, "year", e.target.value);
                }}
                placeholder="e.g., 2020"
                className={INPUT_BASE}
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addEducation}>
          <HugeiconsIcon icon={PlusSignCircleIcon} className="h-4 w-4" />
          Add Education
        </Button>
      </section>

      {/* Skills */}
      <section className="space-y-2">
        <label htmlFor="cv-skills" className="block text-sm font-medium text-foreground">
          Skills
        </label>
        <input
          id="cv-skills"
          type="text"
          value={skillsCsv}
          onChange={(e) => {
            setSkillsCsv(e.target.value);
          }}
          placeholder="Enter skills separated by commas, e.g., customer service, food handling, POS systems"
          className={INPUT_BASE}
        />
        <p className="text-xs text-muted-foreground">Enter skills separated by commas.</p>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? "Saving\u2026" : "Save CV"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isSaving ? "Building your CV\u2026" : "This will replace your current active CV"}
        </p>
      </div>
    </form>
  );
}
