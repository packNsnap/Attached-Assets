import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  level: text("level").notNull(),
  location: text("location").notNull(),
  skills: text("skills").array().notNull(),
  description: text("description").notNull(),
  salaryMin: integer("salary_min").notNull(),
  salaryMax: integer("salary_max").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  role: text("role").notNull(),
  stage: text("stage").notNull().default("Applied"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  appliedDate: text("applied_date").notNull(),
  jobId: varchar("job_id"),
  resumeUrl: text("resume_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  source: text("source"),
  lastTestScore: integer("last_test_score"),
  notesLastViewedAt: timestamp("notes_last_viewed_at"),
  isActive: text("is_active").notNull().default("active"),
  isArchived: text("is_archived").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(),
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export const candidateNotes = pgTable("candidate_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  noteType: text("note_type").notNull().default("general"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCandidateNoteSchema = createInsertSchema(candidateNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertCandidateNote = z.infer<typeof insertCandidateNoteSchema>;
export type CandidateNote = typeof candidateNotes.$inferSelect;

export const candidateDocuments = pgTable("candidate_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  documentType: text("document_type").notNull(),
  resumeText: text("resume_text"),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

export const insertCandidateDocumentSchema = createInsertSchema(candidateDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertCandidateDocument = z.infer<typeof insertCandidateDocumentSchema>;
export type CandidateDocument = typeof candidateDocuments.$inferSelect;

export const interviewNotes = pgTable("interview_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull(),
  questionId: text("question_id").notNull(),
  score: integer("score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertInterviewNoteSchema = createInsertSchema(interviewNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertInterviewNote = z.infer<typeof insertInterviewNoteSchema>;
export type InterviewNote = typeof interviewNotes.$inferSelect;

export const skillsTestRecommendations = pgTable("skills_test_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id"),
  candidateName: text("candidate_name").notNull(),
  jobId: varchar("job_id").notNull(),
  jobTitle: text("job_title").notNull(),
  skillsNeeded: text("skills_needed").array().notNull(),
  fitScore: integer("fit_score").notNull(),
  status: text("status").notNull().default("pending"),
  testId: varchar("test_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSkillsTestRecommendationSchema = createInsertSchema(skillsTestRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertSkillsTestRecommendation = z.infer<typeof insertSkillsTestRecommendationSchema>;
export type SkillsTestRecommendation = typeof skillsTestRecommendations.$inferSelect;

export const interviewRecommendations = pgTable("interview_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id"),
  candidateName: text("candidate_name").notNull(),
  jobTitle: text("job_title").notNull(),
  testScore: integer("test_score").notNull(),
  strengths: text("strengths").array().notNull(),
  weaknesses: text("weaknesses").array().notNull(),
  recommendedQuestions: text("recommended_questions").array().notNull(),
  status: text("status").notNull().default("pending"),
  interviewScore: integer("interview_score"),
  interviewSummary: text("interview_summary"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertInterviewRecommendationSchema = createInsertSchema(interviewRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertInterviewRecommendation = z.infer<typeof insertInterviewRecommendationSchema>;
export type InterviewRecommendation = typeof interviewRecommendations.$inferSelect;

export const resumeAnalysis = pgTable("resume_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull(),
  jobId: varchar("job_id"),
  jobTitle: text("job_title"),
  fitScore: integer("fit_score").notNull(),
  logicScore: integer("logic_score").notNull(),
  matchedSkills: text("matched_skills").array().notNull(),
  missingSkills: text("missing_skills").array().notNull(),
  extraSkills: text("extra_skills").array().notNull(),
  findings: text("findings").notNull(),
  summary: text("summary").notNull(),
  authenticitySignals: text("authenticity_signals"),
  authenticityScore: integer("authenticity_score"),
  fraudFlags: text("fraud_flags"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertResumeAnalysisSchema = createInsertSchema(resumeAnalysis).omit({
  id: true,
  createdAt: true,
});

export type InsertResumeAnalysis = z.infer<typeof insertResumeAnalysisSchema>;
export type ResumeAnalysis = typeof resumeAnalysis.$inferSelect;

export const skillsTests = pgTable("skills_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  roleName: text("role_name").notNull(),
  difficulty: text("difficulty").notNull(),
  skills: text("skills").array().notNull(),
  questions: text("questions").notNull(),
  timePerQuestion: integer("time_per_question").notNull().default(25),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSkillsTestSchema = createInsertSchema(skillsTests).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(),
});

export type InsertSkillsTest = z.infer<typeof insertSkillsTestSchema>;
export type SkillsTest = typeof skillsTests.$inferSelect;

export const skillsTestInvitations = pgTable("skills_test_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull(),
  candidateId: varchar("candidate_id"),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  jobTitle: text("job_title").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  score: integer("score"),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSkillsTestInvitationSchema = createInsertSchema(skillsTestInvitations).omit({
  id: true,
  createdAt: true,
});

export type InsertSkillsTestInvitation = z.infer<typeof insertSkillsTestInvitationSchema>;
export type SkillsTestInvitation = typeof skillsTestInvitations.$inferSelect;

export const skillsTestResponses = pgTable("skills_test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  answer: text("answer").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSkillsTestResponseSchema = createInsertSchema(skillsTestResponses).omit({
  id: true,
  createdAt: true,
});

export type InsertSkillsTestResponse = z.infer<typeof insertSkillsTestResponseSchema>;
export type SkillsTestResponse = typeof skillsTestResponses.$inferSelect;

// Subscription plan types
export const PLAN_LIMITS = {
  starter: { jobs: 2, candidates: 4, aiActionsPerService: 2 },
  eco: { jobs: 10, candidates: 25, aiActionsPerService: 3 },
  pro: { jobs: 25, candidates: 100, aiActionsPerService: 4 },
  enterprise: { jobs: -1, candidates: -1, aiActionsPerService: -1 }, // -1 = unlimited
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  plan: text("plan").notNull().default("starter"),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull().default(sql`now()`),
  currentPeriodEnd: timestamp("current_period_end").notNull().default(sql`now() + interval '1 month'`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Usage tracking per user per month
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  jobsCreated: integer("jobs_created").notNull().default(0),
  candidatesAdded: integer("candidates_added").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  createdAt: true,
});

export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;

// AI action usage tracking per candidate per service
export const aiActionUsage = pgTable("ai_action_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  candidateId: varchar("candidate_id").notNull(),
  serviceType: text("service_type").notNull(), // 'resume_analysis', 'skills_test', 'interview', 'job_description'
  actionCount: integer("action_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAiActionUsageSchema = createInsertSchema(aiActionUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertAiActionUsage = z.infer<typeof insertAiActionUsageSchema>;
export type AiActionUsage = typeof aiActionUsage.$inferSelect;

export const scheduledInterviews = pgTable("scheduled_interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  candidateId: varchar("candidate_id").notNull(),
  candidateName: text("candidate_name").notNull(),
  jobTitle: text("job_title").notNull(),
  interviewType: text("interview_type").notNull().default("video"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(60),
  interviewerName: text("interviewer_name"),
  interviewerEmail: text("interviewer_email"),
  location: text("location"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"),
  recommendationId: varchar("recommendation_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertScheduledInterviewSchema = createInsertSchema(scheduledInterviews).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(),
});

export type InsertScheduledInterview = z.infer<typeof insertScheduledInterviewSchema>;
export type ScheduledInterview = typeof scheduledInterviews.$inferSelect;

export const referenceRequests = pgTable("reference_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  candidateId: varchar("candidate_id"),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email"),
  positionAppliedFor: text("position_applied_for").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  referenceName: text("reference_name"),
  referenceEmail: text("reference_email"),
  referenceRelationship: text("reference_relationship"),
  consentGiven: text("consent_given").default("false"),
  submittedAt: timestamp("submitted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertReferenceRequestSchema = createInsertSchema(referenceRequests).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
});

export type InsertReferenceRequest = z.infer<typeof insertReferenceRequestSchema>;
export type ReferenceRequest = typeof referenceRequests.$inferSelect;

