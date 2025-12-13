/**
 * Email templates for reference requests in the Reference Check module
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: (candidateName: string) => string;
  body: (candidateName: string, candidateRole: string) => string;
}

export const REFERENCE_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "formal",
    name: "Professional & Formal",
    subject: (candidateName) => `Reference Request for ${candidateName}`,
    body: (candidateName, candidateRole) => `Dear Hiring Manager,

We are conducting reference checks for ${candidateName}, who has applied for a ${candidateRole} position with our organization.

As a previous colleague or supervisor of the candidate, we would greatly appreciate your feedback regarding their professional qualifications, work ethic, and overall performance.

Your honest assessment would help us make an informed hiring decision. Please reply to this email with your reference details and any relevant comments about the candidate's strengths and areas of expertise.

Thank you for your time and assistance.

Best regards,
Hiring Team`,
  },
  {
    id: "friendly",
    name: "Friendly & Conversational",
    subject: (candidateName) => `Quick Reference Check - ${candidateName}`,
    body: (candidateName, candidateRole) => `Hi,

Hope you're doing well! We're currently evaluating ${candidateName} for a ${candidateRole} role and would love to hear your thoughts about working with them.

If you could spare a few minutes to share your experience with ${candidateName}, including what they excel at and any areas where they've grown, that would be incredibly helpful!

Your insights really matter to us. Feel free to reply directly to this email.

Thanks so much!`,
  },
  {
    id: "detailed",
    name: "Detailed Request",
    subject: (candidateName) => `Reference Information Needed for ${candidateName}`,
    body: (candidateName, candidateRole) => `Dear Reference,

We are pleased to inform you that ${candidateName} has listed you as a professional reference for a ${candidateRole} position with our company.

To complete our hiring process, we would appreciate your input on the following:

1. How long have you worked with ${candidateName}, and in what capacity?
2. What are their key strengths and professional competencies?
3. How would you describe their communication and teamwork skills?
4. What areas has the candidate shown growth or improvement in?
5. Would you recommend ${candidateName} for this role?

Your detailed feedback will be kept confidential and used solely for evaluation purposes. Please respond at your earliest convenience.

Thank you for your assistance in this important decision.

Best regards,
Hiring Team`,
  },
];

/**
 * Generate a mailto link for a reference email template
 */
export function generateMailtoLink(
  template: EmailTemplate,
  recipientEmail: string,
  candidateName: string,
  candidateRole: string
): string {
  const subject = encodeURIComponent(template.subject(candidateName));
  const body = encodeURIComponent(template.body(candidateName, candidateRole));
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

/**
 * Generate Google Calendar event URL for opening in Gmail
 */
export function generateGmailComposeLink(
  template: EmailTemplate,
  recipientEmail: string,
  candidateName: string,
  candidateRole: string
): string {
  const subject = encodeURIComponent(template.subject(candidateName));
  const body = encodeURIComponent(template.body(candidateName, candidateRole));
  // Gmail compose URL
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${subject}&body=${body}`;
}
