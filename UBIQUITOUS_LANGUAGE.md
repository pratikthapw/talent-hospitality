# Ubiquitous Language

## People and identities

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **User** | An authentication identity in the system that can hold one or more roles. | Account, login |
| **Admin** | A platform operator with full administrative access. | Super admin, operator |
| **Employer** | A hiring-side participant that seeks talent through THP. | Recruiter account, company account |
| **Employer Profile** | The hiring entity owned by one user and used for jobs, credits, boosts, and ads. | Company, workspace, employer account |
| **Employee** | A job-seeking participant who maintains a profile and applies to jobs. | Job seeker, candidate account |
| **Candidate** | An employee viewed from the employer's hiring context such as search or applications. | Applicant profile, CV owner |
| **Advertiser** | An entity that buys ad placements on THP, whether it is an employer or a separate ad-only account. | Sponsor, ad buyer |

## Verification and status

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Employer Verification** | The admin-controlled process that approves an employer to publish jobs. | Employer KYC, approval call |
| **Employee Verification** | The admin-controlled process that marks an employee as verified after manual review. | Candidate KYC, employee approval |
| **Verified Employer** | An employer allowed to publish jobs immediately after spending credits. | Approved company, active recruiter |
| **Verified Employee** | An employee whose profile has passed manual admin verification. | Approved candidate |
| **Verification Status** | The trust state of an employer or employee record. | Review state, approval flag |
| **Suspension** | An admin action that freezes an employer's active hiring and ad activity without deleting records. | Ban, disable |

## Billing and monetization

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Plan** | A subscription tier that controls credit grants and paid feature access. | Package, membership |
| **Billing Term** | The charging interval for a paid plan. | Renewal type, duration |
| **Credit Wallet** | The shared balance of spendable credits attached to an employer profile. | Points, tokens, balance bucket |
| **Credit Grant** | A positive credit event created by signup, subscription, top-up, or admin action. | Credit issue, recharge |
| **Top-up** | A one-time credit purchase added to the credit wallet. | One-time package, extra credits |
| **Credit Ledger** | The permanent audit trail of all credit additions and deductions. | Credit history, wallet log |
| **Paid Feature Access** | The non-credit entitlement provided by an active paid plan such as candidate search. | Premium mode, plan unlock |
| **Unlock Cost** | The credit price to reveal a candidate's full details. | CV view cost, profile view cost |

## Hiring marketplace

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Job** | A hiring listing published by a verified employer. | Job post, listing, vacancy |
| **Draft Job** | A job being prepared that has not consumed publishing credits yet. | Unpublished job |
| **Published Job** | A live job visible to employees and eligible to receive applications. | Active listing, live post |
| **Job Duration** | The preset active period purchased for a job at publish time. | Expiry option, listing term |
| **Job Posting Cycle** | One live run of a job from publish to close or expiry. | Republishing round, campaign |
| **Republish** | The act of creating a new job posting cycle from an expired or closed job. | Reopen, repost |
| **Application Rule** | The job-level setting that allows either all applicants or verified applicants only. | Eligibility rule, verification filter |
| **Boost** | A paid visibility upgrade applied to a published job for a preset duration. | Promotion, featured add-on |
| **Featured Boost** | A mid-tier boost that lifts ranking and adds visible emphasis. | Featured listing |
| **Urgent Boost** | A high-tier boost that gives stronger ranking and urgency treatment. | Urgent hiring boost |

## Candidate discovery and applications

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Candidate Search** | The paid employer feature for browsing proactively discoverable verified candidates. | Talent database, profile browsing |
| **Candidate Preview** | The limited pre-unlock view of a candidate shown in search or applications. | Hidden profile, teaser card |
| **Candidate Unlock** | The one-time employer action that reveals a candidate's full profile, contact details, and CV. | CV view, profile reveal, contact reveal |
| **Unlock Scope** | The rule that one employer unlock pays once and stays valid across all contexts for that candidate. | Per-job unlock, repeat CV view |
| **Application** | A candidate's submission to one job during one job posting cycle. | Job application, submission |
| **Application Snapshot** | The frozen copy of the active CV and relevant profile data submitted with an application. | Submitted CV, historical CV |
| **Application Status** | The employer-managed state of an application in the hiring pipeline. | Pipeline stage, candidate stage |
| **Shortlisted Application** | An application moved forward for deeper consideration. | Shortlist candidate |
| **Interviewed Application** | An application that has reached the interview stage. | Interview stage |
| **Hired Application** | A terminal application status showing the candidate was selected. | Final hire |
| **Rejected Application** | A terminal application status showing the candidate was not selected. | Declined candidate |

## Employee profile and CV

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Employee Profile** | The structured job-seeker record used for search, applications, and verification. | Candidate profile, resume profile |
| **Active CV** | The single current CV stored on the platform for an employee. | Current resume, latest CV |
| **CV Replacement** | The act of making a new CV the active CV on the platform. | CV overwrite, new upload |
| **CV Retention Window** | The 60-day period during which a replaced CV remains temporarily available before deletion. | Old CV expiry, archive period |
| **Search Visibility** | The employee-controlled setting that determines whether the profile appears in candidate search. | Public profile, discoverability |

## Ads and promotions

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Ad Product** | The separate visibility business line for paid placements on THP. | Advertising system, sponsor system |
| **Ad Placement** | A specific inventory slot such as homepage hero or job page sidebar. | Ad space, slot |
| **Exclusive Slot** | An ad placement reserved by one advertiser for one booked duration. | Rotating banner, shared inventory |
| **Ad Booking** | A confirmed purchase of one placement for one duration. | Ad order, campaign reservation |
| **Ad Creative** | The media and copy submitted for an ad placement. | Banner, ad asset |
| **Ad Destination** | The internal or external URL or THP page opened from an ad. | CTA link, landing page |
| **Ad Approval** | The admin review step required before an ad goes live. | Ad moderation, ad verification |

## Training and grooming

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Training Session** | An admin-created off-platform training or grooming offering with limited capacity. | Bootcamp, grooming post, training post |
| **Training Application** | An employee's request to join a training session. | Session registration, interest form |
| **Approved Pending Payment** | The training application state where admin approved the applicant but the seat is not reserved yet. | Reserved, pre-confirmed |
| **Confirmed Seat** | A paid and reserved place in a training session. | Final registration, booked spot |
| **Waitlist** | The queue of training applicants held after session capacity is full. | Overflow list |

## Relationships

- An **Employer Profile** belongs to exactly one **User** in MVP.
- A **User** may hold both **Employer** and **Employee** roles.
- A **Verified Employer** may publish many **Jobs**.
- A **Job** has one **Job Duration** and belongs to one **Job Posting Cycle**.
- A **Republish** creates a new **Job Posting Cycle** for the same logical **Job** content.
- An **Employee** owns exactly one **Active CV** at a time.
- A **CV Replacement** starts one **CV Retention Window** for the previous CV.
- An **Application** belongs to exactly one **Job Posting Cycle** and one **Employee**.
- An **Application Snapshot** belongs to exactly one **Application**.
- A **Candidate Unlock** belongs to one **Employer Profile** and one **Candidate**.
- One **Candidate Unlock** remains valid across many **Applications** and **Candidate Search** views for that same employer.
- A **Plan** grants **Credit Grants** and **Paid Feature Access**.
- A **Top-up** creates a **Credit Grant** but does not create **Paid Feature Access**.
- An **Ad Booking** reserves one **Exclusive Slot** in one **Ad Placement** for one duration.
- A **Training Session** has many **Training Applications** but only up to its capacity in **Confirmed Seats**.

## Example dialogue

> **Dev:** "When an **Employer** opens a **Candidate Preview**, do we deduct credits immediately?"
>
> **Domain expert:** "No. Credits are only deducted on **Candidate Unlock**, not on preview."
>
> **Dev:** "If the same **Employer Profile** sees that **Candidate** again from another **Application**, do we charge a second unlock?"
>
> **Domain expert:** "No. The **Unlock Scope** is employer-wide per candidate, so one **Candidate Unlock** covers every later view by that employer."
>
> **Dev:** "And if the **Employee** uploads a new **Active CV**, does the old one disappear right away?"
>
> **Domain expert:** "No. A **CV Replacement** starts a 60-day **CV Retention Window**, while the **Application Snapshot** remains the submitted record for that application."

## Flagged ambiguities

- "account" was used to mean both **User** and **Employer Profile**; use **User** for authentication identity and **Employer Profile** for the hiring entity.
- "employee" was once used in a sentence that described job posting; use **Employer** for the job-publishing side and **Employee** for the job-seeking side.
- "CV view", "profile view", "contact reveal", and "unlock" were used for the same paid action; use **Candidate Unlock** as the canonical term.
- "job post", "job listing", and "job" were used interchangeably; use **Job** as the main term and reserve **Published Job** when the live state matters.
- "ad", "ads", "ad space", and "placement" were mixed together; use **Ad Product** for the business line, **Ad Placement** for inventory, and **Ad Booking** for the purchased reservation.
- "advertiser" should not imply a separate hiring role; an **Advertiser** can be either an **Employer** using credits for ads or a separate ad-only account.
- "subscription", "credits", and paid capability were sometimes conflated; use **Credit Wallet** for stored spendable value and **Paid Feature Access** for permissions tied to an active paid plan.
- "training post", "grooming session", and "bootcamp" referred to the same admin-run offering; use **Training Session** as the canonical term.
- "training section" was briefly described like ad inventory; treat **Training Session** as admin-owned content, not an **Ad Placement** in the advertiser product.
- "verified employee" and "candidate" overlap but are not identical; use **Employee** for the role and **Candidate** when discussing that employee from the employer hiring context.
- "yearly subscription" was described once as a two-week or twelve-month concept in speech; the canonical meaning is a **yearly Billing Term** of 12 months billed annually.
