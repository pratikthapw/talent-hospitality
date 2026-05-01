/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unnecessary-condition, typescript-eslint/prefer-optional-chain */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles, user } from "@/lib/auth-schema";
import { db } from "@/lib/db";
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

function buildProfileData(row: typeof employeeProfile.$inferSelect): EmployeeProfileData {
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
    hasActiveCV: false,
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

function sanitizeUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      clean[field] = body[field];
    }
  }

  for (const field of STRING_FIELDS) {
    const value = clean[field];
    if (typeof value === "string") {
      clean[field] = value.trim();
    }
  }

  for (const field of ARRAY_FIELDS) {
    const value = clean[field];
    if (value !== undefined && !Array.isArray(value)) {
      Reflect.deleteProperty(clean, field);
    }
  }

  const salary = clean.expectedSalary;
  if (salary !== undefined) {
    if (typeof salary === "number" && salary >= 0) {
      clean.expectedSalary = Math.floor(salary);
    } else {
      Reflect.deleteProperty(clean, "expectedSalary");
    }
  }

  return clean;
}

export async function GET(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const profiles = await db
      .select()
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    const users = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const userEmail = users[0]?.email ?? null;

    if (profiles.length === 0) {
      const completeness = checkProfileCompleteness({
        fullName: null,
        phone: null,
        currentLocation: null,
        preferredCategory: null,
        experienceLevel: null,
        skills: null,
        languages: null,
        educationSummary: null,
        workHistorySummary: null,
        hasActiveCV: false,
      });

      return NextResponse.json({
        profile: null,
        email: userEmail,
        completeness,
        completenessPercentage: getCompletenessPercentage(completeness),
      });
    }

    const profile = profiles[0];
    const profileData = buildProfileData(profile);
    const completeness = checkProfileCompleteness(profileData);

    return NextResponse.json({
      profile: { ...profile, email: userEmail },
      completeness,
      completenessPercentage: getCompletenessPercentage(completeness),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const cleanUpdates = sanitizeUpdates(body);

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    let profile: typeof employeeProfile.$inferSelect;

    if (existing.length === 0) {
      const [created] = await db
        .insert(employeeProfile)
        .values({
          userId,
          ...cleanUpdates,
        })
        .returning();
      profile = created;
    } else {
      const [updated] = await db
        .update(employeeProfile)
        .set(cleanUpdates)
        .where(eq(employeeProfile.userId, userId))
        .returning();
      profile = updated;
    }

    const users = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const profileData = buildProfileData(profile);
    const completeness = checkProfileCompleteness(profileData);

    return NextResponse.json({
      profile: { ...profile, email: users[0]?.email ?? null },
      completeness,
      completenessPercentage: getCompletenessPercentage(completeness),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
