import { 
  type User, 
  type InsertUser,
  type UpsertUser,
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
  type SkillsTest,
  type InsertSkillsTest,
  type SkillsTestInvitation,
  type InsertSkillsTestInvitation,
  type SkillsTestResponse,
  type InsertSkillsTestResponse,
  type Subscription,
  type InsertSubscription,
  type UsageTracking,
  type InsertUsageTracking,
  type AiActionUsage,
  type InsertAiActionUsage,
  type ScheduledInterview,
  type InsertScheduledInterview,
  type PlanType,
  PLAN_LIMITS,
  users,
  jobs,
  candidates,
  interviewNotes,
  skillsTestRecommendations,
  interviewRecommendations,
  candidateNotes,
  candidateDocuments,
  resumeAnalysis,
  skillsTests,
  skillsTestInvitations,
  skillsTestResponses,
  subscriptions,
  usageTracking,
  aiActionUsage,
  scheduledInterviews
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, desc, and, gte, lte, inArray } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  
  createJob(job: InsertJob): Promise<Job>;
  getJobs(userId: string): Promise<Job[]>;
  getJob(id: string, userId: string): Promise<Job | undefined>;
  updateJob(id: string, userId: string, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string, userId: string): Promise<boolean>;
  
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(userId: string): Promise<Candidate[]>;
  getCandidate(id: string, userId: string): Promise<Candidate | undefined>;
  getCandidatesByJobId(jobId: string, userId: string): Promise<Candidate[]>;
  updateCandidateStage(id: string, userId: string, stage: string): Promise<Candidate | undefined>;
  updateCandidateJobId(id: string, userId: string, jobId: string | null): Promise<Candidate | undefined>;
  
  getJobsWithCandidateCounts(userId: string): Promise<(Job & { candidateCount: number })[]>;
  
  createInterviewNote(note: InsertInterviewNote): Promise<InterviewNote>;
  getInterviewNotesByCandidateId(candidateId: string): Promise<InterviewNote[]>;
  
  createSkillsTestRecommendation(rec: InsertSkillsTestRecommendation): Promise<SkillsTestRecommendation>;
  getSkillsTestRecommendations(): Promise<SkillsTestRecommendation[]>;
  updateSkillsTestRecommendationStatus(id: string, status: string, testId?: string): Promise<SkillsTestRecommendation | undefined>;
  updateSkillsTestRecommendationStatusByTestId(testId: string, status: string): Promise<SkillsTestRecommendation | undefined>;
  
  createInterviewRecommendation(rec: InsertInterviewRecommendation): Promise<InterviewRecommendation>;
  getInterviewRecommendations(): Promise<InterviewRecommendation[]>;
  updateInterviewRecommendationStatus(id: string, status: string): Promise<InterviewRecommendation | undefined>;
  updateInterviewRecommendation(id: string, data: { recommendedQuestions?: string[]; strengths?: string[]; weaknesses?: string[]; status?: string; interviewScore?: number; interviewSummary?: string; completedAt?: Date }): Promise<InterviewRecommendation | undefined>;
  
  updateCandidate(id: string, userId: string, data: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  createCandidateNote(note: InsertCandidateNote): Promise<CandidateNote>;
  getCandidateNotes(candidateId: string): Promise<CandidateNote[]>;
  deleteCandidateNote(id: string, candidateId: string): Promise<boolean>;
  
  createCandidateDocument(doc: InsertCandidateDocument): Promise<CandidateDocument>;
  getCandidateDocuments(candidateId: string): Promise<CandidateDocument[]>;
  deleteCandidateDocument(id: string, candidateId: string): Promise<boolean>;
  
  createResumeAnalysis(analysis: InsertResumeAnalysis): Promise<ResumeAnalysis>;
  getResumeAnalysisByCandidateId(candidateId: string): Promise<ResumeAnalysis[]>;
  deleteResumeAnalysis(id: string, candidateId: string): Promise<boolean>;
  
  getSkillsTestRecommendationsByCandidateId(candidateId: string): Promise<SkillsTestRecommendation[]>;
  getInterviewRecommendationsByCandidateId(candidateId: string): Promise<InterviewRecommendation[]>;
  
  getCandidateAssessments(candidateId: string): Promise<{
    resumeAnalysis: ResumeAnalysis[];
    skillsTests: SkillsTestRecommendation[];
    skillsTestInvitations: SkillsTestInvitation[];
    interviews: InterviewRecommendation[];
  }>;
  
  deleteSkillsTestRecommendation(id: string): Promise<boolean>;
  
  createSkillsTest(test: InsertSkillsTest): Promise<SkillsTest>;
  getSkillsTest(id: string, userId: string): Promise<SkillsTest | undefined>;
  getSkillsTestById(id: string): Promise<SkillsTest | undefined>;
  getSkillsTests(userId: string): Promise<SkillsTest[]>;
  
  createSkillsTestInvitation(invitation: InsertSkillsTestInvitation): Promise<SkillsTestInvitation>;
  getSkillsTestInvitation(id: string): Promise<SkillsTestInvitation | undefined>;
  getSkillsTestInvitationByToken(token: string): Promise<SkillsTestInvitation | undefined>;
  getSkillsTestInvitations(): Promise<SkillsTestInvitation[]>;
  getSkillsTestInvitationsByCandidateId(candidateId: string): Promise<SkillsTestInvitation[]>;
  updateSkillsTestInvitation(id: string, data: Partial<InsertSkillsTestInvitation & { score: number; completedAt: Date }>): Promise<SkillsTestInvitation | undefined>;
  
  createSkillsTestResponse(response: InsertSkillsTestResponse): Promise<SkillsTestResponse>;
  getSkillsTestResponsesByInvitationId(invitationId: string): Promise<SkillsTestResponse[]>;
  updateSkillsTestResponse(id: string, data: Partial<InsertSkillsTestResponse>): Promise<SkillsTestResponse | undefined>;
  
  updateCandidateTestScore(candidateId: string, score: number): Promise<Candidate | undefined>;
  getRecentCompletedInvitations(limit: number): Promise<SkillsTestInvitation[]>;
  getSkillsTestInvitationsByUserId(userId: string): Promise<SkillsTestInvitation[]>;
  getRecentCompletedInvitationsByUserId(userId: string, limit: number): Promise<SkillsTestInvitation[]>;
  
  // Subscription methods
  getSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Usage tracking methods
  getUsageTracking(userId: string, periodStart: Date, periodEnd: Date): Promise<UsageTracking | undefined>;
  createUsageTracking(usage: InsertUsageTracking): Promise<UsageTracking>;
  incrementJobsCreated(userId: string): Promise<void>;
  incrementCandidatesAdded(userId: string): Promise<void>;
  
  // AI action usage methods
  getAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage | undefined>;
  incrementAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage>;
  
  // Limit checking
  checkCanCreateJob(userId: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  checkCanAddCandidate(userId: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  checkCanUseAiAction(userId: string, candidateId: string, serviceType: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  getUserUsageSummary(userId: string): Promise<{
    plan: PlanType;
    jobs: { current: number; limit: number };
    candidates: { current: number; limit: number };
    periodEnd: Date;
  }>;
  
  // Scheduled interviews
  createScheduledInterview(interview: InsertScheduledInterview): Promise<ScheduledInterview>;
  getScheduledInterviews(userId: string): Promise<ScheduledInterview[]>;
  getScheduledInterviewsByCandidateId(candidateId: string, userId: string): Promise<ScheduledInterview[]>;
  updateScheduledInterview(id: string, userId: string, data: Partial<InsertScheduledInterview>): Promise<ScheduledInterview | undefined>;
  deleteScheduledInterview(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async getJobs(userId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.userId, userId));
  }

  async getJob(id: string, userId: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(and(eq(jobs.id, id), eq(jobs.userId, userId))).limit(1);
    return result[0];
  }

  async updateJob(id: string, userId: string, data: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(data).where(and(eq(jobs.id, id), eq(jobs.userId, userId))).returning();
    return result[0];
  }

  async deleteJob(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.userId, userId))).returning();
    return result.length > 0;
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const result = await db.insert(candidates).values(candidate).returning();
    return result[0];
  }

  async getCandidates(userId: string): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.userId, userId));
  }

  async getCandidate(id: string, userId: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(and(eq(candidates.id, id), eq(candidates.userId, userId))).limit(1);
    return result[0];
  }

  async updateCandidateStage(id: string, userId: string, stage: string): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ stage })
      .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
      .returning();
    return result[0];
  }

  async getCandidatesByJobId(jobId: string, userId: string): Promise<Candidate[]> {
    return await db.select().from(candidates).where(and(eq(candidates.jobId, jobId), eq(candidates.userId, userId)));
  }

  async updateCandidateJobId(id: string, userId: string, jobId: string | null): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ jobId })
      .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
      .returning();
    return result[0];
  }

  async getJobsWithCandidateCounts(userId: string): Promise<(Job & { candidateCount: number })[]> {
    const allJobs = await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
    const allCandidates = await db.select().from(candidates).where(eq(candidates.userId, userId));
    
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

  async updateSkillsTestRecommendationStatus(id: string, status: string, testId?: string): Promise<SkillsTestRecommendation | undefined> {
    const updateData: { status: string; testId?: string } = { status };
    if (testId) {
      updateData.testId = testId;
    }
    const result = await db
      .update(skillsTestRecommendations)
      .set(updateData)
      .where(eq(skillsTestRecommendations.id, id))
      .returning();
    return result[0];
  }

  async updateSkillsTestRecommendationStatusByTestId(testId: string, status: string): Promise<SkillsTestRecommendation | undefined> {
    const result = await db
      .update(skillsTestRecommendations)
      .set({ status })
      .where(eq(skillsTestRecommendations.testId, testId))
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

  async updateInterviewRecommendation(id: string, data: { recommendedQuestions?: string[]; strengths?: string[]; weaknesses?: string[]; status?: string; interviewScore?: number; interviewSummary?: string; completedAt?: Date }): Promise<InterviewRecommendation | undefined> {
    const result = await db
      .update(interviewRecommendations)
      .set(data)
      .where(eq(interviewRecommendations.id, id))
      .returning();
    return result[0];
  }

  async updateCandidate(id: string, userId: string, data: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set(data)
      .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
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

  async deleteResumeAnalysis(id: string, candidateId: string): Promise<boolean> {
    const analysis = await db.select().from(resumeAnalysis).where(eq(resumeAnalysis.id, id)).limit(1);
    if (!analysis[0] || analysis[0].candidateId !== candidateId) return false;
    const result = await db.delete(resumeAnalysis).where(eq(resumeAnalysis.id, id)).returning();
    return result.length > 0;
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
    skillsTestInvitations: SkillsTestInvitation[];
    interviews: InterviewRecommendation[];
  }> {
    const [resumeResults, skillsResults, invitationResults, interviewResults] = await Promise.all([
      this.getResumeAnalysisByCandidateId(candidateId),
      this.getSkillsTestRecommendationsByCandidateId(candidateId),
      this.getSkillsTestInvitationsByCandidateId(candidateId),
      this.getInterviewRecommendationsByCandidateId(candidateId)
    ]);
    
    return {
      resumeAnalysis: resumeResults,
      skillsTests: skillsResults,
      skillsTestInvitations: invitationResults,
      interviews: interviewResults
    };
  }

  async deleteSkillsTestRecommendation(id: string): Promise<boolean> {
    const result = await db.delete(skillsTestRecommendations).where(eq(skillsTestRecommendations.id, id)).returning();
    return result.length > 0;
  }

  async createSkillsTest(test: InsertSkillsTest): Promise<SkillsTest> {
    const result = await db.insert(skillsTests).values(test).returning();
    return result[0];
  }

  async getSkillsTest(id: string, userId: string): Promise<SkillsTest | undefined> {
    const result = await db.select().from(skillsTests).where(and(eq(skillsTests.id, id), eq(skillsTests.userId, userId))).limit(1);
    return result[0];
  }

  async getSkillsTestById(id: string): Promise<SkillsTest | undefined> {
    const result = await db.select().from(skillsTests).where(eq(skillsTests.id, id)).limit(1);
    return result[0];
  }

  async getSkillsTests(userId: string): Promise<SkillsTest[]> {
    return await db.select().from(skillsTests).where(eq(skillsTests.userId, userId)).orderBy(desc(skillsTests.createdAt));
  }

  async createSkillsTestInvitation(invitation: InsertSkillsTestInvitation): Promise<SkillsTestInvitation> {
    const result = await db.insert(skillsTestInvitations).values(invitation).returning();
    return result[0];
  }

  async getSkillsTestInvitation(id: string): Promise<SkillsTestInvitation | undefined> {
    const result = await db.select().from(skillsTestInvitations).where(eq(skillsTestInvitations.id, id)).limit(1);
    return result[0];
  }

  async getSkillsTestInvitationByToken(token: string): Promise<SkillsTestInvitation | undefined> {
    const result = await db.select().from(skillsTestInvitations).where(eq(skillsTestInvitations.token, token)).limit(1);
    return result[0];
  }

  async getSkillsTestInvitations(): Promise<SkillsTestInvitation[]> {
    return await db.select().from(skillsTestInvitations).orderBy(desc(skillsTestInvitations.createdAt));
  }

  async getSkillsTestInvitationsByCandidateId(candidateId: string): Promise<SkillsTestInvitation[]> {
    return await db.select().from(skillsTestInvitations).where(eq(skillsTestInvitations.candidateId, candidateId)).orderBy(desc(skillsTestInvitations.createdAt));
  }

  async updateSkillsTestInvitation(id: string, data: Partial<InsertSkillsTestInvitation & { score: number; completedAt: Date }>): Promise<SkillsTestInvitation | undefined> {
    const result = await db.update(skillsTestInvitations).set(data).where(eq(skillsTestInvitations.id, id)).returning();
    return result[0];
  }

  async createSkillsTestResponse(response: InsertSkillsTestResponse): Promise<SkillsTestResponse> {
    const result = await db.insert(skillsTestResponses).values(response).returning();
    return result[0];
  }

  async getSkillsTestResponsesByInvitationId(invitationId: string): Promise<SkillsTestResponse[]> {
    return await db.select().from(skillsTestResponses).where(eq(skillsTestResponses.invitationId, invitationId)).orderBy(skillsTestResponses.questionIndex);
  }

  async updateSkillsTestResponse(id: string, data: Partial<InsertSkillsTestResponse>): Promise<SkillsTestResponse | undefined> {
    const result = await db.update(skillsTestResponses).set(data).where(eq(skillsTestResponses.id, id)).returning();
    return result[0];
  }

  async updateCandidateTestScore(candidateId: string, score: number): Promise<Candidate | undefined> {
    const result = await db.update(candidates).set({ lastTestScore: score }).where(eq(candidates.id, candidateId)).returning();
    return result[0];
  }

  async getRecentCompletedInvitations(limit: number): Promise<SkillsTestInvitation[]> {
    return await db.select().from(skillsTestInvitations).where(eq(skillsTestInvitations.status, "completed")).orderBy(desc(skillsTestInvitations.completedAt)).limit(limit);
  }

  async getSkillsTestInvitationsByUserId(userId: string): Promise<SkillsTestInvitation[]> {
    const userTests = await db.select().from(skillsTests).where(eq(skillsTests.userId, userId));
    const userTestIds = userTests.map(t => t.id);
    if (userTestIds.length === 0) return [];
    return await db.select().from(skillsTestInvitations)
      .where(inArray(skillsTestInvitations.testId, userTestIds))
      .orderBy(desc(skillsTestInvitations.createdAt));
  }

  async getRecentCompletedInvitationsByUserId(userId: string, limit: number): Promise<SkillsTestInvitation[]> {
    const userTests = await db.select().from(skillsTests).where(eq(skillsTests.userId, userId));
    const userTestIds = userTests.map(t => t.id);
    if (userTestIds.length === 0) return [];
    return await db.select().from(skillsTestInvitations)
      .where(and(
        inArray(skillsTestInvitations.testId, userTestIds),
        eq(skillsTestInvitations.status, "completed")
      ))
      .orderBy(desc(skillsTestInvitations.completedAt))
      .limit(limit);
  }

  // Subscription methods
  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return result[0];
  }

  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(sub).returning();
    return result[0];
  }

  async updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId)).returning();
    return result[0];
  }

  // Helper to get current period dates
  private getCurrentPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  // Usage tracking methods
  async getUsageTracking(userId: string, periodStart: Date, periodEnd: Date): Promise<UsageTracking | undefined> {
    const result = await db.select().from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        gte(usageTracking.periodStart, periodStart),
        lte(usageTracking.periodEnd, periodEnd)
      ))
      .limit(1);
    return result[0];
  }

  async createUsageTracking(usage: InsertUsageTracking): Promise<UsageTracking> {
    const result = await db.insert(usageTracking).values(usage).returning();
    return result[0];
  }

  private async getOrCreateCurrentUsageTracking(userId: string): Promise<UsageTracking> {
    const { start, end } = this.getCurrentPeriod();
    let usage = await this.getUsageTracking(userId, start, end);
    if (!usage) {
      usage = await this.createUsageTracking({
        userId,
        periodStart: start,
        periodEnd: end,
        jobsCreated: 0,
        candidatesAdded: 0,
      });
    }
    return usage;
  }

  async incrementJobsCreated(userId: string): Promise<void> {
    const usage = await this.getOrCreateCurrentUsageTracking(userId);
    await db.update(usageTracking)
      .set({ jobsCreated: (usage.jobsCreated || 0) + 1 })
      .where(eq(usageTracking.id, usage.id));
  }

  async incrementCandidatesAdded(userId: string): Promise<void> {
    const usage = await this.getOrCreateCurrentUsageTracking(userId);
    await db.update(usageTracking)
      .set({ candidatesAdded: (usage.candidatesAdded || 0) + 1 })
      .where(eq(usageTracking.id, usage.id));
  }

  // AI action usage methods
  async getAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage | undefined> {
    const result = await db.select().from(aiActionUsage)
      .where(and(
        eq(aiActionUsage.userId, userId),
        eq(aiActionUsage.candidateId, candidateId),
        eq(aiActionUsage.serviceType, serviceType)
      ))
      .limit(1);
    return result[0];
  }

  async incrementAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage> {
    const existing = await this.getAiActionUsage(userId, candidateId, serviceType);
    if (existing) {
      const result = await db.update(aiActionUsage)
        .set({ actionCount: (existing.actionCount || 0) + 1 })
        .where(eq(aiActionUsage.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db.insert(aiActionUsage).values({
      userId,
      candidateId,
      serviceType,
      actionCount: 1,
    }).returning();
    return result[0];
  }

  // Limit checking methods
  private async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let sub = await this.getSubscription(userId);
    if (!sub) {
      const { start, end } = this.getCurrentPeriod();
      sub = await this.createSubscription({
        userId,
        plan: "starter",
        status: "active",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });
    }
    return sub;
  }

  async checkCanCreateJob(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const sub = await this.getOrCreateSubscription(userId);
    const plan = (sub.plan as PlanType) || "starter";
    const limits = PLAN_LIMITS[plan];
    
    // Get active jobs count for this user
    const allJobs = await this.getJobs(userId);
    const activeJobs = allJobs.filter(j => j.status === "active").length;
    
    if (limits.jobs === -1) {
      return { allowed: true, current: activeJobs, limit: -1 };
    }
    
    return { allowed: activeJobs < limits.jobs, current: activeJobs, limit: limits.jobs };
  }

  async checkCanAddCandidate(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const sub = await this.getOrCreateSubscription(userId);
    const plan = (sub.plan as PlanType) || "starter";
    const limits = PLAN_LIMITS[plan];
    
    const usage = await this.getOrCreateCurrentUsageTracking(userId);
    const current = usage.candidatesAdded || 0;
    
    if (limits.candidates === -1) {
      return { allowed: true, current, limit: -1 };
    }
    
    return { allowed: current < limits.candidates, current, limit: limits.candidates };
  }

  async checkCanUseAiAction(userId: string, candidateId: string, serviceType: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const sub = await this.getOrCreateSubscription(userId);
    const plan = (sub.plan as PlanType) || "starter";
    const limits = PLAN_LIMITS[plan];
    
    const usage = await this.getAiActionUsage(userId, candidateId, serviceType);
    const current = usage?.actionCount || 0;
    
    if (limits.aiActionsPerService === -1) {
      return { allowed: true, current, limit: -1 };
    }
    
    return { allowed: current < limits.aiActionsPerService, current, limit: limits.aiActionsPerService };
  }

  async getUserUsageSummary(userId: string): Promise<{
    plan: PlanType;
    jobs: { current: number; limit: number };
    candidates: { current: number; limit: number };
    periodEnd: Date;
  }> {
    const sub = await this.getOrCreateSubscription(userId);
    const plan = (sub.plan as PlanType) || "starter";
    const limits = PLAN_LIMITS[plan];
    
    const usage = await this.getOrCreateCurrentUsageTracking(userId);
    
    const allJobs = await this.getJobs(userId);
    const activeJobs = allJobs.filter(j => j.status === "active").length;
    
    return {
      plan,
      jobs: { current: activeJobs, limit: limits.jobs },
      candidates: { current: usage.candidatesAdded || 0, limit: limits.candidates },
      periodEnd: usage.periodEnd,
    };
  }

  // Scheduled interview methods
  async createScheduledInterview(interview: InsertScheduledInterview): Promise<ScheduledInterview> {
    const result = await db.insert(scheduledInterviews).values(interview).returning();
    return result[0];
  }

  async getScheduledInterviews(userId: string): Promise<ScheduledInterview[]> {
    return await db.select().from(scheduledInterviews)
      .where(eq(scheduledInterviews.userId, userId))
      .orderBy(desc(scheduledInterviews.scheduledDate));
  }

  async getScheduledInterviewsByCandidateId(candidateId: string, userId: string): Promise<ScheduledInterview[]> {
    return await db.select().from(scheduledInterviews)
      .where(and(eq(scheduledInterviews.candidateId, candidateId), eq(scheduledInterviews.userId, userId)))
      .orderBy(desc(scheduledInterviews.scheduledDate));
  }

  async updateScheduledInterview(id: string, userId: string, data: Partial<InsertScheduledInterview>): Promise<ScheduledInterview | undefined> {
    const result = await db.update(scheduledInterviews).set(data)
      .where(and(eq(scheduledInterviews.id, id), eq(scheduledInterviews.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteScheduledInterview(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(scheduledInterviews)
      .where(and(eq(scheduledInterviews.id, id), eq(scheduledInterviews.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
