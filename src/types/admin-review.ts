export type ManualReviewIssueType =
  | "address_confidence"
  | "unclear_point"
  | "parcel_mismatch"
  | "payment_issue"
  | "weather_safety"
  | "no_candidate_point";

export type ManualReviewRiskLevel = "low" | "medium" | "high";

export type ManualReviewActionState =
  | "open"
  | "approved"
  | "changes_requested"
  | "cancelled"
  | "operator_assigned";

export type AdminManualReviewItem = {
  id: string;
  orderId: string;
  issueType: ManualReviewIssueType;
  issueLabel: string;
  shortExplanation: string;
  riskLevel: ManualReviewRiskLevel;
  recommendedAction: string;
  createdAt: string;
  clientLabel: string;
  routeSummary: string;
};
