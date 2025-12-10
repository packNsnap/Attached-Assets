import { callAI } from "./routes";

// Types for structured data
export interface ExtractedJob {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  durationMonths: number | null;
  responsibilities: string[];
  achievements: string[];
}

export interface ExtractedEducation {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string | null;
}

export interface Pass1Result {
  jobs: ExtractedJob[];
  education: ExtractedEducation[];
  skills: {
    hard: string[];
    domain: string[];
    soft: string[];
  };
  totalExperienceYears: number;
  extractionConfidence: number;
}

export interface TimelineConcern {
  type: "overlap" | "gap" | "promotion_speed" | "job_hopping" | "tenure";
  severity: "ok" | "mild_concern" | "major_concern";
  description: string;
  details: string;
  riskScore: number;
}

export interface Pass2Result {
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
}

export interface Pass3Result {
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
}

export interface Pass4Result {
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
}

export interface MultiPassAnalysisResult {
  pass1: Pass1Result;
  pass2: Pass2Result;
  pass3: Pass3Result;
  pass4: Pass4Result;
  pass5: Pass5Result;
  fitScore: number;
  logicScore: number;
  authenticityScore: number;
  plausibilityScore: number;
  tooPerfectScore: number;
  tooPerfectIndicators: string[];
  mismatchDetection: {
    hasMismatch: boolean;
    mismatchScore: number;
    issues: Array<{ type: string; description: string; evidence: string }>;
  };
  overallVerdict: "LIKELY_REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
  skillMatch: {
    matched: string[];
    missing: string[];
    extra: string[];
  };
  findings: Array<{ type: "good" | "warning" | "risk"; message: string; details: string }>;
  summary: string;
  authenticitySignals: Pass4Result["authenticitySignals"] & {
    warnings: Array<{ type: string; message: string; details: string }>;
    recommendation: string;
  };
  fraudFlags: FraudFlag[];
  timelineNotes: string;
  roleFitNotes: string;
  certEducationNotes: string;
  // Final recommendation after considering all red flags
  overallRecommendation: {
    action: "proceed_to_interview" | "skills_test_first" | "phone_screen" | "reject" | "needs_review";
    reason: string;
    wasOverridden: boolean;
    originalAction: string;
  };
}

// Title hierarchy for promotion analysis
const TITLE_LEVELS: { [key: string]: number } = {
  "intern": 1, "trainee": 1,
  "junior": 2, "associate": 2, "entry": 2,
  "mid": 3, "intermediate": 3,
  "senior": 4, "lead": 4, "specialist": 4,
  "principal": 5, "staff": 5,
  "manager": 6, "supervisor": 6,
  "director": 7, "head": 7,
  "vp": 8, "vice president": 8,
  "svp": 9, "senior vice president": 9,
  "evp": 9, "executive vice president": 9,
  "c-level": 10, "ceo": 10, "cto": 10, "cfo": 10, "coo": 10, "cmo": 10, "chief": 10
};

function getTitleLevel(title: string): number {
  const lower = title.toLowerCase();
  for (const [key, level] of Object.entries(TITLE_LEVELS)) {
    if (lower.includes(key)) return level;
  }
  return 3; // Default to mid-level if unknown
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.toLowerCase().trim();
  if (cleaned === "present" || cleaned === "current") return new Date();
  
  // Try various date formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  
  // Try "Month Year" format
  const monthYear = cleaned.match(/(\w+)\s*(\d{4})/);
  if (monthYear) {
    const months: { [key: string]: number } = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5,
      jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    const month = months[monthYear[1].substring(0, 3)];
    if (month !== undefined) {
      return new Date(parseInt(monthYear[2]), month);
    }
  }
  
  return null;
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

// ============ PASS 1: Structured Extraction ============
export async function pass1_extractStructuredData(resumeText: string): Promise<Pass1Result> {
  const prompt = `You are an expert resume parser. Extract structured data from the following resume text. Be precise and accurate.

RESUME:
${resumeText}

Extract and return JSON with this EXACT structure:
{
  "jobs": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "Month Year" or null,
      "endDate": "Month Year" or "Present" or null,
      "responsibilities": ["responsibility 1", "responsibility 2"],
      "achievements": ["achievement with metrics if any"]
    }
  ],
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Bachelor's/Master's/PhD/etc",
      "field": "Field of Study",
      "graduationYear": "2020" or null
    }
  ],
  "skills": {
    "hard": ["Python", "Excel", "SQL", "specific tools"],
    "domain": ["marketing", "finance", "healthcare", "logistics"],
    "soft": ["leadership", "communication", "project management"]
  },
  "totalExperienceYears": 5.5,
  "extractionConfidence": 85
}

Rules:
- List jobs in chronological order (most recent first)
- Use "Present" for current jobs
- Extract ALL jobs even if dates are unclear
- Separate hard technical skills from domain expertise and soft skills
- Calculate total experience from job durations
- extractionConfidence: 0-100 based on how complete/clear the resume was`;

  const completion = await callAI("resume_analysis", {
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI in Pass 1");
  
  const result = JSON.parse(content);
  
  // Calculate durations for each job
  result.jobs = result.jobs.map((job: ExtractedJob) => {
    const start = parseDate(job.startDate);
    const end = parseDate(job.endDate);
    job.durationMonths = start && end ? monthsBetween(start, end) : null;
    return job;
  });
  
  return result;
}

// ============ PASS 2: Timeline & Consistency Check ============
export async function pass2_timelineAnalysis(extractedData: Pass1Result): Promise<Pass2Result> {
  const jobs = extractedData.jobs;
  
  // Server-side rule-based analysis
  const overlaps: Array<{ job1: string; job2: string; overlapMonths: number }> = [];
  const gaps: Array<{ afterJob: string; beforeJob: string; gapMonths: number }> = [];
  const promotionTransitions: Array<{ from: string; to: string; months: number; isUnusual: boolean }> = [];
  
  // Calculate overlaps and gaps
  // Jobs are ordered newest-first, so:
  // - current (jobs[i]) is the MORE RECENT job
  // - next (jobs[i+1]) is the OLDER job
  // Timeline: [next starts] ... [next ends] ... gap? ... [current starts] ... [current ends]
  for (let i = 0; i < jobs.length - 1; i++) {
    const newerJob = jobs[i];      // More recent job
    const olderJob = jobs[i + 1];  // Earlier job
    
    const newerStart = parseDate(newerJob.startDate);
    const newerEnd = parseDate(newerJob.endDate);
    const olderStart = parseDate(olderJob.startDate);
    const olderEnd = parseDate(olderJob.endDate);
    
    if (newerStart && olderStart && olderEnd) {
      // True overlap requires BIDIRECTIONAL check:
      // 1. newerStart < olderEnd (newer job started before older job ended)
      // 2. newerEnd > olderStart OR newerEnd is null/current (newer job ended after older job started)
      // This ensures sequential jobs (older ends, newer starts same month) are NOT marked as overlapping
      const newerEndForComparison = newerEnd || new Date(); // Use current date if ongoing
      
      if (newerStart < olderEnd && newerEndForComparison > olderStart) {
        // Calculate overlap as the intersection of the two date ranges
        const overlapStart = newerStart > olderStart ? newerStart : olderStart;
        const overlapEnd = newerEndForComparison < olderEnd ? newerEndForComparison : olderEnd;
        const overlapMonths = Math.max(0, monthsBetween(overlapStart, overlapEnd));
        if (overlapMonths > 1) {
          overlaps.push({
            job1: `${olderJob.title} at ${olderJob.company}`,
            job2: `${newerJob.title} at ${newerJob.company}`,
            overlapMonths
          });
        }
      }
      // Check for gap: newer job started AFTER older job ended
      // Gap = newerStart - olderEnd
      else if (newerStart > olderEnd) {
        const gapMonths = Math.max(0, monthsBetween(olderEnd, newerStart));
        if (gapMonths > 1) {
          gaps.push({
            afterJob: `${olderJob.title} at ${olderJob.company}`,
            beforeJob: `${newerJob.title} at ${newerJob.company}`,
            gapMonths
          });
        }
      }
    }
    
    // Check promotion speed (comparing older job to newer job = promotion)
    const newerLevel = getTitleLevel(newerJob.title);
    const olderLevel = getTitleLevel(olderJob.title);
    const levelJump = newerLevel - olderLevel; // Positive means promotion
    
    if (levelJump > 0 && newerJob.durationMonths) {
      const isUnusual = levelJump >= 2 && newerJob.durationMonths < 24; // 2+ level jump in < 2 years
      promotionTransitions.push({
        from: olderJob.title,
        to: newerJob.title,
        months: newerJob.durationMonths,
        isUnusual
      });
    }
  }
  
  // Calculate averages
  const validTenures = jobs.filter(j => j.durationMonths !== null).map(j => j.durationMonths as number);
  const averageTenureMonths = validTenures.length > 0 
    ? Math.round(validTenures.reduce((a, b) => a + b, 0) / validTenures.length)
    : 0;
  
  const yearsAnalyzed = extractedData.totalExperienceYears;
  
  // Apply rule-based risk scoring
  let timeline_risk = 0;
  let promotion_risk = 0;
  let job_hop_risk = 0;
  
  // Timeline risk: overlap > 6 months = 80+
  const maxOverlap = overlaps.length > 0 ? Math.max(...overlaps.map(o => o.overlapMonths)) : 0;
  if (maxOverlap > 6) timeline_risk = 80;
  else if (maxOverlap > 3) timeline_risk = 50;
  else if (maxOverlap > 1) timeline_risk = 30;
  
  // Add risk for unexplained gaps > 6 months
  const maxGap = gaps.length > 0 ? Math.max(...gaps.map(g => g.gapMonths)) : 0;
  if (maxGap > 12) timeline_risk = Math.max(timeline_risk, 60);
  else if (maxGap > 6) timeline_risk = Math.max(timeline_risk, 40);
  
  // Job hopping risk: 5+ jobs in 4 years = 60+
  const jobsPerYear = yearsAnalyzed > 0 ? jobs.length / yearsAnalyzed : 0;
  if (jobsPerYear >= 1.25) job_hop_risk = 70; // 5+ jobs in 4 years
  else if (jobsPerYear >= 1) job_hop_risk = 50;
  else if (jobsPerYear >= 0.75) job_hop_risk = 30;
  
  // Average tenure under 18 months is also a job hopping signal
  if (averageTenureMonths < 12) job_hop_risk = Math.max(job_hop_risk, 60);
  else if (averageTenureMonths < 18) job_hop_risk = Math.max(job_hop_risk, 40);
  
  // Promotion risk: unusual jumps
  const unusualPromotions = promotionTransitions.filter(p => p.isUnusual);
  if (unusualPromotions.length > 0) promotion_risk = 80;
  else if (promotionTransitions.some(p => p.months < 12)) promotion_risk = 40;
  
  // Now use GPT to label concerns with human-readable descriptions
  const concernsForGPT = {
    overlaps,
    gaps,
    promotionTransitions,
    averageTenureMonths,
    jobCount: jobs.length,
    yearsAnalyzed,
    timeline_risk,
    promotion_risk,
    job_hop_risk
  };
  
  const labelingPrompt = `You are an HR analyst reviewing timeline analysis results. Provide human-readable assessments.

TIMELINE DATA:
${JSON.stringify(concernsForGPT, null, 2)}

For each finding, provide a severity label and explanation. Return JSON:
{
  "concerns": [
    {
      "type": "overlap|gap|promotion_speed|job_hopping|tenure",
      "severity": "ok|mild_concern|major_concern",
      "description": "Brief title",
      "details": "Human-readable explanation"
    }
  ]
}

Guidelines:
- Overlaps > 6 months without explanation = major_concern
- Gaps > 6 months = mild_concern (could be legitimate)
- Gaps > 12 months = major_concern
- Title jump of 2+ levels in < 2 years = major_concern
- Average tenure < 18 months = mild_concern
- 5+ jobs in 4 years = major_concern for job hopping
- Always provide balanced, professional assessments`;

  const labelingCompletion = await callAI("resume_analysis", {
    messages: [{ role: "user", content: labelingPrompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const labelingContent = labelingCompletion.choices[0]?.message?.content;
  const labeling = labelingContent ? JSON.parse(labelingContent) : { concerns: [] };
  
  // Add risk scores to concerns
  const concerns: TimelineConcern[] = labeling.concerns.map((c: any) => ({
    ...c,
    riskScore: c.type === "overlap" ? timeline_risk :
               c.type === "gap" ? timeline_risk :
               c.type === "promotion_speed" ? promotion_risk :
               c.type === "job_hopping" ? job_hop_risk :
               c.type === "tenure" ? job_hop_risk : 30
  }));
  
  return {
    timelineAnalysis: {
      overlaps,
      gaps,
      averageTenureMonths,
      jobCount: jobs.length,
      yearsAnalyzed,
      promotionTransitions
    },
    concerns,
    riskScores: {
      timeline_risk,
      promotion_risk,
      job_hop_risk
    }
  };
}

// ============ PASS 3: Fit Scoring ============
export async function pass3_fitScoring(
  extractedData: Pass1Result,
  jobDescription: string,
  jobSkills: string[],
  jobTitle: string,
  jobLevel: string
): Promise<Pass3Result> {
  const prompt = `You are an expert recruiter scoring candidate fit against a job.

JOB REQUIREMENTS:
Title: ${jobTitle}
Level: ${jobLevel}
Required Skills: ${jobSkills.join(", ")}
Description: ${jobDescription}

CANDIDATE PROFILE:
Total Experience: ${extractedData.totalExperienceYears} years
Skills - Hard: ${extractedData.skills.hard.join(", ")}
Skills - Domain: ${extractedData.skills.domain.join(", ")}
Skills - Soft: ${extractedData.skills.soft.join(", ")}
Recent Jobs: ${extractedData.jobs.slice(0, 3).map(j => `${j.title} at ${j.company}`).join("; ")}
Education: ${extractedData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join("; ")}

Score each dimension 0-100 and categorize skills. Return JSON:
{
  "subScores": {
    "skills_match": 75,
    "experience_years_match": 80,
    "industry_match": 60
  },
  "skillsAnalysis": {
    "matched_must_have": ["skill1", "skill2"],
    "missing_must_have": ["skill3"],
    "matched_nice_to_have": ["skill4"],
    "bonus_skills": ["skill5", "skill6"]
  },
  "experienceAnalysis": {
    "requiredYears": 5,
    "candidateYears": ${extractedData.totalExperienceYears},
    "relevantYears": 4
  },
  "industryAnalysis": {
    "targetIndustry": "technology",
    "candidateIndustries": ["technology", "finance"],
    "overlapScore": 75
  }
}

Scoring Guidelines:
- skills_match: % of must-have skills present, weighted by importance
- experience_years_match: How well candidate years match required (100 if meets/exceeds, penalize for under)
- industry_match: Relevance of candidate's industry background to target role
- Be specific about which skills are must-have vs nice-to-have based on job description`;

  const completion = await callAI("resume_analysis", {
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI in Pass 3");
  
  const result = JSON.parse(content);
  
  // Apply weighted formula: Fit = 0.5 * skills_match + 0.3 * experience_years_match + 0.2 * industry_match
  const fitScore = Math.round(
    0.5 * result.subScores.skills_match +
    0.3 * result.subScores.experience_years_match +
    0.2 * result.subScores.industry_match
  );
  
  return {
    ...result,
    fitScore
  };
}

// ============ PASS 4: Narrative + Recommendations ============
export async function pass4_narrativeAndRecommendations(
  extractedData: Pass1Result,
  timelineAnalysis: Pass2Result,
  fitScoring: Pass3Result,
  resumeText: string
): Promise<Pass4Result> {
  // Calculate weighted risk score
  const { timeline_risk, promotion_risk, job_hop_risk } = timelineAnalysis.riskScores;
  
  const prompt = `You are a senior HR advisor creating a final assessment report. You have structured data from previous analysis passes.

EXTRACTED PROFILE:
${JSON.stringify(extractedData, null, 2)}

TIMELINE ANALYSIS:
${JSON.stringify(timelineAnalysis, null, 2)}

FIT SCORING:
${JSON.stringify(fitScoring, null, 2)}

ORIGINAL RESUME TEXT (for writing style analysis):
${resumeText.substring(0, 3000)}

Create a comprehensive assessment. Also analyze the WRITING STYLE for AI-generation signals.

Return JSON:
{
  "summary": "2-3 paragraph executive summary of the candidate",
  "redFlags": [
    { "flag": "Short title", "severity": "critical|warning", "details": "Explanation" }
  ],
  "greenFlags": [
    { "flag": "Short positive point", "details": "Explanation" }
  ],
  "recommendedAction": "proceed_to_interview|skills_test_first|phone_screen|reject|needs_review",
  "nextSteps": ["Specific action 1", "Specific action 2"],
  "interviewFocusAreas": ["Topic to probe in interview"],
  "authenticitySignals": {
    "genericWritingScore": 0-100,
    "specificityScore": 0-100,
    "fluffRatio": 0-100,
    "aiStyleLikelihood": 0-100,
    "vaguenessRisk": 0-100
  }
}

AUTHENTICITY SCORING GUIDELINES:
- genericWritingScore: HIGH if uses clichés like "results-driven", "proven track record", "leveraged", "spearheaded"
- specificityScore: LOW if metrics are round numbers, company descriptions vague, no unique details
- fluffRatio: HIGH if bullets are responsibilities not achievements, impact is generic
- aiStyleLikelihood: HIGH if uniform sentence length, perfect grammar, no personality, robotic consistency
- vaguenessRisk: HIGH if accomplishments are abstract without measurable outcomes

Base recommendedAction on:
- Fit Score > 70 + low risk → proceed_to_interview
- Fit Score > 60 + some concerns → phone_screen
- Fit Score > 50 + skill gaps → skills_test_first
- Fit Score < 50 or high risk → reject or needs_review`;

  const completion = await callAI("resume_analysis", {
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI in Pass 4");
  
  const result = JSON.parse(content);
  
  // Calculate overall risk score with weights
  // Risk = 0.3 * timeline_risk + 0.2 * promotion_risk + 0.2 * job_hop_risk + 0.15 * vagueness_risk + 0.15 * ai_style_risk
  const overallRiskScore = Math.round(
    0.3 * timeline_risk +
    0.2 * promotion_risk +
    0.2 * job_hop_risk +
    0.15 * (result.authenticitySignals?.vaguenessRisk || 0) +
    0.15 * (result.authenticitySignals?.aiStyleLikelihood || 0)
  );
  
  return {
    ...result,
    overallRiskScore
  };
}

// ============ PASS 5: Enhanced Authenticity Detection ============
export interface FraudFlag {
  category: "timeline" | "company" | "credentials" | "content" | "consistency" | "ai_generated";
  severity: "critical" | "high" | "medium" | "low";
  flag: string;
  evidence: string;
  confidence: number;
}

export interface Pass5Result {
  authenticityScore: number;
  plausibilityScore: number;
  tooPerfectScore: number;
  tooPerfectIndicators: string[];
  overallVerdict: "LIKELY_REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
  fraudFlags: FraudFlag[];
  timelineIssues: {
    impossibleOverlaps: Array<{ description: string; evidence: string }>;
    experienceInflation: { claimed: number; calculated: number; discrepancy: number } | null;
    suspiciousProgression: Array<{ description: string }>;
  };
  companyVerification: {
    suspiciousCompanies: Array<{ name: string; reason: string }>;
    genericDescriptions: number;
    verifiableCompanies: number;
  };
  contentAnalysis: {
    aiGeneratedScore: number;
    templateMatchScore: number;
    genericPhraseCount: number;
    hyphenatedWordCount: number;
    specificDetailsScore: number;
    quantifiableAchievements: number;
    buzzwordDensity: number;
  };
  credentialIssues: {
    unverifiableEducation: Array<{ institution: string; reason: string }>;
    suspiciousCertifications: Array<{ name: string; reason: string }>;
  };
  mismatchDetection: {
    hasMismatch: boolean;
    mismatchScore: number;
    issues: Array<{ type: string; description: string; evidence: string }>;
  };
  timelineNotes: string;
  roleFitNotes: string;
  certEducationNotes: string;
  recommendation: "verified" | "needs_verification" | "high_risk" | "likely_fraudulent";
  summary: string;
}

export async function pass5_authenticityAnalysis(
  extractedData: Pass1Result,
  timelineAnalysis: Pass2Result,
  resumeText: string,
  expectedCandidateName?: string | null
): Promise<Pass5Result> {
  // Known generic/buzzword phrases that indicate low authenticity
  const GENERIC_PHRASES = [
    "results-driven", "proven track record", "leveraged", "spearheaded",
    "synergy", "team player", "go-getter", "dynamic", "proactive",
    "strategic thinker", "detail-oriented", "self-starter", "passionate",
    "excellent communication skills", "fast-paced environment",
    "think outside the box", "value-added", "best practices",
    "stakeholder management", "cross-functional", "drive results",
    "deadline-driven", "data-driven", "goal-oriented", "solutions-oriented",
    "customer-focused", "action-oriented", "forward-thinking"
  ];

  // Count generic phrases in resume
  const lowerText = resumeText.toLowerCase();
  const genericPhraseCount = GENERIC_PHRASES.filter(p => lowerText.includes(p.toLowerCase())).length;
  
  // Detect excessive hyphenated compound words (ChatGPT signature pattern)
  const hyphenatedWordsPattern = /\b\w+-\w+\b/g;
  const hyphenatedMatches = resumeText.match(hyphenatedWordsPattern) || [];
  const hyphenatedWordCount = hyphenatedMatches.length;
  
  // Calculate experience discrepancy
  let experienceInflation = null;
  const claimedYears = extractedData.totalExperienceYears;
  const calculatedYears = extractedData.jobs.reduce((sum, job) => {
    return sum + (job.durationMonths ? job.durationMonths / 12 : 0);
  }, 0);
  const discrepancy = claimedYears - calculatedYears;
  if (Math.abs(discrepancy) > 1) {
    experienceInflation = {
      claimed: claimedYears,
      calculated: Math.round(calculatedYears * 10) / 10,
      discrepancy: Math.round(discrepancy * 10) / 10
    };
  }

  // System prompt for aggressive fraud detection
  const systemPrompt = `You are an aggressive résumé fraud detector.

Your job is NOT to say whether a résumé is well-written or nicely formatted.
Your ONLY job is to judge:

1) Is this résumé PLAUSIBLE based on:
   - Career progression
   - Timeline consistency
   - Education realism
   - Certification realism
   - Role responsibility realism
   - Achievement realism

2) Does anything look FAKE, EXAGGERATED, or SUSPICIOUS?

You must:
- Be skeptical, not generous.
- Assume people exaggerate.
- Look for conflicts, overlaps, impossible timelines, and inflated claims.

Use these specific checks:

A. Career Progression Logic
- Does the path from Job A → Job B → Job C make sense?
- Is there an unrealistic jump from unrelated work (e.g., fast food) to advanced specialist/manager roles in a very short time?
- If a senior or specialist role is reached in less than 3 years, that is suspicious unless the prior roles clearly support it.

B. Education Timeline
- Do completion dates + implied age make sense?
- Are they working full-time in a demanding job while also doing full-time accelerated degrees with no explanation?

C. Role Responsibility Realism
- Do the described responsibilities match what someone at that level would actually do?
- Are they claiming executive-level impact in junior roles?

D. Achievement Realism
- Are metrics suspiciously round (exactly 200%, exactly 50 people, exactly $1M)?
- Are achievements vague buzzwords or specific and verifiable?
- Is every single bullet point a massive win with no normal work?

E. Certification Realism
- Do certifications fit the career path?
- Are there unknown or unverifiable certification providers?

Problems to look for:
- Impossible or highly unlikely promotion speed
- Job responsibilities far above the experience level
- Education timelines that don't make sense
- Overlapping full-time work and full-time school with no explanation
- Certifications that don't fit the prior work history
- Extremely inflated, buzzword-heavy achievement claims
- Conflicting dates or gaps that are suspicious
- Working 2+ full-time jobs simultaneously

F. Mismatch Detection (CRITICAL)
- Are there multiple different names mentioned that could indicate a copy-paste from another resume?
- Is the email address or contact info inconsistent with the name?
- Are there references to "I" or first-person that use a different name?
- Do cover letter fragments or objective statements mention a different person or company?
- Are there leftover template placeholders like "[Your Name]", "[Company Name]", "Lorem ipsum"?
- Does the resume reference a different job title in objectives vs actual experience?
- Are there conflicting details (e.g., claims to be based in NYC but all jobs are in California with no relocation mentioned)?`;

  const prompt = `${systemPrompt}

PRE-COMPUTED ANALYSIS DATA:
- Generic buzzword phrases found: ${genericPhraseCount}
- Hyphenated compound words found: ${hyphenatedWordCount} (ChatGPT often uses excessive hyphenated phrases like "deadline-driven", "results-oriented", "customer-focused")
- Experience claim: ${claimedYears} years vs calculated from jobs: ${Math.round(calculatedYears * 10) / 10} years
- Timeline overlaps detected: ${timelineAnalysis.timelineAnalysis.overlaps.length}
- Promotion transitions: ${JSON.stringify(timelineAnalysis.timelineAnalysis.promotionTransitions)}
- Gaps between jobs: ${JSON.stringify(timelineAnalysis.timelineAnalysis.gaps)}

EXTRACTED STRUCTURED DATA:
${JSON.stringify(extractedData, null, 2)}

<<<RESUME_START>>>
${resumeText}
<<<RESUME_END>>>

Return a JSON object with this exact structure:
{
  "format_score": 0-100,
  "plausibility_score": 0-100,
  "too_perfect_score": 0-100,
  "too_perfect_indicators": ["string explaining why"],
  "overall_verdict": "LIKELY_REAL" | "SUSPICIOUS" | "LIKELY_FAKE",
  "fraudFlags": [
    {
      "category": "timeline|company|credentials|content|consistency|ai_generated",
      "severity": "critical|high|medium|low",
      "flag": "Brief description of the issue",
      "evidence": "Specific evidence from the resume",
      "confidence": 0-100
    }
  ],
  "timelineIssues": {
    "impossibleOverlaps": [{ "description": "...", "evidence": "..." }],
    "suspiciousProgression": [{ "description": "e.g. Fast food to DOT compliance in 1 year" }]
  },
  "companyVerification": {
    "suspiciousCompanies": [{ "name": "Company Name", "reason": "Why suspicious" }],
    "genericDescriptions": 0,
    "verifiableCompanies": 0
  },
  "contentAnalysis": {
    "aiGeneratedScore": 0-100,
    "templateMatchScore": 0-100,
    "specificDetailsScore": 0-100,
    "quantifiableAchievements": 0,
    "buzzwordDensity": 0-100
  },
  "credentialIssues": {
    "unverifiableEducation": [{ "institution": "...", "reason": "..." }],
    "suspiciousCertifications": [{ "name": "...", "reason": "..." }]
  },
  "mismatchDetection": {
    "hasMismatch": true/false,
    "mismatchScore": 0-100,
    "issues": [{ "type": "name|contact|location|objective|template", "description": "What was found", "evidence": "Exact text showing mismatch" }]
  },
  "timeline_notes": "Notes about dates, overlaps, speed of progression",
  "role_fit_notes": "Do responsibilities fit titles and prior history?",
  "cert_education_notes": "Education + certification realism assessment",
  "summary": "Short plain language summary for human review explaining authenticity concerns"
}

TOO PERFECT SCORE GUIDELINES (0-100):
A résumé is "too perfect" when:
- Language is heavily buzzword-driven and formulaic
- Every role shows significant wins with no neutral or weak periods
- Career progression is perfectly linear with constant promotions
- Achievements are generic, with metrics but little concrete context
- Style and sentence structure are extremely uniform throughout

Scoring:
- 0-30: Normal human variation (typos, varied writing, some weak bullets)
- 31-70: Very polished, possibly AI-assisted (too clean, buzzword-heavy)
- 71-100: Over-optimized, likely heavily engineered or AI-generated

SEVERITY GUIDELINES:
- CRITICAL: Working 2+ full-time jobs simultaneously, impossible timelines, clear fabrication, WRONG NAME detected (copy-paste from another resume)
- HIGH: Unrealistic promotion speed (3+ levels in <18 months), major experience inflation, demanding degrees while working full-time with no explanation, template placeholders left in
- MEDIUM: Round number metrics, buzzword-heavy claims, generic company names, minor timeline gaps followed by title jumps
- LOW: Generic responsibilities, minor formatting issues, certifications from less-known providers

MISMATCH DETECTION GUIDELINES:
- mismatchScore 0-30: No significant mismatches, details are internally consistent
- mismatchScore 31-60: Minor inconsistencies (e.g., location doesn't match job history)
- mismatchScore 61-100: Major mismatches found (wrong name, template placeholders, conflicting personal details)

Be aggressive and skeptical. Find the problems. Return ONLY the JSON object.`;

  const completion = await callAI("ai_detection", {
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI in Pass 5");
  
  const result = JSON.parse(content);
  
  // Use the plausibility_score from the aggressive detector as the base
  // This score already reflects the skeptical analysis
  let authenticityScore = result.plausibility_score || 50;
  
  // Apply additional penalties based on our pre-computed checks
  
  // Deduct for experience inflation (not caught by GPT)
  if (experienceInflation && experienceInflation.discrepancy > 2) {
    authenticityScore -= 10;
  }
  
  // Deduct for timeline issues from Pass 2 that may not be in GPT response
  const majorConcerns = timelineAnalysis.concerns.filter(c => c.severity === "major_concern");
  authenticityScore -= majorConcerns.length * 5;
  
  // Deduct for high buzzword density
  if (genericPhraseCount > 5) authenticityScore -= 10;
  else if (genericPhraseCount > 3) authenticityScore -= 5;
  
  // Floor at 0, cap at 100
  authenticityScore = Math.max(0, Math.min(100, authenticityScore));
  
  // Map overall_verdict to our recommendation system
  let recommendation: Pass5Result["recommendation"];
  const verdict = result.overall_verdict || "SUSPICIOUS";
  if (verdict === "LIKELY_REAL" && authenticityScore >= 70) {
    recommendation = "verified";
  } else if (verdict === "LIKELY_REAL") {
    recommendation = "needs_verification";
  } else if (verdict === "SUSPICIOUS") {
    recommendation = authenticityScore >= 40 ? "needs_verification" : "high_risk";
  } else { // LIKELY_FAKE
    recommendation = authenticityScore >= 25 ? "high_risk" : "likely_fraudulent";
  }
  
  // Build mismatch detection result
  let mismatchDetection = result.mismatchDetection || {
    hasMismatch: false,
    mismatchScore: 0,
    issues: []
  };

  // Check for name mismatch against expected candidate name
  if (expectedCandidateName) {
    const resumeLines = resumeText.split('\n').filter(l => l.trim());
    const potentialName = resumeLines[0]?.trim() || '';
    
    // Normalize names for comparison
    const normalizedExpected = expectedCandidateName.toLowerCase().trim();
    const normalizedResume = potentialName.toLowerCase().trim();
    
    // Check if names match (partial match for flexibility)
    const expectedParts = normalizedExpected.split(/\s+/).filter(p => p.length > 1);
    const resumeParts = normalizedResume.split(/\s+/).filter(p => p.length > 1);
    
    // Check if at least one significant part of the expected name appears in the resume name
    const hasMatch = expectedParts.some(part => 
      resumeParts.some(rp => rp.includes(part) || part.includes(rp))
    );
    
    if (!hasMatch && potentialName.length > 0 && expectedParts.length > 0) {
      mismatchDetection = {
        hasMismatch: true,
        mismatchScore: 100,
        issues: [
          ...mismatchDetection.issues,
          {
            type: "name",
            description: `Resume name "${potentialName}" does not match selected candidate "${expectedCandidateName}"`,
            evidence: `Expected: ${expectedCandidateName}, Found in resume: ${potentialName}`
          }
        ]
      };
    }
  }

  return {
    authenticityScore,
    plausibilityScore: result.plausibility_score || authenticityScore,
    tooPerfectScore: result.too_perfect_score || 0,
    tooPerfectIndicators: result.too_perfect_indicators || [],
    overallVerdict: verdict as Pass5Result["overallVerdict"],
    fraudFlags: result.fraudFlags || [],
    timelineIssues: {
      impossibleOverlaps: result.timelineIssues?.impossibleOverlaps || [],
      experienceInflation,
      suspiciousProgression: result.timelineIssues?.suspiciousProgression || []
    },
    companyVerification: result.companyVerification || {
      suspiciousCompanies: [],
      genericDescriptions: 0,
      verifiableCompanies: extractedData.jobs.length
    },
    contentAnalysis: {
      aiGeneratedScore: result.contentAnalysis?.aiGeneratedScore || 0,
      templateMatchScore: result.contentAnalysis?.templateMatchScore || 0,
      genericPhraseCount,
      hyphenatedWordCount,
      specificDetailsScore: result.contentAnalysis?.specificDetailsScore || 50,
      quantifiableAchievements: result.contentAnalysis?.quantifiableAchievements || 0,
      buzzwordDensity: result.contentAnalysis?.buzzwordDensity || 0
    },
    credentialIssues: result.credentialIssues || {
      unverifiableEducation: [],
      suspiciousCertifications: []
    },
    mismatchDetection,
    timelineNotes: result.timeline_notes || "",
    roleFitNotes: result.role_fit_notes || "",
    certEducationNotes: result.cert_education_notes || "",
    recommendation,
    summary: result.summary || "Analysis complete."
  };
}

// ============ MAIN ORCHESTRATOR ============
export async function analyzeResumeMultiPass(
  resumeText: string,
  jobDescription: string,
  jobSkills: string[],
  jobTitle: string,
  jobLevel: string,
  expectedCandidateName?: string | null
): Promise<MultiPassAnalysisResult> {
  // Pass 1: Extract structured data
  const pass1 = await pass1_extractStructuredData(resumeText);
  
  // Pass 2: Timeline analysis (server rules + GPT labeling)
  const pass2 = await pass2_timelineAnalysis(pass1);
  
  // Pass 3: Fit scoring against job
  const pass3 = await pass3_fitScoring(pass1, jobDescription, jobSkills, jobTitle, jobLevel);
  
  // Pass 4: Narrative and recommendations
  const pass4 = await pass4_narrativeAndRecommendations(pass1, pass2, pass3, resumeText);
  
  // Pass 5: Enhanced Authenticity Detection
  const pass5 = await pass5_authenticityAnalysis(pass1, pass2, resumeText, expectedCandidateName);
  
  // Combine into legacy-compatible format while preserving new structure
  const findings: Array<{ type: "good" | "warning" | "risk"; message: string; details: string }> = [];
  
  // Add timeline concerns as findings
  for (const concern of pass2.concerns) {
    findings.push({
      type: concern.severity === "major_concern" ? "risk" : 
            concern.severity === "mild_concern" ? "warning" : "good",
      message: concern.description,
      details: concern.details
    });
  }
  
  // Add red flags as findings
  for (const flag of pass4.redFlags) {
    findings.push({
      type: flag.severity === "critical" ? "risk" : "warning",
      message: flag.flag,
      details: flag.details
    });
  }
  
  // Add green flags as findings
  for (const flag of pass4.greenFlags) {
    findings.push({
      type: "good",
      message: flag.flag,
      details: flag.details
    });
  }
  
  // Add fraud flags from Pass 5 as findings
  for (const flag of pass5.fraudFlags) {
    findings.push({
      type: flag.severity === "critical" || flag.severity === "high" ? "risk" : "warning",
      message: `[Authenticity] ${flag.flag}`,
      details: flag.evidence
    });
  }
  
  // Calculate final recommendation with critical issue overrides
  const originalAction = pass4.recommendedAction;
  let finalAction: typeof originalAction = originalAction;
  let overrideReason = "";
  let wasOverridden = false;
  
  // Critical override conditions - any of these should block interview recommendation
  const criticalIssues: string[] = [];
  
  // 1. Name mismatch is a critical blocker
  if (pass5.mismatchDetection.hasMismatch) {
    const nameMismatchIssue = pass5.mismatchDetection.issues.find(i => i.type === "name");
    if (nameMismatchIssue) {
      criticalIssues.push(`Resume name does not match selected candidate`);
    } else if (pass5.mismatchDetection.issues.length > 0) {
      criticalIssues.push(`Resume mismatch detected: ${pass5.mismatchDetection.issues.map(i => i.description).join(", ")}`);
    }
  }
  
  // 2. Low plausibility score (below 60% is suspicious)
  if (pass5.plausibilityScore < 60) {
    criticalIssues.push(`Low plausibility score (${pass5.plausibilityScore}%) - resume may contain false or exaggerated claims`);
  }
  
  // 3. Very high "too perfect" score (above 70% is suspicious)
  if (pass5.tooPerfectScore > 70) {
    criticalIssues.push(`Resume appears over-optimized (${pass5.tooPerfectScore}%) - may be heavily AI-generated or fabricated`);
  }
  
  // 4. Overall verdict is LIKELY_FAKE
  if (pass5.overallVerdict === "LIKELY_FAKE") {
    criticalIssues.push(`Resume authenticity analysis indicates likely fake or heavily fabricated content`);
  }
  
  // 5. Any critical fraud flags
  const criticalFraudFlags = pass5.fraudFlags.filter(f => f.severity === "critical");
  if (criticalFraudFlags.length > 0) {
    criticalIssues.push(`Critical authenticity issues: ${criticalFraudFlags.map(f => f.flag).join(", ")}`);
  }
  
  // If there are critical issues, override to reject
  if (criticalIssues.length > 0) {
    finalAction = "reject";
    wasOverridden = true;
    overrideReason = criticalIssues.join("; ");
  }
  
  // Even for non-critical, if verdict is SUSPICIOUS and original was proceed_to_interview, downgrade
  if (!wasOverridden && pass5.overallVerdict === "SUSPICIOUS" && originalAction === "proceed_to_interview") {
    finalAction = "needs_review";
    wasOverridden = true;
    overrideReason = "Resume flagged as suspicious - manual review recommended before proceeding";
  }
  
  const overallRecommendation = {
    action: finalAction,
    reason: wasOverridden ? overrideReason : `Based on fit score of ${pass3.fitScore}% and overall analysis`,
    wasOverridden,
    originalAction
  };
  
  return {
    pass1,
    pass2,
    pass3,
    pass4,
    pass5,
    fitScore: pass3.fitScore,
    logicScore: pass4.overallRiskScore,
    authenticityScore: pass5.authenticityScore,
    plausibilityScore: pass5.plausibilityScore,
    tooPerfectScore: pass5.tooPerfectScore,
    tooPerfectIndicators: pass5.tooPerfectIndicators,
    mismatchDetection: pass5.mismatchDetection,
    overallVerdict: pass5.overallVerdict,
    skillMatch: {
      matched: [...pass3.skillsAnalysis.matched_must_have, ...pass3.skillsAnalysis.matched_nice_to_have],
      missing: pass3.skillsAnalysis.missing_must_have,
      extra: pass3.skillsAnalysis.bonus_skills
    },
    findings,
    summary: pass4.summary,
    authenticitySignals: {
      ...pass4.authenticitySignals,
      warnings: pass4.redFlags.filter(f => 
        f.flag.toLowerCase().includes("ai") || 
        f.flag.toLowerCase().includes("generic") ||
        f.flag.toLowerCase().includes("writing")
      ).map(f => ({ type: f.severity, message: f.flag, details: f.details })),
      recommendation: pass5.recommendation
    },
    fraudFlags: pass5.fraudFlags,
    timelineNotes: pass5.timelineNotes,
    roleFitNotes: pass5.roleFitNotes,
    certEducationNotes: pass5.certEducationNotes,
    overallRecommendation
  };
}
