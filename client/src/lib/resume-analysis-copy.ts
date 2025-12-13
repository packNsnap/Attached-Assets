/**
 * Resume Analysis Copy Map
 * Centralized strings for the Resume Review Worksheet
 */

export const RESUME_ANALYSIS_COPY = {
  // Modal and document titles
  modalTitle: "Resume Review Worksheet",
  pdfTitle: "Resume Review Worksheet",
  
  // Top-level disclaimers
  headerDisclaimer: "Candidate-provided resume review only. Not a background check. Not a verification of claims.",
  pdfDisclaimer: "Candidate-provided document review only. Not a background check. Not a verification of claims. Do not use as the sole basis for an employment decision.",
  
  // Score labels
  fitScoreLabel: "Job Match Coverage",
  reviewPriorityLabel: "Review Priority",
  priorityHelper: "Based on resume consistency signals",
  
  // Priority levels (based on logicScore thresholds)
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  
  // Fit score labels (unchanged from backend output, but for reference)
  fitGood: "Good Fit",
  fitPartial: "Partial Fit",
  fitLow: "Low Fit",
  
  // Section titles
  suggestedFollowUps: "Suggested Follow-ups",
  whyNeedsFollowUp: "Why this needs follow-up:",
  suggestedQuestions: "Suggested questions:",
  timelineConsistency: "Timeline Consistency",
  progressionPattern: "Progression Pattern",
  tenurePattern: "Tenure Pattern",
  strengths: "Strengths",
  needsFollowUp: "Needs Follow-up",
  aiWritingSignals: "AI-like Writing Signals",
  suggestedFollowUpTitle: "Suggested follow-up",
  
  // Tab names (mostly unchanged)
  tabOverview: "Overview",
  tabProfile: "Profile",
  tabTimeline: "Timeline",
  tabFlags: "Flags",
  tabSkills: "Skills",
  tabAuthenticity: "Authenticity",
  tabReport: "Report",
  
  // Button labels
  saveNotesBtn: "Save Notes",
  downloadNotesBtn: "Download Interview Prep Notes",
  openFollowUpsBtn: "Open Follow-ups",
  
  // File naming
  getPdfFilename: (candidateName: string): string => {
    const sanitized = candidateName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    return `Resume_Review_Worksheet_${sanitized}.pdf`;
  },
  
  // Text replacements for content
  textReplacements: {
    "likely fake": "inconsistency indicators",
    "fabricated": "inconsistency indicators",
    "fraudulent": "needs clarification",
    "lack of commitment": "short tenures may warrant clarification",
    "detrimental": "",
    "Final Recommendation": "Suggested Follow-ups",
    "likely_fraudulent": "needs clarification",
  },
  
  // Helper functions for dynamic labels
  getPriorityLevel: (riskScore: number): string => {
    if (riskScore <= 33) return "Low";
    if (riskScore <= 66) return "Medium";
    return "High";
  },
  
  getPriorityColor: (riskScore: number): string => {
    if (riskScore <= 33) return "text-green-600";
    if (riskScore <= 66) return "text-yellow-600";
    return "text-red-600";
  },
};
