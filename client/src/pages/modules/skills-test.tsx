import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, Trash2, CheckCircle2, BrainCircuit, Inbox, ArrowRight, User, Briefcase, Send, Copy, Mail, Clock, Eye, FileText, ExternalLink, ChevronRight, RotateCcw, ClipboardList, RefreshCw, AlertCircle } from "lucide-react";
import type { SkillsTestRecommendation, SkillsTest, SkillsTestInvitation, SkillsTestResponse } from "@shared/schema";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  roleName: z.string().min(2, "Role name is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  skills: z.string().min(2, "Skills are required"),
  questionCount: z.string(),
  timePerQuestion: z.string(),
});

type Question = {
  id: number;
  type: "multiple_choice";
  text: string;
  options: string[];
  skill?: string;
};

type GeneratedTest = {
  id: string;
  roleName: string;
  skills: string[];
  questions: Question[];
  status: string;
};

function isValidQuestion(q: any): q is Question {
  return (
    q &&
    typeof q === "object" &&
    typeof q.id === "number" &&
    typeof q.text === "string" &&
    q.type === "multiple_choice" &&
    (q.skill === undefined || typeof q.skill === "string") &&
    Array.isArray(q.options) && q.options.every((opt: any) => typeof opt === "string")
  );
}

function filterValidQuestions(questions: any[]): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.filter(isValidQuestion);
}

export default function SkillsTestModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Dialog states
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<"configure" | "preview" | "send">("configure");
  const [selectedRecommendation, setSelectedRecommendation] = useState<SkillsTestRecommendation | null>(null);
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [generatedInvitation, setGeneratedInvitation] = useState<{ token: string; testLink: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);
  const [pendingJobDescription, setPendingJobDescription] = useState<string>("");
  const [viewResultsInvitation, setViewResultsInvitation] = useState<SkillsTestInvitation | null>(null);

  // Data queries
  const { data: recommendations = [] } = useQuery<SkillsTestRecommendation[]>({
    queryKey: ["/api/skills-test-recommendations"],
  });

  const { data: invitations = [] } = useQuery<SkillsTestInvitation[]>({
    queryKey: ["/api/skills-test-invitations"],
  });

  const { data: savedTests = [] } = useQuery<SkillsTest[]>({
    queryKey: ["/api/skills-tests"],
  });

  const { data: jobs = [] } = useQuery<{ id: string; title: string; description: string }[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: testResponses = [], isLoading: isLoadingResponses } = useQuery<SkillsTestResponse[]>({
    queryKey: ["/api/skills-test-invitations", viewResultsInvitation?.id, "responses"],
    queryFn: async () => {
      if (!viewResultsInvitation) return [];
      const res = await fetch(`/api/skills-test-invitations/${viewResultsInvitation.id}/responses`);
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
    enabled: !!viewResultsInvitation,
  });

  const [isRescoring, setIsRescoring] = useState(false);

  // Mutations
  const deleteRecommendation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skills-test-recommendations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-recommendations"] });
      toast({ title: "Deleted", description: "Recommendation removed." });
      setDeleteConfirmId(null);
    },
  });

  const updateRecommendationStatus = useMutation({
    mutationFn: async ({ id, status, testId }: { id: string; status: string; testId?: string }) => {
      const res = await fetch(`/api/skills-test-recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, testId }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-recommendations"] });
    },
  });

  const createInvitation = useMutation({
    mutationFn: async (data: { testId: string; candidateName: string; candidateEmail: string; jobTitle: string }) => {
      const res = await fetch("/api/skills-test-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create invitation");
      return res.json();
    },
    onSuccess: (invitation) => {
      const testLink = `${window.location.origin}/test/${invitation.token}`;
      setGeneratedInvitation({ token: invitation.token, testLink });
      if (selectedRecommendation) {
        updateRecommendationStatus.mutate({ id: selectedRecommendation.id, status: "sent" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-invitations"] });
      toast({ title: "Test Link Ready", description: "Copy the link and send it to the candidate." });
    },
  });

  const handleRescore = async (invitationId: string) => {
    if (isRescoring) return;
    setIsRescoring(true);
    try {
      const res = await fetch(`/api/skills-test-invitations/${invitationId}/rescore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to rescore");
      const data = await res.json();
      toast({ title: "Rescored", description: `Test scored: ${data.score}%` });
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-invitations", invitationId, "responses"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "skills-test-invitations" });
      if (viewResultsInvitation && viewResultsInvitation.id === invitationId) {
        setViewResultsInvitation({ ...viewResultsInvitation, score: data.score });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to rescore test", variant: "destructive" });
    } finally {
      setIsRescoring(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      difficulty: "Intermediate",
      skills: "",
      questionCount: "5",
      timePerQuestion: "25",
    },
  });

  // Open workflow for a recommendation
  const startWorkflow = (rec: SkillsTestRecommendation) => {
    setSelectedRecommendation(rec);
    setGeneratedTest(null);
    setGeneratedInvitation(null);
    setCandidateEmail("");
    
    if (rec.status === "pending") {
      form.setValue("roleName", rec.jobTitle);
      form.setValue("skills", rec.skillsNeeded.join(", "));
      const job = jobs.find(j => j.id === rec.jobId);
      if (job?.description) {
        setPendingJobDescription(job.description);
      }
      setWorkflowStep("configure");
    } else if (rec.status === "test_created" && rec.testId) {
      const test = savedTests.find(t => t.id === rec.testId);
      if (test) {
        setGeneratedTest({
          id: test.id,
          roleName: test.roleName,
          skills: test.skills,
          questions: filterValidQuestions(JSON.parse(test.questions)),
          status: test.status,
        });
      }
      setWorkflowStep("send");
    } else if (rec.status === "sent") {
      setWorkflowStep("send");
    }
    
    setWorkflowOpen(true);
  };

  // Generate test
  async function generateTest(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-skills-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: values.roleName,
          difficulty: values.difficulty,
          skills: values.skills,
          questionCount: values.questionCount,
          timePerQuestion: values.timePerQuestion,
          jobDescription: pendingJobDescription || undefined,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate test");
      
      const newTest = await response.json();
      const validatedTest = {
        ...newTest,
        questions: filterValidQuestions(newTest.questions || []),
      };
      setGeneratedTest(validatedTest);
      
      if (selectedRecommendation) {
        await updateRecommendationStatus.mutateAsync({ 
          id: selectedRecommendation.id, 
          status: "test_created", 
          testId: newTest.id 
        });
        setSelectedRecommendation({ ...selectedRecommendation, testId: newTest.id, status: "test_created" });
      }
      
      setWorkflowStep("preview");
      toast({ title: "Test Generated", description: `Created ${validatedTest.questions.length} questions.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate test.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  // Get status counts
  const pendingCount = recommendations.filter(r => r.status === "pending").length;
  const readyCount = recommendations.filter(r => r.status === "test_created").length;
  const sentCount = recommendations.filter(r => r.status === "sent").length;
  const completedInvitations = invitations.filter(inv => inv.status === "completed");

  // Get test preview
  const getTestForPreview = (testId: string) => {
    const test = savedTests.find(t => t.id === testId);
    if (test) {
      return {
        ...test,
        questions: filterValidQuestions(JSON.parse(test.questions)),
      };
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Skills Assessment</h1>
        <p className="text-muted-foreground mt-1">
          Create and send skill assessments to candidates. Tests are AI-generated based on the job requirements.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="count-pending">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Need Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="count-ready">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Ready to Send</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="count-sent">{sentCount}</p>
                <p className="text-sm text-muted-foreground">Awaiting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="count-completed">{completedInvitations.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Candidate Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Candidate Queue</h2>
          
          {recommendations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No Candidates Pending</h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm text-center mt-2">
                  When candidates are analyzed in Resume Logic, they'll appear here for skills testing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid={`candidate-card-${rec.id}`}
                  onClick={() => startWorkflow(rec)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`candidate-name-${rec.id}`}>{rec.candidateName}</span>
                            <Badge 
                              variant={rec.status === "pending" ? "default" : rec.status === "test_created" ? "secondary" : "outline"}
                              className={rec.status === "sent" ? "text-purple-600 border-purple-600" : rec.status === "completed" ? "text-green-600 border-green-600" : ""}
                            >
                              {rec.status === "pending" ? "Create Test" : 
                               rec.status === "test_created" ? "Ready to Send" : 
                               rec.status === "sent" ? "Awaiting" : "Completed"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Briefcase className="h-3 w-3" />
                            <span>{rec.jobTitle}</span>
                            <span className="text-primary font-medium">• {rec.fitScore}% fit</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-btn-${rec.id}`}
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(rec.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Completed Tests</h2>
          
          {completedInvitations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-muted-foreground text-center">
                  No completed tests yet. Results will appear here once candidates submit their assessments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedInvitations.map((inv) => (
                <Card 
                  key={inv.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid={`result-card-${inv.id}`}
                  onClick={() => setViewResultsInvitation(inv)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{inv.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{inv.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {inv.score !== null && inv.score !== undefined ? (
                            <>
                              <p className="text-2xl font-bold text-green-600">{inv.score}%</p>
                              <p className="text-xs text-muted-foreground">Score</p>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                              <p className="text-xs text-muted-foreground">Submitted</p>
                            </>
                          )}
                        </div>
                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Tests */}
          {savedTests.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mt-6">Recent Tests</h2>
              <div className="space-y-3">
                {savedTests.slice(0, 5).map((test) => (
                  <Card key={test.id} className="cursor-pointer hover:border-primary/50" onClick={() => setPreviewTestId(test.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{test.roleName}</p>
                          <p className="text-xs text-muted-foreground">{test.skills.join(", ")}</p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workflow Dialog */}
      <Dialog open={workflowOpen} onOpenChange={setWorkflowOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {workflowStep === "configure" && "Configure Skills Test"}
              {workflowStep === "preview" && "Preview Test Questions"}
              {workflowStep === "send" && "Send Test to Candidate"}
            </DialogTitle>
            {selectedRecommendation && (
              <DialogDescription>
                {selectedRecommendation.candidateName} • {selectedRecommendation.jobTitle}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 py-2">
            <div className={`h-2 flex-1 rounded-full ${workflowStep === "configure" ? "bg-primary" : "bg-primary"}`} />
            <div className={`h-2 flex-1 rounded-full ${workflowStep === "preview" || workflowStep === "send" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full ${workflowStep === "send" ? "bg-primary" : "bg-muted"}`} />
          </div>

          <ScrollArea className="flex-1 pr-4">
            {/* Step 1: Configure */}
            {workflowStep === "configure" && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(generateTest)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="roleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Backend Developer" {...field} data-testid="input-role" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Junior">Junior</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Questions</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-count">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="3">3 Questions</SelectItem>
                              <SelectItem value="5">5 Questions</SelectItem>
                              <SelectItem value="10">10 Questions</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timePerQuestion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Per Question (seconds)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="5" 
                            max="120" 
                            {...field} 
                            data-testid="input-time-per-question"
                          />
                        </FormControl>
                        <FormDescription>
                          {parseInt(field.value) > 20 ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Times over 20 seconds may allow candidates to look up answers
                            </span>
                          ) : (
                            "Recommended: 15 seconds to prevent answer lookup"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills to Test</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SQL, Python, System Design" {...field} data-testid="input-skills" />
                        </FormControl>
                        <FormDescription>Comma-separated list of skills.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isGenerating} data-testid="btn-generate">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Generate Assessment
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2: Preview */}
            {workflowStep === "preview" && generatedTest && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{generatedTest.roleName}</h3>
                    <p className="text-sm text-muted-foreground">{generatedTest.questions.length} questions</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setWorkflowStep("configure")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedTest.questions.map((q, idx) => (
                    <Card key={q.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm">{q.text}</p>
                            {q.skill && (
                              <Badge variant="outline" className="text-xs">{q.skill}</Badge>
                            )}
                            <div className="space-y-1 mt-2">
                              {q.options.map((opt, i) => (
                                <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                                  {opt}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Send */}
            {workflowStep === "send" && (
              <div className="space-y-4 py-4">
                {!generatedInvitation ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Candidate Email</label>
                      <Input
                        type="email"
                        placeholder="candidate@email.com"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        data-testid="input-email"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        const testId = generatedTest?.id || selectedRecommendation?.testId;
                        if (selectedRecommendation && candidateEmail && testId) {
                          createInvitation.mutate({
                            testId,
                            candidateName: selectedRecommendation.candidateName,
                            candidateEmail,
                            jobTitle: selectedRecommendation.jobTitle,
                          });
                        }
                      }}
                      disabled={!candidateEmail || createInvitation.isPending}
                      data-testid="btn-generate-link"
                    >
                      {createInvitation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Generate Test Link
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Test Link Ready!</span>
                        </div>
                        <code className="block text-xs break-all bg-white p-2 rounded border mt-2">
                          {generatedInvitation.testLink}
                        </code>
                      </CardContent>
                    </Card>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInvitation.testLink);
                          toast({ title: "Copied!", description: "Link copied to clipboard." });
                        }}
                        data-testid="btn-copy-link"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (selectedRecommendation) {
                            const subject = encodeURIComponent(`Skills Assessment for ${selectedRecommendation.jobTitle} Position`);
                            const body = encodeURIComponent(
`Dear ${selectedRecommendation.candidateName},

We're excited to move forward with your application for the ${selectedRecommendation.jobTitle} position!

Please complete the skills assessment using the link below:

${generatedInvitation.testLink}

The assessment typically takes 15-30 minutes. Please find a quiet environment where you can focus.

Best regards,
HR Team`
                            );
                            window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`, '_blank');
                          }
                        }}
                        data-testid="btn-open-email"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Open Email
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            {workflowStep === "preview" && generatedTest && (
              <Button onClick={() => setWorkflowStep("send")} data-testid="btn-continue-send">
                Continue to Send
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {workflowStep === "send" && generatedInvitation && (
              <Button onClick={() => setWorkflowOpen(false)} data-testid="btn-done">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Preview Dialog */}
      <Dialog open={!!previewTestId} onOpenChange={() => setPreviewTestId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Test Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {previewTestId && (() => {
              const test = getTestForPreview(previewTestId);
              if (!test) return <p>Test not found</p>;
              return (
                <div className="space-y-3 py-4">
                  <div className="mb-4">
                    <h3 className="font-medium">{test.roleName}</h3>
                    <p className="text-sm text-muted-foreground">{test.skills.join(", ")}</p>
                  </div>
                  {test.questions.map((q: Question, idx: number) => (
                    <Card key={q.id}>
                      <CardContent className="py-3">
                        <p className="text-sm"><strong>Q{idx + 1}:</strong> {q.text}</p>
                        {q.options && (
                          <ul className="mt-2 space-y-1">
                            {q.options.map((opt, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {opt}</li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this candidate from the skills test queue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteRecommendation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Test Results Dialog */}
      <Dialog open={!!viewResultsInvitation} onOpenChange={() => setViewResultsInvitation(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
            {viewResultsInvitation && (
              <DialogDescription>
                {viewResultsInvitation.candidateName} • {viewResultsInvitation.jobTitle}
              </DialogDescription>
            )}
          </DialogHeader>

          {viewResultsInvitation && (
            <div className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold">
                  {viewResultsInvitation.score !== null && viewResultsInvitation.score !== undefined 
                    ? `${viewResultsInvitation.score}%` 
                    : "Pending Review"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRescore(viewResultsInvitation.id)}
                  disabled={isRescoring}
                  data-testid="button-rescore"
                >
                  {isRescoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {viewResultsInvitation.score !== null && viewResultsInvitation.score !== undefined ? "Rescore" : "Score Now"}
                    </>
                  )}
                </Button>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Submitted</p>
                  <p>{viewResultsInvitation.completedAt 
                    ? new Date(viewResultsInvitation.completedAt).toLocaleDateString() 
                    : "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            {isLoadingResponses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : testResponses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No responses recorded</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {testResponses.map((response, idx) => (
                  <Card key={response.id} data-testid={`response-${response.id}`}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{response.questionText}</p>
                          </div>
                        </div>
                        {response.score !== null && (
                          <Badge 
                            variant={response.score >= 70 ? "default" : "secondary"}
                            className={response.score >= 70 ? "bg-green-600" : response.score >= 50 ? "bg-yellow-600" : "bg-red-600"}
                          >
                            {response.score}%
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-9 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Candidate's Answer:</p>
                        <p className="text-sm">{response.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
