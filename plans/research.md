# Talent Hospitality Platform Research

Date: 2026-04-25
Repo: `talent-hospitality`
Status: Product discovery synthesis for MVP scope

## Purpose

This document captures the full product understanding established during the product discovery conversation for Talent Hospitality Platform (`THP`). The goal is to preserve the decisions already made inside the conversation context window and convert them into a durable internal research document.

This is not yet a technical specification or database schema. It is the canonical product research summary for the current MVP direction.

## Product Summary

Talent Hospitality Platform is a Nepal-first hospitality marketplace that connects employers and employees. It is intended for the hospitality sector in Nepal and may expand later, but the core hiring marketplace for MVP is focused on Nepal.

The platform has three high-level role groups:

- `admin`
- `employer`
- `employee`

The business model is primarily employer-funded:

- employer subscriptions
- employer one-time credit purchases
- credit-based job posting
- credit-based candidate unlocks / CV views
- credit-based job boosts
- credit-based ad space

There is also a separate admin-operated training and grooming offering for employees.

## Core Product Principles

- The platform should be operationally simple for MVP.
- The hiring marketplace is Nepal-first.
- Marketplace trust is created through manual offline admin verification.
- Employer monetization should be clear and credit-based.
- Candidate privacy should be protected through preview-first and paid unlock access.
- User-generated content should not be forced into dual-language entry in MVP.
- Training/grooming and ad space are real business lines, but they should not overcomplicate the core hiring flow.

## Language Model

### Platform Language

The platform UI, navigation, system labels, and static sections should support both:

- `English`
- `Nepali`

### User-Generated Content

User-generated marketplace content is not language-restricted at input time.

- Employers can type job content in English or Nepali.
- Employees can type profile or CV text in English or Nepali.
- Whatever the user types should be stored as-is in the database.

The system itself is bilingual; the marketplace input is flexible.

## Account and Role Model

### Shared Auth System

The platform uses one auth/account system with role-based access control.

- `admin` is part of the same auth layer
- `employer` is part of the same auth layer
- `employee` is part of the same auth layer

A user may hold multiple roles if needed.

### Admin Access

All admins have full access. There is no admin tier split in MVP.

Even with equal access, all sensitive admin actions should be audit logged, including:

- verification changes
- manual credit adjustments
- refunds
- suspensions
- ad approvals
- training approvals

### Employer Entity Model

There is no multi-staff employer workspace in MVP.

Use a single employer identity model:

- one `user`
- one `employer_profile`
- one employer entity per profile

Employer type can be either:

- `company`
- `individual`

Subscriptions, jobs, boosts, ads, and credits belong to that employer profile.

## Verification Model

### Employer Verification

Employers must be manually verified by admin before they can publish jobs.

Verification is admin-driven and includes offline/manual contact.

Recommended employer verification checklist for MVP:

- account name
- phone number
- email
- primary contact person
- business or recruiter address/location
- offline/manual admin verification

For `company` employers:

- legal company name
- business registration number or supporting document
- company type
- website or social page if available
- hiring category / segment

For `individual` employers:

- legal full name
- government ID or equivalent proof
- reason for hiring / type of establishment represented

Employer verification statuses:

- `pending_review`
- `verified`
- `rejected`

Admin controls and updates these statuses.

### Employee Verification

Employees can sign up immediately and use the platform before verification.

Employee verification is also admin-driven and includes offline/manual contact.

Employees may:

- register
- create profile
- create or upload CV
- browse jobs
- apply to jobs

They may do this even while unverified.

Employee verification statuses:

- `unverified`
- `pending_review`
- `verified`
- `rejected`

Employees and employers are both verified by admin, but the employee side is intentionally more permissive in application flow.

## Employer Subscription and Credit System

### Plan Structure

Employer plans:

- `Free`
- `Pro`
- `Premium`
- `Enterprise`

`Free` is a limited trial.

`Pro` and `Premium` are the main self-serve paid plans.

`Enterprise` is contact-us / manually handled.

### Billing Terms

Supported billing terms:

- `monthly`
- `yearly`

The yearly plan means `12 months billed annually`.

### Credit Grant Rules

Subscription credits are granted month-by-month, including yearly plans.

Example:

- monthly plan: receive monthly credits once each month
- yearly plan: prepay for 12 months, but still receive the monthly credit allowance once each month for 12 months

Unused subscription credits roll over.

Unused one-time purchased credits also remain until used.

If a subscription ends and credits remain:

- leftover credits stay in the wallet
- paid-only plan access does not remain active

This separates `credit ownership` from `plan access`.

### Credit Wallet Model

Use one shared generic employer credit wallet, not separate balances per feature.

Credits are spent for:

- job publishing
- candidate unlocks / CV views
- boosts
- ad space

This avoids stranded balances and keeps monetization simple.

### Credit Source Types

Credits can enter the wallet from:

- free signup grant
- monthly subscription grant
- yearly subscription monthly grant
- one-time top-up purchase
- manual admin adjustment
- admin refund / correction

### Credit Deduction Rules

Credits are deducted when value is actually consumed:

- deduct job-post credits when a job moves from `draft` to `published`
- do not charge for draft saves
- do not charge again for normal job edits
- deduct CV-view credits only when a full candidate unlock happens for the first time
- do not charge again when the same employer reopens the same candidate later
- deduct boost credits when a boost is activated
- deduct ad credits when an ad placement is activated/purchased

If admin rejects a job before it goes live, refund the posting credit automatically. In the confirmed MVP flow, jobs do not require pre-approval, so this edge case is unlikely.

If a live job is later moderated or removed, no automatic refund is guaranteed. Admin can intervene manually.

### Credit Ledger

The platform must maintain a permanent credit ledger.

Suggested ledger reason categories:

- `free_signup_grant`
- `subscription_grant`
- `topup_purchase`
- `job_publish`
- `candidate_unlock_verified`
- `candidate_unlock_unverified`
- `boost_purchase`
- `ad_purchase`
- `admin_adjustment`
- `admin_refund`

The ledger should be auditable and support support/billing disputes cleanly.

## Free Plan Policy

The `Free` plan is intentionally limited.

It should:

- give a small one-time credit grant
- allow limited experimentation
- allow a small amount of short-duration publishing
- allow a very small number of candidate unlocks
- not provide a permanently useful hiring path

The Free plan does not include:

- boosts
- proactive candidate search

Once free credits are exhausted, the employer must:

- upgrade to a paid subscription
- or buy one-time credits

## Paid Plan Access Model

Plans differ by both:

- credit volume
- access level

### Free

- small one-time trial credits
- limited posting ability
- can receive inbound applications
- no boosts
- no candidate search

### Pro

- monthly credits
- candidate search access
- candidate unlock access
- boosts
- standard support

### Premium

- larger monthly credits
- candidate search access
- candidate unlock access
- boosts
- stronger visibility benefits
- better support / priority treatment later

### Enterprise

- contact-us pricing
- manual billing
- manual credit allocation
- manual support structure

### After Plan Expiry

If a paid plan expires:

- leftover credits remain
- employer falls back to Free-level feature access
- remaining credits can still be spent on Free-tier-permitted actions
- candidate search is removed
- boosts are removed as an available feature
- paid-only benefits are removed

If the employer renews a paid plan, those paid-only feature permissions return.

## Payment Model

### Supported Payment Modes

V1 supports both:

- online self-serve payment
- manual/admin-confirmed payment

Online self-serve is the default for:

- `Pro` and `Premium` subscription purchases
- one-time top-ups

Manual/admin-confirmed payment is intended for:

- `Enterprise`
- exceptional billing cases
- training seat confirmation when needed

### Payment Confirmation Rule

Credits are granted only after confirmed payment success.

Flow:

- create order/payment record
- mark it `pending`
- wait for confirmed payment success
- then grant credits or reserve training seat

Do not grant credits on initiated but unconfirmed payment.

### Currency

Self-serve billing is `NPR-only` in MVP.

Store money in minor units internally.

The payment provider is intentionally deferred.

## Refund Policy

Default refund posture is strict, with admin exceptions.

- one-time credits are generally non-refundable
- leftover subscription credits are non-refundable
- active ads are non-refundable once approved and started
- training payments may follow a cutoff-based cancellation rule

Admin may manually issue:

- credit adjustments
- wallet corrections
- money refunds

This applies in cases like:

- duplicate charge
- platform failure
- wrongful moderation
- delivery problem caused by THP

All exceptions should be logged.

## Job Posting Model

### Who Can Post Jobs

Only verified employers can publish jobs.

Admins may manage listings operationally, but normal marketplace posting is for employers.

### Publication Rule

There is no admin approval per job post.

If a verified employer has enough credits and publishes a job:

- credits are deducted
- the job goes live immediately

Admin may still moderate after publication.

### Job Lifecycle

Job statuses:

- `draft`
- `published`
- `paused`
- `closed`
- `expired`
- `removed_by_admin`

Credits are charged on `draft -> published`.

Employers may edit live jobs without being charged again for normal edits.

Boosts can only run on published jobs.

### Job Duration and Expiry

Jobs use preset duration options.

Confirmed direction:

- multiple preset expiry options
- shorter durations cost fewer credits
- longer durations cost more credits

Suggested presets discussed:

- `7 days`
- `15 days`
- `30 days`
- `60 days`

Exact pricing is deferred.

### Republishing

Employers may republish expired or closed jobs.

Republish behavior:

- creates a new posting cycle
- consumes fresh posting credits
- gets a new expiry date
- keeps previous applications attached to the old cycle
- does not merge old and new pipelines

### Hiring Goal vs Closure

Jobs should not auto-close when the number of hired candidates reaches the number of openings.

Reason:

- the platform still monetizes candidate unlocks / CV views
- the employer may still want applicants
- the job should remain live until:
  - employer closes it manually
  - or it expires

The system may track filled count internally and warn the employer, but it should not block further applications.

## Required Job Fields

At publish time, the following are required:

- job title
- employer identity derived from verified employer profile
- job category
- location
- employment type
- salary mode: exact or range
- salary value(s)
- job description
- key responsibilities
- requirements / qualifications
- application rule
- expiry duration option
- application deadline, if not simply derived from expiry
- number of openings

Contact information is not required on the job post.

Applications should flow through the platform.

### Salary Policy

Salary is required.

Allowed modes:

- exact salary
- salary range

Hidden salary is not part of MVP.

The salary currency model is aligned to Nepal-first operation.

## Location Model

The location model was intentionally deferred for MVP simplification.

Current MVP decision:

- use a single free-text location input field
- employers can type whatever they want

Structured Nepal-specific location fields may be added later.

## Application Eligibility Rules

Each job can define whether it accepts:

- `verified applicants only`
- `all applicants`

Employers can choose this at publish time and later edit it.

If the employer later changes the rule to `verified only`:

- existing unverified applicants stay in the pipeline
- no new unverified applications are accepted from that point forward

## Employee Side Product Model

### Employee Core Product Pricing

The employee side is free in V1 for core job-seeking features.

Free employee functionality includes:

- signup
- profile creation
- CV creation
- CV upload
- job browsing
- job apply
- application tracking

Potential future employee monetization may include:

- premium CV templates
- grooming/training
- featured profile
- certificates

But these are not part of the MVP charging model for employee job-seeking.

## Employee Profile Requirements

Before an employee can apply, require:

- full name
- phone number
- email
- current location
- preferred job category
- total experience level
- skills
- languages spoken
- education summary
- work history summary
- one active CV on the platform

Optional fields:

- profile photo
- expected salary
- training / certificates
- personal summary

## CV Model

### One Active CV Rule

An employee can store only one active CV on the platform at a time.

They may:

- create multiple versions locally using the CV generator
- download them to their own device

But inside the platform:

- only one CV is retained as the active current CV

If the employee creates or uploads a new CV:

- the new one becomes active
- the old one is replaced

### CV Creation Sources

An employee may:

- create a CV using the platform CV builder/template
- upload an external CV file

### Application Snapshot Rule

Every application must store a CV snapshot at the time of application.

This prevents later CV edits from rewriting what was originally submitted.

### Old CV Retention Rule

When an employee replaces the current CV:

- the previous CV stays retained for 60 days
- after 60 days it is deleted from the system
- this deletion happens regardless of employer access

Employers who had unlocked the candidate may:

- view the candidate's current live CV/profile
- view the older retained CV until its deletion date

After deletion:

- the old CV file is gone
- the application record remains
- the system may still show that an older CV existed but is no longer retained

This should be visible to employers with a notice such as:

- `Previous CV available until [date]`

### Employer Visibility Across CV Changes

If an employer has already unlocked the candidate:

- they can see the application snapshot
- they can see the current live CV
- they can see the older retained version until the retention window ends

The employer should not be charged again when the employee later updates the CV.

## Candidate Privacy and Discovery Model

### Searchability

Employee profiles are discoverable in employer search if:

- the employee is `verified`
- the employee is marked `searchable`

If the employee hides the profile:

- it will not appear in proactive search
- the employee may still apply directly to jobs
- already-unlocked employers do not lose access because of this change

Unverified candidates should not appear in public candidate search.

### Preview-First Access

Employers do not get full candidate data by default.

Before unlock, the employer sees limited preview information such as:

- experience summary
- skill summary
- verification state
- the exact unlock price for that candidate at that moment
- basic fit indicators

Before unlock, hidden details remain hidden, such as:

- full contact details
- full CV
- full personal details

### Unlock Model

Unlocking consumes credits once per employer per candidate.

Unlock behavior:

- the employer pays once
- access remains employer-wide for that candidate
- the same employer is not charged again from another job or search result
- a different employer must pay separately

Unlock access is employer-wide, not job-specific.

### Verification-Based Unlock Pricing

Verified and unverified candidates have different unlock costs.

Rule:

- verified candidate unlock costs more
- unverified candidate unlock costs less

Pricing is based on the candidate verification state at the moment of unlock.

If the candidate later changes verification state:

- no retroactive repricing
- no additional charge

### Direct Unlock from Search

Paid employers can unlock a candidate directly from candidate search, even if the candidate has never applied to their jobs.

Candidate search is therefore a real sourcing feature, not just a browsing feature.

### Employee Notification of Unlock

When an employer unlocks/views a candidate:

- the employee should be notified
- the employee should see the exact employer identity

It should not be anonymous.

## Candidate Search Access Rules

Proactive candidate search is a paid feature.

Access model:

- Free employers do not get candidate search
- Pro employers do
- Premium employers do
- Enterprise can under manual terms

Even for paid employers:

- full candidate reveal still requires unlock credits

## Application Model

### Apply Rule

An employee can apply to a job even if unverified, unless the job is configured to accept verified candidates only.

### Duplicate Application Rule

Use one active application per employee per job posting cycle.

Rules:

- one employee can apply only once to one job cycle
- if the job is republished later as a new cycle, the employee may apply again
- no automatic reapply flow in MVP

### Apply Flow

Use a final confirmation step before application submission.

The user should see:

- the selected job
- the current active CV that will be submitted
- the relevant profile data being sent

Then the employee confirms and the application snapshot is created.

This keeps the flow low-friction but reduces mistakes.

### No Custom Screening Questions

V1 does not include employer-specific custom application questions.

Applications are based on:

- employee profile
- active CV snapshot
- optional short cover note

### No Employee Withdrawal in V1

Employees cannot withdraw applications in MVP.

Application states remain entirely employer/admin controlled after submission.

## Application Status Pipeline

The confirmed application status pipeline is:

- `submitted`
- `shortlisted`
- `interviewed`
- `hired`
- `rejected`

Additional rules:

- rejection is allowed from any non-terminal stage
- only `interviewed -> hired` results in hire
- `hired` and `rejected` are terminal

Employer private notes are allowed.

Employees should see status updates but not private notes.

Status transitions should be timestamped and actor-logged.

## Candidate Contact Model

There is no in-app chat in V1.

After unlock, the employer gets:

- full contact details
- full profile visibility
- viewable CV
- downloadable CV

Hiring communication then moves off-platform as needed:

- phone
- email
- WhatsApp
- offline coordination

This keeps the paid action clear: unlocking candidate details.

## Job Ranking and Boosting

### Ranking Model

Public job ranking in V1:

- `Urgent` boosted jobs first
- then `Featured` boosted jobs
- then normal jobs by newest first

Within filters, relevance may be influenced by:

- category match
- location
- employment type

Expired, closed, paused, or removed jobs do not appear in public search.

### Boost Types

Boost tiers:

- `Normal`
- `Featured`
- `Urgent`

Boost effect:

- stronger ranking
- visibility badges
- possible homepage / featured placement depending on tier

### Boost Duration

Boosts use preset durations:

- `3 days`
- `7 days`
- `15 days`

Exact credit costs are deferred.

### Boost Rules

- boost only applies to published jobs
- boost ends when its duration ends
- boost cannot outlive the job
- if the job expires, the boost ends
- if the employer closes the job early, no automatic refund is guaranteed

## Ad Product

### Product Separation

Ad space is a separate product line from the normal hiring marketplace.

However, it still uses the same generic credit economy.

This means:

- a current employer may spend credits on ads
- a separate advertiser may also buy ads

But ads do not grant access to candidate data.

### Advertiser Model

Separate advertisers are allowed.

They need lighter verification than normal employers.

Suggested advertiser verification inputs:

- advertiser account name
- email
- phone
- company or brand name
- billing/contact person
- destination URL or campaign objective
- offline/admin review before first approval

This advertiser flow does not create hiring privileges.

### Ad Access Boundaries

Buying ad space does not grant:

- candidate search
- CV unlock rights
- applicant access
- employer verification bypass

Ads are strictly a visibility product.

### Ad Approval

All ad creatives require admin review and approval before going live.

This is stricter than normal job posting.

### Ad Placements

V1 placements:

- homepage hero/banner
- homepage mid-page section
- job listing page sidebar or inline slot
- job detail page slot

The training and grooming section is not self-serve advertiser inventory in MVP. That surface remains admin-controlled.

Pricing should vary by:

- placement
- duration

Higher visibility placements cost more.

### Ad Inventory Model

V1 uses exclusive ad slots, not rotating ads.

Meaning:

- one slot
- one advertiser
- one booked duration

This keeps scheduling, sales, analytics, and fairness simple.

### Ad Duration Model

Ads use preset durations such as:

- `3 days`
- `7 days`
- `15 days`
- `30 days`

Exact pricing is deferred.

### Ad Destination Types

Ads may point to:

- internal THP destinations
- external destinations

Internal destination examples:

- THP page
- THP training page
- THP form

External destination examples:

- foreign recruitment landing page
- visa information page
- external employer website

Outbound destinations require admin review.

### Ad Sales Model

V1 ads are sold by:

- placement
- duration

They are not sold with guaranteed:

- impressions
- clicks
- applications

Analytics are reporting, not contractual guarantees.

Exact analytics fields are deferred.

## Training and Grooming Product

Training and grooming is an admin-only operational product in MVP.

### Ownership

- only admin creates training/grooming posts
- these appear in relevant sections of the website
- employees can apply to them

### Nature of Training

The training model is primarily:

- offline
- off-site
- admin-coordinated

This is not an online course engine in MVP.

### Capacity Model

Training sessions have limited capacity.

### Application and Reservation Flow

Recommended and confirmed flow:

- employee submits interest/application
- admin reviews
- admin contacts offline
- admin marks `approved_pending_payment`
- seat is reserved only after payment is confirmed
- if full, later applicants go to waitlist

Training payments are part of the operational model, but the detailed payment provider and cancellation rules remain deferred beyond the high-level refund posture.

### Training Notifications

Employees should be notified about training/grooming posts.

Admin may also use this section as an internal promotional content surface for employee development opportunities.

## Notification Model

V1 notifications should use:

- in-app notifications for most product events
- email for critical or transactional events

Examples include:

- employer verification updates
- employee verification updates
- new application events
- application status changes
- training announcements
- training approval/payment confirmation
- candidate unlock/view notifications

SMS and WhatsApp automation are not part of MVP.

## Suspension and Moderation Policy

If an employer is suspended or verification is revoked:

- live jobs are paused immediately
- active ads stop immediately
- candidate search access is removed immediately
- new applications should stop

What remains stored:

- application history
- unlock history
- credit ledger
- payment history
- account records

Leftover credits remain in the wallet but cannot be used while suspended.

Admin may later:

- restore access
- or permanently ban the account

Refunds are handled manually on a case-by-case basis.

## Nepal Scope

The MVP hiring marketplace is Nepal-only.

This means:

- jobs and employees are Nepal-first
- self-serve billing is NPR-only
- foreign companies do not use the normal hiring marketplace in MVP

### Foreign Companies

Foreign companies that want Nepali talent should use:

- ad space

They are not part of the normal verified employer hiring flow in MVP.

## Public Employer Identity

Public job listings should show employer identity by default.

Anonymous or confidential job posting is not part of MVP.

This supports trust and reduces scam risk.

## Deferred MVP Decisions

The following items are intentionally deferred and should not block MVP planning:

- exact credit amounts per plan
- exact job duration credit costs
- exact verified vs unverified unlock credit costs
- exact boost costs
- exact ad placement costs
- exact payment provider
- exact ad analytics field set
- structured location model beyond free-text input

These are pricing/configuration details, not blockers to the current product logic.

## MVP Boundary Summary

### In Scope for MVP

- bilingual platform UI/system content
- shared auth with admin/employer/employee roles
- manual admin verification for employers and employees
- employer subscriptions and one-time credit purchases
- generic employer credit wallet
- job publishing with duration-based cost
- candidate unlock monetization
- verification-based unlock pricing
- paid candidate search
- boosts
- ad space as separate product flow
- admin-only training/grooming product
- in-app notifications
- critical email notifications
- one active CV per employee
- application snapshots
- employer candidate unlock persistence
- Nepal-first hiring marketplace

### Explicitly Not in MVP

- in-app employer/employee chat
- custom application screening questions
- anonymous job posting
- foreign-company participation in the standard hiring flow
- guaranteed ad delivery contracts
- fully structured Nepal location taxonomy
- multi-staff employer workspace
- always-on paid employee monetization for job seeking
- online course engine for training/grooming

## Recommended Next Documents

This research document should now feed into:

- product requirements document
- MVP feature breakdown by role
- data model / schema design
- permissions matrix
- admin operations playbook
- billing and ledger design
- notification/event map

## Final Note

This document captures the full product understanding established so far. Where the conversation intentionally left pricing, provider choice, or analytics granularity open, those items are marked as deferred rather than guessed.
