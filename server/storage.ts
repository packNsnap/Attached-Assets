import { 
  type User, 
  type InsertUser,
  type Job,
  type InsertJob,
  type Candidate,
  type InsertCandidate,
  type InterviewNote,
  type InsertInterviewNote,
  users,
  jobs,
  candidates,
  interviewNotes
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
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
  
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  updateCandidateStage(id: string, stage: string): Promise<Candidate | undefined>;
  
  createInterviewNote(note: InsertInterviewNote): Promise<InterviewNote>;
  getInterviewNotesByCandidateId(candidateId: string): Promise<InterviewNote[]>;
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

  async createInterviewNote(note: InsertInterviewNote): Promise<InterviewNote> {
    const result = await db.insert(interviewNotes).values(note).returning();
    return result[0];
  }

  async getInterviewNotesByCandidateId(candidateId: string): Promise<InterviewNote[]> {
    return await db.select().from(interviewNotes).where(eq(interviewNotes.candidateId, candidateId));
  }
}

export const storage = new DatabaseStorage();
