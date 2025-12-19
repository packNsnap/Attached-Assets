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
  type MonthlyUsage,
  type InsertMonthlyUsage,
  type AiActionUsage,
  type InsertAiActionUsage,
  type ScheduledInterview,
  type InsertScheduledInterview,
  type Reference,
  type InsertReference,
  type ReferenceLink,
  type InsertReferenceLink,
  type OnboardingPlan,
  type InsertOnboardingPlan,
  type PerformanceGoal,
  type InsertPerformanceGoal,
  type PlanType,
  type LimitKey,
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
  monthlyUsage,
  aiActionUsage,
  scheduledInterviews,
  references,
  referenceLinks,
  onboardingPlans,
  performanceGoals
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
  getAllUsers(): Promise<User[]>;
  updateUserFreeAccess(id: string, freeAccessUntil: Date | null): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  createJob(job: InsertJob): Promise<Job>;
  getJobs(userId: string): Promise<Job[]>;
  getJob(id: string, userId: string): Promise<Job | undefined>;
  updateJob(id: string, userId: string, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string, userId: string): Promise<boolean>;
  
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(userId: string, includeAll?: boolean): Promise<Candidate[]>;
  getCandidate(id: string, userId: string): Promise<Candidate | undefined>;
  getCandidatesByJobId(jobId: string, userId: string, includeAll?: boolean): Promise<Candidate[]>;
  updateCandidateStage(id: string, userId: string, stage: string): Promise<Candidate | undefined>;
  updateCandidateJobId(id: string, userId: string, jobId: string | null): Promise<Candidate | undefined>;
  updateCandidateStatus(id: string, userId: string, isActive: string, isArchived: string): Promise<Candidate | undefined>;
  deleteCandidate(id: string, userId: string): Promise<boolean>;
  
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
  deleteInterviewRecommendation(id: string): Promise<boolean>;
  
  updateCandidate(id: string, userId: string, data: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  createCandidateNote(note: InsertCandidateNote): Promise<CandidateNote>;
  getCandidateNotes(candidateId: string): Promise<CandidateNote[]>;
  deleteCandidateNote(id: string, candidateId: string): Promise<boolean>;
  
  createCandidateDocument(doc: InsertCandidateDocument): Promise<CandidateDocument>;
  getCandidateDocuments(candidateId: string): Promise<CandidateDocument[]>;
  getDocumentById(id: string): Promise<CandidateDocument | undefined>;
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
  getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Monthly usage tracking (new system)
  getOrCreateMonthlyUsage(userId: string, period: string): Promise<MonthlyUsage>;
  incrementMonthlyUsage(userId: string, field: keyof Pick<MonthlyUsage, 'jobDescUsed' | 'skillsTestsUsed' | 'interviewSetsUsed' | 'pdfExportsUsed' | 'advancedAiUsed'>, increment?: number): Promise<MonthlyUsage>;
  getMonthlyUsage(userId: string, period: string): Promise<MonthlyUsage | undefined>;
  
  // Legacy usage tracking methods (for backward compatibility)
  getUsageTracking(userId: string, periodStart: Date, periodEnd: Date): Promise<UsageTracking | undefined>;
  createUsageTracking(usage: InsertUsageTracking): Promise<UsageTracking>;
  incrementUsage(userId: string, field: keyof Omit<UsageTracking, 'id' | 'userId' | 'periodStart' | 'periodEnd' | 'createdAt'>): Promise<void>;
  incrementCandidatesAdded(userId: string): Promise<void>;
  checkBulkUploadAllowed(userId: string): Promise<boolean>;
  checkCanUseFeature(userId: string, feature: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  
  // AI action usage methods
  getAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage | undefined>;
  incrementAiActionUsage(userId: string, candidateId: string, serviceType: string): Promise<AiActionUsage>;
  
  // Limit checking
  checkCanCreateJob(userId: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  checkCanAddCandidate(userId: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  checkCanUseAiAction(userId: string, candidateId: string, serviceType: string): Promise<{ allowed: boolean; current: number; limit: number }>;
  getUserUsageSummary(userId: string): Promise<{
    plan: PlanType;
    candidates: { current: number; limit: number };
    jobDescriptions: { current: number; limit: number };
    skillsTests: { current: number; limit: number };
    interviewSets: { current: number; limit: number };
    pdfExports: { current: number; limit: number };
    periodEnd: Date;
  }>;
  
  // Scheduled interviews
  createScheduledInterview(interview: InsertScheduledInterview): Promise<ScheduledInterview>;
  getScheduledInterviews(userId: string): Promise<ScheduledInterview[]>;
  getScheduledInterviewsByCandidateId(candidateId: string, userId: string): Promise<ScheduledInterview[]>;
  updateScheduledInterview(id: string, userId: string, data: Partial<InsertScheduledInterview>): Promise<ScheduledInterview | undefined>;
  deleteScheduledInterview(id: string, userId: string): Promise<boolean>;
  
  // Notes tracking
  markCandidateNotesAsViewed(candidateId: string, userId: string): Promise<Candidate | undefined>;
  getUnreadNotesCount(candidateId: string): Promise<number>;
  getCandidatesWithUnreadNotes(userId: string): Promise<{ candidateId: string; unreadCount: number }[]>;
  
  // Reference links (for candidate submission)
  createReferenceLink(link: InsertReferenceLink): Promise<ReferenceLink>;
  getReferenceLinkByToken(token: string): Promise<ReferenceLink | undefined>;
  getReferenceLinksByCandidateId(candidateId: string): Promise<ReferenceLink[]>;
  
  // References (contacts to check)
  createReference(ref: InsertReference): Promise<Reference>;
  getReferencesByCandidateId(candidateId: string): Promise<Reference[]>;
  updateReference(id: string, data: Partial<InsertReference>): Promise<Reference | undefined>;
  markReferenceEmailSent(id: string): Promise<Reference | undefined>;
  
  // Onboarding plans
  createOnboardingPlan(plan: InsertOnboardingPlan): Promise<OnboardingPlan>;
  getOnboardingPlans(userId: string, status?: string): Promise<OnboardingPlan[]>;
  getOnboardingPlan(id: string, userId: string): Promise<OnboardingPlan | undefined>;
  updateOnboardingPlanTaskIds(id: string, userId: string, completedTaskIds: string[]): Promise<OnboardingPlan | undefined>;
  completeOnboardingPlan(id: string, userId: string): Promise<OnboardingPlan | undefined>;
  
  // Performance goals
  createPerformanceGoal(goal: InsertPerformanceGoal): Promise<PerformanceGoal>;
  getPerformanceGoals(userId: string, employeeId?: string): Promise<PerformanceGoal[]>;
  getPerformanceGoal(id: string, userId: string): Promise<PerformanceGoal | undefined>;
  updatePerformanceGoal(id: string, userId: string, data: Partial<InsertPerformanceGoal>): Promise<PerformanceGoal | undefined>;
  deletePerformanceGoal(id: string, userId: string): Promise<boolean>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserFreeAccess(id: string, freeAccessUntil: Date | null): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ freeAccessUntil, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(usageTracking).where(eq(usageTracking.userId, id));
    await db.delete(aiActionUsage).where(eq(aiActionUsage.userId, id));
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async resetUsageTracking(userId: string): Promise<void> {
    // Delete all usage tracking records for this user to reset them
    await db.delete(usageTracking).where(eq(usageTracking.userId, userId));
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

  async getCandidates(userId: string, includeAll: boolean = false): Promise<Candidate[]> {
    const allCandidates = await db.select().from(candidates).where(eq(candidates.userId, userId));
    if (includeAll) {
      return allCandidates;
    }
    return allCandidates.filter(c => 
      c.isArchived !== "true" && 
      c.stage !== "Rejected" && 
      c.isActive !== "deactivated"
    );
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

  async getCandidatesByJobId(jobId: string, userId: string, includeAll: boolean = false): Promise<Candidate[]> {
    const allCandidates = await db.select().from(candidates).where(and(eq(candidates.jobId, jobId), eq(candidates.userId, userId)));
    if (includeAll) {
      return allCandidates;
    }
    return allCandidates.filter(c => 
      c.isArchived !== "true" && 
      c.stage !== "Rejected" && 
      c.isActive !== "deactivated"
    );
  }

  async updateCandidateJobId(id: string, userId: string, jobId: string | null): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ jobId })
      .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
      .returning();
    return result[0];
  }

  async updateCandidateStatus(id: string, userId: string, isActive: string, isArchived: string): Promise<Candidate | undefined> {
    const result = await db
      .update(candidates)
      .set({ isActive, isArchived })
      .where(and(eq(candidates.id, id), eq(candidates.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteCandidate(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(candidates).where(and(eq(candidates.id, id), eq(candidates.userId, userId))).returning();
    return result.length > 0;
  }

  async getJobsWithCandidateCounts(userId: string): Promise<(Job & { candidateCount: number })[]> {
    const allJobs = await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
    const allCandidates = await db.select().from(candidates).where(eq(candidates.userId, userId));
    const activeCandidates = allCandidates.filter(c => 
      c.isArchived !== "true" && 
      c.stage !== "Rejected" && 
      c.isActive !== "deactivated"
    );
    
    return allJobs.map(job => ({
      ...job,
      candidateCount: activeCandidates.filter(c => c.jobId === job.id).length
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

  async deleteInterviewRecommendation(id: string): Promise<boolean> {
    const result = await db.delete(interviewRecommendations).where(eq(interviewRecommendations.id, id)).returning();
    return result.length > 0;
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

  async getDocumentById(id: string): Promise<CandidateDocument | undefined> {
    const result = await db.select().from(candidateDocuments).where(eq(candidateDocuments.id, id)).limit(1);
    return result[0];
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

  async getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
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

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set(data).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).returning();
    return result[0];
  }

  // Helper to get current period dates
  private getCurrentPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  // Helper to get current period string (YYYY-MM)
  private getCurrentPeriodString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Monthly usage tracking methods (new system)
  async getMonthlyUsage(userId: string, period: string): Promise<MonthlyUsage | undefined> {
    const result = await db.select().from(monthlyUsage)
      .where(and(
        eq(monthlyUsage.userId, userId),
        eq(monthlyUsage.period, period)
      ))
      .limit(1);
    return result[0];
  }

  async getOrCreateMonthlyUsage(userId: string, period: string): Promise<MonthlyUsage> {
    let usage = await this.getMonthlyUsage(userId, period);
    if (!usage) {
      const result = await db.insert(monthlyUsage).values({
        userId,
        period,
        jobDescUsed: 0,
        skillsTestsUsed: 0,
        interviewSetsUsed: 0,
        pdfExportsUsed: 0,
        advancedAiUsed: 0,
      }).returning();
      usage = result[0];
    }
    return usage;
  }

  async incrementMonthlyUsage(
    userId: string, 
    field: keyof Pick<MonthlyUsage, 'jobDescUsed' | 'skillsTestsUsed' | 'interviewSetsUsed' | 'pdfExportsUsed' | 'advancedAiUsed'>,
    increment: number = 1
  ): Promise<MonthlyUsage> {
    const period = this.getCurrentPeriodString();
    const usage = await this.getOrCreateMonthlyUsage(userId, period);
    const currentValue = (usage[field] as number) || 0;
    const result = await db.update(monthlyUsage)
      .set({ 
        [field]: currentValue + increment,
        updatedAt: new Date()
      })
      .where(eq(monthlyUsage.id, usage.id))
      .returning();
    return result[0];
  }

  // Legacy usage tracking methods
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
        candidatesAdded: 0,
        baselineAnalyses: 0,
        advancedReviews: 0,
        jobDescriptions: 0,
        policies: 0,
        skillsTests: 0,
        interviewSets: 0,
        emails: 0,
        bulkBatches: 0,
        bulkAnalysisRuns: 0,
      });
    }
    return usage;
  }

  async incrementUsage(userId: string, field: keyof Omit<UsageTracking, 'id' | 'userId' | 'periodStart' | 'periodEnd' | 'createdAt'>): Promise<void> {
    const usage = await this.getOrCreateCurrentUsageTracking(userId);
    const currentValue = (usage[field] as number) || 0;
    await db.update(usageTracking)
      .set({ [field]: currentValue + 1 })
      .where(eq(usageTracking.id, usage.id));
  }

  async incrementCandidatesAdded(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'candidatesAdded');
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
        plan: "free",
        status: "active",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });
    }
    return sub;
  }

  // Helper to check if user is admin
  private async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.email === "admin@resumelogik.com";
  }

  // Helper method to get effective plan, checking both subscription and freeAccessUntil
  private async getEffectivePlan(userId: string): Promise<PlanType> {
    // Check if user is admin - they get enterprise (unlimited)
    if (await this.isUserAdmin(userId)) {
      return "enterprise";
    }
    
    // Check if user has active free access granted by admin
    const user = await this.getUser(userId);
    if (user && user.freeAccessUntil && new Date(user.freeAccessUntil) > new Date()) {
      return "growth"; // Admin-granted access gives growth tier
    }
    // Otherwise check subscription
    const sub = await this.getOrCreateSubscription(userId);
    return (sub.plan as PlanType) || "free";
  }

  async checkCanCreateJob(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    if (await this.isUserAdmin(userId)) {
      return { allowed: true, current: 0, limit: -1 };
    }
    const plan = await this.getEffectivePlan(userId);
    const allJobs = await this.getJobs(userId);
    const activeJobs = allJobs.filter(j => j.status === "active").length;
    // No job limit in new plan structure - always allow
    return { allowed: true, current: activeJobs, limit: -1 };
  }

  async checkCanAddCandidate(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    if (await this.isUserAdmin(userId)) {
      return { allowed: true, current: 0, limit: -1 };
    }
    const plan = await this.getEffectivePlan(userId);
    const candidates = await this.getCandidates(userId);
    const limit = PLAN_LIMITS[plan].limits.candidates_max;
    return { allowed: candidates.length < limit, current: candidates.length, limit };
  }

  async checkCanUseFeature(userId: string, feature: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    if (await this.isUserAdmin(userId)) {
      return { allowed: true, current: 0, limit: -1 };
    }
    
    const plan = await this.getEffectivePlan(userId);
    const period = this.getCurrentPeriodString();
    const usage = await this.getOrCreateMonthlyUsage(userId, period);
    const planConfig = PLAN_LIMITS[plan];
    
    // Map feature names to new limit keys
    const limitKeyMap: Record<string, LimitKey> = {
      'job_descriptions': 'job_descriptions_per_month',
      'skills_tests': 'skills_tests_per_month',
      'interview_sets': 'interview_sets_per_month',
      'pdf_exports': 'pdf_exports_per_month',
      'candidates': 'candidates_max',
    };
    
    const usageFieldMap: Record<string, keyof MonthlyUsage> = {
      'job_descriptions': 'jobDescUsed',
      'skills_tests': 'skillsTestsUsed',
      'interview_sets': 'interviewSetsUsed',
      'pdf_exports': 'pdfExportsUsed',
    };
    
    const limitKey = limitKeyMap[feature];
    const usageField = usageFieldMap[feature];
    
    if (!limitKey) {
      return { allowed: true, current: 0, limit: -1 };
    }
    
    const limit = planConfig.limits[limitKey];
    
    // For candidates, count actual candidates instead of monthly usage
    if (feature === 'candidates') {
      const candidates = await this.getCandidates(userId);
      return { allowed: candidates.length < limit, current: candidates.length, limit };
    }
    
    if (!usageField) {
      return { allowed: true, current: 0, limit: -1 };
    }
    
    const current = (usage[usageField] as number) || 0;
    
    return { allowed: current < limit, current, limit };
  }

  async checkBulkUploadAllowed(userId: string): Promise<boolean> {
    if (await this.isUserAdmin(userId)) return true;
    const plan = await this.getEffectivePlan(userId);
    return PLAN_LIMITS[plan].features.bulk_upload;
  }

  async checkCanUseAiAction(userId: string, candidateId: string, serviceType: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    if (await this.isUserAdmin(userId)) {
      return { allowed: true, current: 0, limit: -1 };
    }
    
    const plan = await this.getEffectivePlan(userId);
    const period = this.getCurrentPeriodString();
    const usage = await this.getOrCreateMonthlyUsage(userId, period);
    const planConfig = PLAN_LIMITS[plan];
    
    // For resume analysis, check per-candidate limit using aiActionUsage table
    if (serviceType === 'resume_analysis') {
      const scansPerCandidate = planConfig.limits.resume_scans_per_candidate;
      const aiUsage = await this.getAiActionUsage(userId, candidateId, 'resume_analysis');
      const currentScans = aiUsage?.actionCount || 0;
      return { allowed: currentScans < scansPerCandidate, current: currentScans, limit: scansPerCandidate };
    }
    
    // Map service types to limits and usage fields
    const serviceToLimitMap: Record<string, { limit: LimitKey; usage: keyof MonthlyUsage }> = {
      'job_description': { limit: 'job_descriptions_per_month', usage: 'jobDescUsed' },
      'skills_test': { limit: 'skills_tests_per_month', usage: 'skillsTestsUsed' },
      'interview_questions': { limit: 'interview_sets_per_month', usage: 'interviewSetsUsed' },
      'pdf_export': { limit: 'pdf_exports_per_month', usage: 'pdfExportsUsed' },
    };
    
    const mapping = serviceToLimitMap[serviceType];
    if (!mapping) {
      return { allowed: true, current: 0, limit: -1 };
    }
    
    const limit = planConfig.limits[mapping.limit];
    const current = (usage[mapping.usage] as number) || 0;
    
    return { allowed: current < limit, current, limit };
  }

  async getUserUsageSummary(userId: string): Promise<{
    plan: PlanType;
    candidates: { current: number; limit: number };
    jobDescriptions: { current: number; limit: number };
    skillsTests: { current: number; limit: number };
    interviewSets: { current: number; limit: number };
    pdfExports: { current: number; limit: number };
    periodEnd: Date;
  }> {
    const plan = await this.getEffectivePlan(userId);
    const limits = PLAN_LIMITS[plan].limits;
    
    const period = this.getCurrentPeriodString();
    const usage = await this.getOrCreateMonthlyUsage(userId, period);
    const { end } = this.getCurrentPeriod();
    const candidates = await this.getCandidates(userId);
    
    return {
      plan,
      candidates: { current: candidates.length, limit: limits.candidates_max },
      jobDescriptions: { current: usage.jobDescUsed || 0, limit: limits.job_descriptions_per_month },
      skillsTests: { current: usage.skillsTestsUsed || 0, limit: limits.skills_tests_per_month },
      interviewSets: { current: usage.interviewSetsUsed || 0, limit: limits.interview_sets_per_month },
      pdfExports: { current: usage.pdfExportsUsed || 0, limit: limits.pdf_exports_per_month },
      periodEnd: end,
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

  async markCandidateNotesAsViewed(candidateId: string, userId: string): Promise<Candidate | undefined> {
    const result = await db.update(candidates)
      .set({ notesLastViewedAt: new Date() })
      .where(and(eq(candidates.id, candidateId), eq(candidates.userId, userId)))
      .returning();
    return result[0];
  }

  async getUnreadNotesCount(candidateId: string): Promise<number> {
    const candidate = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
    if (!candidate[0]) return 0;
    
    const lastViewed = candidate[0].notesLastViewedAt;
    
    if (!lastViewed) {
      const notes = await db.select().from(candidateNotes).where(eq(candidateNotes.candidateId, candidateId));
      return notes.length;
    }
    
    const notes = await db.select().from(candidateNotes)
      .where(and(
        eq(candidateNotes.candidateId, candidateId),
        sql`${candidateNotes.createdAt} > ${lastViewed}`
      ));
    return notes.length;
  }

  async getCandidatesWithUnreadNotes(userId: string): Promise<{ candidateId: string; unreadCount: number }[]> {
    const userCandidates = await this.getCandidates(userId);
    const results: { candidateId: string; unreadCount: number }[] = [];
    
    for (const candidate of userCandidates) {
      const unreadCount = await this.getUnreadNotesCount(candidate.id);
      if (unreadCount > 0) {
        results.push({ candidateId: candidate.id, unreadCount });
      }
    }
    
    return results;
  }

  async createReferenceLink(link: InsertReferenceLink): Promise<ReferenceLink> {
    const result = await db.insert(referenceLinks).values(link).returning();
    return result[0];
  }

  async getReferenceLinkByToken(token: string): Promise<ReferenceLink | undefined> {
    const result = await db.select().from(referenceLinks).where(eq(referenceLinks.token, token)).limit(1);
    return result[0];
  }

  async getReferenceLinksByCandidateId(candidateId: string): Promise<ReferenceLink[]> {
    return await db.select().from(referenceLinks).where(eq(referenceLinks.candidateId, candidateId)).orderBy(desc(referenceLinks.createdAt));
  }

  async createReference(ref: InsertReference): Promise<Reference> {
    const result = await db.insert(references).values(ref).returning();
    return result[0];
  }

  async getReferencesByCandidateId(candidateId: string): Promise<Reference[]> {
    return await db.select().from(references).where(eq(references.candidateId, candidateId)).orderBy(desc(references.createdAt));
  }

  async updateReference(id: string, data: Partial<InsertReference>): Promise<Reference | undefined> {
    const result = await db.update(references).set(data).where(eq(references.id, id)).returning();
    return result[0];
  }

  async markReferenceEmailSent(id: string): Promise<Reference | undefined> {
    const result = await db.update(references).set({ 
      status: "email_sent", 
      emailSentAt: new Date() 
    }).where(eq(references.id, id)).returning();
    return result[0];
  }

  async createOnboardingPlan(plan: InsertOnboardingPlan): Promise<OnboardingPlan> {
    const result = await db.insert(onboardingPlans).values(plan).returning();
    return result[0];
  }

  async getOnboardingPlans(userId: string, status?: string): Promise<OnboardingPlan[]> {
    if (status) {
      return await db.select().from(onboardingPlans)
        .where(and(eq(onboardingPlans.userId, userId), eq(onboardingPlans.status, status)))
        .orderBy(desc(onboardingPlans.createdAt));
    }
    return await db.select().from(onboardingPlans)
      .where(eq(onboardingPlans.userId, userId))
      .orderBy(desc(onboardingPlans.createdAt));
  }

  async getOnboardingPlan(id: string, userId: string): Promise<OnboardingPlan | undefined> {
    const result = await db.select().from(onboardingPlans)
      .where(and(eq(onboardingPlans.id, id), eq(onboardingPlans.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updateOnboardingPlanTaskIds(id: string, userId: string, completedTaskIds: string[]): Promise<OnboardingPlan | undefined> {
    const result = await db.update(onboardingPlans)
      .set({ completedTaskIds })
      .where(and(eq(onboardingPlans.id, id), eq(onboardingPlans.userId, userId)))
      .returning();
    return result[0];
  }

  async completeOnboardingPlan(id: string, userId: string): Promise<OnboardingPlan | undefined> {
    const result = await db.update(onboardingPlans)
      .set({ status: "completed", completedAt: new Date() })
      .where(and(eq(onboardingPlans.id, id), eq(onboardingPlans.userId, userId)))
      .returning();
    return result[0];
  }

  async createPerformanceGoal(goal: InsertPerformanceGoal): Promise<PerformanceGoal> {
    const result = await db.insert(performanceGoals).values(goal).returning();
    return result[0];
  }

  async getPerformanceGoals(userId: string, employeeId?: string): Promise<PerformanceGoal[]> {
    if (employeeId) {
      return await db.select().from(performanceGoals)
        .where(and(eq(performanceGoals.userId, userId), eq(performanceGoals.employeeId, employeeId)))
        .orderBy(desc(performanceGoals.createdAt));
    }
    return await db.select().from(performanceGoals)
      .where(eq(performanceGoals.userId, userId))
      .orderBy(desc(performanceGoals.createdAt));
  }

  async getPerformanceGoal(id: string, userId: string): Promise<PerformanceGoal | undefined> {
    const result = await db.select().from(performanceGoals)
      .where(and(eq(performanceGoals.id, id), eq(performanceGoals.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updatePerformanceGoal(id: string, userId: string, data: Partial<InsertPerformanceGoal>): Promise<PerformanceGoal | undefined> {
    const now = new Date();
    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    const status = data.status;
    
    let isAtRisk = "false";
    if (status !== "completed" && dueDate) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (dueDate < now || dueDate <= sevenDaysFromNow) {
        isAtRisk = "true";
      }
    }
    
    const result = await db.update(performanceGoals)
      .set({ ...data, isAtRisk, updatedAt: now })
      .where(and(eq(performanceGoals.id, id), eq(performanceGoals.userId, userId)))
      .returning();
    return result[0];
  }

  async deletePerformanceGoal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(performanceGoals)
      .where(and(eq(performanceGoals.id, id), eq(performanceGoals.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
