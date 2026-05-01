"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ProfileFormProps {
  profile: {
    fullName: string | null;
    phone: string | null;
    currentLocation: string | null;
    preferredCategory: string | null;
    experienceLevel: string | null;
    skills: string[] | null;
    languages: string[] | null;
    educationSummary: string | null;
    workHistorySummary: string | null;
    profilePhoto: string | null;
    expectedSalary: number | null;
    trainingCertificates: string[] | null;
    personalSummary: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { value: "Hospitality", label: "Hospitality" },
  { value: "Food & Beverage", label: "Food & Beverage" },
  { value: "Front Desk", label: "Front Desk" },
  { value: "Housekeeping", label: "Housekeeping" },
  { value: "Chef & Cooking", label: "Chef & Cooking" },
  { value: "Tourism", label: "Tourism" },
  { value: "Event Management", label: "Event Management" },
  { value: "Other", label: "Other" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "Entry Level (0-1 years)", label: "Entry Level (0-1 years)" },
  { value: "Junior (1-3 years)", label: "Junior (1-3 years)" },
  { value: "Mid-Level (3-5 years)", label: "Mid-Level (3-5 years)" },
  { value: "Senior (5-10 years)", label: "Senior (5-10 years)" },
  { value: "Expert (10+ years)", label: "Expert (10+ years)" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function arrToCsv(arr: string[] | null): string {
  if (arr === null || arr.length === 0) {
    return "";
  }
  return arr.join(", ");
}

function csvToArr(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface ErrorResponse {
  error?: string;
}

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "string"
  );
}

const INPUT_BASE =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ProfileForm({ profile }: ProfileFormProps) {
  // Personal
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [currentLocation, setCurrentLocation] = useState(profile.currentLocation ?? "");

  // Professional
  const [preferredCategory, setPreferredCategory] = useState(profile.preferredCategory ?? "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel ?? "");
  const [skillsCsv, setSkillsCsv] = useState(arrToCsv(profile.skills));
  const [languagesCsv, setLanguagesCsv] = useState(arrToCsv(profile.languages));

  // Education & work
  const [educationSummary, setEducationSummary] = useState(profile.educationSummary ?? "");
  const [workHistorySummary, setWorkHistorySummary] = useState(profile.workHistorySummary ?? "");

  // Optional
  const [showOptional, setShowOptional] = useState(
    profile.profilePhoto !== null ||
      profile.expectedSalary !== null ||
      (profile.trainingCertificates !== null && profile.trainingCertificates.length > 0) ||
      profile.personalSummary !== null,
  );
  const [profilePhoto, setProfilePhoto] = useState(profile.profilePhoto ?? "");
  const [expectedSalary, setExpectedSalary] = useState(
    profile.expectedSalary !== null ? String(profile.expectedSalary) : "",
  );
  const [certificatesCsv, setCertificatesCsv] = useState(arrToCsv(profile.trainingCertificates));
  const [personalSummary, setPersonalSummary] = useState(profile.personalSummary ?? "");

  // Submit state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    void submitProfile();
  }

  async function submitProfile() {
    try {
      const payload: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        currentLocation: currentLocation.trim(),
        preferredCategory: preferredCategory.trim(),
        experienceLevel: experienceLevel.trim(),
        skills: csvToArr(skillsCsv),
        languages: csvToArr(languagesCsv),
        educationSummary: educationSummary.trim(),
        workHistorySummary: workHistorySummary.trim(),
        trainingCertificates: csvToArr(certificatesCsv),
        personalSummary: personalSummary.trim() || null,
      };

      if (profilePhoto.trim()) {
        payload.profilePhoto = profilePhoto.trim();
      }
      if (expectedSalary.trim() !== "") {
        const salary = Number(expectedSalary);
        if (salary >= 0) {
          payload.expectedSalary = Math.floor(salary);
        }
      }

      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let body: ErrorResponse | null = null;
        try {
          const json = (await res.json()) as unknown;
          if (isErrorResponse(json)) {
            body = json;
          }
        } catch {
          // ignore json parse errors
        }
        setError(body?.error ?? "Failed to save profile. Please try again.");
        return;
      }

      setSuccessMessage("Profile saved successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function PersonalInfoSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Personal Information
        </h2>

        <div className="space-y-2">
          <label htmlFor="full-name" className="block text-sm font-medium text-foreground">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="full-name"
            type="text"
            required
            maxLength={150}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
            }}
            placeholder="Your full name"
            className={INPUT_BASE}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-foreground">
              Phone <span className="text-destructive">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              required
              maxLength={30}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }}
              placeholder="e.g., +977-9800000000"
              className={INPUT_BASE}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="current-location" className="block text-sm font-medium text-foreground">
              Current Location <span className="text-destructive">*</span>
            </label>
            <input
              id="current-location"
              type="text"
              required
              maxLength={100}
              value={currentLocation}
              onChange={(e) => {
                setCurrentLocation(e.target.value);
              }}
              placeholder="e.g., Kathmandu, Nepal"
              className={INPUT_BASE}
            />
          </div>
        </div>
      </section>
    );
  }

  function ProfessionalInfoSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Professional Information
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="preferred-category"
              className="block text-sm font-medium text-foreground"
            >
              Preferred Category <span className="text-destructive">*</span>
            </label>
            <select
              id="preferred-category"
              required
              value={preferredCategory}
              onChange={(e) => {
                setPreferredCategory(e.target.value);
              }}
              className={INPUT_BASE}
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="experience-level" className="block text-sm font-medium text-foreground">
              Experience Level <span className="text-destructive">*</span>
            </label>
            <select
              id="experience-level"
              required
              value={experienceLevel}
              onChange={(e) => {
                setExperienceLevel(e.target.value);
              }}
              className={INPUT_BASE}
            >
              <option value="" disabled>
                Select experience level
              </option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="skills" className="block text-sm font-medium text-foreground">
            Skills <span className="text-destructive">*</span>
          </label>
          <input
            id="skills"
            type="text"
            required
            value={skillsCsv}
            onChange={(e) => {
              setSkillsCsv(e.target.value);
            }}
            placeholder="Enter skills separated by commas, e.g., customer service, food handling, POS systems"
            className={INPUT_BASE}
          />
          <p className="text-xs text-muted-foreground">Enter skills separated by commas.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="languages" className="block text-sm font-medium text-foreground">
            Languages <span className="text-destructive">*</span>
          </label>
          <input
            id="languages"
            type="text"
            required
            value={languagesCsv}
            onChange={(e) => {
              setLanguagesCsv(e.target.value);
            }}
            placeholder="Enter languages you speak, e.g., Nepali, English, Hindi"
            className={INPUT_BASE}
          />
          <p className="text-xs text-muted-foreground">Enter languages separated by commas.</p>
        </div>
      </section>
    );
  }

  function EducationWorkSection() {
    return (
      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Education &amp; Work History
        </h2>

        <div className="space-y-2">
          <label htmlFor="education-summary" className="block text-sm font-medium text-foreground">
            Education Summary <span className="text-destructive">*</span>
          </label>
          <textarea
            id="education-summary"
            required
            rows={4}
            value={educationSummary}
            onChange={(e) => {
              setEducationSummary(e.target.value);
            }}
            placeholder="Summarize your education background"
            className={INPUT_BASE + " resize-y"}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="work-history-summary"
            className="block text-sm font-medium text-foreground"
          >
            Work History Summary <span className="text-destructive">*</span>
          </label>
          <textarea
            id="work-history-summary"
            required
            rows={4}
            value={workHistorySummary}
            onChange={(e) => {
              setWorkHistorySummary(e.target.value);
            }}
            placeholder="Summarize your work experience"
            className={INPUT_BASE + " resize-y"}
          />
        </div>
      </section>
    );
  }

  function OptionalInfoSection() {
    return (
      <section className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setShowOptional((prev) => !prev);
          }}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground"
        >
          <span
            className={
              "inline-block transition-transform duration-200 " +
              (showOptional ? "rotate-90" : "rotate-0")
            }
            aria-hidden="true"
          >
            ▸
          </span>
          Optional Information
        </button>

        {showOptional && (
          <div className="space-y-5 pl-1">
            <div className="space-y-2">
              <label htmlFor="profile-photo" className="block text-sm font-medium text-foreground">
                Profile Photo URL
              </label>
              <input
                id="profile-photo"
                type="url"
                value={profilePhoto}
                onChange={(e) => {
                  setProfilePhoto(e.target.value);
                }}
                placeholder="Link to your profile photo"
                className={INPUT_BASE}
              />
              <p className="text-xs text-muted-foreground">A direct link to your profile photo.</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="expected-salary"
                className="block text-sm font-medium text-foreground"
              >
                Expected Salary (NPR)
              </label>
              <input
                id="expected-salary"
                type="number"
                min={0}
                step={1}
                value={expectedSalary}
                onChange={(e) => {
                  setExpectedSalary(e.target.value);
                }}
                placeholder="Monthly expected salary in NPR"
                className={INPUT_BASE}
              />
              <p className="text-xs text-muted-foreground">Monthly expected salary in NPR.</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="training-certificates"
                className="block text-sm font-medium text-foreground"
              >
                Training &amp; Certificates
              </label>
              <input
                id="training-certificates"
                type="text"
                value={certificatesCsv}
                onChange={(e) => {
                  setCertificatesCsv(e.target.value);
                }}
                placeholder="Enter certificates separated by commas, e.g., Food Safety Certificate, First Aid"
                className={INPUT_BASE}
              />
              <p className="text-xs text-muted-foreground">
                Enter certificates separated by commas.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="personal-summary"
                className="block text-sm font-medium text-foreground"
              >
                Personal Summary
              </label>
              <textarea
                id="personal-summary"
                rows={4}
                value={personalSummary}
                onChange={(e) => {
                  setPersonalSummary(e.target.value);
                }}
                placeholder="Tell employers about yourself"
                className={INPUT_BASE + " resize-y"}
              />
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Error display */}
      {error !== null && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Success display */}
      {successMessage !== null && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300">
          {successMessage}
        </div>
      )}

      <PersonalInfoSection />
      <ProfessionalInfoSection />
      <EducationWorkSection />
      <OptionalInfoSection />

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? "Saving\u2026" : "Save Profile"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Saving your profile data\u2026" : "All required fields marked with *"}
        </p>
      </div>
    </form>
  );
}
