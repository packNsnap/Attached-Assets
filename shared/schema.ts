import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
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
  roleName: text("role_name").notNull(),
  difficulty: text("difficulty").notNull(),
  skills: text("skills").array().notNull(),
  questions: text("questions").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSkillsTestSchema = createInsertSchema(skillsTests).omit({
  id: true,
  createdAt: true,
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
