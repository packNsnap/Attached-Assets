import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertJobSchema, 
  insertCandidateSchema, 
  insertInterviewNoteSchema,
  insertSkillsTestRecommendationSchema,
  insertInterviewRecommendationSchema,
  insertCandidateNoteSchema,
  insertCandidateDocumentSchema,
  insertResumeAnalysisSchema,
  insertSkillsTestSchema,
  insertSkillsTestInvitationSchema,
  insertSkillsTestResponseSchema,
  insertScheduledInterviewSchema
} from "@shared/schema";
import { randomBytes } from "crypto";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import bcrypt from "bcryptjs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// In-memory resume storage (resumeId -> resumeText)
const resumeStore = new Map<string, string>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // Email/Password Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ message: "An account with this email already exists" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Create session for the new user
      (req as any).login({ claims: { sub: user.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          res.status(500).json({ message: "Account created but failed to sign in" });
          return;
        }
        res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Email/Password Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Check if user has a password (might have signed up via OAuth)
      if (!user.password) {
        res.status(401).json({ message: "Please use social login for this account" });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Create session
      (req as any).login({ claims: { sub: user.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          res.status(500).json({ message: "Failed to sign in" });
          return;
        }
        res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  // Logout endpoint for email/password auth
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: "Failed to log out" });
        return;
      }
      req.session.destroy((err) => {
        if (err) {
          res.status(500).json({ message: "Failed to destroy session" });
          return;
        }
        res.json({ success: true });
      });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Usage and subscription routes
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getUserUsageSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage data" });
    }
  });

  app.get('/api/usage/check-job', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.checkCanCreateJob(userId);
      res.json(result);
    } catch (error) {
      console.error("Error checking job limit:", error);
      res.status(500).json({ message: "Failed to check job limit" });
    }
  });

  app.get('/api/usage/check-candidate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.checkCanAddCandidate(userId);
      res.json(result);
    } catch (error) {
      console.error("Error checking candidate limit:", error);
      res.status(500).json({ message: "Failed to check candidate limit" });
    }
  });

  app.get('/api/usage/check-ai-action', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId, serviceType } = req.query;
      if (!candidateId || !serviceType) {
        res.status(400).json({ message: "candidateId and serviceType are required" });
        return;
      }
      const result = await storage.checkCanUseAiAction(userId, candidateId as string, serviceType as string);
      res.json(result);
    } catch (error) {
      console.error("Error checking AI action limit:", error);
      res.status(500).json({ message: "Failed to check AI action limit" });
    }
  });

  app.post('/api/usage/increment-ai-action', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId, serviceType } = req.body;
      if (!candidateId || !serviceType) {
        res.status(400).json({ message: "candidateId and serviceType are required" });
        return;
      }
      const result = await storage.incrementAiActionUsage(userId, candidateId, serviceType);
      res.json(result);
    } catch (error) {
      console.error("Error incrementing AI action:", error);
      res.status(500).json({ message: "Failed to increment AI action" });
    }
  });

  app.post("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check job limit
      const canCreate = await storage.checkCanCreateJob(userId);
      if (!canCreate.allowed) {
        res.status(403).json({ 
          error: "Job limit reached",
          message: `You've reached your limit of ${canCreate.limit} active jobs. Please upgrade your plan or close existing jobs.`,
          current: canCreate.current,
          limit: canCreate.limit
        });
        return;
      }
      
      const jobData = insertJobSchema.parse(req.body);
      // Override userId with authenticated user's ID to prevent privilege escalation
      jobData.userId = userId;
      const job = await storage.createJob(jobData);
      await storage.incrementJobsCreated(userId);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create job" });
      }
    }
  });

  app.get("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobs(userId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const job = await storage.getJob(req.params.id, userId);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.patch("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rawData = req.body;
      
      // Coerce and validate the data before updating
      const jobData: Record<string, any> = {};
      
      if (rawData.title !== undefined) jobData.title = String(rawData.title);
      if (rawData.level !== undefined) jobData.level = String(rawData.level);
      if (rawData.location !== undefined) jobData.location = String(rawData.location);
      if (rawData.status !== undefined) jobData.status = String(rawData.status);
      if (rawData.description !== undefined) jobData.description = String(rawData.description);
      
      // Handle skills - convert string to array if needed
      if (rawData.skills !== undefined) {
        if (typeof rawData.skills === "string") {
          jobData.skills = rawData.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (Array.isArray(rawData.skills)) {
          jobData.skills = rawData.skills;
        }
      }
      
      // Parse salary values to numbers
      if (rawData.salaryMin !== undefined) {
        const parsed = parseInt(String(rawData.salaryMin), 10);
        if (!isNaN(parsed)) jobData.salaryMin = parsed;
      }
      if (rawData.salaryMax !== undefined) {
        const parsed = parseInt(String(rawData.salaryMax), 10);
        if (!isNaN(parsed)) jobData.salaryMax = parsed;
      }
      
      const job = await storage.updateJob(req.params.id, userId, jobData);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json(job);
    } catch (error) {
      console.error("Job update error:", error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteJob(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.post("/api/candidates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check candidate limit
      const canAdd = await storage.checkCanAddCandidate(userId);
      if (!canAdd.allowed) {
        res.status(403).json({ 
          error: "Candidate limit reached",
          message: `You've reached your limit of ${canAdd.limit} candidates this month. Please upgrade your plan.`,
          current: canAdd.current,
          limit: canAdd.limit
        });
        return;
      }
      
      const candidateData = insertCandidateSchema.parse(req.body);
      // Override userId with authenticated user's ID to prevent privilege escalation
      candidateData.userId = userId;
      const candidate = await storage.createCandidate(candidateData);
      await storage.incrementCandidatesAdded(userId);
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create candidate" });
      }
    }
  });

  app.get("/api/candidates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidates = await storage.getCandidates(userId);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/unread-notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadNotes = await storage.getCandidatesWithUnreadNotes(userId);
      res.json(unreadNotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread notes" });
    }
  });

  app.get("/api/candidates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidate = await storage.getCandidate(req.params.id, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate" });
    }
  });

  app.get("/api/candidates/:id/assessments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      // Verify candidate belongs to user first
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      const assessments = await storage.getCandidateAssessments(candidateId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate assessments" });
    }
  });

  app.post("/api/candidates/:id/mark-notes-viewed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      const candidate = await storage.markCandidateNotesAsViewed(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notes as viewed" });
    }
  });

  app.patch("/api/candidates/:id/stage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stage } = req.body;
      if (!stage || typeof stage !== "string") {
        res.status(400).json({ error: "Stage is required and must be a string" });
        return;
      }
      const candidate = await storage.updateCandidateStage(req.params.id, userId, stage);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update candidate stage" });
    }
  });

  app.patch("/api/candidates/:id/job", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobId } = req.body;
      if (jobId !== null && (typeof jobId !== "string" || jobId === "")) {
        res.status(400).json({ error: "jobId must be a string or null" });
        return;
      }
      if (jobId !== null) {
        const job = await storage.getJob(jobId, userId);
        if (!job) {
          res.status(404).json({ error: "Job not found" });
          return;
        }
      }
      const candidate = await storage.updateCandidateJobId(req.params.id, userId, jobId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update candidate job" });
    }
  });

  app.get("/api/jobs/:id/candidates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidates = await storage.getCandidatesByJobId(req.params.id, userId);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates for job" });
    }
  });

  app.get("/api/jobs-with-candidates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobsWithCounts = await storage.getJobsWithCandidateCounts(userId);
      res.json(jobsWithCounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs with candidate counts" });
    }
  });

  app.post("/api/interview-notes", async (req, res) => {
    try {
      const noteData = insertInterviewNoteSchema.parse(req.body);
      const note = await storage.createInterviewNote(noteData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create interview note" });
      }
    }
  });

  app.get("/api/interview-notes/:candidateId", async (req, res) => {
    try {
      const notes = await storage.getInterviewNotesByCandidateId(req.params.candidateId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interview notes" });
    }
  });

  app.post("/api/skills-test-recommendations", async (req, res) => {
    try {
      const recData = insertSkillsTestRecommendationSchema.parse(req.body);
      const recommendation = await storage.createSkillsTestRecommendation(recData);
      res.json(recommendation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create skills test recommendation" });
      }
    }
  });

  app.get("/api/skills-test-recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getSkillsTestRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills test recommendations" });
    }
  });

  app.patch("/api/skills-test-recommendations/:id/status", async (req, res) => {
    try {
      const { status, testId } = req.body;
      if (!status || typeof status !== "string") {
        res.status(400).json({ error: "Status is required and must be a string" });
        return;
      }
      const recommendation = await storage.updateSkillsTestRecommendationStatus(req.params.id, status, testId);
      if (!recommendation) {
        res.status(404).json({ error: "Recommendation not found" });
        return;
      }
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recommendation status" });
    }
  });

  app.post("/api/interview-recommendations", async (req, res) => {
    try {
      const recData = insertInterviewRecommendationSchema.parse(req.body);
      const recommendation = await storage.createInterviewRecommendation(recData);
      res.json(recommendation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create interview recommendation" });
      }
    }
  });

  app.get("/api/interview-recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getInterviewRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interview recommendations" });
    }
  });

  app.patch("/api/interview-recommendations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        res.status(400).json({ error: "Status is required and must be a string" });
        return;
      }
      const recommendation = await storage.updateInterviewRecommendationStatus(req.params.id, status);
      if (!recommendation) {
        res.status(404).json({ error: "Interview recommendation not found" });
        return;
      }
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update interview recommendation status" });
    }
  });

  // Complete an interview - saves scores, notes, and updates candidate stage
  app.post("/api/complete-interview", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recommendationId, candidateId, candidateName, averageScore, interviewSummary } = req.body;
      
      if (!recommendationId) {
        res.status(400).json({ error: "recommendationId is required" });
        return;
      }

      // Prepare interview summary string
      let summaryText = "";
      if (interviewSummary && interviewSummary.length > 0) {
        summaryText = JSON.stringify(interviewSummary);
      }

      // Update recommendation with score, summary, and completed status
      const recommendation = await storage.updateInterviewRecommendation(recommendationId, {
        status: "completed",
        interviewScore: averageScore || null,
        interviewSummary: summaryText || undefined,
        completedAt: new Date()
      });

      if (!recommendation) {
        res.status(404).json({ error: "Interview recommendation not found" });
        return;
      }

      // Update candidate stage to "interviewed" if candidateId is provided
      if (candidateId) {
        await storage.updateCandidateStage(candidateId, userId, "interviewed");
        
        // Save interview notes as a candidate note
        if (interviewSummary && interviewSummary.length > 0) {
          const noteSummary = interviewSummary
            .filter((q: any) => q.notes || q.score > 0)
            .map((q: any) => `[${q.category}] Score: ${q.score}/5\n${q.notes || "No notes"}`)
            .join("\n\n");
          
          if (noteSummary) {
            await storage.createCandidateNote({
              candidateId,
              content: `Interview Summary (Score: ${averageScore}%)\n\n${noteSummary}`,
              authorName: "Interview Assistant"
            });
          }
        }
      }

      res.json({ 
        success: true, 
        recommendation,
        message: `Interview for ${candidateName} completed successfully`
      });
    } catch (error) {
      console.error("Complete interview error:", error);
      res.status(500).json({ error: "Failed to complete interview" });
    }
  });

  // Scheduled interviews routes
  app.post("/api/scheduled-interviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interviewData = insertScheduledInterviewSchema.parse(req.body);
      interviewData.userId = userId;
      const interview = await storage.createScheduledInterview(interviewData);
      res.json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Create scheduled interview error:", error);
        res.status(500).json({ error: "Failed to schedule interview" });
      }
    }
  });

  app.get("/api/scheduled-interviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interviews = await storage.getScheduledInterviews(userId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled interviews" });
    }
  });

  app.get("/api/scheduled-interviews/candidate/:candidateId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interviews = await storage.getScheduledInterviewsByCandidateId(req.params.candidateId, userId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate interviews" });
    }
  });

  app.patch("/api/scheduled-interviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = insertScheduledInterviewSchema.partial().parse(req.body);
      const interview = await storage.updateScheduledInterview(req.params.id, userId, updateData);
      if (!interview) {
        res.status(404).json({ error: "Scheduled interview not found" });
        return;
      }
      res.json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update scheduled interview" });
      }
    }
  });

  app.delete("/api/scheduled-interviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteScheduledInterview(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Scheduled interview not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduled interview" });
    }
  });

  app.patch("/api/candidates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = insertCandidateSchema.partial().parse(req.body);
      // Strip userId from update data to prevent ownership transfer
      delete (updateData as any).userId;
      const candidate = await storage.updateCandidate(req.params.id, userId, updateData);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update candidate" });
      }
    }
  });

  app.post("/api/candidates/:id/notes", async (req, res) => {
    try {
      const noteData = insertCandidateNoteSchema.parse({
        ...req.body,
        candidateId: req.params.id
      });
      const note = await storage.createCandidateNote(noteData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create note" });
      }
    }
  });

  app.get("/api/candidates/:id/notes", async (req, res) => {
    try {
      const notes = await storage.getCandidateNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.delete("/api/candidates/:id/notes/:noteId", async (req, res) => {
    try {
      const deleted = await storage.deleteCandidateNote(req.params.noteId, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Note not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.post("/api/candidates/:id/documents", async (req, res) => {
    try {
      const docData = insertCandidateDocumentSchema.parse({
        ...req.body,
        candidateId: req.params.id
      });
      const document = await storage.createCandidateDocument(docData);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create document" });
      }
    }
  });

  app.get("/api/candidates/:id/documents", async (req, res) => {
    try {
      const documents = await storage.getCandidateDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.delete("/api/candidates/:id/documents/:docId", async (req, res) => {
    try {
      const deleted = await storage.deleteCandidateDocument(req.params.docId, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get("/api/candidates/:id/resume-analyses", async (req, res) => {
    try {
      const analyses = await storage.getResumeAnalysisByCandidateId(req.params.id);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resume analyses" });
    }
  });

  app.post("/api/resume-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const analysisData = insertResumeAnalysisSchema.parse(req.body);
      const analysis = await storage.createResumeAnalysis(analysisData);
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Failed to save resume analysis:", error);
        res.status(500).json({ error: "Failed to save resume analysis" });
      }
    }
  });

  app.delete("/api/candidates/:id/resume-analyses/:analysisId", async (req, res) => {
    try {
      const deleted = await storage.deleteResumeAnalysis(req.params.analysisId, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Resume analysis not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resume analysis" });
    }
  });

  async function extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error("Failed to extract text from Word document");
    }
  }

  async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = new Uint8Array(buffer);
      const pdf = await pdfjs.getDocument({ data }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
      
      return fullText.trim();
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  app.post("/api/upload-resume", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId } = req.body;
      const file = req.file;

      if (!candidateId || !file) {
        res.status(400).json({ error: "candidateId and file are required" });
        return;
      }

      let resumeText = "";
      const fileName = file.originalname;
      const fileExt = fileName.split(".").pop()?.toLowerCase();

      if (fileExt === "pdf") {
        resumeText = await extractTextFromPdf(file.buffer);
      } else if (fileExt === "docx" || fileExt === "doc") {
        resumeText = await extractTextFromDocx(file.buffer);
      } else {
        res.status(400).json({ error: "Only PDF and DOCX files are supported" });
        return;
      }

      if (!resumeText.trim()) {
        res.status(400).json({ error: "Could not extract text from file" });
        return;
      }

      // Store resume text in memory with candidateId as key
      resumeStore.set(candidateId, resumeText);

      const candidate = await storage.updateCandidate(candidateId, userId, { 
        resumeUrl: fileName
      });

      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Also save to the documents table for persistence
      await storage.createCandidateDocument({
        candidateId,
        fileName: fileName,
        fileType: fileExt || "unknown",
        fileUrl: fileName,
        documentType: "Resume",
        resumeText: resumeText
      });

      res.json({ success: true, fileName, resumeText, candidate });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload resume" });
    }
  });

  app.get("/api/resume/:candidateId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidate = await storage.getCandidate(req.params.candidateId, userId);
      if (!candidate || !candidate.resumeUrl) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }
      // First try in-memory, then fall back to database
      let resumeText = resumeStore.get(req.params.candidateId);
      if (!resumeText) {
        const documents = await storage.getCandidateDocuments(req.params.candidateId);
        const resumeDoc = documents.find(d => d.documentType === "Resume" && d.resumeText);
        resumeText = resumeDoc?.resumeText || "[Resume text not available]";
      }
      res.json({ candidateId: candidate.id, resumeUrl: candidate.resumeUrl, resumeText });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resume" });
    }
  });

  app.post("/api/analyze-resume", async (req, res) => {
    try {
      const { resumeText, jobDescription, jobSkills, jobTitle, jobLevel, candidateId, jobId } = req.body;
      
      if (!resumeText) {
        res.status(400).json({ error: "Resume text is required" });
        return;
      }

      const skillsList = jobSkills || [];
      const jobContext = jobDescription || `Job: ${jobTitle || "Unknown"}, Level: ${jobLevel || "Unknown"}, Skills: ${skillsList.join(", ")}`;

      // Import and use the multi-pass analyzer
      const { analyzeResumeMultiPass } = await import("./resume-analyzer");
      
      const result = await analyzeResumeMultiPass(
        resumeText,
        jobContext,
        skillsList,
        jobTitle || "Unknown",
        jobLevel || "Unknown"
      );
      
      if (candidateId) {
        try {
          await storage.createResumeAnalysis({
            candidateId,
            jobId: jobId || null,
            jobTitle: jobTitle || null,
            fitScore: result.fitScore,
            logicScore: result.logicScore,
            matchedSkills: result.skillMatch?.matched || [],
            missingSkills: result.skillMatch?.missing || [],
            extraSkills: result.skillMatch?.extra || [],
            findings: JSON.stringify(result.findings || []),
            summary: result.summary || "",
            authenticitySignals: result.authenticitySignals ? JSON.stringify(result.authenticitySignals) : null,
            status: "completed"
          });
        } catch (saveError) {
          console.error("Failed to save analysis to database:", saveError);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Resume analysis error:", error);
      res.status(500).json({ error: "Failed to analyze resume" });
    }
  });

  app.post("/api/generate-skills-test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roleName, difficulty, skills, questionCount, jobDescription, timePerQuestion } = req.body;
      
      if (!roleName || !difficulty || !skills) {
        res.status(400).json({ error: "Missing required fields: roleName, difficulty, skills" });
        return;
      }

      const numQuestions = parseInt(questionCount) || 5;
      const questionTimeLimit = parseInt(timePerQuestion) || 15;

      const jobContext = jobDescription 
        ? `\n\nJob Description for context:\n${jobDescription}\n\nUse the specific responsibilities and requirements from this job description to make questions highly relevant.`
        : '';

      const prompt = `You are a senior hiring manager creating a TIMED multiple-choice skills assessment for a ${roleName} position at the ${difficulty} level.

IMPORTANT: This is a TIMED test with ${questionTimeLimit} seconds per question. All questions MUST be multiple choice only - no open text questions. Questions should be answerable within the time limit without external research.

Skills to assess: ${skills}${jobContext}

## Question Format Requirements:

Each question must have exactly 4 answer options with TWO correct answers of different quality:
- bestAnswerIndex: The BEST answer (scores 100%) - the optimal professional response
- goodAnswerIndex: A GOOD answer (scores 70%) - acceptable but not ideal
- The other 2 options are WRONG (score 0%)

## Question Types to Generate:

1. **Situational Judgment**: Present a realistic workplace scenario. "What would you do if..." or "How would you handle..."
   - Best answer = optimal professional response
   - Good answer = acceptable but not ideal approach

2. **Practical Application**: Test decision-making in role-specific contexts.
   - Best answer = most efficient/effective approach
   - Good answer = works but has drawbacks

3. **Knowledge Application**: Apply knowledge to real scenarios (not pure trivia).
   - Best answer = demonstrates deep understanding
   - Good answer = shows basic competency

## Requirements:
- ALL ${numQuestions} questions must be multiple_choice type
- Questions must be specific to the ${roleName} role
- All 4 options should be plausible (no obviously wrong answers)
- Questions should be answerable in ${questionTimeLimit} seconds without research
- bestAnswerIndex and goodAnswerIndex must be different values (0-3)
- Difficulty should match ${difficulty} level expectations

Respond with JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "text": "Scenario-based question here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "bestAnswerIndex": 0,
      "goodAnswerIndex": 2,
      "skill": "primary skill being tested"
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      
      // Validate and ensure all questions are multiple choice with weighted answers
      const validatedQuestions = (result.questions || []).map((q: any, idx: number) => {
        // Ensure type is multiple_choice
        if (q.type !== "multiple_choice" || !Array.isArray(q.options) || q.options.length !== 4) {
          return null; // Invalid question
        }
        // Ensure bestAnswerIndex and goodAnswerIndex exist and are valid
        if (typeof q.bestAnswerIndex !== "number" || q.bestAnswerIndex < 0 || q.bestAnswerIndex > 3) {
          q.bestAnswerIndex = 0; // Default to first option
        }
        if (typeof q.goodAnswerIndex !== "number" || q.goodAnswerIndex < 0 || q.goodAnswerIndex > 3 || q.goodAnswerIndex === q.bestAnswerIndex) {
          q.goodAnswerIndex = q.bestAnswerIndex === 0 ? 1 : 0; // Default to different option
        }
        
        // Shuffle options to randomize answer positions
        const optionsWithIndices = q.options.map((opt: string, i: number) => ({ text: opt, originalIndex: i }));
        for (let i = optionsWithIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
        }
        
        // Find new positions of best and good answers after shuffle
        const newBestIndex = optionsWithIndices.findIndex((opt: any) => opt.originalIndex === q.bestAnswerIndex);
        const newGoodIndex = optionsWithIndices.findIndex((opt: any) => opt.originalIndex === q.goodAnswerIndex);
        const shuffledOptions = optionsWithIndices.map((opt: any) => opt.text);
        
        return {
          id: q.id || idx + 1,
          type: "multiple_choice" as const,
          text: q.text,
          options: shuffledOptions,
          bestAnswerIndex: newBestIndex,
          goodAnswerIndex: newGoodIndex,
          skill: q.skill || skills.split(",")[0]?.trim() || "general",
        };
      }).filter(Boolean);
      
      if (validatedQuestions.length === 0) {
        throw new Error("No valid questions generated");
      }
      
      const skillsArray = skills.split(",").map((s: string) => s.trim());
      
      // Save test to database with timePerQuestion
      const savedTest = await storage.createSkillsTest({
        roleName,
        difficulty,
        skills: skillsArray,
        questions: JSON.stringify(validatedQuestions),
        status: "active",
        timePerQuestion: questionTimeLimit,
        userId,
      });
      
      res.json({
        id: savedTest.id,
        roleName: savedTest.roleName,
        skills: savedTest.skills,
        questions: validatedQuestions,
        status: savedTest.status,
        timePerQuestion: savedTest.timePerQuestion,
        candidatesCompleted: 0,
        avgScore: 0,
      });
    } catch (error) {
      console.error("Skills test generation error:", error);
      res.status(500).json({ error: "Failed to generate skills test" });
    }
  });

  // Helper function to calculate realistic salary ranges based on level and location
  function calculateRealisticSalary(level: string, location: string): { min: number; max: number } {
    // Base ranges by level (conservative market rates for 2024)
    const baseSalaries: Record<string, { min: number; max: number }> = {
      "Junior": { min: 50000, max: 75000 },
      "Mid": { min: 75000, max: 110000 },
      "Senior": { min: 100000, max: 150000 },
      "Lead": { min: 130000, max: 180000 },
    };

    // Location multipliers
    const locationMultipliers: Record<string, number> = {
      "Remote": 1.0,
      "Hybrid": 1.05,
      "Onsite": 1.1,
      "On-site": 1.1,
    };

    const baseRange = baseSalaries[level] || baseSalaries["Mid"];
    const multiplier = locationMultipliers[location] || 1.0;

    return {
      min: Math.round(baseRange.min * multiplier),
      max: Math.round(baseRange.max * multiplier),
    };
  }

  app.post("/api/research-job-description", async (req, res) => {
    try {
      const { title, level, location, skills } = req.body;
      
      if (!title || !level || !location) {
        res.status(400).json({ error: "Missing required fields: title, level, location" });
        return;
      }

      const prompt = `You are an expert HR recruiter with access to thousands of real job postings. Research and provide key elements from real-world job descriptions for this role:

Job Title: ${title}
Level: ${level}
Location Type: ${location}
Skills: ${skills || "Not specified"}

Based on your knowledge of actual job postings for similar roles, provide:
1. Common responsibilities found in real ${title} job descriptions
2. Typical requirements and qualifications employers ask for
3. Popular benefits and perks companies offer for this role
4. Industry-standard phrases and keywords used in these postings
5. Unique selling points that make job postings stand out

Format your response as JSON:
{
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "requirements": ["requirement 1", "requirement 2", ...],
  "benefits": ["benefit 1", "benefit 2", ...],
  "keywords": ["keyword 1", "keyword 2", ...],
  "uniqueSellingPoints": ["USP 1", "USP 2", ...],
  "summary": "A brief summary of what makes a great job posting for this role"
}

Be specific and practical - these should reflect what real companies actually include in their postings.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Job research error:", error);
      res.status(500).json({ error: "Failed to research job description" });
    }
  });

  app.post("/api/generate-job-description", async (req, res) => {
    try {
      const { title, level, location, skills, notes } = req.body;
      
      if (!title || !level || !location || !skills) {
        res.status(400).json({ error: "Missing required fields: title, level, location, skills" });
        return;
      }

      const prompt = `You are an expert HR professional and technical recruiter. Generate a professional, engaging job description for the following role:

Job Title: ${title}
Level: ${level}
Location: ${location}
Required Skills: ${skills}
${notes ? `Additional Notes: ${notes}` : ''}

Please provide a compelling job description with sections for: About the Role, Key Responsibilities, Requirements, and Why Join Us.

Format your response as JSON with exactly this structure:
{
  "description": "The full job description text with markdown formatting"
}

Make the description professional but engaging. Use bullet points for responsibilities and requirements.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      const salaryRange = calculateRealisticSalary(level, location);
      
      res.json({
        description: result.description,
        salaryRange,
      });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: "Failed to generate job description" });
    }
  });

  // Delete skills test recommendation
  app.delete("/api/skills-test-recommendations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSkillsTestRecommendation(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Recommendation not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recommendation" });
    }
  });

  // Skills Tests CRUD
  app.post("/api/skills-tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const testData = insertSkillsTestSchema.parse(req.body);
      // Override userId with authenticated user's ID to prevent privilege escalation
      testData.userId = userId;
      const test = await storage.createSkillsTest(testData);
      res.json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create skills test" });
      }
    }
  });

  app.get("/api/skills-tests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tests = await storage.getSkillsTests(userId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills tests" });
    }
  });

  app.get("/api/skills-tests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const test = await storage.getSkillsTest(req.params.id, userId);
      if (!test) {
        res.status(404).json({ error: "Skills test not found" });
        return;
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills test" });
    }
  });

  // Skills Test Invitations
  app.post("/api/skills-test-invitations", async (req, res) => {
    try {
      const { testId, candidateId, candidateName, candidateEmail, jobTitle } = req.body;
      
      // Generate unique token for public access
      const token = randomBytes(32).toString("hex");
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitationData = {
        testId,
        candidateId: candidateId || null,
        candidateName,
        candidateEmail,
        jobTitle,
        token,
        status: "pending",
        sentAt: new Date(),
        expiresAt,
      };
      
      const invitation = await storage.createSkillsTestInvitation(invitationData);
      res.json(invitation);
    } catch (error) {
      console.error("Create invitation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create invitation" });
      }
    }
  });

  app.get("/api/skills-test-invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitations = await storage.getSkillsTestInvitationsByUserId(userId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Get recent completed invitations (limited) - must be before /:id route
  app.get("/api/skills-test-invitations/recent-completed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 5;
      const invitations = await storage.getRecentCompletedInvitationsByUserId(userId, limit);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent completed invitations" });
    }
  });

  app.get("/api/skills-test-invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitation = await storage.getSkillsTestInvitation(req.params.id);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      // Verify ownership through the test
      const test = await storage.getSkillsTest(invitation.testId, userId);
      if (!test) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  app.get("/api/candidates/:id/skills-test-invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify candidate belongs to user
      const candidate = await storage.getCandidate(req.params.id, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      const invitations = await storage.getSkillsTestInvitationsByCandidateId(req.params.id);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate invitations" });
    }
  });

  // Public endpoint - Get test by token (no auth required)
  app.get("/api/public/skills-test/:token", async (req, res) => {
    try {
      const invitation = await storage.getSkillsTestInvitationByToken(req.params.token);
      if (!invitation) {
        res.status(404).json({ error: "Test not found or link expired" });
        return;
      }
      
      // Check if expired
      if (new Date() > new Date(invitation.expiresAt)) {
        res.status(410).json({ error: "This test link has expired" });
        return;
      }
      
      // Check if already completed
      if (invitation.status === "completed") {
        res.status(410).json({ error: "This test has already been completed" });
        return;
      }
      
      // Get the actual test questions (using internal method for public access)
      const test = await storage.getSkillsTestById(invitation.testId);
      if (!test) {
        res.status(404).json({ error: "Test not found" });
        return;
      }
      
      // Return invitation info plus test questions
      res.json({
        invitation: {
          id: invitation.id,
          candidateName: invitation.candidateName,
          jobTitle: invitation.jobTitle,
          status: invitation.status,
        },
        test: {
          roleName: test.roleName,
          difficulty: test.difficulty,
          skills: test.skills,
          questions: JSON.parse(test.questions),
          timePerQuestion: test.timePerQuestion || 15,
        },
      });
    } catch (error) {
      console.error("Public test fetch error:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  // Public endpoint - Submit test answers (no auth required)
  app.post("/api/public/skills-test/:token/submit", async (req, res) => {
    try {
      // Accept both "answers" and "responses" for flexibility
      const answers = req.body.answers || req.body.responses;
      
      if (!answers || !Array.isArray(answers)) {
        res.status(400).json({ error: "Answers array is required" });
        return;
      }
      
      const invitation = await storage.getSkillsTestInvitationByToken(req.params.token);
      if (!invitation) {
        res.status(404).json({ error: "Test not found or link expired" });
        return;
      }
      
      // Check if expired
      if (new Date() > new Date(invitation.expiresAt)) {
        res.status(410).json({ error: "This test link has expired" });
        return;
      }
      
      // Check if already completed
      if (invitation.status === "completed") {
        res.status(410).json({ error: "This test has already been completed" });
        return;
      }
      
      // Get test for scoring (using internal method for public access)
      const test = await storage.getSkillsTestById(invitation.testId);
      if (!test) {
        res.status(404).json({ error: "Test not found" });
        return;
      }
      
      const questions = JSON.parse(test.questions);
      const savedResponses: { id: string; questionIndex: number; answer: string; question: any }[] = [];
      
      // First, save all responses
      for (const answer of answers) {
        const question = questions[answer.questionIndex];
        const response = await storage.createSkillsTestResponse({
          invitationId: invitation.id,
          questionIndex: answer.questionIndex,
          questionText: question?.text || "",
          answer: answer.answer,
          score: null,
        });
        savedResponses.push({ 
          id: response.id, 
          questionIndex: answer.questionIndex, 
          answer: answer.answer, 
          question 
        });
      }
      
      // Update invitation to completed immediately
      await storage.updateSkillsTestInvitation(invitation.id, {
        status: "completed",
        completedAt: new Date(),
      });
      
      // Update recommendation status to completed
      await storage.updateSkillsTestRecommendationStatusByTestId(invitation.testId, "completed");
      
      // Score responses in the background
      (async () => {
        try {
          let totalScore = 0;
          let scoredCount = 0;
          
          for (const item of savedResponses) {
            const { id, answer, question } = item;
            let score: number | null = null;
            
            if (question) {
              if (question.type === "multiple_choice") {
                // For multiple choice: check weighted answers (bestAnswerIndex = 100%, goodAnswerIndex = 70%)
                if (question.bestAnswerIndex !== undefined && question.goodAnswerIndex !== undefined && question.options) {
                  const bestOptionText = question.options[question.bestAnswerIndex];
                  const goodOptionText = question.options[question.goodAnswerIndex];
                  if (answer === bestOptionText) {
                    score = 100;
                  } else if (answer === goodOptionText) {
                    score = 70;
                  } else {
                    score = 0;
                  }
                  totalScore += score;
                  scoredCount++;
                } else if (question.correctAnswer !== undefined && question.options) {
                  // Legacy: single correct answer
                  const correctOptionText = question.options[question.correctAnswer];
                  score = answer === correctOptionText ? 100 : 0;
                  totalScore += score;
                  scoredCount++;
                } else if (question.options) {
                  // No correct answer defined, use AI to evaluate the response
                  try {
                    const mcGradingPrompt = `You are grading a multiple choice skills test response.

Question: ${question.text}
Skill being assessed: ${question.skill || "general knowledge"}

Available options:
${question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}

Candidate's chosen answer: "${answer}"

Evaluate if the candidate chose the BEST answer for this question. Consider:
- Which option best demonstrates the assessed skill
- Which option reflects best professional practice
- Which option is most appropriate for the scenario

If the candidate chose the best or an excellent answer: score 90-100
If the candidate chose a good but not optimal answer: score 60-80
If the candidate chose a mediocre answer: score 30-50
If the candidate chose a poor or incorrect answer: score 0-20

Respond with ONLY a number between 0 and 100.`;

                    const result = await openai.chat.completions.create({
                      model: "gpt-4o",
                      messages: [{ role: "user", content: mcGradingPrompt }],
                      max_tokens: 10,
                      temperature: 0.1,
                    });
                    
                    const scoreText = result.choices[0]?.message?.content?.trim() || "50";
                    score = Math.min(100, Math.max(0, parseInt(scoreText) || 50));
                    totalScore += score;
                    scoredCount++;
                  } catch (e) {
                    console.error("AI MC grading error:", e);
                    score = 50;
                    totalScore += score;
                    scoredCount++;
                  }
                } else {
                  score = answer ? 50 : 0;
                  totalScore += score;
                  scoredCount++;
                }
              } else if (question.type === "open_text") {
                // Use AI to grade open-text responses
                try {
                  const gradingPrompt = `You are grading a skills test response. 

Question: ${question.text}
Skill being assessed: ${question.skill || "general knowledge"}

Candidate's Answer: "${answer}"

Grade this response on a scale of 0-100 based on:
- Relevance to the question
- Depth and specificity of the answer
- Demonstration of the assessed skill
- Professional quality of the response

Very short answers like "yes", "no", or single words should receive low scores (0-20).
Generic or vague answers should receive moderate scores (30-50).
Detailed, specific, and well-reasoned answers should receive high scores (70-100).

Respond with ONLY a number between 0 and 100.`;

                  const result = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: gradingPrompt }],
                    max_tokens: 10,
                    temperature: 0.1,
                  });
                  
                  const scoreText = result.choices[0]?.message?.content?.trim() || "50";
                  score = Math.min(100, Math.max(0, parseInt(scoreText) || 50));
                  totalScore += score;
                  scoredCount++;
                } catch (e) {
                  console.error("AI grading error:", e);
                  score = 50; // Default score on error
                  totalScore += score;
                  scoredCount++;
                }
              }
            }
            
            // Update response with score
            if (score !== null) {
              await storage.updateSkillsTestResponse(id, { score });
            }
          }
          
          // Update final score on invitation
          const finalScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : null;
          if (finalScore !== null) {
            await storage.updateSkillsTestInvitation(invitation.id, { score: finalScore });
            // Update candidate's test score in their profile
            if (invitation.candidateId) {
              await storage.updateCandidateTestScore(invitation.candidateId, finalScore);
            }
          }
        } catch (e) {
          console.error("Background scoring error:", e);
        }
      })();
      
      res.json({ 
        success: true, 
        message: "Test submitted successfully. Scoring in progress.",
      });
    } catch (error) {
      console.error("Test submission error:", error);
      res.status(500).json({ error: "Failed to submit test" });
    }
  });

  // Get test responses by invitation
  app.get("/api/skills-test-invitations/:id/responses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitation = await storage.getSkillsTestInvitation(req.params.id);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      // Verify ownership through the test
      const test = await storage.getSkillsTest(invitation.testId, userId);
      if (!test) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      const responses = await storage.getSkillsTestResponsesByInvitationId(req.params.id);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test responses" });
    }
  });

  // Rescore a completed test invitation
  app.post("/api/skills-test-invitations/:id/rescore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitation = await storage.getSkillsTestInvitation(req.params.id);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      // Verify ownership through the test
      const test = await storage.getSkillsTest(invitation.testId, userId);
      if (!test) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      if (invitation.status !== "completed") {
        res.status(400).json({ error: "Can only rescore completed tests" });
        return;
      }

      const questions = JSON.parse(test.questions);
      const responses = await storage.getSkillsTestResponsesByInvitationId(invitation.id);
      
      let totalScore = 0;
      let scoredCount = 0;

      for (const response of responses) {
        const question = questions[response.questionIndex];
        let score: number | null = null;

        if (question) {
          if (question.type === "multiple_choice") {
            // For multiple choice: check weighted answers (bestAnswerIndex = 100%, goodAnswerIndex = 70%)
            if (question.bestAnswerIndex !== undefined && question.goodAnswerIndex !== undefined && question.options) {
              const bestOptionText = question.options[question.bestAnswerIndex];
              const goodOptionText = question.options[question.goodAnswerIndex];
              if (response.answer === bestOptionText) {
                score = 100;
              } else if (response.answer === goodOptionText) {
                score = 70;
              } else {
                score = 0;
              }
              totalScore += score;
              scoredCount++;
            } else if (question.correctAnswer !== undefined && question.options) {
              // Legacy: single correct answer
              const correctOptionText = question.options[question.correctAnswer];
              score = response.answer === correctOptionText ? 100 : 0;
              totalScore += score;
              scoredCount++;
            } else if (question.options) {
              // No correct answer defined, use AI to evaluate the response
              try {
                const mcGradingPrompt = `You are grading a multiple choice skills test response.

Question: ${question.text}
Skill being assessed: ${question.skill || "general knowledge"}

Available options:
${question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}

Candidate's chosen answer: "${response.answer}"

Evaluate if the candidate chose the BEST answer for this question. Consider:
- Which option best demonstrates the assessed skill
- Which option reflects best professional practice
- Which option is most appropriate for the scenario

If the candidate chose the best or an excellent answer: score 90-100
If the candidate chose a good but not optimal answer: score 60-80
If the candidate chose a mediocre answer: score 30-50
If the candidate chose a poor or incorrect answer: score 0-20

Respond with ONLY a number between 0 and 100.`;

                const result = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [{ role: "user", content: mcGradingPrompt }],
                  max_tokens: 10,
                  temperature: 0.1,
                });
                
                const scoreText = result.choices[0]?.message?.content?.trim() || "50";
                score = Math.min(100, Math.max(0, parseInt(scoreText) || 50));
                totalScore += score;
                scoredCount++;
              } catch (e) {
                console.error("AI MC grading error:", e);
                score = 50;
                totalScore += score;
                scoredCount++;
              }
            } else {
              score = response.answer ? 50 : 0;
              totalScore += score;
              scoredCount++;
            }
          } else if (question.type === "open_text") {
            try {
              const gradingPrompt = `You are grading a skills test response. 

Question: ${question.text}
Skill being assessed: ${question.skill || "general knowledge"}

Candidate's Answer: "${response.answer}"

Grade this response on a scale of 0-100 based on:
- Relevance to the question
- Depth and specificity of the answer
- Demonstration of the assessed skill
- Professional quality of the response

Very short answers like "yes", "no", or single words should receive low scores (0-20).
Generic or vague answers should receive moderate scores (30-50).
Detailed, specific, and well-reasoned answers should receive high scores (70-100).

Respond with ONLY a number between 0 and 100.`;

              const result = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: gradingPrompt }],
                max_tokens: 10,
                temperature: 0.1,
              });
              
              const scoreText = result.choices[0]?.message?.content?.trim() || "50";
              score = Math.min(100, Math.max(0, parseInt(scoreText) || 50));
              totalScore += score;
              scoredCount++;
            } catch (e) {
              console.error("AI grading error:", e);
              score = 50;
              totalScore += score;
              scoredCount++;
            }
          }
        }

        if (score !== null) {
          await storage.updateSkillsTestResponse(response.id, { score });
        }
      }

      const finalScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : undefined;
      await storage.updateSkillsTestInvitation(invitation.id, { score: finalScore });
      
      // Update candidate's test score in their profile
      if (finalScore !== undefined && invitation.candidateId) {
        await storage.updateCandidateTestScore(invitation.candidateId, finalScore);
      }

      res.json({ success: true, score: finalScore });
    } catch (error) {
      console.error("Rescore error:", error);
      res.status(500).json({ error: "Failed to rescore test" });
    }
  });

  // Generate AI-powered interview questions based on resume, test results, and AI detection
  app.post("/api/generate-interview-questions", async (req, res) => {
    try {
      const { candidateId, candidateName, jobTitle, testScore, strengths, weaknesses, recommendationId } = req.body;
      
      if (!candidateName || !jobTitle) {
        res.status(400).json({ error: "candidateName and jobTitle are required" });
        return;
      }

      // Gather all available data about the candidate
      let resumeText = "";
      let resumeAnalysisData: any = null;
      let testResponses: any[] = [];
      let skillsTestInfo: any = null;
      
      // Derived strengths and weaknesses from actual data
      let derivedStrengths: string[] = strengths || [];
      let derivedWeaknesses: string[] = weaknesses || [];

      if (candidateId) {
        // Get resume text from documents
        const documents = await storage.getCandidateDocuments(candidateId);
        const resumeDoc = documents.find(d => d.documentType === "Resume" && d.resumeText);
        resumeText = resumeDoc?.resumeText || resumeStore.get(candidateId) || "";

        // Get resume analysis (includes AI detection signals)
        const analyses = await storage.getResumeAnalysisByCandidateId(candidateId);
        if (analyses.length > 0) {
          resumeAnalysisData = analyses[0]; // Most recent analysis
          // Derive strengths from matched skills
          if (resumeAnalysisData.matchedSkills && resumeAnalysisData.matchedSkills.length > 0) {
            derivedStrengths = Array.from(new Set([...derivedStrengths, ...resumeAnalysisData.matchedSkills]));
          }
          // Derive weaknesses from missing skills
          if (resumeAnalysisData.missingSkills && resumeAnalysisData.missingSkills.length > 0) {
            derivedWeaknesses = Array.from(new Set([...derivedWeaknesses, ...resumeAnalysisData.missingSkills]));
          }
        }

        // Get test responses and skills test info
        const invitations = await storage.getSkillsTestInvitationsByCandidateId(candidateId);
        const completedInvitation = invitations.find(inv => inv.status === "completed");
        if (completedInvitation) {
          testResponses = await storage.getSkillsTestResponsesByInvitationId(completedInvitation.id);
          const test = await storage.getSkillsTestById(completedInvitation.testId);
          if (test) {
            skillsTestInfo = {
              roleName: test.roleName,
              skills: test.skills,
              questions: JSON.parse(test.questions)
            };
            
            // Analyze test responses to derive strengths/weaknesses
            const questionPerformance: Record<string, { total: number; scored: number }> = {};
            testResponses.forEach((r) => {
              const question = skillsTestInfo.questions[r.questionIndex];
              if (question && r.score !== null) {
                const skill = question.skill || "General";
                if (!questionPerformance[skill]) {
                  questionPerformance[skill] = { total: 0, scored: 0 };
                }
                questionPerformance[skill].total += r.score;
                questionPerformance[skill].scored += 1;
              }
            });
            
            // Skills with high scores are strengths, low scores are weaknesses
            for (const [skill, perf] of Object.entries(questionPerformance)) {
              const avg = perf.scored > 0 ? perf.total / perf.scored : 0;
              if (avg >= 75 && !derivedStrengths.includes(skill)) {
                derivedStrengths.push(skill);
              } else if (avg < 50 && !derivedWeaknesses.includes(skill)) {
                derivedWeaknesses.push(skill);
              }
            }
          }
        }
      }

      // Build the AI prompt with all available context
      const prompt = `You are a senior HR professional and expert interviewer. Generate personalized interview questions for a candidate based on their resume, test performance, and authenticity signals.

CANDIDATE INFORMATION:
Name: ${candidateName}
Position: ${jobTitle}
Test Score: ${testScore ? `${testScore}%` : "Not available"}

${derivedStrengths.length > 0 ? `IDENTIFIED STRENGTHS:\n${derivedStrengths.join(", ")}` : ""}

${derivedWeaknesses.length > 0 ? `AREAS TO PROBE:\n${derivedWeaknesses.join(", ")}` : ""}

${resumeText ? `RESUME CONTENT:\n${resumeText.substring(0, 3000)}${resumeText.length > 3000 ? "..." : ""}` : "No resume available"}

${resumeAnalysisData ? `
RESUME ANALYSIS:
- Fit Score: ${resumeAnalysisData.fitScore}%
- Logic/Risk Score: ${resumeAnalysisData.logicScore}%
- Matched Skills: ${resumeAnalysisData.matchedSkills?.join(", ") || "None"}
- Missing Skills: ${resumeAnalysisData.missingSkills?.join(", ") || "None"}
${resumeAnalysisData.authenticitySignals ? `
AI DETECTION SIGNALS:
${JSON.stringify(JSON.parse(resumeAnalysisData.authenticitySignals), null, 2)}` : ""}
` : ""}

${testResponses.length > 0 && skillsTestInfo ? `
SKILLS TEST PERFORMANCE:
${testResponses.map((r, idx) => {
  const question = skillsTestInfo.questions[r.questionIndex];
  return `Q${idx + 1}: "${question?.text || r.questionText}"
   Answer: "${r.answer}"
   Score: ${r.score !== null ? `${r.score}%` : "Not scored"}`;
}).join("\n\n")}
` : ""}

GENERATE INTERVIEW QUESTIONS IN THESE CATEGORIES:

1. **Resume Verification Questions (3 questions)**: 
   - Ask for specific details about claimed achievements that would be difficult to fabricate
   - Probe for concrete numbers, names, timelines, and challenges faced
   - Focus on areas that seem potentially AI-generated or embellished
   - Ask "How" and "Why" questions rather than "What" questions

2. **AI Detection Probing Questions (2 questions)**:
   - If AI signals are high, ask questions that require genuine personal experience
   - Ask for stories about failures, mistakes, or unexpected challenges
   - Request specific anecdotes that only someone with real experience would know
   - These should be impossible to answer well with generic AI-generated content

3. **Skills Gap Questions (2 questions)**:
   - Based on missing skills or weak test performance areas
   - Explore how they would handle scenarios requiring those skills
   - Assess learning ability and adaptability

4. **Technical Depth Questions (2 questions)**:
   - Based on their strongest claimed skills
   - Go deeper than surface-level to verify genuine expertise
   - Ask about edge cases, trade-offs, or real-world complications

5. **Behavioral & Cultural Questions (2 questions)**:
   - Standard behavioral questions adapted to role
   - Focus on teamwork, communication, and problem-solving

For each question, provide:
- The question text
- Category (resume_verification, ai_detection, skills_gap, technical_depth, behavioral)
- A rubric explaining what a strong answer looks like vs red flags

Respond in this exact JSON format:
{
  "questions": [
    {
      "id": 1,
      "category": "resume_verification",
      "text": "The question text...",
      "rubric": "What to look for in a good answer...",
      "redFlags": "Warning signs of fabrication or AI content..."
    }
  ],
  "overallGuidance": "Brief guidance for the interviewer about this candidate..."
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        throw new Error("Invalid AI response format");
      }

      // Validate and ensure we have questions
      const questions = Array.isArray(result.questions) ? result.questions : [];
      
      // Validate each question has required fields
      const validatedQuestions = questions.map((q: any, idx: number) => ({
        id: q.id || idx + 1,
        category: q.category || "behavioral",
        text: q.text || "Tell me about your experience.",
        rubric: q.rubric || "Look for specific examples and depth of understanding.",
        redFlags: q.redFlags || null,
      })).filter((q: any) => q.text && q.text.length > 0);

      // If no valid questions, provide fallback questions
      const finalQuestions = validatedQuestions.length > 0 ? validatedQuestions : [
        {
          id: 1,
          category: "behavioral",
          text: "Tell me about a challenging project you worked on. What was your role and what did you accomplish?",
          rubric: "Look for specific examples, clear role definition, and measurable outcomes.",
          redFlags: "Vague answers, inability to provide specifics, or confusion about their own contributions."
        },
        {
          id: 2,
          category: "technical_depth",
          text: "Describe a technical problem you solved recently. What trade-offs did you consider?",
          rubric: "Look for technical understanding, awareness of constraints, and clear explanation.",
          redFlags: "Surface-level answers without technical depth or inability to explain trade-offs."
        },
        {
          id: 3,
          category: "resume_verification",
          text: "You mentioned [a specific achievement] on your resume. Can you walk me through exactly how you achieved that?",
          rubric: "Look for concrete details, timelines, and specific challenges overcome.",
          redFlags: "Generic answers or inability to provide specifics about their own claimed achievements."
        }
      ];

      // Parse AI detection level safely
      let aiDetectionLevel: number | null = null;
      if (resumeAnalysisData?.authenticitySignals) {
        try {
          const signals = JSON.parse(resumeAnalysisData.authenticitySignals);
          aiDetectionLevel = typeof signals.aiStyleLikelihood === "number" ? signals.aiStyleLikelihood : null;
        } catch {
          aiDetectionLevel = null;
        }
      }
      
      // Save the generated questions to the recommendation if recommendationId is provided
      if (recommendationId) {
        const questionTexts = finalQuestions.map((q: any) => q.text);
        await storage.updateInterviewRecommendation(recommendationId, {
          recommendedQuestions: questionTexts,
          strengths: derivedStrengths,
          weaknesses: derivedWeaknesses,
          status: "interview_started"
        });
      }
      
      res.json({
        questions: finalQuestions,
        overallGuidance: result.overallGuidance || "Focus on verifying specific claims and look for concrete examples from the candidate's experience.",
        candidateContext: {
          hasResume: !!resumeText,
          hasAnalysis: !!resumeAnalysisData,
          hasTestResults: testResponses.length > 0,
          aiDetectionLevel
        }
      });
    } catch (error) {
      console.error("Interview questions generation error:", error);
      res.status(500).json({ error: "Failed to generate interview questions" });
    }
  });

  return httpServer;
}
