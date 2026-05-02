CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"amount_npr" integer NOT NULL,
	"source_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"reason" text NOT NULL,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"balance_npr" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_wallet_employer_profile_id_unique" UNIQUE("employer_profile_id")
);
--> statement-breakpoint
CREATE TABLE "cv_document" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_profile_id" text NOT NULL,
	"source_type" text NOT NULL,
	"file_name" text,
	"file_url" text,
	"file_size" integer,
	"mime_type" text,
	"builder_content" json,
	"is_active" boolean DEFAULT false NOT NULL,
	"replaced_at" timestamp,
	"retention_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text,
	"phone" text,
	"current_location" text,
	"preferred_category" varchar(100),
	"experience_level" varchar(50),
	"skills" json DEFAULT '[]'::json,
	"languages" json DEFAULT '[]'::json,
	"education_summary" text,
	"work_history_summary" text,
	"profile_photo" text,
	"expected_salary" integer,
	"training_certificates" json DEFAULT '[]'::json,
	"personal_summary" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"verification_notes" text,
	"verified_by" text,
	"verified_at" timestamp,
	"verification_updated_at" timestamp DEFAULT now() NOT NULL,
	"search_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "employer_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"company_type" text NOT NULL,
	"verification_status" text DEFAULT 'pending_review' NOT NULL,
	"verification_notes" text,
	"verified_by" text,
	"verified_at" timestamp,
	"verification_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employer_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "employer_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"billing_term" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employer_subscription_employer_profile_id_unique" UNIQUE("employer_profile_id")
);
--> statement-breakpoint
CREATE TABLE "job_boost" (
	"id" text PRIMARY KEY NOT NULL,
	"job_posting_cycle_id" text NOT NULL,
	"employer_id" text NOT NULL,
	"boost_type" text NOT NULL,
	"cost_npr" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"employment_type" varchar(50) NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" varchar(3) DEFAULT 'USD',
	"salary_period" varchar(20),
	"requirements" text,
	"benefits" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_posting_cycle" (
	"id" text PRIMARY KEY NOT NULL,
	"job_draft_id" text NOT NULL,
	"employer_id" text NOT NULL,
	"duration_days" integer NOT NULL,
	"cost_npr" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"previous_cycle_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"billing_terms" json NOT NULL,
	"monthly_credit_grant" integer DEFAULT 0 NOT NULL,
	"can_publish_jobs" boolean DEFAULT false NOT NULL,
	"can_search_candidates" boolean DEFAULT false NOT NULL,
	"can_use_boosts" boolean DEFAULT false NOT NULL,
	"max_job_drafts" integer DEFAULT 0 NOT NULL,
	"max_published_jobs" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"subscription_id" text,
	"plan_id" text NOT NULL,
	"billing_term" text NOT NULL,
	"amount_npr" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_ref" text,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suspended_user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"suspended_by" text NOT NULL,
	"reason" text NOT NULL,
	"suspended_at" timestamp DEFAULT now() NOT NULL,
	"unsuspended_at" timestamp,
	"unsuspended_by" text,
	CONSTRAINT "suspended_user_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_employer_profile_id_employer_profile_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_wallet" ADD CONSTRAINT "credit_wallet_employer_profile_id_employer_profile_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_document" ADD CONSTRAINT "cv_document_employee_profile_id_employee_profile_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profile" ADD CONSTRAINT "employer_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profile" ADD CONSTRAINT "employer_profile_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_subscription" ADD CONSTRAINT "employer_subscription_employer_profile_id_employer_profile_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_subscription" ADD CONSTRAINT "employer_subscription_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_boost" ADD CONSTRAINT "job_boost_job_posting_cycle_id_job_posting_cycle_id_fk" FOREIGN KEY ("job_posting_cycle_id") REFERENCES "public"."job_posting_cycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_boost" ADD CONSTRAINT "job_boost_employer_id_employer_profile_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_draft" ADD CONSTRAINT "job_draft_employer_id_employer_profile_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_cycle" ADD CONSTRAINT "job_posting_cycle_job_draft_id_job_draft_id_fk" FOREIGN KEY ("job_draft_id") REFERENCES "public"."job_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_cycle" ADD CONSTRAINT "job_posting_cycle_employer_id_employer_profile_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_cycle" ADD CONSTRAINT "job_posting_cycle_previous_cycle_id_job_posting_cycle_id_fk" FOREIGN KEY ("previous_cycle_id") REFERENCES "public"."job_posting_cycle"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_employer_profile_id_employer_profile_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_id_employer_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."employer_subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspended_user" ADD CONSTRAINT "suspended_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspended_user" ADD CONSTRAINT "suspended_user_suspended_by_user_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspended_user" ADD CONSTRAINT "suspended_user_unsuspended_by_user_id_fk" FOREIGN KEY ("unsuspended_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_actorId_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_profile_idx" ON "credit_ledger" USING btree ("employer_profile_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_source_type_idx" ON "credit_ledger" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "credit_ledger_created_at_idx" ON "credit_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_reference_id_unique" ON "credit_ledger" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "cv_document_employee_profile_id_idx" ON "cv_document" USING btree ("employee_profile_id");--> statement-breakpoint
CREATE INDEX "cv_document_is_active_idx" ON "cv_document" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cv_document_replaced_at_idx" ON "cv_document" USING btree ("replaced_at");--> statement-breakpoint
CREATE INDEX "cv_document_retention_expires_at_idx" ON "cv_document" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "employee_profile_userId_idx" ON "employee_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "employee_profile_verification_status_idx" ON "employee_profile" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "employer_profile_userId_idx" ON "employer_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "employer_profile_verification_status_idx" ON "employer_profile" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "employer_subscription_profile_idx" ON "employer_subscription" USING btree ("employer_profile_id");--> statement-breakpoint
CREATE INDEX "employer_subscription_status_idx" ON "employer_subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_boost_cycle_idx" ON "job_boost" USING btree ("job_posting_cycle_id");--> statement-breakpoint
CREATE INDEX "job_boost_employer_idx" ON "job_boost" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "job_boost_status_idx" ON "job_boost" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_boost_expires_at_idx" ON "job_boost" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "job_draft_employer_id_idx" ON "job_draft" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "job_draft_status_idx" ON "job_draft" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_posting_cycle_job_draft_id_idx" ON "job_posting_cycle" USING btree ("job_draft_id");--> statement-breakpoint
CREATE INDEX "job_posting_cycle_employer_id_idx" ON "job_posting_cycle" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "job_posting_cycle_status_idx" ON "job_posting_cycle" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_posting_cycle_expires_at_idx" ON "job_posting_cycle" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "job_posting_cycle_previous_cycle_id_idx" ON "job_posting_cycle" USING btree ("previous_cycle_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_payment_profile_idx" ON "subscription_payment" USING btree ("employer_profile_id");--> statement-breakpoint
CREATE INDEX "subscription_payment_status_idx" ON "subscription_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_payment_subscription_idx" ON "subscription_payment" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "suspended_user_userId_idx" ON "suspended_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_userId_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_userId_role_unique" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");