import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, MessageSquare, Mic, Play, Save, Star, ChevronRight, ChevronDown, Check, Inbox, User, Briefcase, ArrowRight, Trophy, AlertCircle, Brain, Shield, Target, Users, FileSearch, Eye, StickyNote, Calendar, Clock, MapPin, Video, Phone, Building, Plus, X, CalendarDays, Trash2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import type { InterviewRecommendation, ScheduledInterview, Candidate } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, parseISO } from "date-fns";

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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
  const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: "",
    candidateName: "",
    jobTitle: "",
    interviewType: "video",
    scheduledTime: "10:00",
    duration: 60,
    interviewerName: "",
    interviewerEmail: "",
    location: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [] } = useQuery<InterviewRecommendation[]>({
    queryKey: ["/api/interview-recommendations"],
    refetchInterval: 5000,
  });

  const { data: scheduledInterviews = [] } = useQuery<ScheduledInterview[]>({
    queryKey: ["/api/scheduled-interviews"],
    refetchInterval: 5000,
  });

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    refetchInterval: 5000,
  });

  const createScheduledInterview = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduled-interviews", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-interviews"] });
      setScheduleDialogOpen(false);
      toast({ title: "Interview Scheduled", description: "The interview has been added to the calendar." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule interview.", variant: "destructive" });
    },
  });

  const deleteScheduledInterview = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/scheduled-interviews/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-interviews"] });
      toast({ title: "Interview Cancelled", description: "The scheduled interview has been removed." });
    },
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

  const deleteRecommendation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/interview-recommendations/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
      toast({ title: "Removed", description: "Candidate removed from interview queue." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove candidate.", variant: "destructive" });
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

  const generateQuestionsOnly = async (rec: InterviewRecommendation) => {
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
          generateOnly: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate interview questions");
      }

      const result = await response.json();
      
      // Refresh the recommendations list to show updated questions
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
      
      toast({
        title: "Questions Generated",
        description: `Generated ${result.questions?.length || 0} personalized questions for ${rec.candidateName}.`,
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

  const module = getModuleByPath("/interviews");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Interview Assistant"
        description="AI-generated structured interview questions with real-time scoring rubrics."
        icon={module.icon}
        gradient={module.color}
      >
        {session && (
          <Button variant="outline" onClick={() => { setSession(null); setActiveTab("recommendations"); }}>
            End Session
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            Queue
            {queueRecommendations.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {queueRecommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
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
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          {rec.status === "pending" && rec.recommendedQuestions.length === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-generate-questions-${rec.id}`}
                              onClick={() => generateQuestionsOnly(rec)}
                              disabled={isGenerating}
                            >
                              {isGenerating && loadingRecommendationId === rec.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate Questions
                                </>
                              )}
                            </Button>
                          )}
                          {rec.status === "pending" && rec.recommendedQuestions.length > 0 && (
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRecommendation.mutate(rec.id)}
                            disabled={deleteRecommendation.isPending}
                            data-testid={`button-delete-rec-${rec.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              );})
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Interview Calendar
                  </CardTitle>
                  <CardDescription>Schedule and manage upcoming interviews</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="bg-muted-foreground/10 p-2 text-center text-xs font-medium">
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const monthStart = startOfMonth(currentMonth);
                    const monthEnd = endOfMonth(currentMonth);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    const startPadding = monthStart.getDay();
                    const paddedDays = [...Array(startPadding).fill(null), ...days];
                    
                    return paddedDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`pad-${idx}`} className="bg-background p-2 min-h-[80px]" />;
                      }
                      const dayInterviews = scheduledInterviews.filter((interview) => {
                        const interviewDate = new Date(interview.scheduledDate);
                        return isSameDay(interviewDate, day);
                      });
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "bg-background p-2 min-h-[80px] cursor-pointer hover:bg-muted/50 transition-colors",
                            isToday(day) && "ring-2 ring-primary ring-inset",
                            !isSameMonth(day, currentMonth) && "opacity-50"
                          )}
                          onClick={() => {
                            setSelectedDate(day);
                            setScheduleDialogOpen(true);
                          }}
                          data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                        >
                          <span className={cn(
                            "text-xs font-medium",
                            isToday(day) && "text-primary"
                          )}>
                            {format(day, "d")}
                          </span>
                          <div className="mt-1 space-y-1">
                            {dayInterviews.slice(0, 2).map((interview) => (
                              <div
                                key={interview.id}
                                className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                                title={`${interview.candidateName} - ${interview.jobTitle}`}
                              >
                                {format(new Date(interview.scheduledDate), "h:mm a")} {interview.candidateName.split(" ")[0]}
                              </div>
                            ))}
                            {dayInterviews.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{dayInterviews.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Interviews</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {scheduledInterviews
                      .filter((i) => new Date(i.scheduledDate) >= new Date())
                      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                      .slice(0, 10)
                      .map((interview) => (
                        <div key={interview.id} className="p-3 border rounded-lg" data-testid={`scheduled-interview-${interview.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{interview.candidateName}</p>
                              <p className="text-xs text-muted-foreground">{interview.jobTitle}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(interview.scheduledDate), "MMM d, h:mm a")}
                                <span>({interview.duration}min)</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {interview.interviewType === "video" && <Video className="h-3 w-3 mr-1" />}
                                {interview.interviewType === "phone" && <Phone className="h-3 w-3 mr-1" />}
                                {interview.interviewType === "in_person" && <Building className="h-3 w-3 mr-1" />}
                                {interview.interviewType}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => deleteScheduledInterview.mutate(interview.id)}
                              data-testid={`delete-interview-${interview.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    {scheduledInterviews.filter((i) => new Date(i.scheduledDate) >= new Date()).length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming interviews</p>
                        <p className="text-xs">Click on a calendar date to schedule</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
                <DialogDescription>
                  {selectedDate && `Schedule an interview for ${format(selectedDate, "EEEE, MMMM d, yyyy")}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Candidate</label>
                  <Select
                    value={scheduleForm.candidateId}
                    onValueChange={(value) => {
                      const candidate = candidates.find((c) => c.id === value);
                      setScheduleForm((prev) => ({
                        ...prev,
                        candidateId: value,
                        candidateName: candidate?.name || "",
                        jobTitle: candidate?.role || "",
                      }));
                    }}
                  >
                    <SelectTrigger data-testid="select-candidate">
                      <SelectValue placeholder="Select a candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={scheduleForm.scheduledTime}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                      data-testid="input-time"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Duration</label>
                    <Select
                      value={String(scheduleForm.duration)}
                      onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, duration: parseInt(value) }))}
                    >
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Interview Type</label>
                  <Select
                    value={scheduleForm.interviewType}
                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, interviewType: value }))}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video"><Video className="h-4 w-4 inline mr-2" />Video Call</SelectItem>
                      <SelectItem value="phone"><Phone className="h-4 w-4 inline mr-2" />Phone Call</SelectItem>
                      <SelectItem value="in_person"><Building className="h-4 w-4 inline mr-2" />In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Interviewer Name</label>
                  <Input
                    value={scheduleForm.interviewerName}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, interviewerName: e.target.value }))}
                    placeholder="e.g., John Smith"
                    data-testid="input-interviewer"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    data-testid="input-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (!selectedDate || !scheduleForm.candidateId) {
                      toast({ title: "Error", description: "Please select a candidate", variant: "destructive" });
                      return;
                    }
                    const [hours, minutes] = scheduleForm.scheduledTime.split(":").map(Number);
                    const scheduledDate = new Date(selectedDate);
                    scheduledDate.setHours(hours, minutes, 0, 0);
                    
                    createScheduledInterview.mutate({
                      candidateId: scheduleForm.candidateId,
                      candidateName: scheduleForm.candidateName,
                      jobTitle: scheduleForm.jobTitle,
                      interviewType: scheduleForm.interviewType,
                      scheduledDate: scheduledDate.toISOString(),
                      duration: scheduleForm.duration,
                      interviewerName: scheduleForm.interviewerName || null,
                      interviewerEmail: scheduleForm.interviewerEmail || null,
                      location: scheduleForm.location || null,
                      notes: scheduleForm.notes || null,
                    });
                  }}
                  disabled={createScheduledInterview.isPending}
                  data-testid="button-schedule"
                >
                  {createScheduledInterview.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scheduling...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" />Schedule Interview</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                          <Collapsible
                            open={expandedInterviews.has(rec.id)}
                            onOpenChange={(open) => {
                              setExpandedInterviews(prev => {
                                const next = new Set(prev);
                                if (open) {
                                  next.add(rec.id);
                                } else {
                                  next.delete(rec.id);
                                }
                                return next;
                              });
                            }}
                            className="mt-4"
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-between"
                                data-testid={`toggle-interview-details-${rec.id}`}
                              >
                                <span className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  View All Questions & Ratings ({interviewSummary.length})
                                </span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedInterviews.has(rec.id) && "rotate-180")} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                                {interviewSummary.map((item: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-background rounded-lg border" data-testid={`question-detail-${rec.id}-${idx}`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <Badge variant={getCategoryBadgeVariant(item.category)} className="text-xs">
                                        {getCategoryIcon(item.category)} {formatCategoryName(item.category)}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={cn(
                                              "h-4 w-4",
                                              star <= item.score
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                            )}
                                          />
                                        ))}
                                        <span className="ml-1 text-sm font-medium">{item.score}/5</span>
                                      </div>
                                    </div>
                                    <p className="text-sm font-medium mb-2">{item.question}</p>
                                    {item.notes ? (
                                      <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary/50">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                          <StickyNote className="h-3 w-3" />
                                          Interviewer Notes
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">No notes recorded</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
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
