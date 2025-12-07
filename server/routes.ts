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
  insertResumeAnalysisSchema
} from "@shared/schema";
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
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        res.status(400).json({ error: "Status is required and must be a string" });
        return;
      }
      const recommendation = await storage.updateSkillsTestRecommendationStatus(req.params.id, status);
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
      const { resumeText, jobDescription, jobSkills, jobTitle, jobLevel } = req.body;
      
      if (!resumeText) {
        res.status(400).json({ error: "Resume text is required" });
        return;
      }

      const skillsList = jobSkills?.join(", ") || "";
      const jobContext = jobDescription || `Job: ${jobTitle || "Unknown"}, Level: ${jobLevel || "Unknown"}, Skills: ${skillsList}`;

      const prompt = `You are an expert HR recruiter analyzing a resume for job fit and logical consistency. Analyze the following resume against the job requirements.

JOB CONTEXT:
${jobContext}

REQUIRED SKILLS:
${skillsList}

RESUME:
${resumeText}

Analyze this resume and provide:
1. A fit score (0-100) based on how well the candidate matches the job requirements
2. A logic/risk score (0-100) measuring inconsistencies, gaps, or concerns (higher = more risk)
3. Skills analysis - which required skills are matched, missing, and what extra skills they have
4. Key findings about the resume (mark each as "risk", "warning", or "good")
5. A brief summary of the candidate's suitability

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
  "summary": "Overall assessment of the candidate in 2-3 sentences"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Resume analysis error:", error);
      res.status(500).json({ error: "Failed to analyze resume" });
    }
  });

  app.post("/api/generate-skills-test", async (req, res) => {
    try {
      const { roleName, difficulty, skills, questionCount } = req.body;
      
      if (!roleName || !difficulty || !skills) {
        res.status(400).json({ error: "Missing required fields: roleName, difficulty, skills" });
        return;
      }

      const numQuestions = parseInt(questionCount) || 5;

      const prompt = `You are an expert technical recruiter creating a skills assessment test. Generate exactly ${numQuestions} questions to test a candidate for a ${roleName} position at the ${difficulty} level.

Skills to test: ${skills}

Create a mix of multiple choice and open-ended questions. Each question should:
- Be practical and scenario-based, not just trivia
- Test real-world application of the skill
- Be appropriate for the ${difficulty} difficulty level

Respond with a JSON object in exactly this format:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    },
    {
      "id": 2,
      "type": "open_text",
      "text": "Open-ended question text here"
    }
  ]
}

Generate approximately 60% multiple choice and 40% open text questions. Make sure all questions are relevant to the specified skills and difficulty level.`;

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
      const skillsArray = skills.split(",").map((s: string) => s.trim());
      
      res.json({
        id: `test-${Date.now()}`,
        roleName,
        skills: skillsArray,
        questions: result.questions,
        status: "draft",
        candidatesCompleted: 0,
        avgScore: 0,
      });
    } catch (error) {
      console.error("Skills test generation error:", error);
      res.status(500).json({ error: "Failed to generate skills test" });
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

Please provide:
1. A compelling job description with sections for: About the Role, Key Responsibilities, Requirements, and Why Join Us
2. An estimated annual salary range in USD based on current market rates for this role, level, and location type

Format your response as JSON with exactly this structure:
{
  "description": "The full job description text with markdown formatting",
  "salaryMin": 80000,
  "salaryMax": 120000
}

Make the description professional but engaging. Use bullet points for responsibilities and requirements. The salary should reflect realistic 2024 market rates for the specified level and location type.`;

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
      res.json({
        description: result.description,
        salaryRange: {
          min: result.salaryMin,
          max: result.salaryMax,
        },
      });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: "Failed to generate job description" });
    }
  });

  return httpServer;
}
