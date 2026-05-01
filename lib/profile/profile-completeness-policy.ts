export interface MissingField {
  field: string;
  label: string;
  hint: string;
}

export interface CompletenessCheckResult {
  isReadyToApply: boolean;
  completedCount: number;
  totalRequired: number;
  missingFields: MissingField[];
}

export interface EmployeeProfileData {
  fullName: string | null;
  phone: string | null;
  currentLocation: string | null;
  preferredCategory: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
  languages: string[] | null;
  educationSummary: string | null;
  workHistorySummary: string | null;
  hasActiveCV: boolean;
}

interface RequiredFieldCheck {
  field: keyof EmployeeProfileData;
  label: string;
  hint: string;
  validate: (value: EmployeeProfileData[keyof EmployeeProfileData]) => boolean;
}

const REQUIRED_FIELDS: RequiredFieldCheck[] = [
  {
    field: "fullName",
    label: "Full Name",
    hint: "Enter your full legal name as it appears on your ID.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "phone",
    label: "Phone Number",
    hint: "Add a phone number so employers can reach you.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "currentLocation",
    label: "Current Location",
    hint: "Specify the city or area where you currently reside.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "preferredCategory",
    label: "Preferred Job Category",
    hint: "Choose the hospitality role you are most interested in.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "experienceLevel",
    label: "Experience Level",
    hint: "Indicate your years of experience in the industry.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "skills",
    label: "Skills",
    hint: "List at least one relevant skill (e.g. food safety, barista).",
    validate: (v) => Array.isArray(v) && v.length > 0,
  },
  {
    field: "languages",
    label: "Languages",
    hint: "List at least one language you speak.",
    validate: (v) => Array.isArray(v) && v.length > 0,
  },
  {
    field: "educationSummary",
    label: "Education Summary",
    hint: "Briefly describe your educational background.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "workHistorySummary",
    label: "Work History Summary",
    hint: "Summarize your relevant work experience.",
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    field: "hasActiveCV",
    label: "Active CV",
    hint: "Upload and activate at least one CV document.",
    validate: (v) => v === true,
  },
];

export function checkProfileCompleteness(profile: EmployeeProfileData): CompletenessCheckResult {
  const missingFields: MissingField[] = [];
  let completedCount = 0;

  for (const check of REQUIRED_FIELDS) {
    const value = profile[check.field];
    if (check.validate(value)) {
      completedCount++;
    } else {
      missingFields.push({ field: check.field, label: check.label, hint: check.hint });
    }
  }

  return {
    isReadyToApply: missingFields.length === 0,
    completedCount,
    totalRequired: REQUIRED_FIELDS.length,
    missingFields,
  };
}

export function getCompletenessPercentage(result: CompletenessCheckResult): number {
  if (result.totalRequired === 0) {
    return 100;
  }
  return Math.round((result.completedCount / result.totalRequired) * 100);
}
