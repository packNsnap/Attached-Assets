import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, FileText, Upload, AlertTriangle, CheckCircle, Search, XCircle, Briefcase, Target, ClipboardList, Bot, Sparkles, TrendingDown, Quote, Wrench, Info, Columns, Calendar, TrendingUp, Building, GraduationCap, ArrowRight, Clock, Flag, Download, Save, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Job } from "@shared/schema";

const formSchema = z.object({
  jobId: z.string().optional(),
  jobDescription: z.string().optional(),
  resumeName: z.string().optional(),
  resumeText: z.string().optional(),
});

type SkillMatch = {
  matched: string[];
  missing: string[];
  extra: string[];
};

type AuthenticityWarning = {
  type: "risk" | "warning" | string;
  message: string;
  details: string;
};

type AuthenticitySignals = {
  genericWritingScore: number;
  specificityScore: number;
  fluffRatio: number;
  aiStyleLikelihood: number;
  vaguenessRisk?: number;
  clichePhrases?: string[];
  metricsFound?: string[];
  toolsMentioned?: string[];
  structuralPatterns?: string[];
  warnings: AuthenticityWarning[];
  recommendation: string;
};

type ExtractedJob = {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  durationMonths: number | null;
  responsibilities: string[];
  achievements: string[];
};

type ExtractedEducation = {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string | null;
};

type Pass1Result = {
  jobs: ExtractedJob[];
  education: ExtractedEducation[];
  skills: {
    hard: string[];
    domain: string[];
    soft: string[];
  };
  totalExperienceYears: number;
  extractionConfidence: number;
};

type TimelineConcern = {
  type: string;
  severity: "ok" | "mild_concern" | "major_concern";
  description: string;
  details: string;
  riskScore: number;
};

type Pass2Result = {
  timelineAnalysis: {
    overlaps: Array<{ job1: string; job2: string; overlapMonths: number }>;
    gaps: Array<{ afterJob: string; beforeJob: string; gapMonths: number }>;
    averageTenureMonths: number;
    jobCount: number;
    yearsAnalyzed: number;
    promotionTransitions: Array<{ from: string; to: string; months: number; isUnusual: boolean }>;
  };
  concerns: TimelineConcern[];
  riskScores: {
    timeline_risk: number;
    promotion_risk: number;
    job_hop_risk: number;
  };
};

type Pass3Result = {
  subScores: {
    skills_match: number;
    experience_years_match: number;
    industry_match: number;
  };
  fitScore: number;
  skillsAnalysis: {
    matched_must_have: string[];
    missing_must_have: string[];
    matched_nice_to_have: string[];
    bonus_skills: string[];
  };
  experienceAnalysis: {
    requiredYears: number;
    candidateYears: number;
    relevantYears: number;
  };
  industryAnalysis: {
    targetIndustry: string;
    candidateIndustries: string[];
    overlapScore: number;
  };
};

type Pass4Result = {
  summary: string;
  redFlags: Array<{ flag: string; severity: "critical" | "warning"; details: string }>;
  greenFlags: Array<{ flag: string; details: string }>;
  recommendedAction: "proceed_to_interview" | "skills_test_first" | "phone_screen" | "reject" | "needs_review";
  nextSteps: string[];
  interviewFocusAreas: string[];
  overallRiskScore: number;
  authenticitySignals: {
    genericWritingScore: number;
    specificityScore: number;
    fluffRatio: number;
    aiStyleLikelihood: number;
    vaguenessRisk: number;
  };
};

type FraudFlag = {
  category: "timeline" | "company" | "credentials" | "content" | "consistency" | "ai_generated";
  severity: "critical" | "high" | "medium" | "low";
  flag: string;
  evidence: string;
  confidence: number;
};

type Pass5Result = {
  authenticityScore: number;
  plausibilityScore: number;
  tooPerfectScore: number;
  tooPerfectIndicators: string[];
  overallVerdict: "LIKELY_REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
  fraudFlags: FraudFlag[];
  timelineNotes: string;
  roleFitNotes: string;
  certEducationNotes: string;
  recommendation: "verified" | "needs_verification" | "high_risk" | "likely_fraudulent";
  summary: string;
};

type AnalysisResult = {
  fitScore: number;
  logicScore: number;
  authenticityScore?: number;
  plausibilityScore?: number;
  tooPerfectScore?: number;
  tooPerfectIndicators?: string[];
  overallVerdict?: "LIKELY_REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
  skillMatch: SkillMatch;
  findings: {
    type: "risk" | "warning" | "good";
    message: string;
    details: string;
  }[];
  summary: string;
  selectedJob?: Job;
  authenticitySignals?: AuthenticitySignals;
  fraudFlags?: FraudFlag[];
  timelineNotes?: string;
  roleFitNotes?: string;
  certEducationNotes?: string;
  pass1?: Pass1Result;
  pass2?: Pass2Result;
  pass3?: Pass3Result;
  pass4?: Pass4Result;
  pass5?: Pass5Result;
} | null;

export default function ResumeAnalyzerModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult>(null);
  const [fileName, setFileName] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: candidates = [] } = useQuery<{ id: string; name: string; resumeUrl?: string }[]>({
    queryKey: ["candidates-with-resumes"],
    queryFn: async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const recommendMutation = useMutation({
    mutationFn: async (data: { candidateId?: string; candidateName: string; jobId: string; jobTitle: string; skillsNeeded: string[]; fitScore: number }) => {
      const res = await fetch("/api/skills-test-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create recommendation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-recommendations"] });
      toast({
        title: "Recommendation Sent",
        description: "Skills test recommendation created.",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/skills-test")}>
            View in Skills Tests
          </Button>
        ),
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create skills test recommendation.",
      });
    },
  });

  const saveReportMutation = useMutation({
    mutationFn: async (data: {
      candidateId: string;
      htmlContent: string;
      fileName: string;
      jobTitle: string;
      jobId?: string;
      analysis: NonNullable<AnalysisResult>;
    }) => {
      // First, save the structured analysis data
      const analysisRes = await fetch("/api/resume-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: data.candidateId,
          jobId: data.jobId || null,
          jobTitle: data.jobTitle,
          fitScore: data.analysis.fitScore,
          logicScore: data.analysis.logicScore,
          matchedSkills: data.analysis.skillMatch.matched,
          missingSkills: data.analysis.skillMatch.missing,
          extraSkills: data.analysis.skillMatch.extra,
          findings: JSON.stringify(data.analysis.findings),
          summary: data.analysis.summary,
          authenticitySignals: data.analysis.authenticitySignals ? JSON.stringify(data.analysis.authenticitySignals) : null,
        }),
      });
      if (!analysisRes.ok) throw new Error("Failed to save analysis data");

      // Then, save the HTML document
      const docRes = await fetch(`/api/candidates/${data.candidateId}/save-analysis-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: data.htmlContent,
          fileName: data.fileName,
          jobTitle: data.jobTitle,
        }),
      });
      if (!docRes.ok) throw new Error("Failed to save report document");
      return docRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-documents", selectedCandidateId] });
      queryClient.invalidateQueries({ queryKey: ["resume-analysis", selectedCandidateId] });
      toast({
        title: "Analysis Saved",
        description: "Resume analysis has been saved to the candidate's profile and documents.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save analysis to candidate.",
      });
    },
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobId: "",
      jobDescription: "",
      resumeName: "",
      resumeText: "",
    },
  });

  const selectedJobId = form.watch("jobId");
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      form.setValue("resumeName", e.target.files[0].name);
    }
  };

  const handleCandidateSelect = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.resumeUrl) {
      setFileName(candidate.resumeUrl);
      try {
        const response = await fetch(`/api/resume/${candidateId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.resumeText) {
            setResumeText(data.resumeText);
          }
        }
      } catch (error) {
        console.error("Error fetching candidate resume", error);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!fileName && !resumeText) {
      toast({
        variant: "destructive",
        title: "Resume missing",
        description: "Please upload a resume file or paste resume text to analyze.",
      });
      return;
    }

    if (!selectedJob && !values.jobDescription) {
      toast({
        variant: "destructive",
        title: "Job context missing",
        description: "Please select a job or paste a job description.",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText,
          jobDescription: values.jobDescription || selectedJob?.description,
          jobSkills: selectedJob?.skills || [],
          jobTitle: selectedJob?.title || "",
          jobLevel: selectedJob?.level || "",
          candidateId: selectedCandidateId || undefined,
          jobId: selectedJob?.id || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze resume");
      }

      const analysisResult = await response.json();
      setResult({
        ...analysisResult,
        selectedJob,
      });
      setIsResultModalOpen(true);
      
      if (selectedCandidateId) {
        queryClient.invalidateQueries({ queryKey: ["resume-analysis", selectedCandidateId] });
      }
      
      toast({
        title: "Analysis Complete",
        description: "Resume logic and fit have been analyzed using AI.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the resume. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function generateReportHtml(analysis: NonNullable<AnalysisResult>, candidateName: string, jobTitle: string): string {
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fitScoreColor = analysis.fitScore >= 70 ? '#16a34a' : analysis.fitScore >= 50 ? '#ca8a04' : '#dc2626';
    const riskScoreColor = analysis.logicScore < 30 ? '#16a34a' : analysis.logicScore < 60 ? '#ca8a04' : '#dc2626';
    
    const recommendationMap: Record<string, { text: string; color: string }> = {
      'proceed_to_interview': { text: 'Proceed to Interview', color: '#16a34a' },
      'skills_test_first': { text: 'Skills Test First', color: '#2563eb' },
      'phone_screen': { text: 'Phone Screen', color: '#ca8a04' },
      'reject': { text: 'Reject', color: '#dc2626' },
      'needs_review': { text: 'Needs Manual Review', color: '#ca8a04' },
    };
    const rec = analysis.pass4 ? recommendationMap[analysis.pass4.recommendedAction] : null;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume Analysis Report - ${candidateName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1f2937; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 28px; color: #111827; margin-bottom: 8px; }
    .header .subtitle { color: #6b7280; font-size: 14px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .meta-item { text-align: center; }
    .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 14px; font-weight: 600; color: #111827; margin-top: 4px; }
    .scores { display: flex; gap: 24px; margin-bottom: 32px; }
    .score-card { flex: 1; padding: 20px; border-radius: 12px; text-align: center; }
    .score-card.fit { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; }
    .score-card.risk { background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border: 1px solid #fca5a5; }
    .score-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .score-value { font-size: 36px; font-weight: 700; }
    .score-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 8px; }
    .recommendation { padding: 16px 24px; border-radius: 8px; margin-bottom: 32px; display: flex; align-items: center; gap: 12px; }
    .recommendation-icon { font-size: 20px; }
    .recommendation-text { font-weight: 600; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 20px; border-radius: 2px; }
    .section-title.skills::before { background: #3b82f6; }
    .section-title.timeline::before { background: #8b5cf6; }
    .section-title.flags::before { background: #f59e0b; }
    .section-title.authenticity::before { background: #ec4899; }
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .skills-box { padding: 12px; border-radius: 8px; }
    .skills-box.matched { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .skills-box.missing { background: #fef2f2; border: 1px solid #fca5a5; }
    .skills-box.extra { background: #eff6ff; border: 1px solid #bfdbfe; }
    .skills-box-title { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .skill-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
    .skill-tag.matched { background: #d1fae5; color: #047857; }
    .skill-tag.missing { background: #fecaca; color: #b91c1c; }
    .skill-tag.extra { background: #dbeafe; color: #1d4ed8; }
    .finding { display: flex; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
    .finding.risk { background: #fef2f2; border-left: 3px solid #dc2626; }
    .finding.warning { background: #fffbeb; border-left: 3px solid #f59e0b; }
    .finding.good { background: #ecfdf5; border-left: 3px solid #16a34a; }
    .finding-icon { font-size: 16px; }
    .finding-content { flex: 1; }
    .finding-message { font-weight: 500; font-size: 14px; }
    .finding-details { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .authenticity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .auth-item { padding: 12px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .auth-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .auth-value { font-size: 20px; font-weight: 600; }
    .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .summary { padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 32px; }
    .summary p { font-size: 14px; color: #374151; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
    .print-btn:hover { background: #2563eb; }
    @media print { .print-btn { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Resume Analysis Report</h1>
    <p class="subtitle">Generated by Resume Logik AI</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Candidate</div>
      <div class="meta-value">${candidateName}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Position</div>
      <div class="meta-value">${jobTitle}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Date</div>
      <div class="meta-value">${date}</div>
    </div>
  </div>

  <div class="scores">
    <div class="score-card fit">
      <div class="score-label">Fit Score</div>
      <div class="score-value" style="color: ${fitScoreColor}">${analysis.fitScore}%</div>
      <span class="score-badge" style="background: ${fitScoreColor}20; color: ${fitScoreColor}">
        ${analysis.fitScore >= 70 ? 'Good Fit' : analysis.fitScore >= 50 ? 'Partial Fit' : 'Low Fit'}
      </span>
    </div>
    <div class="score-card risk">
      <div class="score-label">Risk Score</div>
      <div class="score-value" style="color: ${riskScoreColor}">${analysis.logicScore}%</div>
      <span class="score-badge" style="background: ${riskScoreColor}20; color: ${riskScoreColor}">
        ${analysis.logicScore < 30 ? 'Low Risk' : analysis.logicScore < 60 ? 'Medium Risk' : 'High Risk'}
      </span>
    </div>
  </div>

  ${rec ? `
  <div class="recommendation" style="background: ${rec.color}10; border: 1px solid ${rec.color}40;">
    <span class="recommendation-icon">📋</span>
    <span class="recommendation-text" style="color: ${rec.color}">Recommendation: ${rec.text}</span>
  </div>
  ` : ''}

  ${analysis.summary ? `
  <div class="summary">
    <p>${analysis.summary}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title skills">Skills Match</h2>
    <div class="skills-grid">
      <div class="skills-box matched">
        <div class="skills-box-title">Matched Skills (${analysis.skillMatch.matched.length})</div>
        ${analysis.skillMatch.matched.map(s => `<span class="skill-tag matched">${s}</span>`).join('')}
      </div>
      <div class="skills-box missing">
        <div class="skills-box-title">Missing Skills (${analysis.skillMatch.missing.length})</div>
        ${analysis.skillMatch.missing.map(s => `<span class="skill-tag missing">${s}</span>`).join('')}
      </div>
      <div class="skills-box extra">
        <div class="skills-box-title">Extra Skills (${analysis.skillMatch.extra.length})</div>
        ${analysis.skillMatch.extra.map(s => `<span class="skill-tag extra">${s}</span>`).join('')}
      </div>
    </div>
  </div>

  ${analysis.findings.length > 0 ? `
  <div class="section">
    <h2 class="section-title flags">Findings</h2>
    ${analysis.findings.map(f => `
      <div class="finding ${f.type}">
        <span class="finding-icon">${f.type === 'risk' ? '❌' : f.type === 'warning' ? '⚠️' : '✅'}</span>
        <div class="finding-content">
          <div class="finding-message">${f.message}</div>
          <div class="finding-details">${f.details}</div>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${analysis.authenticitySignals ? `
  <div class="section">
    <h2 class="section-title authenticity">Authenticity Signals</h2>
    <div class="authenticity-grid">
      <div class="auth-item">
        <div class="auth-label">Generic Writing Score</div>
        <div class="auth-value" style="color: ${analysis.authenticitySignals.genericWritingScore > 60 ? '#ca8a04' : '#16a34a'}">${analysis.authenticitySignals.genericWritingScore}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${analysis.authenticitySignals.genericWritingScore}%; background: ${analysis.authenticitySignals.genericWritingScore > 60 ? '#ca8a04' : '#16a34a'}"></div></div>
      </div>
      <div class="auth-item">
        <div class="auth-label">Specificity Score</div>
        <div class="auth-value" style="color: ${analysis.authenticitySignals.specificityScore < 40 ? '#ca8a04' : '#16a34a'}">${analysis.authenticitySignals.specificityScore}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${analysis.authenticitySignals.specificityScore}%; background: ${analysis.authenticitySignals.specificityScore < 40 ? '#ca8a04' : '#16a34a'}"></div></div>
      </div>
      <div class="auth-item">
        <div class="auth-label">Fluff Ratio</div>
        <div class="auth-value" style="color: ${analysis.authenticitySignals.fluffRatio > 50 ? '#ca8a04' : '#16a34a'}">${analysis.authenticitySignals.fluffRatio}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${analysis.authenticitySignals.fluffRatio}%; background: ${analysis.authenticitySignals.fluffRatio > 50 ? '#ca8a04' : '#16a34a'}"></div></div>
      </div>
      <div class="auth-item">
        <div class="auth-label">AI-Style Likelihood</div>
        <div class="auth-value" style="color: ${analysis.authenticitySignals.aiStyleLikelihood > 60 ? '#ea580c' : analysis.authenticitySignals.aiStyleLikelihood > 40 ? '#ca8a04' : '#16a34a'}">${analysis.authenticitySignals.aiStyleLikelihood}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${analysis.authenticitySignals.aiStyleLikelihood}%; background: ${analysis.authenticitySignals.aiStyleLikelihood > 60 ? '#ea580c' : analysis.authenticitySignals.aiStyleLikelihood > 40 ? '#ca8a04' : '#16a34a'}"></div></div>
      </div>
    </div>
    ${analysis.authenticitySignals.recommendation ? `
    <div style="margin-top: 16px; padding: 12px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px;">
      <p style="font-size: 13px; color: #7c3aed;"><strong>Recommendation:</strong> ${analysis.authenticitySignals.recommendation}</p>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>This report was generated automatically by Resume Logik AI analysis.</p>
    <p style="margin-top: 4px;">This is an internal consistency analysis only and is not a background check or verification of claims.</p>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;
  }

  const module = getModuleByPath("/resume-analyzer");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Resume Logic Analyzer"
        description="Detect inconsistencies, gaps, and logic risks in resumes. Compare against job requirements."
        icon={module.icon}
        gradient={module.color}
        badge={module.featured ? "AI" : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Upload & Context</CardTitle>
            <CardDescription>
              Upload a resume and select a job to compare against.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                  <Label>Select Candidate from System</Label>
                  <Select value={selectedCandidateId} onValueChange={handleCandidateSelect}>
                    <SelectTrigger data-testid="select-candidate-resume">
                      <SelectValue placeholder="Choose a candidate with uploaded resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates
                        .filter(c => c.resumeUrl)
                        .map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id} data-testid={`option-candidate-${candidate.id}`}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {candidates.filter(c => c.resumeUrl).length === 0 && (
                    <p className="text-xs text-muted-foreground">No candidates with uploaded resumes. Add one in the Candidates module first.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Or Upload Resume (PDF/Docx)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <Input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      data-testid="input-resume-file"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      {fileName ? (
                        <div className="text-sm font-medium text-foreground">
                          {fileName}
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium">Click to upload or drag and drop</div>
                          <div className="text-xs text-muted-foreground">PDF or DOCX up to 5MB</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Or Paste Resume Text</Label>
                  <Textarea
                    placeholder="Paste resume content here..."
                    className="min-h-[100px] font-mono text-sm"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    data-testid="input-resume-text"
                  />
                </div>

                <div className="border-t pt-4">
                  <FormField
                    control={form.control}
                    name="jobId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Select Job from System
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-job">
                              <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Choose a job to compare against"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id} data-testid={`option-job-${job.id}`}>
                                {job.title} - {job.level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedJob && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-primary" />
                          Required Skills for {selectedJob.title}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedJob.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Level: {selectedJob.level} | Location: {selectedJob.location}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedJobId && (
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Or Paste Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the job description here..." 
                            className="min-h-[120px] font-mono text-sm"
                            data-testid="input-job-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={isAnalyzing} data-testid="button-analyze">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Logic...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Analysis Complete
                </CardTitle>
                <CardDescription>
                  {result.selectedJob ? `Analyzed for: ${result.selectedJob.title}` : "Resume analysis completed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">Fit Score</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-bold", result.fitScore >= 70 ? "text-green-600" : result.fitScore >= 50 ? "text-yellow-600" : "text-red-600")} data-testid="text-fit-score">
                        {result.fitScore}%
                      </span>
                      <Badge variant={result.fitScore >= 70 ? "default" : "secondary"} className={result.fitScore >= 70 ? "bg-green-600" : ""}>
                        {result.fitScore >= 70 ? "Good Fit" : result.fitScore >= 50 ? "Partial Fit" : "Low Fit"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-bold", result.logicScore < 30 ? "text-green-600" : result.logicScore < 60 ? "text-yellow-600" : "text-red-600")} data-testid="text-logic-score">
                        {result.logicScore}%
                      </span>
                      <Badge variant="secondary" className={result.logicScore < 30 ? "bg-green-100 text-green-700" : result.logicScore < 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {result.logicScore < 30 ? "Low Risk" : result.logicScore < 60 ? "Medium Risk" : "High Risk"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {result.authenticityScore !== undefined && (
                  <div className={cn("p-4 rounded-lg border", 
                    result.overallVerdict === "LIKELY_REAL" ? "bg-green-50/50 border-green-200" :
                    result.overallVerdict === "SUSPICIOUS" ? "bg-yellow-50/50 border-yellow-200" :
                    "bg-red-50/50 border-red-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", 
                          result.overallVerdict === "LIKELY_REAL" ? "bg-green-100" :
                          result.overallVerdict === "SUSPICIOUS" ? "bg-yellow-100" :
                          "bg-red-100"
                        )}>
                          {result.overallVerdict === "LIKELY_REAL" ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                           result.overallVerdict === "SUSPICIOUS" ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
                           <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Plausibility Score</p>
                          <p className={cn("text-2xl font-bold",
                            result.authenticityScore >= 70 ? "text-green-600" :
                            result.authenticityScore >= 40 ? "text-yellow-600" :
                            "text-red-600"
                          )} data-testid="text-authenticity-score">
                            {result.authenticityScore}%
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        result.overallVerdict === "LIKELY_REAL" ? "bg-green-600" :
                        result.overallVerdict === "SUSPICIOUS" ? "bg-yellow-600" :
                        "bg-red-600"
                      )}>
                        {result.overallVerdict === "LIKELY_REAL" ? "Likely Real" :
                         result.overallVerdict === "SUSPICIOUS" ? "Suspicious" :
                         "Likely Fake"}
                      </Badge>
                    </div>
                    {result.fraudFlags && result.fraudFlags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current/10">
                        <p className="text-xs text-muted-foreground mb-2">Detected Issues ({result.fraudFlags.length})</p>
                        <div className="space-y-1.5">
                          {result.fraudFlags.slice(0, 3).map((flag, i) => (
                            <div key={i} className={cn("text-xs px-2 py-1 rounded flex items-start gap-2",
                              flag.severity === "critical" ? "bg-red-100 text-red-700" :
                              flag.severity === "high" ? "bg-orange-100 text-orange-700" :
                              flag.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-slate-100 text-slate-700"
                            )}>
                              <span className="font-medium">{flag.flag}</span>
                            </div>
                          ))}
                          {result.fraudFlags.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{result.fraudFlags.length - 3} more issues</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {result.tooPerfectScore !== undefined && result.tooPerfectScore > 30 && (
                  <div className={cn("p-4 rounded-lg border", 
                    result.tooPerfectScore > 80 ? "bg-red-50/50 border-red-200" :
                    result.tooPerfectScore > 60 ? "bg-orange-50/50 border-orange-200" :
                    "bg-yellow-50/50 border-yellow-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", 
                          result.tooPerfectScore > 80 ? "bg-red-100" :
                          result.tooPerfectScore > 60 ? "bg-orange-100" :
                          "bg-yellow-100"
                        )}>
                          <Sparkles className={cn("h-5 w-5",
                            result.tooPerfectScore > 80 ? "text-red-600" :
                            result.tooPerfectScore > 60 ? "text-orange-600" :
                            "text-yellow-600"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Too Perfect Score</p>
                          <p className={cn("text-2xl font-bold",
                            result.tooPerfectScore > 80 ? "text-red-600" :
                            result.tooPerfectScore > 60 ? "text-orange-600" :
                            "text-yellow-600"
                          )} data-testid="text-too-perfect-score">
                            {result.tooPerfectScore}%
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        result.tooPerfectScore > 80 ? "bg-red-600" :
                        result.tooPerfectScore > 60 ? "bg-orange-600" :
                        "bg-yellow-600"
                      )}>
                        {result.tooPerfectScore > 80 ? "Suspiciously Optimized" :
                         result.tooPerfectScore > 60 ? "Very Polished" :
                         "Slightly Polished"}
                      </Badge>
                    </div>
                    {result.tooPerfectIndicators && result.tooPerfectIndicators.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current/10">
                        <p className="text-xs text-muted-foreground mb-2">Why it looks over-optimized:</p>
                        <div className="space-y-1">
                          {result.tooPerfectIndicators.slice(0, 3).map((indicator, i) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-600 mt-0.5">•</span>
                              {indicator}
                            </p>
                          ))}
                          {result.tooPerfectIndicators.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{result.tooPerfectIndicators.length - 3} more indicators</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {result.pass4 && (
                  <div className={cn("p-3 rounded-lg border", 
                    result.pass4.recommendedAction === "proceed_to_interview" ? "bg-green-50/50 border-green-200" :
                    result.pass4.recommendedAction === "reject" ? "bg-red-50/50 border-red-200" :
                    "bg-yellow-50/50 border-yellow-200"
                  )}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      <span className="text-sm font-medium">Recommendation:</span>
                      <Badge className={cn(
                        result.pass4.recommendedAction === "proceed_to_interview" ? "bg-green-600" :
                        result.pass4.recommendedAction === "reject" ? "bg-red-600" :
                        result.pass4.recommendedAction === "skills_test_first" ? "bg-blue-600" :
                        "bg-yellow-600"
                      )}>
                        {result.pass4.recommendedAction === "proceed_to_interview" && "Proceed to Interview"}
                        {result.pass4.recommendedAction === "reject" && "Reject"}
                        {result.pass4.recommendedAction === "skills_test_first" && "Skills Test First"}
                        {result.pass4.recommendedAction === "phone_screen" && "Phone Screen"}
                        {result.pass4.recommendedAction === "needs_review" && "Needs Manual Review"}
                      </Badge>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => setIsResultModalOpen(true)}
                  data-testid="button-view-results"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center bg-muted/10 border-dashed min-h-[400px]">
              <CardContent className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">Waiting for Resume</h3>
                <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto mt-2">
                  Upload a resume and select a job to start the analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0" data-testid="dialog-analysis-results">
          <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>Resume Analysis Report</span>
                {result?.selectedJob && (
                  <p className="text-sm font-normal text-muted-foreground mt-0.5">{result.selectedJob.title}</p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Complete analysis of the resume
            </DialogDescription>
          </DialogHeader>

          {result && (
            <>
              <div className="flex gap-3 px-6 py-4 bg-muted/30 border-b flex-shrink-0">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", 
                  result.fitScore >= 70 ? "bg-green-100 text-green-700" : result.fitScore >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                )}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Fit: {result.fitScore}%</span>
                </div>
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  result.logicScore < 30 ? "bg-green-100 text-green-700" : result.logicScore < 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                )} data-testid="modal-risk-score">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Risk: {result.logicScore}%</span>
                </div>
                {result.pass4 && (
                  <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ml-auto",
                    result.pass4.recommendedAction === "proceed_to_interview" ? "bg-green-600 text-white" :
                    result.pass4.recommendedAction === "reject" ? "bg-red-600 text-white" :
                    result.pass4.recommendedAction === "skills_test_first" ? "bg-blue-600 text-white" :
                    "bg-yellow-600 text-white"
                  )}>
                    <Flag className="h-3.5 w-3.5" />
                    {result.pass4.recommendedAction === "proceed_to_interview" && "Proceed to Interview"}
                    {result.pass4.recommendedAction === "reject" && "Reject"}
                    {result.pass4.recommendedAction === "skills_test_first" && "Skills Test First"}
                    {result.pass4.recommendedAction === "phone_screen" && "Phone Screen"}
                    {result.pass4.recommendedAction === "needs_review" && "Needs Review"}
                  </div>
                )}
              </div>

              <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex-shrink-0 w-full justify-start overflow-x-auto bg-transparent border-b rounded-none h-auto p-0 px-6">
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-profile">Profile</TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="flags" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-flags">Flags</TabsTrigger>
                  <TabsTrigger value="skills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-skills">Skills</TabsTrigger>
                  <TabsTrigger value="authenticity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-authenticity">Authenticity</TabsTrigger>
                  <TabsTrigger value="report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3" data-testid="tab-report">Report</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    {result.pass4 && (
                      <div className={cn("p-4 rounded-lg border",
                        result.pass4.recommendedAction === "proceed_to_interview" ? "bg-green-50/50 border-green-200" :
                        result.pass4.recommendedAction === "reject" ? "bg-red-50/50 border-red-200" :
                        "bg-yellow-50/50 border-yellow-200"
                      )}>
                        <div className="flex items-center gap-2 mb-3">
                          <Flag className="h-4 w-4" />
                          <span className="font-medium">Recommended Action</span>
                        </div>
                        {result.pass4.nextSteps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Next Steps:</p>
                            <ul className="text-sm space-y-1">
                              {result.pass4.nextSteps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <p className="text-sm font-semibold mb-2">Summary</p>
                      <p className="text-sm">{result.summary}</p>
                    </div>
                    {result.pass4?.interviewFocusAreas && result.pass4.interviewFocusAreas.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-blue-500" />
                          Interview Focus Areas
                        </p>
                        <ul className="space-y-2">
                          {result.pass4.interviewFocusAreas.map((area, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-medium flex-shrink-0">
                                {i + 1}
                              </div>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="profile" className="mt-0 space-y-4">
                    {result.pass1 && (
                      <>
                        <div className="text-sm text-muted-foreground mb-3">
                          {result.pass1.totalExperienceYears} years of experience • {result.pass1.jobs.length} positions • Confidence: {result.pass1.extractionConfidence}%
                        </div>
                        <div className="space-y-3">
                          {result.pass1.jobs.map((job, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{job.title}</p>
                                <p className="text-xs text-muted-foreground">{job.company}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {job.startDate || "?"} - {job.endDate || "Present"}
                                  {job.durationMonths && <span className="text-primary font-medium">({job.durationMonths} mo)</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {result.pass1.education.length > 0 && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium flex items-center gap-2 mb-3">
                              <GraduationCap className="h-4 w-4" />
                              Education
                            </p>
                            <div className="space-y-2">
                              {result.pass1.education.map((edu, i) => (
                                <div key={i} className="text-sm">
                                  <span className="font-medium">{edu.degree}</span> in {edu.field}
                                  <span className="text-muted-foreground"> • {edu.institution}</span>
                                  {edu.graduationYear && <span className="text-muted-foreground"> ({edu.graduationYear})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-4 border-t grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Hard Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {result.pass1.skills.hard.map((s, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Domain Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {result.pass1.skills.domain.map((s, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-blue-50">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Soft Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {result.pass1.skills.soft.map((s, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-purple-50">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0 space-y-4">
                    {result.pass2 && (
                      <>
                        <div className="text-sm text-muted-foreground mb-3">
                          {result.pass2.timelineAnalysis.jobCount} jobs over {result.pass2.timelineAnalysis.yearsAnalyzed.toFixed(1)} years • Avg tenure: {result.pass2.timelineAnalysis.averageTenureMonths} months
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground">Timeline Risk</p>
                            <p className={cn("text-lg font-bold", result.pass2.riskScores.timeline_risk > 50 ? "text-red-600" : "text-green-600")}>
                              {result.pass2.riskScores.timeline_risk}%
                            </p>
                          </div>
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground">Promotion Risk</p>
                            <p className={cn("text-lg font-bold", result.pass2.riskScores.promotion_risk > 50 ? "text-red-600" : "text-green-600")}>
                              {result.pass2.riskScores.promotion_risk}%
                            </p>
                          </div>
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground">Job Hop Risk</p>
                            <p className={cn("text-lg font-bold", result.pass2.riskScores.job_hop_risk > 50 ? "text-red-600" : "text-green-600")}>
                              {result.pass2.riskScores.job_hop_risk}%
                            </p>
                          </div>
                        </div>
                        {result.pass2.concerns.length > 0 && (
                          <div className="space-y-3">
                            {result.pass2.concerns.map((concern, i) => (
                              <div key={i} className={cn(
                                "flex gap-3 items-start p-3 rounded-lg border",
                                concern.severity === "major_concern" ? "bg-red-50/50 border-red-200" :
                                concern.severity === "mild_concern" ? "bg-yellow-50/50 border-yellow-200" :
                                "bg-green-50/50 border-green-200"
                              )} data-testid={`timeline-concern-${i}`}>
                                {concern.severity === "major_concern" && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                                {concern.severity === "mild_concern" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                                {concern.severity === "ok" && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{concern.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{concern.details}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">Risk: {concern.riskScore}%</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="flags" className="mt-0 space-y-4">
                    {result.pass4 && (
                      <>
                        {result.pass4.greenFlags.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Green Flags ({result.pass4.greenFlags.length})
                            </p>
                            {result.pass4.greenFlags.map((flag, i) => (
                              <div key={i} className="flex gap-3 items-start p-3 rounded-lg border bg-green-50/50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm text-green-700">{flag.flag}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{flag.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {result.pass4.redFlags.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Red Flags ({result.pass4.redFlags.length})
                            </p>
                            {result.pass4.redFlags.map((flag, i) => (
                              <div key={i} className={cn(
                                "flex gap-3 items-start p-3 rounded-lg border",
                                flag.severity === "critical" ? "bg-red-50/50 border-red-200" : "bg-yellow-50/50 border-yellow-200"
                              )}>
                                {flag.severity === "critical" ? (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                )}
                                <div>
                                  <p className={cn("font-medium text-sm", flag.severity === "critical" ? "text-red-700" : "text-yellow-700")}>{flag.flag}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{flag.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="skills" className="mt-0 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Match Rate</span>
                        <span className="text-sm font-semibold" data-testid="text-match-rate">
                          {result.skillMatch.matched.length} / {result.skillMatch.matched.length + result.skillMatch.missing.length} skills
                        </span>
                      </div>
                      <Progress 
                        value={(result.skillMatch.matched.length / Math.max(result.skillMatch.matched.length + result.skillMatch.missing.length, 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    {result.skillMatch.matched.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.skillMatch.matched.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.skillMatch.missing.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.skillMatch.missing.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.skillMatch.extra.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          Additional Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.skillMatch.extra.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.fitScore >= 70 && result.selectedJob && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => {
                            const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
                            if (!selectedCandidate) return;
                            recommendMutation.mutate({
                              candidateId: selectedCandidateId,
                              candidateName: selectedCandidate.name,
                              jobId: result.selectedJob!.id,
                              jobTitle: result.selectedJob!.title,
                              skillsNeeded: result.skillMatch.missing.length > 0 ? result.skillMatch.missing : result.selectedJob!.skills,
                              fitScore: result.fitScore,
                            });
                          }}
                          disabled={recommendMutation.isPending || !selectedCandidateId}
                          className="w-full"
                          variant="outline"
                          data-testid="button-recommend-skills-test"
                        >
                          {recommendMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Recommend Skills Test
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="authenticity" className="mt-0 space-y-4">
                    {result.authenticitySignals && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Quote className="h-3 w-3" />
                                Generic Writing
                              </span>
                              <span className={cn("text-xs font-semibold", result.authenticitySignals.genericWritingScore > 60 ? "text-yellow-600" : "text-green-600")}>
                                {result.authenticitySignals.genericWritingScore}%
                              </span>
                            </div>
                            <Progress value={result.authenticitySignals.genericWritingScore} className={cn("h-2", result.authenticitySignals.genericWritingScore > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
                          </div>
                          <div className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Specificity
                              </span>
                              <span className={cn("text-xs font-semibold", result.authenticitySignals.specificityScore < 40 ? "text-yellow-600" : "text-green-600")}>
                                {result.authenticitySignals.specificityScore}%
                              </span>
                            </div>
                            <Progress value={result.authenticitySignals.specificityScore} className={cn("h-2", result.authenticitySignals.specificityScore < 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
                          </div>
                          <div className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Fluff Ratio
                              </span>
                              <span className={cn("text-xs font-semibold", result.authenticitySignals.fluffRatio > 50 ? "text-yellow-600" : "text-green-600")}>
                                {result.authenticitySignals.fluffRatio}%
                              </span>
                            </div>
                            <Progress value={result.authenticitySignals.fluffRatio} className={cn("h-2", result.authenticitySignals.fluffRatio > 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
                          </div>
                          <div className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Bot className="h-3 w-3" />
                                AI-Style Likelihood
                              </span>
                              <span className={cn("text-xs font-semibold", result.authenticitySignals.aiStyleLikelihood > 60 ? "text-orange-600" : result.authenticitySignals.aiStyleLikelihood > 40 ? "text-yellow-600" : "text-green-600")}>
                                {result.authenticitySignals.aiStyleLikelihood}%
                              </span>
                            </div>
                            <Progress value={result.authenticitySignals.aiStyleLikelihood} className={cn("h-2", result.authenticitySignals.aiStyleLikelihood > 60 ? "[&>div]:bg-orange-500" : result.authenticitySignals.aiStyleLikelihood > 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
                          </div>
                        </div>
                        {result.authenticitySignals.clichePhrases && result.authenticitySignals.clichePhrases.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-yellow-600 mb-2 flex items-center gap-1">
                              <Quote className="h-3 w-3" />
                              Cliché Phrases Detected
                            </p>
                            <div className="flex flex-wrap gap-1" data-testid="list-cliche-phrases">
                              {result.authenticitySignals.clichePhrases.map((phrase, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  "{phrase}"
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.authenticitySignals.warnings.length > 0 && (
                          <div className="space-y-2">
                            {result.authenticitySignals.warnings.map((warning, index) => (
                              <div key={index} className="flex gap-3 items-start p-3 rounded-lg border bg-yellow-50/50" data-testid={`authenticity-warning-${index}`}>
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">{warning.message}</p>
                                  <p className="text-xs text-muted-foreground">{warning.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-200/50">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-purple-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-purple-700">Recommendation</p>
                              <p className="text-xs text-muted-foreground mt-1" data-testid="text-authenticity-recommendation">
                                {result.authenticitySignals.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="report" className="mt-0 space-y-4">
                    <Card data-testid="card-authenticity-signals">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Analysis Findings
                        </CardTitle>
                        <CardDescription>Internal consistency checks only. Not a background check.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.findings.map((finding, index) => (
                          <div key={index} className="flex gap-3 items-start p-3 rounded-lg border bg-card" data-testid={`finding-${index}`}>
                            <div className="mt-0.5">
                              {finding.type === "risk" && <XCircle className="h-4 w-4 text-destructive" />}
                              {finding.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                              {finding.type === "good" && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{finding.message}</p>
                              <p className="text-xs text-muted-foreground">{finding.details}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!selectedCandidateId || saveReportMutation.isPending}
                  onClick={() => {
                    if (selectedCandidateId && result) {
                      const candidate = candidates.find(c => c.id === selectedCandidateId);
                      const jobTitle = result.selectedJob?.title || "Job Position";
                      const candidateName = candidate?.name || "Unknown Candidate";
                      const htmlContent = generateReportHtml(result, candidateName, jobTitle);
                      saveReportMutation.mutate({
                        candidateId: selectedCandidateId,
                        htmlContent,
                        fileName: `Resume_Analysis_${candidateName.replace(/\s+/g, '_')}`,
                        jobTitle,
                        jobId: result.selectedJob?.id,
                        analysis: result,
                      });
                    }
                  }}
                  className="gap-2"
                  data-testid="button-save-candidate"
                >
                  {saveReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save to Candidate
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!result) return;
                    const candidate = candidates.find(c => c.id === selectedCandidateId);
                    const reportHtml = generateReportHtml(result, candidate?.name || "Unknown Candidate", result.selectedJob?.title || "Job Position");
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(reportHtml);
                      printWindow.document.close();
                    }
                  }}
                  className="gap-2"
                  data-testid="button-download-report"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
                <Button size="sm" onClick={() => setIsResultModalOpen(false)} data-testid="button-close-modal">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

