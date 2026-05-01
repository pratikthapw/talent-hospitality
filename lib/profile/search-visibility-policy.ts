/**
 * Search Visibility Policy
 *
 * Determines whether an employee is eligible for Candidate Search.
 * Eligibility requires BOTH:
 * 1. verificationStatus === "verified" (admin-verified employee)
 * 2. searchVisible === true (employee opted into search)
 */

type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

export interface SearchEligibilityResult {
  isEligible: boolean;
  searchVisible: boolean;
  verificationStatus: VerificationStatus;
  explanation: string;
}

export function isEligibleForCandidateSearch(
  verificationStatus: VerificationStatus,
  searchVisible: boolean,
): boolean {
  return verificationStatus === "verified" && searchVisible;
}

export function getSearchEligibility(
  verificationStatus: VerificationStatus,
  searchVisible: boolean,
): SearchEligibilityResult {
  const isEligible = isEligibleForCandidateSearch(verificationStatus, searchVisible);
  const explanation = getExplanation(verificationStatus, searchVisible);

  return { isEligible, searchVisible, verificationStatus, explanation };
}

function getExplanation(
  verificationStatus: VerificationStatus,
  searchVisible: boolean,
): string {
  // Case 1: Verified and visible — fully discoverable
  if (verificationStatus === "verified" && searchVisible) {
    return "Your profile is visible to employers in candidate search. You can still apply to jobs directly.";
  }

  // Case 2: Verified but hidden — employee chose to hide
  if (verificationStatus === "verified" && !searchVisible) {
    return "Your profile is hidden from candidate search. You can still apply to jobs directly.";
  }

  // Case 3: Unverified — even if visibility is on, they remain hidden
  if (verificationStatus === "unverified") {
    return searchVisible
      ? "Your profile is not yet verified. Verification is required before employers can find you in candidate search, even with visibility enabled."
      : "Your profile is not yet verified. Complete verification and enable search visibility to appear in candidate search.";
  }

  // Case 4: Pending review
  if (verificationStatus === "pending_review") {
    return "Your verification is under review. Once verified, enable search visibility to appear in candidate search.";
  }

  // Case 5: Rejected
  if (verificationStatus === "rejected") {
    return "Your verification was not approved. You can still apply to jobs directly, but will not appear in candidate search.";
  }

  return "Contact support if you have questions about your search visibility.";
}
