import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, FileText, Upload, AlertTriangle, CheckCircle, Search, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  jobDescription: z.string().min(10, "Job description is required"),
  // In a real app, this would be a file list or similar
  resumeName: z.string().optional(), 
});

type AnalysisResult = {
  fitScore: number;
  logicScore: number;
  findings: {
    type: "risk" | "warning" | "good";
    message: string;
    details: string;
  }[];
  summary: string;
} | null;

export default function ResumeAnalyzerModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult>(null);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
      resumeName: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      form.setValue("resumeName", e.target.files[0].name);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!fileName) {
      toast({
        variant: "destructive",
        title: "Resume missing",
        description: "Please upload a resume file to analyze.",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const generated = generateMockAnalysis(values.jobDescription);
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
        <h1 className="text-3xl font-bold tracking-tight">Resume Logic Analyzer</h1>
        <p className="text-muted-foreground mt-2">
          Detect inconsistencies, gaps, and logic risks in resumes without running background checks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Upload & Context</CardTitle>
            <CardDescription>
              Upload the candidate's resume and paste the job description for context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                  <FormLabel>Candidate Resume (PDF/Docx)</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <Input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
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

                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the job description here..." 
                          className="min-h-[150px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isAnalyzing}>
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

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Score Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Role Fit Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold">{result.fitScore}%</div>
                      <Progress value={result.fitScore} className={cn(
                        "h-2",
                        result.fitScore > 75 ? "text-green-500" : "text-yellow-500"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on keyword matching and experience level.
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
                      )}>{result.logicScore}%</div>
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

              {/* Detailed Findings */}
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
                      <div key={index} className="flex gap-3 items-start p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
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
                  Upload a resume and job description to start the logic analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock Logic
function generateMockAnalysis(jd: string): AnalysisResult {
  // Randomize results slightly for demo feel
  const fitScore = Math.floor(Math.random() * (95 - 60) + 60);
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

  // Randomly select 3-4 findings
  const selectedFindings = findings.sort(() => 0.5 - Math.random()).slice(0, 3);

  return {
    fitScore,
    logicScore,
    findings: selectedFindings,
    summary: `The candidate shows a strong fit (${fitScore}%) for the role based on skills. However, there are minor logic flags regarding timeline overlaps that should be clarified in an interview.`,
  };
}
