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
  insertScheduledInterviewSchema,
  references,
  type PlanType
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import pg from "pg";
import { randomBytes } from "crypto";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL_MAP: Record<string, string> = {
  "resume_analysis": "gpt-4o",
  "ai_detection": "gpt-4o",
  "job_description": "gpt-4o-mini",
  "skills_test": "gpt-4o-mini",
  "interview_questions": "gpt-4o-mini",
  "onboarding_plan": "gpt-4o-mini",
  "policy_generation": "gpt-4o-mini",
  "performance_goals": "gpt-4o-mini",
  "reference_check": "gpt-4o-mini",
  "default": "gpt-4o-mini",
};

type ChatCompletionParams = Omit<Parameters<typeof openai.chat.completions.create>[0], "model" | "stream">;

export async function callAI(
  purpose: string = "default",
  params: ChatCompletionParams
) {
  const model = MODEL_MAP[purpose] || MODEL_MAP["default"];
  return openai.chat.completions.create({ model, stream: false, ...params });
}

const upload = multer({ storage: multer.memoryStorage() });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Persistent file storage directory - base uploads folder
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Strict regex for safe IDs (UUID format or alphanumeric with hyphens/underscores)
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Security helper: validate ID is safe (no path traversal characters)
function isSafeId(id: string): boolean {
  return SAFE_ID_REGEX.test(id) && !id.includes("..") && id.length <= 100;
}

// Security helper: ensure path is within uploads directory
function isWithinUploadsDir(filePath: string): boolean {
  const normalizedPath = path.normalize(path.resolve(filePath));
  const normalizedUploads = path.normalize(path.resolve(UPLOADS_DIR));
  return normalizedPath.startsWith(normalizedUploads + path.sep) || normalizedPath === normalizedUploads;
}

// Helper to get user-specific upload directory: uploads/account_<userId>/candidate_<candidateId>/
function getUserCandidateDir(userId: string, candidateId: string): string | null {
  // Validate IDs to prevent path traversal
  if (!isSafeId(userId) || !isSafeId(candidateId)) {
    console.error(`Invalid ID format: userId=${userId}, candidateId=${candidateId}`);
    return null;
  }
  
  const dir = path.join(UPLOADS_DIR, `account_${userId}`, `candidate_${candidateId}`);
  
  // Double-check the resulting path is within uploads dir
  if (!isWithinUploadsDir(dir)) {
    console.error(`Path traversal attempt detected: ${dir}`);
    return null;
  }
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Helper to resolve a stored file path (handles both new per-account paths and legacy flat paths)
function resolveFilePath(storedPath: string, userId?: string, candidateId?: string): string | null {
  // Normalize and validate the stored path
  const cleanStoredPath = path.normalize(storedPath);
  
  // Reject any path with directory traversal attempts
  if (cleanStoredPath.includes("..")) {
    console.error(`Path traversal attempt in storedPath: ${storedPath}`);
    return null;
  }
  
  let resolved: string | null = null;
  
  // If it's an absolute path, just normalize and use it
  if (path.isAbsolute(cleanStoredPath)) {
    resolved = path.normalize(cleanStoredPath);
  }
  // Check if it contains account_ folder structure (new format)
  else if (cleanStoredPath.includes("account_")) {
    resolved = path.join(UPLOADS_DIR, cleanStoredPath);
  }
  // Try the new per-account structure if userId and candidateId provided
  else if (userId && candidateId) {
    const userDir = getUserCandidateDir(userId, candidateId);
    if (userDir) {
      resolved = path.join(userDir, path.basename(cleanStoredPath));
    }
  }
  
  // Fall back to legacy flat structure (use only basename to prevent traversal)
  if (!resolved) {
    resolved = path.join(UPLOADS_DIR, path.basename(cleanStoredPath));
  }
  
  // Final security check: ensure resolved path is within UPLOADS_DIR
  if (!isWithinUploadsDir(resolved)) {
    console.error(`Security: resolved path outside uploads: ${resolved}`);
    return null;
  }
  
  return fs.existsSync(resolved) ? resolved : null;
}

// In-memory resume storage (for text only - files are persisted to disk)
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

  // Admin middleware - checks if user is an admin
  const isAdminMiddleware = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Always check from database for most up-to-date admin status
      const user = await storage.getUser(userId);
      // Handle both string "true" and boolean true values
      const isAdminUser = user?.isAdmin === "true" || user?.isAdmin === true;
      if (!user || !isAdminUser) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, isAdminMiddleware, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isAdmin: u.isAdmin,
        freeAccessUntil: u.freeAccessUntil,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:userId/free-access', isAuthenticated, isAdminMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { days } = req.body;
      
      if (!days || typeof days !== 'number' || days < 0) {
        res.status(400).json({ message: "days must be a positive number" });
        return;
      }

      let freeAccessUntil: Date | null = null;
      if (days > 0) {
        freeAccessUntil = new Date();
        freeAccessUntil.setDate(freeAccessUntil.getDate() + days);
      }

      const user = await storage.updateUserFreeAccess(userId, freeAccessUntil);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        freeAccessUntil: user.freeAccessUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Error updating free access:", error);
      res.status(500).json({ message: "Failed to update free access" });
    }
  });

  app.delete('/api/admin/users/:userId/free-access', isAuthenticated, isAdminMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.updateUserFreeAccess(userId, null);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        freeAccessUntil: user.freeAccessUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Error removing free access:", error);
      res.status(500).json({ message: "Failed to remove free access" });
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
      const includeAll = req.query.includeAll === "true";
      const candidates = await storage.getCandidates(userId, includeAll);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  // Bulk resume upload - Pro+ only
  app.post("/api/bulk-resume-upload", isAuthenticated, upload.single("resume"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check user's plan - must be Pro or Enterprise
      const subscription = await storage.getSubscription(userId);
      const plan = subscription?.planType || "free";
      if (plan !== "pro" && plan !== "enterprise") {
        res.status(403).json({ 
          error: "Bulk upload requires Pro or Enterprise plan",
          message: "Please upgrade to Pro or Enterprise to use bulk resume upload."
        });
        return;
      }
      
      // Check candidate limit
      const canAdd = await storage.checkCanAddCandidate(userId);
      if (!canAdd.allowed) {
        res.status(403).json({ 
          error: "Candidate limit reached",
          message: `You've reached your limit of ${canAdd.limit} candidates this month.`,
          current: canAdd.current,
          limit: canAdd.limit
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const jobId = req.body.jobId;
      if (!jobId) {
        res.status(400).json({ error: "Job ID is required" });
        return;
      }

      // Verify job belongs to user
      const job = await storage.getJob(jobId, userId);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      // Extract text from PDF
      let resumeText = "";
      try {
        const pdfData = new Uint8Array(req.file.buffer);
        const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise;
        const textParts: string[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          textParts.push(pageText);
        }
        resumeText = textParts.join("\n\n");
      } catch (err) {
        res.status(400).json({ error: "Failed to parse PDF file" });
        return;
      }

      // Extract candidate name from first line of resume
      const lines = resumeText.split('\n').filter(l => l.trim());
      let candidateName = lines[0]?.trim() || "Unknown Candidate";
      
      // Clean up name - remove common prefixes and limit length
      candidateName = candidateName.replace(/^(resume|cv|curriculum vitae)[\s:-]*/i, '').trim();
      if (candidateName.length > 100) {
        candidateName = candidateName.substring(0, 100);
      }
      if (!candidateName || candidateName.length < 2) {
        candidateName = "Unknown Candidate";
      }

      // Extract email if present
      const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : `candidate_${Date.now()}@unknown.com`;

      // Create candidate
      const today = new Date().toISOString().split('T')[0];
      const candidate = await storage.createCandidate({
        userId,
        name: candidateName,
        email: email,
        role: job.title,
        stage: "Applied",
        appliedDate: today,
        jobId: jobId,
        tags: ["Bulk Upload"],
        source: "Bulk Upload"
      });

      await storage.incrementCandidatesAdded(userId);

      // Save the resume file
      const candidateDir = getUserCandidateDir(userId, candidate.id);
      if (candidateDir) {
        const fileName = `resume_${Date.now()}.pdf`;
        const filePath = path.join(candidateDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Update candidate with resume URL
        await storage.updateCandidate(candidate.id, userId, {
          resumeUrl: `/api/documents/${candidate.id}/${fileName}`
        });
      }

      res.json({ 
        candidateId: candidate.id, 
        candidateName: candidate.name,
        email: candidate.email
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ error: "Failed to process resume upload" });
    }
  });

  // Bulk reject candidates
  app.post("/api/bulk-reject-candidates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateIds } = req.body;

      if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
        res.status(400).json({ error: "No candidate IDs provided" });
        return;
      }

      let rejectedCount = 0;
      for (const candidateId of candidateIds) {
        try {
          // Verify candidate belongs to user
          const candidate = await storage.getCandidate(candidateId, userId);
          if (candidate) {
            await storage.updateCandidate(candidateId, userId, { stage: "Rejected" });
            rejectedCount++;
          }
        } catch (err) {
          console.error(`Failed to reject candidate ${candidateId}:`, err);
        }
      }

      res.json({ rejectedCount, total: candidateIds.length });
    } catch (error) {
      console.error("Bulk reject error:", error);
      res.status(500).json({ error: "Failed to reject candidates" });
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

  app.patch("/api/candidates/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isActive, isArchived } = req.body;
      
      // Validate isActive - must be "active" or "deactivated"
      const validIsActive = ["active", "deactivated"];
      if (!isActive || !validIsActive.includes(isActive)) {
        res.status(400).json({ error: "isActive must be 'active' or 'deactivated'" });
        return;
      }
      
      // Validate isArchived - must be "true" or "false"
      const validIsArchived = ["true", "false"];
      if (!isArchived || !validIsArchived.includes(isArchived)) {
        res.status(400).json({ error: "isArchived must be 'true' or 'false'" });
        return;
      }
      
      const candidate = await storage.updateCandidateStatus(req.params.id, userId, isActive, isArchived);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update candidate status" });
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

  app.delete("/api/interview-recommendations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInterviewRecommendation(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Interview recommendation not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete interview recommendation" });
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
      // Convert ISO string to Date object before validation
      const bodyWithDate = {
        ...req.body,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
      };
      const interviewData = insertScheduledInterviewSchema.parse(bodyWithDate);
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

  app.get("/api/documents/:documentId/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const doc = await storage.getDocumentById(req.params.documentId);
      if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      const storedPath = doc.fileUrl;
      let resolvedPath: string | null = null;

      // Special case for report files in public folder
      if (storedPath.startsWith("/uploads/reports/")) {
        resolvedPath = path.join(process.cwd(), "public", storedPath);
        if (!fs.existsSync(resolvedPath)) {
          resolvedPath = null;
        }
      } else {
        // Use helper for normal uploads (supports per-account structure and legacy)
        resolvedPath = resolveFilePath(storedPath, userId, doc.candidateId);
      }

      if (!resolvedPath) {
        res.status(404).json({ 
          error: "File not found on disk",
          message: "The original file may have been uploaded before persistent storage was enabled. Please re-upload the document."
        });
        return;
      }

      const fileBuffer = fs.readFileSync(resolvedPath);
      
      let mimeType: string;
      const ext = doc.fileType.toLowerCase();
      if (ext === "pdf" || ext === "application/pdf") {
        mimeType = "application/pdf";
      } else if (ext === "html" || ext === "text/html") {
        mimeType = "text/html";
      } else if (ext === "docx" || ext === "doc" || ext.includes("word")) {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        mimeType = "application/octet-stream";
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Document download error:", error);
      res.status(500).json({ error: "Failed to download document" });
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

  // Save analysis report as HTML document to candidate's documents
  app.post("/api/candidates/:id/save-analysis-report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      const { htmlContent, fileName, jobTitle } = req.body;

      if (!htmlContent || !fileName) {
        res.status(400).json({ error: "htmlContent and fileName are required" });
        return;
      }

      // Verify candidate belongs to user
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fullFileName = `${safeFileName}_${timestamp}.html`;
      const filePath = `public/uploads/reports/${candidateId}`;
      const fullPath = `${filePath}/${fullFileName}`;

      // Create directory if it doesn't exist
      const fs = await import('fs/promises');
      const path = await import('path');
      await fs.mkdir(filePath, { recursive: true });
      
      // Write the HTML file
      await fs.writeFile(fullPath, htmlContent, 'utf-8');

      // Create document record
      const document = await storage.createCandidateDocument({
        candidateId,
        fileName: `Resume Analysis - ${jobTitle || 'Report'}.html`,
        fileType: "text/html",
        fileUrl: `/uploads/reports/${candidateId}/${fullFileName}`,
        documentType: "resume_analysis_report",
      });

      res.json(document);
    } catch (error) {
      console.error("Failed to save analysis report:", error);
      res.status(500).json({ error: "Failed to save analysis report" });
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

      if (fileExt !== "pdf") {
        res.status(400).json({ error: "Only PDF files are supported. Please convert your document to PDF before uploading." });
        return;
      }
      
      // Try to extract text, but continue without it if extraction fails
      try {
        resumeText = await extractTextFromPdf(file.buffer);
      } catch (extractError) {
        console.warn("Could not extract text from PDF, proceeding without text extraction:", extractError);
        // Continue with empty resume text - file will still be stored
        resumeText = "";
      }

      // Store resume text in memory for quick access
      resumeStore.set(candidateId, resumeText);

      // Generate unique filename with original extension and save to per-account/candidate folder
      const uniqueId = randomBytes(8).toString("hex");
      const safeFileName = `${uniqueId}.${fileExt}`;
      const userCandidateDir = getUserCandidateDir(userId, candidateId);
      
      if (!userCandidateDir) {
        res.status(400).json({ error: "Invalid user or candidate ID format" });
        return;
      }
      
      const filePath = path.join(userCandidateDir, safeFileName);
      
      // Relative path to store in DB (relative to UPLOADS_DIR)
      const relativeFilePath = path.relative(UPLOADS_DIR, filePath);
      
      // Save the original file buffer to disk
      fs.writeFileSync(filePath, file.buffer);

      // Use API endpoint for resume URL
      const resumeUrl = `/api/resume/${candidateId}/download`;
      
      const candidate = await storage.updateCandidate(candidateId, userId, { 
        resumeUrl: resumeUrl
      });

      if (!candidate) {
        // Clean up the saved file if candidate update fails
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Save to the documents table with relative file path for persistence
      await storage.createCandidateDocument({
        candidateId,
        fileName: fileName,
        fileType: fileExt || "unknown",
        fileUrl: relativeFilePath,  // Store path relative to uploads dir (includes account/candidate folders)
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

  app.get("/api/resume/:candidateId/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidate = await storage.getCandidate(req.params.candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      
      // Get document from database which contains the file path
      const documents = await storage.getCandidateDocuments(req.params.candidateId);
      const resumeDoc = documents.find(d => d.documentType === "Resume");
      if (!resumeDoc) {
        res.status(404).json({ error: "Resume file not found" });
        return;
      }
      
      // Use helper to resolve file path (supports both new per-account structure and legacy flat structure)
      const storedPath = resumeDoc.fileUrl;
      const candidateId = req.params.candidateId;
      const resolvedPath = storedPath ? resolveFilePath(storedPath, userId, candidateId) : null;
      
      if (resolvedPath) {
        const fileBuffer = fs.readFileSync(resolvedPath);
        const mimeType = resumeDoc.fileType === "pdf" ? "application/pdf" : 
                        (resumeDoc.fileType === "docx" || resumeDoc.fileType === "doc") ? 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : 
                        "application/octet-stream";
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${resumeDoc.fileName}"`);
        res.send(fileBuffer);
        return;
      }
      
      // File not found on disk - return error (don't serve .txt fallback)
      res.status(404).json({ 
        error: "Original file not found on disk. Please re-upload the resume as a PDF.",
        message: "The original file may have been uploaded before persistent storage was enabled. Please upload the resume again."
      });
    } catch (error) {
      console.error("Resume download error:", error);
      res.status(500).json({ error: "Failed to download resume" });
    }
  });

  app.post("/api/analyze-resume", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { resumeText, jobDescription, jobSkills, jobTitle, jobLevel, candidateId, jobId } = req.body;
      
      if (!resumeText) {
        res.status(400).json({ error: "Resume text is required" });
        return;
      }

      // Check AI usage limit if candidateId is provided
      if (candidateId) {
        const canUse = await storage.checkCanUseAiAction(userId, candidateId, "resume_analysis");
        if (!canUse.allowed) {
          res.status(403).json({
            error: "AI usage limit reached",
            message: `You've reached your limit of ${canUse.limit} AI actions for this candidate. Please upgrade your plan.`,
            current: canUse.current,
            limit: canUse.limit
          });
          return;
        }
      }

      const skillsList = jobSkills || [];
      const jobContext = jobDescription || `Job: ${jobTitle || "Unknown"}, Level: ${jobLevel || "Unknown"}, Skills: ${skillsList.join(", ")}`;

      // Get candidate name if candidateId is provided for name mismatch detection
      let expectedCandidateName: string | null = null;
      if (candidateId) {
        try {
          const candidate = await storage.getCandidate(candidateId, userId);
          if (candidate) {
            expectedCandidateName = candidate.name;
          }
        } catch (err) {
          console.error("Failed to fetch candidate for name check:", err);
        }
      }

      // Import and use the multi-pass analyzer
      const { analyzeResumeMultiPass } = await import("./resume-analyzer");
      
      const result = await analyzeResumeMultiPass(
        resumeText,
        jobContext,
        skillsList,
        jobTitle || "Unknown",
        jobLevel || "Unknown",
        expectedCandidateName
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
            authenticityScore: result.authenticityScore ?? null,
            fraudFlags: result.fraudFlags ? JSON.stringify(result.fraudFlags) : null,
            status: "completed"
          });
          // Track AI usage after successful analysis
          await storage.incrementAiActionUsage(userId, candidateId, "resume_analysis");
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

      const completion = await callAI("skills_test", {
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

      const completion = await callAI("job_description", {
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

      const completion = await callAI("job_description", {
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

                    const result = await callAI("skills_test", {
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

                  const result = await callAI("skills_test", {
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

                const result = await callAI("skills_test", {
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

              const result = await callAI("skills_test", {
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
  app.post("/api/generate-interview-questions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { candidateId, candidateName, jobTitle, testScore, strengths, weaknesses, recommendationId } = req.body;
      
      if (!candidateName || !jobTitle) {
        res.status(400).json({ error: "candidateName and jobTitle are required" });
        return;
      }

      // Check AI usage limit if candidateId is provided
      if (candidateId) {
        const canUse = await storage.checkCanUseAiAction(userId, candidateId, "interview_questions");
        if (!canUse.allowed) {
          res.status(403).json({
            error: "AI usage limit reached",
            message: `You've reached your limit of ${canUse.limit} AI actions for this candidate. Please upgrade your plan.`,
            current: canUse.current,
            limit: canUse.limit
          });
          return;
        }
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

      const completion = await callAI("interview_questions", {
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

      // Track AI usage if candidateId was provided
      if (candidateId) {
        await storage.incrementAiActionUsage(userId, candidateId, "interview_questions");
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

  // AI-Powered Reference Check Generator
  app.post("/api/generate-reference-check", async (req, res) => {
    try {
      const { 
        mode, 
        candidateName, 
        positionAppliedFor, 
        referenceName, 
        referenceEmail, 
        relationshipToCandidate, 
        emailTemplate,
        resumeText,
        candidateId 
      } = req.body;

      if (!mode || !["from_resume", "from_form", "request_link"].includes(mode)) {
        res.status(400).json({ error: "Invalid mode. Must be 'from_resume', 'from_form', or 'request_link'" });
        return;
      }

      // For request_link mode, create a reference link and generate text with actual URL
      if (mode === "request_link") {
        if (!candidateName || !positionAppliedFor || !candidateId) {
          res.status(400).json({ error: "Candidate name, position, and candidateId are required for request_link mode" });
          return;
        }

        const userId = (req as any).user?.claims?.sub;
        if (!userId) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        // Generate a secure token for the reference submission link
        const token = randomBytes(16).toString("hex");

        // Create the reference link in the database
        const referenceLink = await storage.createReferenceLink({
          candidateId,
          candidateName,
          token
        });

        // Build the actual submission URL
        const host = req.headers.host || "localhost:5000";
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const referenceSubmissionUrl = `${protocol}://${host}/reference-link/${token}`;

        const linkRequestText = `Dear ${candidateName},

As part of our hiring process for the ${positionAppliedFor} position, we would like to gather your professional references.

Please use the link below to securely provide your reference details:
${referenceSubmissionUrl}

We will ask for:
- Reference name
- Reference email address
- Their relationship to you

Thank you for taking a moment to complete this step in the hiring process.

Best regards,
[Your Company Name]`;

        res.json({
          selectedReference: null,
          emailSubject: null,
          emailBody: null,
          questions: null,
          mailtoTemplate: null,
          candidateLinkRequestText: linkRequestText,
          referenceLinkId: referenceLink.id,
          referenceSubmissionUrl
        });
        return;
      }

      // For from_form mode, validate required fields
      if (mode === "from_form") {
        if (!candidateName || !positionAppliedFor || !referenceName || !referenceEmail || !relationshipToCandidate) {
          res.status(400).json({ error: "All form fields are required for from_form mode" });
          return;
        }
      }

      // For from_resume mode, try to get resume text from candidate
      let actualResumeText = resumeText;
      if (mode === "from_resume" && !resumeText && candidateId) {
        actualResumeText = resumeStore.get(candidateId) || null;
      }

      if (mode === "from_resume" && !actualResumeText) {
        res.status(400).json({ error: "Resume text is required for from_resume mode" });
        return;
      }

      const prompt = `You are the Reference Check Generator for a hiring workflow app.

INPUTS:
- Mode: ${mode}
- Candidate Name: ${candidateName || "Unknown"}
- Position Applied For: ${positionAppliedFor || "Unknown"}
${mode === "from_form" ? `- Reference Name: ${referenceName}
- Reference Email: ${referenceEmail}
- Relationship to Candidate: ${relationshipToCandidate}
- Email Template Style: ${emailTemplate || "formal"}` : ""}
${mode === "from_resume" && actualResumeText ? `
RESUME TEXT:
${actualResumeText}
` : ""}

YOUR TASKS:

${mode === "from_resume" ? `
Since mode is "from_resume":
1. Scan the resume for likely references: supervisors, managers, team leads, or colleagues mentioned.
2. Pick the single most appropriate reference based on seniority and relevance.
3. Fill in any available details (name, title, company, potential relationship).
4. If no clear reference is found, make a reasonable recommendation about who to contact.
` : ""}

${mode === "from_form" ? `
Since mode is "from_form":
1. Use the exact reference details provided above.
2. Do not invent new names or details.
` : ""}

Generate a professional reference request email with:
1. Clear subject line appropriate for ${emailTemplate || "formal"} style
2. Short intro explaining why the reference is being contacted
3. Mention of the candidate and the role they applied for
4. A list of 5-7 characteristic reference check questions such as:
   - How long have you known/worked with the candidate?
   - How would you describe their work ethic and reliability?
   - What are their main professional strengths?
   - Can you describe their communication and collaboration style?
   - What areas could they improve upon?
   - How did they handle challenges or pressure?
   - Would you recommend them for this type of role?

Make the email appropriate for:
- Sending via external email clients like Outlook or Gmail
- Simple copy-and-paste usage

Respond in this exact JSON format:
{
  "selectedReference": {
    "name": "${mode === "from_form" ? referenceName : "Extracted name or null"}",
    "email": "${mode === "from_form" ? referenceEmail : "Extracted email or null"}",
    "relationship": "${mode === "from_form" ? relationshipToCandidate : "Inferred relationship"}",
    "title": "Job title if known or null",
    "company": "Company if known or null"
  },
  "emailSubject": "The email subject line",
  "emailBody": "The complete email body text",
  "questions": [
    "Question 1",
    "Question 2",
    "..."
  ]
}`;

      const completion = await callAI("reference_check", {
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

      // Build the mailto template
      const targetEmail = mode === "from_form" ? referenceEmail : result.selectedReference?.email || "";
      const mailtoTemplate = targetEmail && result.emailSubject && result.emailBody
        ? `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(result.emailSubject)}&body=${encodeURIComponent(result.emailBody)}`
        : null;

      res.json({
        selectedReference: result.selectedReference || null,
        emailSubject: result.emailSubject || null,
        emailBody: result.emailBody || null,
        questions: result.questions || [],
        mailtoTemplate,
        candidateLinkRequestText: null
      });
    } catch (error) {
      console.error("Reference check generation error:", error);
      res.status(500).json({ error: "Failed to generate reference check" });
    }
  });

  // Public endpoint to get reference link details by token (no auth required)
  app.get("/api/reference-link/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const link = await storage.getReferenceLinkByToken(token);

      if (!link) {
        res.status(404).json({ error: "Reference link not found" });
        return;
      }

      res.json({
        candidateName: link.candidateName,
        createdAt: link.createdAt
      });
    } catch (error) {
      console.error("Error fetching reference link:", error);
      res.status(500).json({ error: "Failed to fetch reference link" });
    }
  });

  // Public endpoint to submit references via link (no auth required)
  app.post("/api/reference-link/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      const { references } = req.body;

      if (!references || !Array.isArray(references) || references.length === 0) {
        res.status(400).json({ error: "At least one reference is required" });
        return;
      }

      const link = await storage.getReferenceLinkByToken(token);

      if (!link) {
        res.status(404).json({ error: "Reference link not found" });
        return;
      }

      // Create each reference
      for (const ref of references) {
        if (!ref.name || !ref.email) {
          res.status(400).json({ error: "Each reference must have name and email" });
          return;
        }
        
        await storage.createReference({
          candidateId: link.candidateId,
          source: "candidate_link",
          name: ref.name,
          email: ref.email,
          relationship: ref.relationship || null,
          status: "pending_contact"
        });
      }

      res.json({
        success: true,
        message: "References submitted successfully. Thank you!"
      });
    } catch (error) {
      console.error("Error submitting references:", error);
      res.status(500).json({ error: "Failed to submit references" });
    }
  });

  // Create a reference link for a candidate
  app.post("/api/candidates/:id/reference-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      const token = randomBytes(16).toString("hex");
      const link = await storage.createReferenceLink({
        candidateId,
        candidateName: candidate.name,
        token
      });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host;
      const url = `${protocol}://${host}/reference-link/${token}`;

      res.json({ link, url });
    } catch (error) {
      console.error("Error creating reference link:", error);
      res.status(500).json({ error: "Failed to create reference link" });
    }
  });

  // Get reference links for a candidate
  app.get("/api/candidates/:id/reference-links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      
      const links = await storage.getReferenceLinksByCandidateId(candidateId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching reference links:", error);
      res.status(500).json({ error: "Failed to fetch reference links" });
    }
  });

  // Get references for a candidate
  app.get("/api/candidates/:id/references", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      
      const refs = await storage.getReferencesByCandidateId(candidateId);
      res.json(refs);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ error: "Failed to fetch references" });
    }
  });

  // Create a manual reference for a candidate
  app.post("/api/candidates/:id/references", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const candidateId = req.params.id;
      const { name, email, relationship } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: "Name and email are required" });
        return;
      }
      
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      
      const ref = await storage.createReference({
        candidateId,
        source: "manual",
        name,
        email,
        relationship: relationship || null,
        status: "pending_contact"
      });
      
      res.json(ref);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ error: "Failed to create reference" });
    }
  });

  // Update a reference
  app.patch("/api/references/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const updated = await storage.updateReference(id, data);
      if (!updated) {
        res.status(404).json({ error: "Reference not found" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating reference:", error);
      res.status(500).json({ error: "Failed to update reference" });
    }
  });

  // Mark reference email as sent
  app.post("/api/references/:id/email-sent", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const updated = await storage.markReferenceEmailSent(id);
      if (!updated) {
        res.status(404).json({ error: "Reference not found" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error marking email sent:", error);
      res.status(500).json({ error: "Failed to mark email sent" });
    }
  });

  // Generate email for a reference (returns mailto link)
  app.post("/api/references/:id/generate-email", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { candidateName, candidateRole } = req.body;

      const refs = await db.select().from(references).where(eq(references.id, id)).limit(1);
      const ref = refs[0];
      
      if (!ref) {
        res.status(404).json({ error: "Reference not found" });
        return;
      }

      const subject = encodeURIComponent(`Reference Request for ${candidateName || "Candidate"}`);
      const body = encodeURIComponent(`Dear ${ref.name},

We are considering ${candidateName || "a candidate"} for the ${candidateRole || "open"} position at our company. They provided your contact information as a professional reference.

Would you be willing to provide a brief reference? I would appreciate any insights you can share about:
- Their work performance and reliability
- Their strengths and areas of growth
- Their interpersonal skills and teamwork
- Whether you would recommend them for this role

Please feel free to reply to this email or let me know if you prefer a phone call instead.

Thank you for your time.

Best regards`);

      const mailto = `mailto:${ref.email}?subject=${subject}&body=${body}`;
      
      res.json({ mailto });
    } catch (error) {
      console.error("Error generating reference email:", error);
      res.status(500).json({ error: "SERVER_ERROR" });
    }
  });

  // Generate reference check email using AI
  app.post("/api/generate-reference-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId, candidateName, positionAppliedFor, referenceName, referenceEmail, relationshipToCandidate } = req.body;
      
      if (!candidateId || !candidateName || !positionAppliedFor || !referenceName || !referenceEmail || !relationshipToCandidate) {
        res.status(400).json({ error: "All fields are required: candidateId, candidateName, positionAppliedFor, referenceName, referenceEmail, relationshipToCandidate" });
        return;
      }

      // Verify candidate ownership before checking usage limits
      const candidate = await storage.getCandidate(candidateId, userId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // Check AI usage limits
      const canUse = await storage.checkCanUseAiAction(userId, candidateId, "reference_email");
      if (!canUse.allowed) {
        res.status(403).json({
          error: "AI usage limit reached",
          message: `You've reached your limit of ${canUse.limit} reference email generations for this candidate. Please upgrade your plan.`,
          current: canUse.current,
          limit: canUse.limit
        });
        return;
      }

      const prompt = `Generate a professional reference check email. The email should be polite, professional, and request specific information about the candidate's work history.

Details:
- Candidate Name: ${candidateName}
- Position Applied For: ${positionAppliedFor}
- Reference Name: ${referenceName}
- Reference Email: ${referenceEmail}
- Relationship to Candidate: ${relationshipToCandidate}

Generate:
1. A concise email subject line
2. A professional email body that:
   - Introduces the purpose (reference check for the candidate)
   - Explains the position they're being considered for
   - Asks about:
     - How long and in what capacity they worked with the candidate
     - The candidate's key strengths and areas for development
     - Their reliability, teamwork, and communication skills
     - Whether they would recommend hiring this candidate
   - Thanks them for their time
   - Includes a professional sign-off

Return a JSON object with these exact fields:
{
  "emailSubject": "the subject line",
  "emailBody": "the full email body with proper formatting"
}`;

      const response = await callAI("reference_check", {
        messages: [
          { role: "system", content: "You are an HR professional helping to write reference check emails. Return only valid JSON without markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "";
      let parsed;
      try {
        // Remove any markdown code blocks if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        parsed = JSON.parse(cleanContent);
      } catch {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      const { emailSubject, emailBody } = parsed;
      
      // Increment AI usage after successful generation - must succeed before returning response
      await storage.incrementAiActionUsage(userId, candidateId, "reference_email");
      
      // Create mailto template
      const encodedSubject = encodeURIComponent(emailSubject);
      const encodedBody = encodeURIComponent(emailBody);
      const mailtoTemplate = `mailto:${referenceEmail}?subject=${encodedSubject}&body=${encodedBody}`;

      res.json({
        emailSubject,
        emailBody,
        mailtoTemplate
      });
    } catch (error) {
      console.error("Error generating reference email:", error);
      res.status(500).json({ error: "Failed to generate reference email" });
    }
  });

  // Generate AI-powered onboarding plan and save to database
  app.post("/api/onboarding/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { employee_name, role, start_date, onboarding_type, candidate_id } = req.body;

      if (!employee_name || !role || !start_date || !onboarding_type) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      // Check AI usage limit if candidate_id is provided
      if (candidate_id) {
        const canUse = await storage.checkCanUseAiAction(userId, candidate_id, "onboarding_plan");
        if (!canUse.allowed) {
          res.status(403).json({
            error: "AI usage limit reached",
            message: `You've reached your limit of ${canUse.limit} AI actions for this candidate. Please upgrade your plan.`,
            current: canUse.current,
            limit: canUse.limit
          });
          return;
        }
      }

      const systemPrompt = `You are an HR onboarding specialist. Generate a comprehensive onboarding plan in STRICT JSON format only. No prose or explanation - just valid JSON.

The output must exactly follow this structure:
{
  "tasks_by_week": [
    {
      "week": 1,
      "title": "Week 1: Orientation & Setup",
      "tasks": [
        {
          "id": "week1_task1",
          "title": "Task name",
          "owner": "HR" | "Manager" | "IT" | "Employee",
          "relative_day": 0,
          "description": "Brief description of the task"
        }
      ]
    }
  ],
  "thirty_sixty_ninety": {
    "day_30": [
      { "goal": "Goal title", "details": "Details about this goal" }
    ],
    "day_60": [
      { "goal": "Goal title", "details": "Details about this goal" }
    ],
    "day_90": [
      { "goal": "Goal title", "details": "Details about this goal" }
    ]
  },
  "emails": {
    "welcome_email_hr": {
      "subject": "Email subject",
      "body": "Email body with proper line breaks"
    },
    "manager_intro_email": {
      "subject": "Email subject",
      "body": "Email body"
    },
    "it_request_email": {
      "subject": "Email subject",
      "body": "Email body"
    }
  }
}

IMPORTANT: Each task MUST have a unique "id" field like "week1_task1", "week1_task2", "week2_task1", etc.
Generate realistic, role-appropriate tasks. Include 2-4 weeks of tasks depending on onboarding type. Use the employee name and role to customize the content.`;

      const userPrompt = `Generate an onboarding plan for:
- Employee Name: ${employee_name}
- Role: ${role}
- Start Date: ${start_date}
- Onboarding Type: ${onboarding_type}

Make sure all emails reference the employee by name (${employee_name}) and their role (${role}).`;

      const response = await callAI("onboarding_plan", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || "";
      let parsed;
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        parsed = JSON.parse(cleanContent);
      } catch {
        res.status(500).json({ error: "Failed to parse AI response" });
        return;
      }

      // Ensure all tasks have IDs (fallback if AI didn't generate them)
      let taskCounter = 0;
      if (parsed.tasks_by_week) {
        for (const week of parsed.tasks_by_week) {
          if (week.tasks) {
            for (const task of week.tasks) {
              if (!task.id) {
                taskCounter++;
                task.id = `week${week.week}_task${taskCounter}`;
              }
            }
          }
        }
      }

      // Save to database
      const plan = await storage.createOnboardingPlan({
        userId,
        candidateId: candidate_id || null,
        employeeName: employee_name,
        role,
        startDate: start_date,
        onboardingType: onboarding_type,
        status: "active",
        planJson: parsed,
        completedTaskIds: [],
      });

      // Track AI usage if candidate_id was provided
      if (candidate_id) {
        await storage.incrementAiActionUsage(userId, candidate_id, "onboarding_plan");
      }

      res.json({ ...parsed, planId: plan.id });
    } catch (error) {
      console.error("Error generating onboarding plan:", error);
      res.status(500).json({ error: "Failed to generate onboarding plan" });
    }
  });

  // Get onboarding plans
  app.get("/api/onboarding/plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const status = req.query.status as string | undefined;
      const plans = await storage.getOnboardingPlans(userId, status);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching onboarding plans:", error);
      res.status(500).json({ error: "Failed to fetch onboarding plans" });
    }
  });

  // Get single onboarding plan
  app.get("/api/onboarding/plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const plan = await storage.getOnboardingPlan(req.params.id, userId);
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching onboarding plan:", error);
      res.status(500).json({ error: "Failed to fetch onboarding plan" });
    }
  });

  // Toggle task completion
  app.post("/api/onboarding/plans/:id/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { task_id, completed } = req.body;
      if (!task_id || typeof completed !== "boolean") {
        res.status(400).json({ error: "task_id and completed are required" });
        return;
      }

      const plan = await storage.getOnboardingPlan(req.params.id, userId);
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }

      let completedTaskIds = (plan.completedTaskIds as string[]) || [];
      if (completed) {
        if (!completedTaskIds.includes(task_id)) {
          completedTaskIds.push(task_id);
        }
      } else {
        completedTaskIds = completedTaskIds.filter(id => id !== task_id);
      }

      const updated = await storage.updateOnboardingPlanTaskIds(req.params.id, userId, completedTaskIds);
      res.json(updated);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Mark plan as completed
  app.post("/api/onboarding/plans/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const plan = await storage.completeOnboardingPlan(req.params.id, userId);
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error("Error completing plan:", error);
      res.status(500).json({ error: "Failed to complete plan" });
    }
  });

  // Policy generation with web search and AI
  app.post("/api/policies/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { company_name, policy_type, industry, state, team_size, additional_requirements } = req.body;

      if (!company_name || !policy_type) {
        res.status(400).json({ error: "Company name and policy type are required" });
        return;
      }

      // Curated reference sources based on policy type (real, authoritative HR sources)
      const policyReferences: Record<string, Array<{ title: string; url: string; snippet: string }>> = {
        "remote-work": [
          { title: "SHRM Remote Work Policy Template", url: "https://www.shrm.org/topics-tools/tools/policies/telecommuting-policy", snippet: "Sample telecommuting policy covering eligibility, expectations, equipment, and performance standards for remote work arrangements." },
          { title: "DOL Remote Work Best Practices", url: "https://www.dol.gov/agencies/whd/flsa/pandemic", snippet: "Department of Labor guidance on wage and hour laws for remote workers, including overtime and recordkeeping requirements." },
          { title: "OSHA Home Office Guidelines", url: "https://www.osha.gov/workers/remote-work", snippet: "Workplace safety considerations for home offices and employer obligations under OSHA for remote employees." },
          { title: "IRS Home Office Deduction Rules", url: "https://www.irs.gov/businesses/small-businesses-self-employed/home-office-deduction", snippet: "Tax implications and deduction rules for employees working from home offices." },
        ],
        "pto": [
          { title: "SHRM PTO Policy Best Practices", url: "https://www.shrm.org/topics-tools/tools/policies/paid-time-off-policy", snippet: "Comprehensive guide to structuring paid time off policies including accrual, carryover, and payout provisions." },
          { title: "DOL FMLA Guidelines", url: "https://www.dol.gov/agencies/whd/fmla", snippet: "Family and Medical Leave Act requirements for eligible employers regarding unpaid, job-protected leave." },
          { title: "State Leave Law Compliance", url: "https://www.dol.gov/agencies/whd/state/leave", snippet: "Overview of state-specific leave requirements that may exceed federal minimums." },
        ],
        "code-of-conduct": [
          { title: "SHRM Code of Conduct Template", url: "https://www.shrm.org/topics-tools/tools/policies/code-ethics-conduct", snippet: "Sample code of ethics and business conduct policy covering integrity, compliance, and professional behavior." },
          { title: "EEOC Workplace Guidelines", url: "https://www.eeoc.gov/employers", snippet: "Equal Employment Opportunity Commission guidance on preventing discrimination and maintaining inclusive workplaces." },
          { title: "SOX Compliance for Public Companies", url: "https://www.sec.gov/spotlight/sarbanes-oxley.htm", snippet: "Sarbanes-Oxley Act requirements for corporate ethics and financial reporting standards." },
        ],
        "anti-harassment": [
          { title: "EEOC Harassment Prevention", url: "https://www.eeoc.gov/harassment", snippet: "Federal guidelines on preventing workplace harassment, including definitions, examples, and employer responsibilities." },
          { title: "SHRM Anti-Harassment Policy", url: "https://www.shrm.org/topics-tools/tools/policies/anti-harassment-policy-complaint-procedure", snippet: "Sample anti-harassment policy with complaint procedures and investigation protocols." },
          { title: "Title VII Compliance", url: "https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964", snippet: "Title VII requirements prohibiting employment discrimination based on protected characteristics." },
          { title: "State Harassment Training Requirements", url: "https://www.eeoc.gov/employers/small-business/harassment-training", snippet: "Overview of state-mandated harassment prevention training requirements for employers." },
        ],
        "expense": [
          { title: "IRS Business Expense Rules", url: "https://www.irs.gov/publications/p463", snippet: "IRS Publication 463 covering travel, gift, and car expense deductions and documentation requirements." },
          { title: "SHRM Expense Reimbursement Policy", url: "https://www.shrm.org/topics-tools/tools/policies/travel-expense-reimbursement-policy", snippet: "Sample expense reimbursement policy with approval workflows and documentation standards." },
          { title: "Per Diem Rates", url: "https://www.gsa.gov/travel/plan-book/per-diem-rates", snippet: "Federal per diem rates for lodging and meals that serve as benchmarks for corporate policies." },
        ],
        "social-media": [
          { title: "NLRB Social Media Guidelines", url: "https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/social-media", snippet: "National Labor Relations Board guidance on employee rights regarding social media use and protected concerted activity." },
          { title: "SHRM Social Media Policy", url: "https://www.shrm.org/topics-tools/tools/policies/social-media-policy", snippet: "Sample social media policy balancing company interests with employee rights." },
          { title: "FTC Endorsement Guidelines", url: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", snippet: "FTC rules on disclosure requirements when employees post about their employer or products." },
        ],
        "dress-code": [
          { title: "SHRM Dress Code Policy", url: "https://www.shrm.org/topics-tools/tools/policies/dress-code-policy", snippet: "Sample dress code policies covering professional attire, casual days, and accommodation considerations." },
          { title: "EEOC Religious Accommodation", url: "https://www.eeoc.gov/laws/guidance/religious-garb-and-grooming-workplace-rights-and-responsibilities", snippet: "Guidance on accommodating religious dress and grooming practices in workplace dress codes." },
          { title: "ADA Dress Code Considerations", url: "https://www.ada.gov/resources/employers/", snippet: "Americans with Disabilities Act considerations for dress code accommodations." },
        ],
        "confidentiality": [
          { title: "DTSA Trade Secret Protection", url: "https://www.congress.gov/bill/114th-congress/senate-bill/1890", snippet: "Defend Trade Secrets Act provisions for protecting confidential business information." },
          { title: "SHRM Confidentiality Agreement", url: "https://www.shrm.org/topics-tools/tools/policies/confidentiality-nondisclosure-agreement", snippet: "Sample confidentiality and non-disclosure agreement templates for employees." },
          { title: "HIPAA for Healthcare", url: "https://www.hhs.gov/hipaa/for-professionals/index.html", snippet: "HIPAA privacy and security rules for organizations handling protected health information." },
        ],
      };

      // Get references for this policy type
      const references = policyReferences[policy_type] || policyReferences["code-of-conduct"];

      // Format references for the prompt
      const referencesText = references.map((ref, i) => 
        `${i + 1}. "${ref.title}" - ${ref.url}\n   ${ref.snippet}`
      ).join("\n\n");

      const policyNames: Record<string, string> = {
        "remote-work": "Remote Work Policy",
        "pto": "Paid Time Off & Leave Policy",
        "code-of-conduct": "Code of Conduct",
        "anti-harassment": "Anti-Harassment Policy",
        "expense": "Expense Reimbursement Policy",
        "social-media": "Social Media Policy",
        "dress-code": "Dress Code Policy",
        "confidentiality": "Confidentiality Agreement",
      };

      const policyName = policyNames[policy_type] || "HR Policy";

      const systemPrompt = `You are an HR policy assistant helping companies draft professional HR policies.

IMPORTANT GUIDELINES:
- You are NOT a lawyer and must NEVER claim any policy is legally sufficient or compliant.
- Use phrases like "recommended clauses", "typical elements", and "common best practices".
- Base your drafting on the provided reference sources and general HR best practices.
- Include practical, actionable policy language appropriate for the company size and industry.
- The policy should be professional, clear, and comprehensive.

You must return ONLY valid JSON (no markdown code blocks) with this exact structure:
{
  "policy_markdown": "## Policy Title\\n\\n### Section 1\\n\\nPolicy content in markdown format...",
  "compliance_notes": [
    "Note about relevant compliance consideration",
    "Another compliance consideration"
  ],
  "disclaimer": "This draft is for informational purposes only and is not legal advice. Please consult with qualified legal counsel before implementing any workplace policy.",
  "sources": [
    { "title": "Source Title", "url": "https://example.com" }
  ]
}`;

      const userPrompt = `Generate a ${policyName} for the following company:

**Company Name:** ${company_name}
**Industry:** ${industry || "General"}
**State:** ${state || "Not specified"}
**Team Size:** ${team_size || "Not specified"}
**Additional Requirements:** ${additional_requirements || "None specified"}

**Reference Sources to incorporate:**
${referencesText}

Please draft a comprehensive, professional ${policyName} that:
1. Is tailored to the ${industry || "general"} industry
2. Is appropriate for a company with ${team_size || "varying"} employees
3. Complies with ${state || "federal"} state-specific employment laws and regulations where applicable
4. Incorporates best practices from the reference sources
5. Addresses any additional requirements mentioned
6. Uses clear, professional language
7. Includes practical implementation guidance

IMPORTANT: Include state-specific considerations for ${state || "applicable states"} in the policy where relevant (e.g., leave laws, wage requirements, harassment training mandates, etc.).

Include 3-5 compliance notes highlighting key legal or regulatory considerations, especially any ${state || "state"}-specific requirements.
List the reference sources used in the sources array.`;

      const response = await callAI("policy_generation", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        res.status(500).json({ error: "No response from AI" });
        return;
      }

      // Parse the JSON response
      let parsed;
      try {
        // Remove any markdown code block wrappers if present
        let jsonContent = content;
        if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Failed to parse policy response:", content);
        res.status(500).json({ error: "Failed to parse AI response. Please try again." });
        return;
      }

      // Validate response structure
      if (!parsed.policy_markdown || !parsed.compliance_notes || !parsed.disclaimer || !parsed.sources) {
        res.status(500).json({ error: "Invalid response structure from AI" });
        return;
      }

      res.json(parsed);
    } catch (error) {
      console.error("Error generating policy:", error);
      res.status(500).json({ error: "Failed to generate policy. Please try again." });
    }
  });

  // Performance Goals API
  
  // Get all goals with optional employee filter
  app.get("/api/performance/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const employeeId = req.query.employee_id as string | undefined;
      const goals = await storage.getPerformanceGoals(userId, employeeId);
      
      // Recalculate at-risk status for each goal
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const goalsWithRisk = goals.map(goal => {
        let isAtRisk = "false";
        if (goal.status !== "completed") {
          const dueDate = new Date(goal.dueDate);
          if (dueDate < now || dueDate <= sevenDaysFromNow) {
            isAtRisk = "true";
          }
        }
        return { ...goal, isAtRisk };
      });

      // Compute summary
      const totalGoals = goalsWithRisk.length;
      const completedGoals = goalsWithRisk.filter(g => g.status === "completed").length;
      const atRiskGoals = goalsWithRisk.filter(g => g.isAtRisk === "true").length;
      const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      res.json({
        goals: goalsWithRisk,
        summary: {
          total_goals: totalGoals,
          completed_goals: completedGoals,
          at_risk_goals: atRiskGoals,
          overall_progress: overallProgress
        }
      });
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Generate AI goals for an employee
  app.post("/api/performance/goals/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { employee_id, employee_name, role, industry, time_horizon } = req.body;

      if (!employee_id || !employee_name || !role) {
        res.status(400).json({ error: "Employee ID, name, and role are required" });
        return;
      }

      const timeHorizonDays = parseInt(time_horizon) || 90;

      // Generate goals using OpenAI
      const systemPrompt = `You are an HR performance coach specializing in creating measurable SMART goals.
Create practical, achievable performance goals that are:
- Specific: Clear and well-defined
- Measurable: With quantifiable outcomes
- Achievable: Realistic for the role
- Relevant: Aligned with job responsibilities
- Time-bound: With clear deadlines

Do NOT claim legal compliance or guarantee results. Use phrases like "recommended targets" and "typical benchmarks".`;

      const userPrompt = `Generate 3-5 SMART performance goals for:
- Employee: ${employee_name}
- Role: ${role}
- Industry: ${industry || "General"}
- Time Horizon: ${timeHorizonDays} days

Create goals that would be appropriate for someone in this role. Each goal should have a title, description with specific metrics or outcomes, and a due date within the time horizon.

Return your response as a JSON object with this exact structure:
{
  "goals": [
    {
      "title": "Goal title here",
      "description": "Detailed description with specific metrics or outcomes",
      "due_in_days": 30
    }
  ]
}

Generate 3-5 diverse goals covering different aspects of the role.`;

      const response = await callAI("performance_goals", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        res.status(500).json({ error: "No response from AI" });
        return;
      }

      let parsed;
      try {
        let jsonContent = content;
        if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Failed to parse goals response:", content);
        res.status(500).json({ error: "Failed to parse AI response. Please try again." });
        return;
      }

      if (!parsed.goals || !Array.isArray(parsed.goals)) {
        res.status(500).json({ error: "Invalid response structure from AI" });
        return;
      }

      // Save goals to database
      const createdGoals = [];
      const now = new Date();

      for (const goal of parsed.goals) {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (goal.due_in_days || timeHorizonDays));

        const newGoal = await storage.createPerformanceGoal({
          userId,
          employeeId: employee_id,
          employeeName: employee_name,
          role,
          goalTitle: goal.title,
          goalDescription: goal.description,
          status: "not_started",
          dueDate,
          isAtRisk: "false"
        });
        createdGoals.push(newGoal);
      }

      res.json({ goals: createdGoals });
    } catch (error) {
      console.error("Error generating goals:", error);
      res.status(500).json({ error: "Failed to generate goals. Please try again." });
    }
  });

  // Update a goal (status, due date)
  app.patch("/api/performance/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { status, dueDate } = req.body;
      const updateData: any = {};

      if (status) {
        if (!["not_started", "in_progress", "completed"].includes(status)) {
          res.status(400).json({ error: "Invalid status value" });
          return;
        }
        updateData.status = status;
      }

      if (dueDate) {
        updateData.dueDate = new Date(dueDate);
      }

      // Recalculate at-risk status
      const goal = await storage.getPerformanceGoal(req.params.id, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      const finalDueDate = updateData.dueDate || goal.dueDate;
      const finalStatus = updateData.status || goal.status;
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      if (finalStatus !== "completed") {
        const dueDateObj = new Date(finalDueDate);
        if (dueDateObj < now || dueDateObj <= sevenDaysFromNow) {
          updateData.isAtRisk = "true";
        } else {
          updateData.isAtRisk = "false";
        }
      } else {
        updateData.isAtRisk = "false";
      }

      const updated = await storage.updatePerformanceGoal(req.params.id, userId, updateData);
      if (!updated) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // Create manual goal
  app.post("/api/performance/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { employee_id, employee_name, role, goal_title, goal_description, due_date } = req.body;

      if (!employee_id || !employee_name || !role || !goal_title || !goal_description || !due_date) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      const dueDate = new Date(due_date);
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      let isAtRisk = "false";
      if (dueDate < now || dueDate <= sevenDaysFromNow) {
        isAtRisk = "true";
      }

      const goal = await storage.createPerformanceGoal({
        userId,
        employeeId: employee_id,
        employeeName: employee_name,
        role,
        goalTitle: goal_title,
        goalDescription: goal_description,
        status: "not_started",
        dueDate,
        isAtRisk
      });

      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  // Delete a goal
  app.delete("/api/performance/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const deleted = await storage.deletePerformanceGoal(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Analytics API - all real data
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Fetch all candidates and jobs for this user
      const allCandidates = await storage.getCandidates(userId);
      const allJobs = await storage.getJobs(userId);

      // 1. KPI Metrics
      const hiredCandidates = allCandidates.filter(c => c.stage === "Hired");
      const totalEmployees = hiredCandidates.length;
      const openPositions = allJobs.filter(j => j.status === "active").length;

      // Avg time to hire (days from appliedDate to now for hired candidates)
      let avgTimeToHire = 0;
      if (hiredCandidates.length > 0) {
        const now = new Date();
        const totalDays = hiredCandidates.reduce((sum, c) => {
          const applied = new Date(c.appliedDate);
          const days = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
      }

      // Offer acceptance rate (for now, approximate: hired / (hired + rejected offers))
      const offersExtended = allCandidates.filter(c => c.stage === "Offer" || c.stage === "Hired").length;
      const offerAcceptanceRate = offersExtended > 0 ? Math.round((hiredCandidates.length / offersExtended) * 100) : 0;

      // 2. Pipeline Funnel - count candidates by stage
      const stageOrder = ["Applied", "Screening", "Phone Interview", "Technical", "Final Round", "Offer", "Hired"];
      const pipelineStages = stageOrder.map(stage => ({
        stage,
        count: allCandidates.filter(c => c.stage === stage).length
      }));

      // 3. Pipeline Conversion Rates
      const conversions: Record<string, number> = {};
      for (let i = 0; i < stageOrder.length - 1; i++) {
        const fromStage = stageOrder[i];
        const toStage = stageOrder[i + 1];
        const fromCount = pipelineStages[i].count;
        const toCount = pipelineStages[i + 1].count;
        conversions[`${fromStage}_to_${toStage}`] = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
      }

      // 4. Headcount Over Time - group hired candidates by month
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const headcountByMonth: Record<string, number> = {};
      
      // Get the last 6 months
      const now = new Date();
      const last6Months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      last6Months.forEach(m => headcountByMonth[m] = 0);

      hiredCandidates.forEach(c => {
        const applied = new Date(c.appliedDate);
        const monthKey = `${applied.getFullYear()}-${String(applied.getMonth() + 1).padStart(2, '0')}`;
        if (headcountByMonth[monthKey] !== undefined) {
          headcountByMonth[monthKey]++;
        }
      });

      const headcountOverTime = {
        labels: last6Months.map(m => {
          const [year, month] = m.split('-');
          return monthNames[parseInt(month) - 1];
        }),
        data: last6Months.map(m => headcountByMonth[m] || 0)
      };

      // 5. Hiring trends over time (applications, interviews, hires per month)
      const hiringTrends = last6Months.map(m => {
        const [year, month] = m.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0);

        const monthCandidates = allCandidates.filter(c => {
          const applied = new Date(c.appliedDate);
          return applied >= monthStart && applied <= monthEnd;
        });

        const applications = monthCandidates.length;
        const interviews = monthCandidates.filter(c => 
          ["Phone Interview", "Technical", "Final Round", "Offer", "Hired"].includes(c.stage)
        ).length;
        const hires = monthCandidates.filter(c => c.stage === "Hired").length;

        return {
          month: monthNames[parseInt(month) - 1],
          applications,
          interviews,
          hires
        };
      });

      // 6. Recruiting Sources
      const sourceGroups: Record<string, { applications: number; hires: number }> = {};
      allCandidates.forEach(c => {
        const source = c.source || "Direct";
        if (!sourceGroups[source]) {
          sourceGroups[source] = { applications: 0, hires: 0 };
        }
        sourceGroups[source].applications++;
        if (c.stage === "Hired") {
          sourceGroups[source].hires++;
        }
      });

      const sourceData = Object.entries(sourceGroups).map(([source, data]) => ({
        source: source || "Direct",
        applications: data.applications,
        hires: data.hires
      }));

      // 7. Department/Role distribution (group hired by role)
      const roleGroups: Record<string, number> = {};
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
      hiredCandidates.forEach(c => {
        const role = c.role || "Other";
        roleGroups[role] = (roleGroups[role] || 0) + 1;
      });

      const departmentData = Object.entries(roleGroups).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));

      // 8. Efficiency metrics
      const avgDaysToFill = avgTimeToHire; // Using same calculation
      const interviewToHireRatio = totalEmployees > 0 ? 
        Math.round(allCandidates.filter(c => 
          ["Phone Interview", "Technical", "Final Round", "Offer", "Hired"].includes(c.stage)
        ).length / Math.max(totalEmployees, 1)) : 0;

      res.json({
        kpis: {
          totalEmployees,
          openPositions,
          avgTimeToHire,
          offerAcceptanceRate
        },
        pipelineStages,
        conversions,
        headcountOverTime,
        hiringTrends,
        sourceData,
        departmentData,
        efficiency: {
          avgDaysToFill,
          interviewToHireRatio
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Stripe Checkout Routes (connection:conn_stripe_01KC862ZZYZMDZ97Q2H76PX0F7)
  const STRIPE_PRICE_MAP: Record<string, string> = {
    growth: process.env.STRIPE_GROWTH_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  };

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe publishable key" });
    }
  });

  app.get("/api/stripe/products", isAuthenticated, async (_req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC`
      );
      res.json({ products: result.rows });
    } catch (error) {
      console.error("Error fetching Stripe products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/stripe/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { priceId, plan } = req.body;
      if (!priceId || !plan) {
        return res.status(400).json({ error: "Missing priceId or plan" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stripe = await getUncachableStripeClient();

      let customerId: string;
      const subscription = await storage.getSubscription(userId);
      
      if (subscription?.stripeCustomerId) {
        customerId = subscription.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        
        await storage.updateSubscription(userId, {
          stripeCustomerId: customerId,
        });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/pricing?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: {
          userId,
          plan,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/create-portal-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const subscription = await storage.getSubscription(userId);
      if (!subscription?.stripeCustomerId) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${baseUrl}/pricing`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  app.get("/api/stripe/subscription-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const subscription = await storage.getSubscription(userId);
      if (!subscription) {
        return res.json({ 
          plan: "free",
          status: "active",
          hasActiveSubscription: false,
        });
      }

      let stripeSubscription = null;
      if (subscription.stripeSubscriptionId) {
        try {
          const result = await db.execute(
            sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscription.stripeSubscriptionId}`
          );
          stripeSubscription = result.rows[0];
        } catch (e) {
          console.error("Error fetching stripe subscription:", e);
        }
      }

      res.json({
        plan: subscription.plan,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        hasActiveSubscription: subscription.status === "active" && subscription.plan !== "free",
        stripeSubscription,
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  return httpServer;
}
