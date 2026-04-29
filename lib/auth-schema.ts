import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "employer", "employee"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_roles_userId_idx").on(table.userId),
    index("user_roles_role_idx").on(table.role),
    uniqueIndex("user_roles_userId_role_unique").on(table.userId, table.role),
  ],
);

export const employeeProfile = pgTable(
  "employee_profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    verificationStatus: text("verification_status", {
      enum: ["unverified", "pending_review", "verified", "rejected"],
    })
      .notNull()
      .default("unverified"),
    verificationNotes: text("verification_notes"),
    verifiedBy: text("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    verificationUpdatedAt: timestamp("verification_updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("employee_profile_userId_idx").on(table.userId),
    index("employee_profile_verification_status_idx").on(table.verificationStatus),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    action: text("action").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_actorId_idx").on(table.actorId),
    index("audit_log_target_idx").on(table.targetType, table.targetId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);

export const suspendedUser = pgTable(
  "suspended_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    suspendedBy: text("suspended_by")
      .notNull()
      .references(() => user.id),
    reason: text("reason").notNull(),
    suspendedAt: timestamp("suspended_at").defaultNow().notNull(),
    unsuspendedAt: timestamp("unsuspended_at"),
    unsuspendedBy: text("unsuspended_by").references(() => user.id),
  },
  (table) => [index("suspended_user_userId_idx").on(table.userId)],
);

export const employerProfile = pgTable(
  "employer_profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    companyType: text("company_type", { enum: ["company", "individual"] }).notNull(),
    verificationStatus: text("verification_status", {
      enum: ["pending_review", "verified", "rejected"],
    })
      .notNull()
      .default("pending_review"),
    verificationNotes: text("verification_notes"),
    verifiedBy: text("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    verificationUpdatedAt: timestamp("verification_updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("employer_profile_userId_idx").on(table.userId),
    index("employer_profile_verification_status_idx").on(table.verificationStatus),
  ],
);

export const plan = pgTable("plan", {
  id: text("id").primaryKey(),
  key: text("key", { enum: ["free", "pro", "premium", "enterprise"] })
    .notNull()
    .unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  billingTerms: json("billing_terms").$type<("monthly" | "yearly")[]>().notNull(),
  monthlyCreditGrant: integer("monthly_credit_grant").notNull().default(0),
  canPublishJobs: boolean("can_publish_jobs").notNull().default(false),
  canSearchCandidates: boolean("can_search_candidates").notNull().default(false),
  canUseBoosts: boolean("can_use_boosts").notNull().default(false),
  maxJobDrafts: integer("max_job_drafts").notNull().default(0),
  maxPublishedJobs: integer("max_published_jobs").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employerSubscription = pgTable(
  "employer_subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employerProfileId: text("employer_profile_id")
      .notNull()
      .unique()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id),
    billingTerm: text("billing_term", { enum: ["monthly", "yearly"] }).notNull(),
    status: text("status", { enum: ["active", "expired", "cancelled"] })
      .notNull()
      .default("active"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("employer_subscription_profile_idx").on(table.employerProfileId),
    index("employer_subscription_status_idx").on(table.status),
  ],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  roles: many(userRoles),
  employeeProfile: one(employeeProfile, {
    fields: [user.id],
    references: [employeeProfile.userId],
  }),
  suspension: one(suspendedUser, {
    fields: [user.id],
    references: [suspendedUser.userId],
  }),
  employerProfile: one(employerProfile, {
    fields: [user.id],
    references: [employerProfile.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, {
    fields: [userRoles.userId],
    references: [user.id],
  }),
}));

export const employeeProfileRelations = relations(employeeProfile, ({ one }) => ({
  user: one(user, {
    fields: [employeeProfile.userId],
    references: [user.id],
  }),
  verifiedByUser: one(user, {
    fields: [employeeProfile.verifiedBy],
    references: [user.id],
    relationName: "employee_verified_by",
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorId],
    references: [user.id],
    relationName: "audit_log_actor",
  }),
}));

export const suspendedUserRelations = relations(suspendedUser, ({ one }) => ({
  user: one(user, {
    fields: [suspendedUser.userId],
    references: [user.id],
  }),
  suspendedByUser: one(user, {
    fields: [suspendedUser.suspendedBy],
    references: [user.id],
    relationName: "suspended_by_user",
  }),
  unsuspendedByUser: one(user, {
    fields: [suspendedUser.unsuspendedBy],
    references: [user.id],
    relationName: "unsuspended_by_user",
  }),
}));

export const employerProfileRelations = relations(employerProfile, ({ one }) => ({
  user: one(user, {
    fields: [employerProfile.userId],
    references: [user.id],
  }),
  verifiedByUser: one(user, {
    fields: [employerProfile.verifiedBy],
    references: [user.id],
    relationName: "employer_verified_by",
  }),
  subscription: one(employerSubscription, {
    fields: [employerProfile.id],
    references: [employerSubscription.employerProfileId],
  }),
}));

export const planRelations = relations(plan, ({ many }) => ({
  subscriptions: many(employerSubscription),
}));

export const employerSubscriptionRelations = relations(employerSubscription, ({ one }) => ({
  plan: one(plan, {
    fields: [employerSubscription.planId],
    references: [plan.id],
  }),
  employerProfile: one(employerProfile, {
    fields: [employerSubscription.employerProfileId],
    references: [employerProfile.id],
  }),
}));
