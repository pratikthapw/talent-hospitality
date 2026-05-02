/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unnecessary-condition, typescript-eslint/prefer-optional-chain */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { hasActiveCV } from "@/lib/profile/active-cv-manager";
import {
  checkProfileCompleteness,
  getCompletenessPercentage,
} from "@/lib/profile/profile-completeness-policy";
import type { EmployeeProfileData } from "@/lib/profile/profile-completeness-policy";

const UPDATABLE_FIELDS = [
  "fullName",
  "phone",
  "currentLocation",
  "preferredCategory",
  "experienceLevel",
  "skills",
  "languages",
  "educationSummary",
  "workHistorySummary",
  "profilePhoto",
  "expectedSalary",
  "trainingCertificates",
  "personalSummary",
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

async function requireEmployee(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session === null || session.user === null || typeof session.user.id !== "string") {
    return null;
  }

  const userId = session.user.id;

  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "employee")))
    .limit(1);

  return rows.length > 0 ? userId : null;
}

async function buildProfileData(
  row: typeof employeeProfile.$inferSelect,
): Promise<EmployeeProfileData> {
  const cvActive = await hasActiveCV(row.id);
  return {
    fullName: row.fullName,
    phone: row.phone,
    currentLocation: row.currentLocation,
    preferredCategory: row.preferredCategory,
    experienceLevel: row.experienceLevel,
    skills: row.skills,
    languages: row.languages,
    educationSummary: row.educationSummary,
    workHistorySummary: row.workHistorySummary,
    hasActiveCV: cvActive,
  };
}

const STRING_FIELDS: readonly UpdatableField[] = [
  "fullName",
  "phone",
  "currentLocation",
  "preferredCategory",
  "experienceLevel",
  "educationSummary",
  "workHistorySummary",
  "profilePhoto",
  "personalSummary",
];

const ARRAY_FIELDS: readonly UpdatableField[] = ["skills", "languages", "trainingCertificates"];

function trimStringFields(body: Record<string, unknown>, fields: readonly UpdatableField[]): void {
  for (const field of fields) {
    const value = body[field];
    if (typeof value === "string") {
      body[field] = value.trim();
    }
  }
}

function validateArrayFields(
  body: Record<string, unknown>,
  fields: readonly UpdatableField[],
): void {
  for (const field of fields) {
    const value = body[field];
    if (value !== undefined && !Array.isArray(value)) {
      Reflect.deleteProperty(body, field);
    }
  }
}

function normalizeSalary(body: Record<string, unknown>): void {
  const salary = body.expectedSalary;
  if (salary !== undefined) {
    if (typeof salary === "number" && salary >= 0) {
      body.expectedSalary = Math.floor(salary);
    } else {
      Reflect.deleteProperty(body, "expectedSalary");
    }
  }
}

function sanitizeUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  // Filter only updatable fields
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = body[field];
    }
  }

  // Trim string fields
  trimStringFields(clean, STRING_FIELDS);

  // Validate array fields
  validateArrayFields(clean, ARRAY_FIELDS);

  // Normalize salary
  normalizeSalary(clean);

  return clean;
}

export async function GET(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Profile not found. Create one first." }, { status: 404 });
    }

    const profile = await buildProfileData(rows[0]);
    const completeness = checkProfileCompleteness(profile);
    const percentage = getCompletenessPercentage(completeness);

    return NextResponse.json({
      profile,
      completeness,
      percentage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const clean = sanitizeUpdates(body);

    const rows = await db
      .select({ id: employeeProfile.id })
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      await db.insert(employeeProfile).values({ userId, ...clean });
      const inserted = await db
        .select()
        .from(employeeProfile)
        .where(eq(employeeProfile.userId, userId))
        .limit(1);
      const profile = await buildProfileData(inserted[0]);
      const completeness = checkProfileCompleteness(profile);
      const percentage = getCompletenessPercentage(completeness);

      return NextResponse.json(
        {
          profile,
          completeness,
          percentage,
          message: "Profile created successfully.",
        },
        { status: 201 },
      );
    }

    await db.update(employeeProfile).set(clean).where(eq(employeeProfile.id, rows[0].id));

    const updated = await db
      .select()
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    const profile = await buildProfileData(updated[0]);
    const completeness = checkProfileCompleteness(profile);
    const percentage = getCompletenessPercentage(completeness);

    return NextResponse.json({
      profile,
      completeness,
      percentage,
      message: "Profile updated successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
