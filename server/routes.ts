import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertSkillsTestResponseSchema
} from "@shared/schema";
import { randomBytes } from "crypto";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// In-memory resume storage (resumeId -> resumeText)
const resumeStore = new Map<string, string>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/jobs", async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create job" });
      }
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
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
      
      const job = await storage.updateJob(req.params.id, jobData);
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

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteJob(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData);
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create candidate" });
      }
    }
  });

  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const candidate = await storage.getCandidate(req.params.id);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate" });
    }
  });

  app.get("/api/candidates/:id/assessments", async (req, res) => {
    try {
      const candidateId = req.params.id;
      const assessments = await storage.getCandidateAssessments(candidateId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate assessments" });
    }
  });

  app.patch("/api/candidates/:id/stage", async (req, res) => {
    try {
      const { stage } = req.body;
      if (!stage || typeof stage !== "string") {
        res.status(400).json({ error: "Stage is required and must be a string" });
        return;
      }
      const candidate = await storage.updateCandidateStage(req.params.id, stage);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update candidate stage" });
    }
  });

  app.patch("/api/candidates/:id/job", async (req, res) => {
    try {
      const { jobId } = req.body;
      if (jobId !== null && (typeof jobId !== "string" || jobId === "")) {
        res.status(400).json({ error: "jobId must be a string or null" });
        return;
      }
      if (jobId !== null) {
        const job = await storage.getJob(jobId);
        if (!job) {
          res.status(404).json({ error: "Job not found" });
          return;
        }
      }
      const candidate = await storage.updateCandidateJobId(req.params.id, jobId);
      if (!candidate) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update candidate job" });
    }
  });

  app.get("/api/jobs/:id/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidatesByJobId(req.params.id);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates for job" });
    }
  });

  app.get("/api/jobs-with-candidates", async (req, res) => {
    try {
      const jobsWithCounts = await storage.getJobsWithCandidateCounts();
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

  app.patch("/api/candidates/:id", async (req, res) => {
    try {
      const updateData = insertCandidateSchema.partial().parse(req.body);
      const candidate = await storage.updateCandidate(req.params.id, updateData);
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

  app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
    try {
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

      const candidate = await storage.updateCandidate(candidateId, { 
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

  app.get("/api/resume/:candidateId", async (req, res) => {
    try {
      const candidate = await storage.getCandidate(req.params.candidateId);
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

      const skillsList = jobSkills?.join(", ") || "";
      const jobContext = jobDescription || `Job: ${jobTitle || "Unknown"}, Level: ${jobLevel || "Unknown"}, Skills: ${skillsList}`;

      const prompt = `You are an expert HR recruiter and AI-content forensics specialist. Your PRIMARY focus is detecting AI-generated or AI-assisted content. Be SKEPTICAL by default - modern AI generates convincing resumes with metrics and tools.

JOB CONTEXT:
${jobContext}

REQUIRED SKILLS:
${skillsList}

RESUME:
${resumeText}

PART 1 - JOB FIT ANALYSIS:
1. Fit score (0-100): How well does the candidate match job requirements?
2. Logic/risk score (0-100): Inconsistencies, gaps, or concerns (higher = more risk)
3. Skills analysis: matched, missing, and extra skills
4. Key findings (mark as "risk", "warning", or "good")
5. Brief summary of suitability

PART 2 - AI DETECTION (BE AGGRESSIVE - Modern AI is sophisticated):

6. Generic Writing Score (0-100) - Score HIGH (60+) if you see:
   - ANY clichés: "results-driven", "proven track record", "dynamic", "passionate", "detail-oriented", "self-starter", "team player", "go-getter", "leveraged", "spearheaded", "synergy", "cross-functional"
   - Buzzwords without substance: "innovative", "strategic", "cutting-edge", "state-of-the-art"
   - Perfect parallel structure in ALL bullets (AI loves consistency)
   - Every bullet starts with past-tense action verbs in identical patterns
   - Suspiciously polished language with no casual/natural voice

7. Specificity Score (0-100) - Score LOW (under 50) if:
   - Metrics use round numbers (20%, 30%, 50% instead of 23%, 37%, 48%)
   - Company descriptions are vague ("leading company", "innovative firm")
   - Project descriptions lack unique details that only someone who did it would know
   - Tools mentioned are just popular keywords without specific use cases
   - No mention of specific challenges, failures, or lessons learned

8. Fluff Ratio (0-100) - Score HIGH if:
   - Bullets describe responsibilities rather than achievements
   - Impact statements are generic ("improved efficiency", "enhanced productivity")
   - No before/after comparisons with specifics
   - Metrics seem fabricated (too perfect, too convenient)

9. AI-Style Likelihood Score (0-100) - THIS IS THE KEY SCORE. Score HIGH (60+) if:
   - Sentence lengths are suspiciously uniform (within 5-10 words of each other)
   - Perfect grammar with ZERO typos, abbreviations, or informal elements
   - No personality or unique voice - reads like a template
   - Every section is perfectly balanced in length
   - Vocabulary is consistently formal throughout (no natural variation)
   - Writing feels "optimized" - every word seems deliberately chosen
   - Too comprehensive - covers everything perfectly with no gaps
   - Achievements are suspiciously well-distributed across all roles
   - Numbers follow patterns (all multiples of 5 or 10)
   - Lacks specific anecdotes or stories that feel personal
   - Uses trendy keywords that AI tends to insert

10. Additional red flags to look for:
    - Does the resume feel like it could apply to anyone in this field?
    - Are there unique human touches (casual phrasing, specific anecdotes)?
    - Does the writing have natural rhythm variations or is it robotically consistent?

IMPORTANT: Err on the side of HIGHER AI detection scores. A 100% AI-generated resume should score 70-90+ on aiStyleLikelihood. If the resume seems "too perfect", that itself is suspicious. "Perfect" resumes with metrics ARE often AI-generated.

Respond in this exact JSON format:
{
  "fitScore": 75,
  "logicScore": 25,
  "skillMatch": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3"],
    "extra": ["skill4", "skill5"]
  },
  "findings": [
    {
      "type": "good",
      "message": "Strong relevant experience",
      "details": "Candidate has 5+ years in similar role"
    },
    {
      "type": "warning",
      "message": "Employment gap detected",
      "details": "6-month gap between positions in 2022"
    }
  ],
  "summary": "Overall assessment of the candidate in 2-3 sentences",
  "authenticitySignals": {
    "genericWritingScore": 75,
    "specificityScore": 35,
    "fluffRatio": 65,
    "aiStyleLikelihood": 80,
    "clichePhrases": ["results-driven", "proven track record", "leveraged", "spearheaded"],
    "metricsFound": ["increased sales by 30%", "managed team of 12"],
    "toolsMentioned": ["Salesforce", "Excel", "Python"],
    "structuralPatterns": ["All bullets 15-20 words", "Every bullet starts with past-tense verb", "Round percentages only"],
    "warnings": [
      {
        "type": "risk",
        "message": "High AI-generation probability",
        "details": "Resume exhibits multiple AI writing patterns including uniform structure, perfect grammar, and optimized buzzword placement"
      }
    ],
    "recommendation": "This resume shows strong indicators of AI-assisted writing. In interviews, ask for specific stories behind achievements, request examples of challenges faced, and verify metrics with follow-up questions about methodology."
  }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      
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

  app.post("/api/generate-skills-test", async (req, res) => {
    try {
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
        return {
          id: q.id || idx + 1,
          type: "multiple_choice" as const,
          text: q.text,
          options: q.options,
          bestAnswerIndex: q.bestAnswerIndex,
          goodAnswerIndex: q.goodAnswerIndex,
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
  app.post("/api/skills-tests", async (req, res) => {
    try {
      const testData = insertSkillsTestSchema.parse(req.body);
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

  app.get("/api/skills-tests", async (req, res) => {
    try {
      const tests = await storage.getSkillsTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills tests" });
    }
  });

  app.get("/api/skills-tests/:id", async (req, res) => {
    try {
      const test = await storage.getSkillsTest(req.params.id);
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

  app.get("/api/skills-test-invitations", async (req, res) => {
    try {
      const invitations = await storage.getSkillsTestInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.get("/api/skills-test-invitations/:id", async (req, res) => {
    try {
      const invitation = await storage.getSkillsTestInvitation(req.params.id);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  app.get("/api/candidates/:id/skills-test-invitations", async (req, res) => {
    try {
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
      
      // Get the actual test questions
      const test = await storage.getSkillsTest(invitation.testId);
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
      
      // Get test for scoring
      const test = await storage.getSkillsTest(invitation.testId);
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
  app.get("/api/skills-test-invitations/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getSkillsTestResponsesByInvitationId(req.params.id);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test responses" });
    }
  });

  // Rescore a completed test invitation
  app.post("/api/skills-test-invitations/:id/rescore", async (req, res) => {
    try {
      const invitation = await storage.getSkillsTestInvitation(req.params.id);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      if (invitation.status !== "completed") {
        res.status(400).json({ error: "Can only rescore completed tests" });
        return;
      }

      const test = await storage.getSkillsTest(invitation.testId);
      if (!test) {
        res.status(404).json({ error: "Test not found" });
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

      res.json({ success: true, score: finalScore });
    } catch (error) {
      console.error("Rescore error:", error);
      res.status(500).json({ error: "Failed to rescore test" });
    }
  });

  return httpServer;
}
