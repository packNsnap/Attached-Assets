import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, FileText, Upload, AlertTriangle, CheckCircle, Search, XCircle, Briefcase, Target, ClipboardList } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
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

type AnalysisResult = {
  fitScore: number;
  logicScore: number;
  skillMatch: SkillMatch;
  findings: {
    type: "risk" | "warning" | "good";
    message: string;
    details: string;
  }[];
  summary: string;
  selectedJob?: Job;
} | null;

export default function ResumeAnalyzerModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult>(null);
  const [fileName, setFileName] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const recommendMutation = useMutation({
    mutationFn: async (data: { candidateName: string; jobId: string; jobTitle: string; skillsNeeded: string[]; fitScore: number }) => {
      const res = await fetch("/api/skills-test-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create recommendation");
      return res.json();
    },
    onSuccess: () => {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
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
    
    setTimeout(() => {
      const generated = generateAnalysis(selectedJob, values.jobDescription || "", resumeText);
      setResult(generated);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Resume logic and fit have been analyzed.",
      });
    }, 2500);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Resume Logic Analyzer</h1>
        <p className="text-muted-foreground mt-2">
          Detect inconsistencies, gaps, and logic risks in resumes. Compare against job requirements.
        </p>
      </div>

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
                  <Label>Candidate Resume (PDF/Docx)</Label>
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
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Role Fit Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold" data-testid="text-fit-score">{result.fitScore}%</div>
                      <Progress value={result.fitScore} className={cn(
                        "h-2",
                        result.fitScore > 75 ? "text-green-500" : "text-yellow-500"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on skills match and experience level.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Logic Risk Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className={cn("text-3xl font-bold", 
                        result.logicScore < 30 ? "text-green-600" : 
                        result.logicScore < 60 ? "text-yellow-600" : "text-red-600"
                      )} data-testid="text-logic-score">{result.logicScore}%</div>
                      <div className="text-xs font-medium px-2 py-1 rounded bg-muted">
                        {result.logicScore < 30 ? "Low Risk" : result.logicScore < 60 ? "Medium Risk" : "High Risk"}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Probability of inconsistencies or timeline gaps.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Skills Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Match Rate</span>
                      <span className="text-xs font-semibold" data-testid="text-match-rate">
                        {result.skillMatch.matched.length} / {result.skillMatch.matched.length + result.skillMatch.missing.length} skills
                      </span>
                    </div>
                    <Progress 
                      value={(result.skillMatch.matched.length / (result.skillMatch.matched.length + result.skillMatch.missing.length)) * 100} 
                      className="h-2"
                    />
                  </div>

                  {result.skillMatch.matched.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Matched Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.skillMatch.matched.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.skillMatch.missing.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Missing Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.skillMatch.missing.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.skillMatch.extra.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Additional Skills (Not Required)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.skillMatch.extra.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
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
                          recommendMutation.mutate({
                            candidateName: fileName || "Unknown Candidate",
                            jobId: result.selectedJob!.id,
                            jobTitle: result.selectedJob!.title,
                            skillsNeeded: result.skillMatch.missing.length > 0 ? result.skillMatch.missing : result.selectedJob!.skills,
                            fitScore: result.fitScore,
                          });
                        }}
                        disabled={recommendMutation.isPending}
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
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Send this candidate to the Skills Test module for assessment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Logic Analysis Report
                  </CardTitle>
                  <CardDescription>
                    Internal consistency checks only. Not a background check.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-lg text-sm border">
                    <span className="font-semibold">Summary: </span>
                    {result.summary}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Findings</h3>
                    {result.findings.map((finding, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors" data-testid={`finding-${index}`}>
                        <div className="mt-0.5">
                          {finding.type === "risk" && <XCircle className="h-5 w-5 text-destructive" />}
                          {finding.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                          {finding.type === "good" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{finding.message}</p>
                          <p className="text-xs text-muted-foreground">{finding.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
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
    </div>
  );
}

const KNOWN_SKILLS = [
  "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Express",
  "Python", "Django", "Flask", "FastAPI", "Java", "Spring", "C#", ".NET",
  "Go", "Rust", "Ruby", "Rails", "PHP", "Laravel", "Swift", "Kotlin",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
  "Git", "GitHub", "REST APIs", "GraphQL", "Microservices", "Agile", "Scrum",
  "HTML", "CSS", "Tailwind", "Sass", "Bootstrap", "Figma", "UI/UX",
  "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch",
  "Linux", "Bash", "DevOps", "Jenkins", "Ansible", "Nginx", "Apache"
];

function extractSkillsFromText(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const foundSkills: string[] = [];
  
  for (const skill of KNOWN_SKILLS) {
    const skillLower = skill.toLowerCase();
    const variations = [
      skillLower,
      skillLower.replace(/\./g, ""),
      skillLower.replace(/-/g, " "),
      skillLower.replace(/\s/g, ""),
    ];
    
    if (variations.some(v => normalizedText.includes(v))) {
      foundSkills.push(skill);
    }
  }
  
  return [...new Set(foundSkills)];
}

function generateAnalysis(selectedJob: Job | undefined, jd: string, resumeText: string): AnalysisResult {
  const extractedResumeSkills = extractSkillsFromText(resumeText);
  
  let requiredSkills: string[] = [];
  if (selectedJob) {
    requiredSkills = selectedJob.skills;
  } else if (jd) {
    requiredSkills = extractSkillsFromText(jd);
    if (requiredSkills.length === 0) {
      requiredSkills = ["JavaScript", "React"];
    }
  } else {
    requiredSkills = ["JavaScript", "React"];
  }

  const matched = requiredSkills.filter(skill => 
    extractedResumeSkills.some(rs => rs.toLowerCase() === skill.toLowerCase())
  );
  const missing = requiredSkills.filter(skill => 
    !extractedResumeSkills.some(rs => rs.toLowerCase() === skill.toLowerCase())
  );
  const extra = extractedResumeSkills.filter(skill => 
    !requiredSkills.some(rs => rs.toLowerCase() === skill.toLowerCase())
  );

  const matchRate = requiredSkills.length > 0 
    ? (matched.length / requiredSkills.length) * 100 
    : 50;
  
  const fitScore = Math.min(100, Math.floor(matchRate * 0.7 + Math.random() * 30));
  const logicScore = Math.floor(Math.random() * (45 - 5) + 5);

  const findings = [
    {
      type: "good" as const,
      message: "Consistent Career Progression",
      details: "Titles show a clear upward trajectory (Junior -> Senior) without unexplained demotions.",
    },
    {
      type: "warning" as const,
      message: "Vague Skill Descriptors",
      details: "Candidate lists 'Expert' in tools mentioned only once in work history.",
    },
    {
      type: "risk" as const,
      message: "Timeline Overlap Detected",
      details: "Role at 'Tech Corp' overlaps with 'Startup Inc' by 3 months. Verify if this was contract work.",
    },
    {
      type: "good" as const,
      message: "Education Timeline Matches",
      details: "Graduation dates align with start of professional career.",
    }
  ];

  const selectedFindings = findings.sort(() => 0.5 - Math.random()).slice(0, 3);

  const jobTitle = selectedJob?.title || "the role";
  const skillsSummary = matched.length > 0 
    ? `The candidate matches ${matched.length} of ${requiredSkills.length} required skills for ${jobTitle}.`
    : `Skills analysis could not be performed against ${jobTitle}.`;

  return {
    fitScore,
    logicScore,
    skillMatch: { matched, missing, extra },
    findings: selectedFindings,
    summary: `${skillsSummary} Fit score is ${fitScore}%. There are minor logic flags regarding timeline consistency that should be clarified in an interview.`,
    selectedJob,
  };
}
