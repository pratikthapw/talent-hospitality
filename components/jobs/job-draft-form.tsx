"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

interface JobDraftFormData {
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string | null;
  requirements: string | null;
  benefits: string | null;
}

export type { JobDraftFormData };

export interface JobDraftFormProps {
  onSubmit: (data: JobDraftFormData) => Promise<void>;
  initialData?: Partial<JobDraftFormData>;
  isLoading?: boolean;
}

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "seasonal", label: "Seasonal" },
  { value: "internship", label: "Internship" },
] as const;

export function JobDraftForm({ onSubmit, initialData, isLoading }: JobDraftFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType ?? "");
  const [salaryMin, setSalaryMin] = useState(
    initialData?.salaryMin !== null && initialData?.salaryMin !== undefined
      ? String(initialData.salaryMin)
      : "",
  );
  const [salaryMax, setSalaryMax] = useState(
    initialData?.salaryMax !== null && initialData?.salaryMax !== undefined
      ? String(initialData.salaryMax)
      : "",
  );
  const [requirements, setRequirements] = useState(initialData?.requirements ?? "");
  const [benefits, setBenefits] = useState(initialData?.benefits ?? "");

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSubmit({
      title,
      description,
      location,
      employmentType,
      salaryMin: salaryMin !== "" ? Number(salaryMin) : null,
      salaryMax: salaryMax !== "" ? Number(salaryMax) : null,
      salaryCurrency: "USD",
      salaryPeriod: "year",
      requirements: requirements.trim() || null,
      benefits: benefits.trim() || null,
    });
  }

  const inputBase =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

  function JobDetailsSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Job details</h2>

        <div className="space-y-2">
          <label htmlFor="job-title" className="block text-sm font-medium text-foreground">
            Job title <span className="text-destructive">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            placeholder="e.g. Front Desk Receptionist, Sous Chef"
            className={inputBase}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="job-description" className="block text-sm font-medium text-foreground">
            Job description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="job-description"
            required
            minLength={30}
            rows={6}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            placeholder="Describe the role, responsibilities, and what makes it a great opportunity."
            className={inputBase + " resize-y"}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="job-location" className="block text-sm font-medium text-foreground">
              Job location <span className="text-destructive">*</span>
            </label>
            <input
              id="job-location"
              type="text"
              required
              maxLength={100}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
              }}
              placeholder="e.g. Miami, FL or Remote"
              className={inputBase}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="employment-type" className="block text-sm font-medium text-foreground">
              Employment type <span className="text-destructive">*</span>
            </label>
            <select
              id="employment-type"
              required
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value);
              }}
              className={inputBase}
            >
              <option value="" disabled>
                Select employment type
              </option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    );
  }

  function CompensationSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Compensation</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="salary-min" className="block text-sm font-medium text-foreground">
              Minimum salary
            </label>
            <input
              id="salary-min"
              type="number"
              min={0}
              step={1}
              value={salaryMin}
              onChange={(e) => {
                setSalaryMin(e.target.value);
              }}
              placeholder="In USD per year"
              className={inputBase}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="salary-max" className="block text-sm font-medium text-foreground">
              Maximum salary
            </label>
            <input
              id="salary-max"
              type="number"
              min={0}
              step={1}
              value={salaryMax}
              onChange={(e) => {
                setSalaryMax(e.target.value);
              }}
              placeholder="In USD per year"
              className={inputBase}
            />
          </div>
        </div>
      </section>
    );
  }

  function RequirementsBenefitsSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Requirements &amp; Benefits
        </h2>

        <div className="space-y-2">
          <label htmlFor="requirements" className="block text-sm font-medium text-foreground">
            Requirements
          </label>
          <textarea
            id="requirements"
            rows={4}
            value={requirements}
            onChange={(e) => {
              setRequirements(e.target.value);
            }}
            placeholder="Skills, experience, and qualifications needed."
            className={inputBase + " resize-y"}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="benefits" className="block text-sm font-medium text-foreground">
            Benefits
          </label>
          <textarea
            id="benefits"
            rows={4}
            value={benefits}
            onChange={(e) => {
              setBenefits(e.target.value);
            }}
            placeholder="Health insurance, housing, meals, tips, etc."
            className={inputBase + " resize-y"}
          />
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <JobDetailsSection />
      <CompensationSection />
      <RequirementsBenefitsSection />

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isLoading ?? false} size="lg">
          {isLoading === true ? "Saving draft\u2026" : "Save as Draft"}
        </Button>
        <p className="text-xs text-muted-foreground">
          This will be saved as a draft. No credits will be charged until you publish.
        </p>
      </div>
    </form>
  );
}
