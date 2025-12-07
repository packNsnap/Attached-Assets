import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, MessageSquare, Mic, Play, Save, Star, ChevronRight, Check, Inbox, User, Briefcase, ArrowRight, Trophy, AlertCircle, Brain, Shield, Target, Users, FileSearch } from "lucide-react";
import type { InterviewRecommendation } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  candidateName: z.string().min(2, "Candidate name is required"),
  jobDescription: z.string().min(10, "Job description is required"),
});

type QuestionCategory = "resume_verification" | "ai_detection" | "skills_gap" | "technical_depth" | "behavioral" | "Technical" | "Behavioral" | "Cultural";

type Question = {
  id: number;
  category: QuestionCategory;
  text: string;
  rubric: string;
  redFlags?: string;
};

type InterviewSession = {
  id: string;
  candidateName: string;
  questions: Question[];
  status: "active" | "completed";
  overallGuidance?: string;
  candidateContext?: {
    hasResume: boolean;
    hasAnalysis: boolean;
    hasTestResults: boolean;
    aiDetectionLevel: number | null;
  };
  recommendationId?: string;
  candidateId?: string;
};

function formatCategoryName(category: QuestionCategory): string {
  const names: Record<string, string> = {
    resume_verification: "Resume Verification",
    ai_detection: "AI Detection Probe",
    skills_gap: "Skills Gap",
    technical_depth: "Technical Depth",
    behavioral: "Behavioral",
    Technical: "Technical",
    Behavioral: "Behavioral",
    Cultural: "Cultural Fit",
  };
  return names[category] || category;
}

function getCategoryIcon(category: QuestionCategory): string {
  const icons: Record<string, string> = {
    resume_verification: "📋",
    ai_detection: "🤖",
    skills_gap: "🎯",
    technical_depth: "🔧",
    behavioral: "👥",
    Technical: "🔧",
    Behavioral: "👥",
    Cultural: "🏢",
  };
  return icons[category] || "❓";
}

function getCategoryBadgeVariant(category: QuestionCategory): "default" | "secondary" | "destructive" | "outline" {
  if (category === "ai_detection") return "destructive";
  if (category === "resume_verification") return "secondary";
  if (category === "skills_gap" || category === "technical_depth") return "default";
  return "outline";
}

export default function InterviewAssistantModule() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loadingRecommendationId, setLoadingRecommendationId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [] } = useQuery<InterviewRecommendation[]>({
    queryKey: ["/api/interview-recommendations"],
  });

  const updateRecommendationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/interview-recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateName: "",
      jobDescription: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSession = generateMockSession(values);
      setSession(newSession);
      setCurrentQuestionIndex(0);
      setScores({});
      setNotes({});
      setIsGenerating(false);
      setActiveTab("interview");
      toast({
        title: "Interview Guide Ready",
        description: "Questions and rubrics generated.",
      });
    }, 2000);
  }

  const handleScore = (value: number[]) => {
    setScores(prev => ({ ...prev, [currentQuestionIndex]: value[0] }));
  };

  const handleNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
  };

  const nextQuestion = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const completeInterview = async () => {
    if (!session) return;
    setIsCompleting(true);
    
    try {
      // Calculate average score
      const scoredQuestions = Object.values(scores).filter(s => s > 0);
      const averageScore = scoredQuestions.length > 0 
        ? Math.round((scoredQuestions.reduce((a, b) => a + b, 0) / scoredQuestions.length) * 20) 
        : null;
      
      // Prepare interview notes summary
      const interviewSummary = session.questions.map((q, idx) => ({
        question: q.text,
        category: q.category,
        score: scores[idx] || 0,
        notes: notes[idx] || "",
      }));

      // Complete the interview via API
      const response = await fetch("/api/complete-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: session.recommendationId,
          candidateId: session.candidateId,
          candidateName: session.candidateName,
          averageScore,
          interviewSummary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete interview");
      }

      // Refresh recommendations
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
      
      // Clear session and go to completed tab
      setSession(null);
      setActiveTab("completed");
      
      toast({
        title: "Interview Completed",
        description: `Interview for ${session.candidateName} has been saved. Average score: ${averageScore ? averageScore + "%" : "Not scored"}`,
      });
    } catch (error) {
      console.error("Failed to complete interview:", error);
      toast({
        title: "Error",
        description: "Failed to save interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const startFromRecommendation = async (rec: InterviewRecommendation) => {
    setIsGenerating(true);
    setLoadingRecommendationId(rec.id);
    
    try {
      const response = await fetch("/api/generate-interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: rec.candidateId,
          candidateName: rec.candidateName,
          jobTitle: rec.jobTitle,
          testScore: rec.testScore,
          strengths: rec.strengths,
          weaknesses: rec.weaknesses,
          recommendationId: rec.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate interview questions");
      }

      const result = await response.json();
      
      const questions: Question[] = result.questions.map((q: any, idx: number) => ({
        id: idx + 1,
        category: q.category,
        text: q.text,
        rubric: q.rubric,
        redFlags: q.redFlags,
      }));

      const newSession: InterviewSession = {
        id: "session-" + Date.now(),
        candidateName: rec.candidateName,
        status: "active",
        questions,
        overallGuidance: result.overallGuidance,
        candidateContext: result.candidateContext,
        recommendationId: rec.id,
        candidateId: rec.candidateId || undefined,
      };

      setSession(newSession);
      setCurrentQuestionIndex(0);
      setScores({});
      setNotes({});
      setActiveTab("interview");
      
      // Refresh the recommendations list to show updated questions and status
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
      
      toast({
        title: "AI Interview Guide Ready",
        description: `Generated ${questions.length} personalized questions based on resume, tests, and AI detection.`,
      });
    } catch (error) {
      console.error("Failed to generate interview questions:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setLoadingRecommendationId(null);
    }
  };

  const queueRecommendations = recommendations.filter(r => r.status === "pending" || r.status === "interview_started");
  const pendingRecommendations = recommendations.filter(r => r.status === "pending");
  const inProgressRecommendations = recommendations.filter(r => r.status === "interview_started");
  const completedRecommendations = recommendations.filter(r => r.status === "completed");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Assistant</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated structured interview questions with real-time scoring rubrics.
          </p>
        </div>
        {session && (
          <Button variant="outline" onClick={() => { setSession(null); setActiveTab("recommendations"); }}>
            End Session
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            Queue
            {queueRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {queueRecommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="interview" disabled={!session} data-testid="tab-interview">
            {session ? "Active" : "Interview"}
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed
            {completedRecommendations.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {completedRecommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {queueRecommendations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Candidates in Queue</h3>
                  <p className="text-sm text-muted-foreground/70 max-w-sm text-center mt-2">
                    When candidates pass skills tests with a score of 70% or higher, they'll appear here with AI-tailored interview questions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              queueRecommendations.map((rec) => {
                const isLoading = loadingRecommendationId === rec.id;
                return (
                <Card 
                  key={rec.id} 
                  data-testid={`interview-rec-${rec.id}`}
                  className={cn(
                    "transition-all duration-300",
                    isLoading && "border-primary/50 bg-primary/5"
                  )}
                >
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <Brain className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="font-medium">Preparing Interview for {rec.candidateName}</h3>
                          <p className="text-sm text-muted-foreground">AI is analyzing resume, test results, and generating personalized questions...</p>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileSearch className="h-3 w-3" /> Analyzing resume</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Identifying skill gaps</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Creating AI detection probes</span>
                        </div>
                      </div>
                    ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-rec-name-${rec.id}`}>{rec.candidateName}</span>
                          <Badge variant={rec.status === "pending" ? "default" : "secondary"}>
                            {rec.status === "pending" ? "Ready for Interview" : "In Progress"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{rec.jobTitle}</span>
                          <span className="font-medium">
                            • <Trophy className="h-3 w-3 inline" /> Test Score: {rec.testScore}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Strengths
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.strengths.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                  {skill}
                                </Badge>
                              ))}
                              {rec.strengths.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">None identified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Areas to Probe
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.weaknesses.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                                  {skill}
                                </Badge>
                              ))}
                              {rec.weaknesses.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">None identified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <h4 className="text-xs font-medium mb-2">AI-Recommended Questions ({rec.recommendedQuestions.length})</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {rec.recommendedQuestions.slice(0, 2).map((q, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-primary">•</span>
                                <span className="line-clamp-1">{q}</span>
                              </li>
                            ))}
                            {rec.recommendedQuestions.length > 2 && (
                              <li className="text-primary text-xs">+ {rec.recommendedQuestions.length - 2} more questions</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {rec.status === "pending" && (
                          <Button
                            size="sm"
                            data-testid={`button-start-interview-${rec.id}`}
                            onClick={() => startFromRecommendation(rec)}
                            disabled={isGenerating}
                          >
                            {isGenerating && loadingRecommendationId === rec.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Preparing...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Start Interview
                              </>
                            )}
                          </Button>
                        )}
                        {rec.status === "interview_started" && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-continue-interview-${rec.id}`}
                            onClick={() => startFromRecommendation(rec)}
                            disabled={isGenerating}
                          >
                            {isGenerating && loadingRecommendationId === rec.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "Continue"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              );})
            )}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Start New Interview</CardTitle>
              <CardDescription>
                Enter details to generate a tailored interview script manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="candidateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidate Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Alex Johnson" {...field} data-testid="input-candidate-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the job description here to tailor the questions..." 
                            className="min-h-[150px]"
                            data-testid="textarea-job-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-start-interview">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Guide...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Interview
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedRecommendations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Completed Interviews</h3>
                  <p className="text-sm text-muted-foreground/70 max-w-sm text-center mt-2">
                    Completed interviews will appear here with scores and notes summary.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
              {completedRecommendations.map((rec) => {
                const interviewSummary = rec.interviewSummary ? JSON.parse(rec.interviewSummary) : [];
                return (
                <Card key={rec.id} data-testid={`completed-interview-${rec.id}`} className="border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{rec.candidateName}</span>
                          <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                            <Check className="h-3 w-3 mr-1" /> Completed
                          </Badge>
                          {rec.interviewScore !== null && rec.interviewScore !== undefined && (
                            <Badge variant={rec.interviewScore >= 70 ? "default" : rec.interviewScore >= 50 ? "secondary" : "destructive"}>
                              <Star className="h-3 w-3 mr-1" /> Interview: {rec.interviewScore}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{rec.jobTitle}</span>
                          <span className="font-medium">
                            • <Trophy className="h-3 w-3 inline" /> Test Score: {rec.testScore}%
                          </span>
                          {rec.completedAt && (
                            <span className="text-xs">• Completed: {new Date(rec.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        
                        {interviewSummary.length > 0 && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> Interview Summary
                            </h4>
                            <div className="space-y-2 text-xs">
                              {interviewSummary.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {formatCategoryName(item.category)} {item.score}/5
                                  </Badge>
                                  {item.notes && (
                                    <span className="text-muted-foreground line-clamp-1">{item.notes}</span>
                                  )}
                                </div>
                              ))}
                              {interviewSummary.length > 3 && (
                                <span className="text-primary text-xs">+ {interviewSummary.length - 3} more questions</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Strengths
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.strengths.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                  {skill}
                                </Badge>
                              ))}
                              {rec.strengths.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">None identified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">Questions Asked</h4>
                            <span className="text-xs text-muted-foreground">{rec.recommendedQuestions.length} questions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interview" className="mt-6">
          {session ? (
        <div className="grid gap-6 lg:grid-cols-3 h-[600px]">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{session.candidateName}</CardTitle>
              <CardDescription>Interview Progress</CardDescription>
              {session.candidateContext?.aiDetectionLevel !== null && session.candidateContext?.aiDetectionLevel !== undefined && (
                <div className="mt-2">
                  <Badge 
                    variant={session.candidateContext.aiDetectionLevel > 60 ? "destructive" : session.candidateContext.aiDetectionLevel > 30 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    AI Detection: {session.candidateContext.aiDetectionLevel}%
                  </Badge>
                </div>
              )}
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {session.overallGuidance && (
                  <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">{session.overallGuidance}</p>
                  </div>
                )}
                {session.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg text-sm transition-colors flex items-start gap-3",
                      currentQuestionIndex === idx 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 border",
                      currentQuestionIndex === idx ? "border-primary-foreground" : "border-muted-foreground"
                    )}>
                      {scores[idx] ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block mb-0.5 text-xs capitalize">
                        {getCategoryIcon(q.category)} {formatCategoryName(q.category)}
                      </span>
                      <span className="opacity-90 line-clamp-1 text-xs">{q.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-muted/20">
              <Button variant="outline" className="w-full" onClick={() => setSession(null)}>
                End Session
              </Button>
            </div>
          </Card>

          {/* Active Question Area */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <Badge variant={getCategoryBadgeVariant(session.questions[currentQuestionIndex].category)}>
                  {getCategoryIcon(session.questions[currentQuestionIndex].category)} {formatCategoryName(session.questions[currentQuestionIndex].category)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {session.questions[currentQuestionIndex].text}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-4 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  What to look for (Rubric)
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {session.questions[currentQuestionIndex].rubric}
                </p>
              </div>

              {session.questions[currentQuestionIndex].redFlags && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                  <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Red Flags to Watch For
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {session.questions[currentQuestionIndex].redFlags}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Candidate Score</label>
                    <span className="text-sm font-bold text-primary">
                      {scores[currentQuestionIndex] ? scores[currentQuestionIndex] + "/5" : "Not scored"}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0]}
                    value={[scores[currentQuestionIndex] || 0]}
                    max={5}
                    step={1}
                    onValueChange={handleScore}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interviewer Notes</label>
                  <Textarea
                    placeholder="Record key points from the candidate's answer..."
                    className="min-h-[100px]"
                    value={notes[currentQuestionIndex] || ""}
                    onChange={handleNote}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex === session.questions.length - 1 ? (
                <Button onClick={completeInterview} disabled={isCompleting} className="bg-green-600 hover:bg-green-700">
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Interview
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={nextQuestion}>
                  Next Question
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-medium">Generating AI Interview Questions...</p>
                    <p className="text-sm text-muted-foreground mt-1">Analyzing resume, test results, and AI detection signals</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No active interview. Start from Recommendations or Manual Setup.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock Generator
function generateMockSession(values: any): InterviewSession {
  return {
    id: "session-" + Date.now(),
    candidateName: values.candidateName,
    status: "active",
    questions: [
      {
        id: 1,
        category: "Behavioral",
        text: "Tell me about a time you had to handle a difficult stakeholder or team member. How did you resolve the conflict?",
        rubric: "Look for: Specific example (STAR method), emotional intelligence, focus on resolution rather than blame, and a positive outcome."
      },
      {
        id: 2,
        category: "Technical",
        text: "Describe a challenging technical problem you solved recently. What trade-offs did you have to consider?",
        rubric: "Look for: Depth of technical understanding, awareness of constraints (performance vs. cost), and clarity in explaining complex concepts."
      },
      {
        id: 3,
        category: "Cultural",
        text: "What kind of work environment allows you to be most productive?",
        rubric: "Look for: Alignment with our remote/async culture, self-motivation, and communication style."
      },
      {
        id: 4,
        category: "Technical",
        text: "How do you approach testing and quality assurance in your development process?",
        rubric: "Look for: Experience with unit/integration tests, TDD mentality, and view of quality as a team responsibility."
      }
    ]
  };
}
