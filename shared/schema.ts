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
