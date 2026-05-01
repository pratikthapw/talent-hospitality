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
  varchar,
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

    // Required profile fields
    fullName: text("full_name"),
    phone: text("phone"),
    currentLocation: text("current_location"),
    preferredCategory: varchar("preferred_category", { length: 100 }),
    experienceLevel: varchar("experience_level", { length: 50 }),
    skills: json("skills").$type<string[]>().default([]),
    languages: json("languages").$type<string[]>().default([]),
    educationSummary: text("education_summary"),
    workHistorySummary: text("work_history_summary"),

    // Optional profile fields
    profilePhoto: text("profile_photo"),
    expectedSalary: integer("expected_salary"),
    trainingCertificates: json("training_certificates").$type<string[]>().default([]),
    personalSummary: text("personal_summary"),

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

export const cvDocument = pgTable(
  "cv_document",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employeeProfileId: text("employee_profile_id")
      .notNull()
      .references(() => employeeProfile.id, { onDelete: "cascade" }),
    sourceType: text("source_type", { enum: ["upload", "builder"] }).notNull(),
    // Upload-specific fields
    fileName: text("file_name"),
    fileUrl: text("file_url"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    // Builder-specific fields
    builderContent: json("builder_content").$type<Record<string, unknown>>(),
    // Status
    isActive: boolean("is_active").notNull().default(false),
    replacedAt: timestamp("replaced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("cv_document_employee_profile_id_idx").on(table.employeeProfileId),
    index("cv_document_is_active_idx").on(table.isActive),
    index("cv_document_replaced_at_idx").on(table.replacedAt),
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

export const creditWallet = pgTable("credit_wallet", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  employerProfileId: text("employer_profile_id")
    .notNull()
    .unique()
    .references(() => employerProfile.id, { onDelete: "cascade" }),
  balanceNpr: integer("balance_npr").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employerProfileId: text("employer_profile_id")
      .notNull()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    amountNpr: integer("amount_npr").notNull(),
    sourceType: text("source_type", {
      enum: [
        "signup_grant",
        "subscription_grant",
        "yearly_monthly_grant",
        "top_up_purchase",
        "admin_adjustment",
        "admin_refund",
        "publish_cost",
        "boost_cost",
      ],
    }).notNull(),
    referenceId: text("reference_id").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actor_id").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("credit_ledger_profile_idx").on(table.employerProfileId),
    index("credit_ledger_source_type_idx").on(table.sourceType),
    index("credit_ledger_created_at_idx").on(table.createdAt),
    uniqueIndex("credit_ledger_reference_id_unique").on(table.referenceId),
  ],
);

export const subscriptionPayment = pgTable(
  "subscription_payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employerProfileId: text("employer_profile_id")
      .notNull()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => employerSubscription.id),
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id),
    billingTerm: text("billing_term", { enum: ["monthly", "yearly"] }).notNull(),
    amountNpr: integer("amount_npr").notNull(),
    status: text("status", { enum: ["pending", "confirmed", "failed"] })
      .notNull()
      .default("pending"),
    paymentMethod: text("payment_method"),
    paymentRef: text("payment_ref"),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscription_payment_profile_idx").on(table.employerProfileId),
    index("subscription_payment_status_idx").on(table.status),
    index("subscription_payment_subscription_idx").on(table.subscriptionId),
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

export const employeeProfileRelations = relations(employeeProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [employeeProfile.userId],
    references: [user.id],
  }),
  verifiedByUser: one(user, {
    fields: [employeeProfile.verifiedBy],
    references: [user.id],
    relationName: "employee_verified_by",
  }),
  cvDocuments: many(cvDocument),
}));

export const cvDocumentRelations = relations(cvDocument, ({ one }) => ({
  employeeProfile: one(employeeProfile, {
    fields: [cvDocument.employeeProfileId],
    references: [employeeProfile.id],
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

export const employerProfileRelations = relations(employerProfile, ({ one, many }) => ({
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
  wallet: one(creditWallet, {
    fields: [employerProfile.id],
    references: [creditWallet.employerProfileId],
  }),
  ledgerEntries: many(creditLedger),
  payments: many(subscriptionPayment),
  jobDrafts: many(jobDraft),
  postingCycles: many(jobPostingCycle),
  boosts: many(jobBoost),
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

export const creditWalletRelations = relations(creditWallet, ({ one }) => ({
  employerProfile: one(employerProfile, {
    fields: [creditWallet.employerProfileId],
    references: [employerProfile.id],
  }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  employerProfile: one(employerProfile, {
    fields: [creditLedger.employerProfileId],
    references: [employerProfile.id],
  }),
  actor: one(user, {
    fields: [creditLedger.actorId],
    references: [user.id],
    relationName: "credit_ledger_actor",
  }),
}));

export const subscriptionPaymentRelations = relations(subscriptionPayment, ({ one }) => ({
  employerProfile: one(employerProfile, {
    fields: [subscriptionPayment.employerProfileId],
    references: [employerProfile.id],
  }),
  subscription: one(employerSubscription, {
    fields: [subscriptionPayment.subscriptionId],
    references: [employerSubscription.id],
  }),
  plan: one(plan, {
    fields: [subscriptionPayment.planId],
    references: [plan.id],
  }),
}));

// --- Job Posting Tables ---

export const jobDraft = pgTable(
  "job_draft",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employerId: text("employer_id")
      .notNull()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    // Values: "full-time", "part-time", "contract", "seasonal", "internship"
    employmentType: varchar("employment_type", { length: 50 }).notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: varchar("salary_currency", { length: 3 }).default("USD"),
    salaryPeriod: varchar("salary_period", { length: 20 }),
    requirements: text("requirements"),
    benefits: text("benefits"),
    // draft → published → expired/closed
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("job_draft_employer_id_idx").on(table.employerId),
    index("job_draft_status_idx").on(table.status),
  ],
);

export const jobPostingCycle = pgTable(
  "job_posting_cycle",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobDraftId: text("job_draft_id")
      .notNull()
      .references(() => jobDraft.id, { onDelete: "cascade" }),
    employerId: text("employer_id")
      .notNull()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    durationDays: integer("duration_days").notNull(),
    costNpr: integer("cost_npr").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle ORM reference pattern
    previousCycleId: text("previous_cycle_id").references((): any => jobPostingCycle.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_posting_cycle_job_draft_id_idx").on(table.jobDraftId),
    index("job_posting_cycle_employer_id_idx").on(table.employerId),
    index("job_posting_cycle_status_idx").on(table.status),
    index("job_posting_cycle_expires_at_idx").on(table.expiresAt),
    index("job_posting_cycle_previous_cycle_id_idx").on(table.previousCycleId),
  ],
);

export const jobBoost = pgTable(
  "job_boost",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobPostingCycleId: text("job_posting_cycle_id")
      .notNull()
      .references(() => jobPostingCycle.id, { onDelete: "cascade" }),
    employerId: text("employer_id")
      .notNull()
      .references(() => employerProfile.id, { onDelete: "cascade" }),
    boostType: text("boost_type", { enum: ["featured", "urgent"] }).notNull(),
    costNpr: integer("cost_npr").notNull(),
    durationDays: integer("duration_days").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("job_boost_cycle_idx").on(table.jobPostingCycleId),
    index("job_boost_employer_idx").on(table.employerId),
    index("job_boost_status_idx").on(table.status),
    index("job_boost_expires_at_idx").on(table.expiresAt),
  ],
);

export const jobBoostRelations = relations(jobBoost, ({ one }) => ({
  jobPostingCycle: one(jobPostingCycle, {
    fields: [jobBoost.jobPostingCycleId],
    references: [jobPostingCycle.id],
  }),
  employer: one(employerProfile, {
    fields: [jobBoost.employerId],
    references: [employerProfile.id],
  }),
}));

export const jobPostingCycleRelations = relations(jobPostingCycle, ({ one, many }) => ({
  jobDraft: one(jobDraft, {
    fields: [jobPostingCycle.jobDraftId],
    references: [jobDraft.id],
  }),
  employer: one(employerProfile, {
    fields: [jobPostingCycle.employerId],
    references: [employerProfile.id],
  }),
  previousCycle: one(jobPostingCycle, {
    fields: [jobPostingCycle.previousCycleId],
    references: [jobPostingCycle.id],
    relationName: "cycle_lineage",
  }),
  republishedCycles: many(jobPostingCycle, { relationName: "cycle_lineage" }),
  boosts: many(jobBoost),
}));

export const jobDraftRelations = relations(jobDraft, ({ one, many }) => ({
  employer: one(employerProfile, {
    fields: [jobDraft.employerId],
    references: [employerProfile.id],
  }),
  cycles: many(jobPostingCycle),
}));
