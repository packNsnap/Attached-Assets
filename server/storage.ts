import { 
  type User, 
  type InsertUser,
  type Job,
  type InsertJob,
  type Candidate,
  type InsertCandidate,
  type InterviewNote,
  type InsertInterviewNote,
  type SkillsTestRecommendation,
  type InsertSkillsTestRecommendation,
  type InterviewRecommendation,
  type InsertInterviewRecommendation,
  type CandidateNote,
  type InsertCandidateNote,
  type CandidateDocument,
  type InsertCandidateDocument,
  type ResumeAnalysis,
  type InsertResumeAnalysis,
  users,
  jobs,
  candidates,
  interviewNotes,
  skillsTestRecommendations,
  interviewRecommendations,
  candidateNotes,
  candidateDocuments,
  resumeAnalysis
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, desc } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createJob(job: InsertJob): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidatesByJobId(jobId: string): Promise<Candidate[]>;
  updateCandidateStage(id: string, stage: string): Promise<Candidate | undefined>;
  updateCandidateJobId(id: string, jobId: string | null): Promise<Candidate | undefined>;
  
  getJobsWithCandidateCounts(): Promise<(Job & { candidateCount: number })[]>;
  
  createInterviewNote(note: InsertInterviewNote): Promise<InterviewNote>;
  getInterviewNotesByCandidateId(candidateId: string): Promise<InterviewNote[]>;
  
  createSkillsTestRecommendation(rec: InsertSkillsTestRecommendation): Promise<SkillsTestRecommendation>;
  getSkillsTestRecommendations(): Promise<SkillsTestRecommendation[]>;
  updateSkillsTestRecommendationStatus(id: string, status: string): Promise<SkillsTestRecommendation | undefined>;
  
  createInterviewRecommendation(rec: InsertInterviewRecommendation): Promise<InterviewRecommendation>;
  getInterviewRecommendations(): Promise<InterviewRecommendation[]>;
  updateInterviewRecommendationStatus(id: string, status: string): Promise<InterviewRecommendation | undefined>;
  
  updateCandidate(id: string, data: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  createCandidateNote(note: InsertCandidateNote): Promise<CandidateNote>;
  getCandidateNotes(candidateId: string): Promise<CandidateNote[]>;
  deleteCandidateNote(id: string, candidateId: string): Promise<boolean>;
  
  createCandidateDocument(doc: InsertCandidateDocument): Promise<CandidateDocument>;
  getCandidateDocuments(candidateId: string): Promise<CandidateDocument[]>;
  deleteCandidateDocument(id: string, candidateId: string): Promise<boolean>;
  
  createResumeAnalysis(analysis: InsertResumeAnalysis): Promise<ResumeAnalysis>;
  getResumeAnalysisByCandidateId(candidateId: string): Promise<ResumeAnalysis[]>;
  
  getSkillsTestRecommendationsByCandidateId(candidateId: string): Promise<SkillsTestRecommendation[]>;
  getInterviewRecommendationsByCandidateId(candidateId: string): Promise<InterviewRecommendation[]>;
  
  getCandidateAssessments(candidateId: string): Promise<{
    resumeAnalysis: ResumeAnalysis[];
    skillsTests: SkillsTestRecommendation[];
    interviews: InterviewRecommendation[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async updateJob(id: string, data: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(data).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    return result.length > 0;
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const result = await db.insert(candidates).values(candidate).returning();
    return result[0];
  }

  async getCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    return result[0];
  }

  async updateCandidateStage(id: string, stage: string): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ stage })
      .where(eq(candidates.id, id))
      .returning();
    return result[0];
  }

  async getCandidatesByJobId(jobId: string): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.jobId, jobId));
  }

  async updateCandidateJobId(id: string, jobId: string | null): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ jobId })
      .where(eq(candidates.id, id))
      .returning();
    return result[0];
  }

  async getJobsWithCandidateCounts(): Promise<(Job & { candidateCount: number })[]> {
    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    const allCandidates = await db.select().from(candidates);
    
    return allJobs.map(job => ({
      ...job,
      candidateCount: allCandidates.filter(c => c.jobId === job.id).length
    }));
  }

  async createInterviewNote(note: InsertInterviewNote): Promise<InterviewNote> {
    const result = await db.insert(interviewNotes).values(note).returning();
    return result[0];
  }

  async getInterviewNotesByCandidateId(candidateId: string): Promise<InterviewNote[]> {
    return await db.select().from(interviewNotes).where(eq(interviewNotes.candidateId, candidateId));
  }

  async createSkillsTestRecommendation(rec: InsertSkillsTestRecommendation): Promise<SkillsTestRecommendation> {
    const result = await db.insert(skillsTestRecommendations).values(rec).returning();
    return result[0];
  }

  async getSkillsTestRecommendations(): Promise<SkillsTestRecommendation[]> {
    return await db.select().from(skillsTestRecommendations);
  }

  async updateSkillsTestRecommendationStatus(id: string, status: string): Promise<SkillsTestRecommendation | undefined> {
    const result = await db
      .update(skillsTestRecommendations)
      .set({ status })
      .where(eq(skillsTestRecommendations.id, id))
      .returning();
    return result[0];
  }

  async createInterviewRecommendation(rec: InsertInterviewRecommendation): Promise<InterviewRecommendation> {
    const result = await db.insert(interviewRecommendations).values(rec).returning();
    return result[0];
  }

  async getInterviewRecommendations(): Promise<InterviewRecommendation[]> {
    return await db.select().from(interviewRecommendations);
  }

  async updateInterviewRecommendationStatus(id: string, status: string): Promise<InterviewRecommendation | undefined> {
    const result = await db
      .update(interviewRecommendations)
      .set({ status })
      .where(eq(interviewRecommendations.id, id))
      .returning();
    return result[0];
  }

  async updateCandidate(id: string, data: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set(data)
      .where(eq(candidates.id, id))
      .returning();
    return result[0];
  }

  async createCandidateNote(note: InsertCandidateNote): Promise<CandidateNote> {
    const result = await db.insert(candidateNotes).values(note).returning();
    return result[0];
  }

  async getCandidateNotes(candidateId: string): Promise<CandidateNote[]> {
    return await db.select().from(candidateNotes).where(eq(candidateNotes.candidateId, candidateId)).orderBy(desc(candidateNotes.createdAt));
  }

  async deleteCandidateNote(id: string, candidateId: string): Promise<boolean> {
    const note = await db.select().from(candidateNotes).where(eq(candidateNotes.id, id)).limit(1);
    if (!note[0] || note[0].candidateId !== candidateId) return false;
    const result = await db.delete(candidateNotes).where(eq(candidateNotes.id, id)).returning();
    return result.length > 0;
  }

  async createCandidateDocument(doc: InsertCandidateDocument): Promise<CandidateDocument> {
    const result = await db.insert(candidateDocuments).values(doc).returning();
    return result[0];
  }

  async getCandidateDocuments(candidateId: string): Promise<CandidateDocument[]> {
    return await db.select().from(candidateDocuments).where(eq(candidateDocuments.candidateId, candidateId)).orderBy(desc(candidateDocuments.uploadedAt));
  }

  async deleteCandidateDocument(id: string, candidateId: string): Promise<boolean> {
    const doc = await db.select().from(candidateDocuments).where(eq(candidateDocuments.id, id)).limit(1);
    if (!doc[0] || doc[0].candidateId !== candidateId) return false;
    const result = await db.delete(candidateDocuments).where(eq(candidateDocuments.id, id)).returning();
    return result.length > 0;
  }

  async createResumeAnalysis(analysis: InsertResumeAnalysis): Promise<ResumeAnalysis> {
    const result = await db.insert(resumeAnalysis).values(analysis).returning();
    return result[0];
  }

  async getResumeAnalysisByCandidateId(candidateId: string): Promise<ResumeAnalysis[]> {
    return await db.select().from(resumeAnalysis).where(eq(resumeAnalysis.candidateId, candidateId)).orderBy(desc(resumeAnalysis.createdAt));
  }

  async getSkillsTestRecommendationsByCandidateId(candidateId: string): Promise<SkillsTestRecommendation[]> {
    return await db.select().from(skillsTestRecommendations).where(eq(skillsTestRecommendations.candidateId, candidateId)).orderBy(desc(skillsTestRecommendations.createdAt));
  }

  async getInterviewRecommendationsByCandidateId(candidateId: string): Promise<InterviewRecommendation[]> {
    return await db.select().from(interviewRecommendations).where(eq(interviewRecommendations.candidateId, candidateId)).orderBy(desc(interviewRecommendations.createdAt));
  }

  async getCandidateAssessments(candidateId: string): Promise<{
    resumeAnalysis: ResumeAnalysis[];
    skillsTests: SkillsTestRecommendation[];
    interviews: InterviewRecommendation[];
  }> {
    const [resumeResults, skillsResults, interviewResults] = await Promise.all([
      this.getResumeAnalysisByCandidateId(candidateId),
      this.getSkillsTestRecommendationsByCandidateId(candidateId),
      this.getInterviewRecommendationsByCandidateId(candidateId)
    ]);
    
    return {
      resumeAnalysis: resumeResults,
      skillsTests: skillsResults,
      interviews: interviewResults
    };
  }
}

export const storage = new DatabaseStorage();
