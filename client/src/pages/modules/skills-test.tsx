import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, Plus, Trash2, Eye, Link as LinkIcon, CheckCircle2, ListChecks, BrainCircuit, Inbox, ArrowRight, User, Briefcase, Send, MessageSquare, Copy, Mail, Clock, X } from "lucide-react";
import type { SkillsTestRecommendation, SkillsTest, SkillsTestInvitation } from "@shared/schema";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  roleName: z.string().min(2, "Role name is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  skills: z.string().min(2, "Skills are required"),
  questionCount: z.string(),
});

type Question = {
  id: number;
  type: "multiple_choice" | "open_text";
  text: string;
  options?: string[];
};

type Test = {
  id: string;
  roleName: string;
  skills: string[];
  questions: Question[];
  status: "active" | "draft";
  candidatesCompleted: number;
  avgScore: number;
};

type TestResult = {
  id: string;
  candidateName: string;
  roleName: string;
  skills: string[];
  score: number;
  skillScores: Record<string, number>;
  completedAt: string;
  sentToInterview: boolean;
};

const mockTestResults: TestResult[] = [
  {
    id: "result-1",
    candidateName: "Sarah Chen",
    roleName: "Backend Developer",
    skills: ["Python", "SQL", "System Design"],
    score: 85,
    skillScores: { "Python": 90, "SQL": 80, "System Design": 85 },
    completedAt: "2024-01-15",
    sentToInterview: false,
  },
  {
    id: "result-2",
    candidateName: "Marcus Johnson",
    roleName: "Frontend Developer",
    skills: ["React", "TypeScript", "CSS"],
    score: 72,
    skillScores: { "React": 80, "TypeScript": 65, "CSS": 70 },
    completedAt: "2024-01-14",
    sentToInterview: false,
  },
  {
    id: "result-3",
    candidateName: "Emily Rodriguez",
    roleName: "Full Stack Developer",
    skills: ["Node.js", "React", "PostgreSQL"],
    score: 58,
    skillScores: { "Node.js": 55, "React": 60, "PostgreSQL": 60 },
    completedAt: "2024-01-13",
    sentToInterview: false,
  },
];

export default function SkillsTestModule() {
  const [activeTab, setActiveTab] = useState("builder");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<Test | null>(null);
  const [pendingRecommendationId, setPendingRecommendationId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>(mockTestResults);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<SkillsTestRecommendation | null>(null);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [generatedInvitation, setGeneratedInvitation] = useState<{ token: string; testLink: string } | null>(null);

  const { data: recommendations = [] } = useQuery<SkillsTestRecommendation[]>({
    queryKey: ["/api/skills-test-recommendations"],
  });

  const { data: savedTests = [] } = useQuery<SkillsTest[]>({
    queryKey: ["/api/skills-tests"],
  });

  const deleteRecommendation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skills-test-recommendations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete recommendation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-recommendations"] });
      toast({
        title: "Recommendation Deleted",
        description: "The recommendation has been removed.",
      });
      setDeleteConfirmId(null);
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
      toast({
        title: "Invitation Created",
        description: "Test link generated. Copy and send to candidate.",
      });
    },
  });

  const updateRecommendationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/skills-test-recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills-test-recommendations"] });
    },
  });

  const sendToInterview = useMutation({
    mutationFn: async (result: TestResult) => {
      const strengths = Object.entries(result.skillScores)
        .filter(([_, score]) => score >= 75)
        .map(([skill]) => skill);
      
      const weaknesses = Object.entries(result.skillScores)
        .filter(([_, score]) => score < 75)
        .map(([skill]) => skill);
      
      const recommendedQuestions = weaknesses.map(skill => 
        `Describe a challenging project where you used ${skill}. What obstacles did you face?`
      );
      if (recommendedQuestions.length === 0) {
        recommendedQuestions.push("Tell me about a time you had to learn a new technology quickly.");
      }

      const res = await fetch("/api/interview-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: result.candidateName,
          jobTitle: result.roleName,
          testScore: result.score,
          strengths,
          weaknesses,
          recommendedQuestions,
          status: "pending",
        }),
      });
      if (!res.ok) throw new Error("Failed to send to interview");
      return res.json();
    },
    onSuccess: (_, result) => {
      setTestResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, sentToInterview: true } : r)
      );
      queryClient.invalidateQueries({ queryKey: ["/api/interview-recommendations"] });
      toast({
        title: "Sent to Interview",
        description: (
          <div className="flex flex-col gap-2">
            <span>{result.candidateName} has been sent to the Interview module.</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-fit"
              onClick={() => setLocation("/modules/interview-assistant")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View in Interview Assistant
            </Button>
          </div>
        ),
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      difficulty: "Intermediate",
      skills: "",
      questionCount: "5",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate test");
      }
      
      const newTest = await response.json();
      setGeneratedTest(newTest);
      setActiveTab("preview");
      
      if (pendingRecommendationId) {
        updateRecommendationStatus.mutate({ id: pendingRecommendationId, status: "test_created" });
        setPendingRecommendationId(null);
      }
      
      toast({
        title: "Test Generated",
        description: `Created ${newTest.questions.length} questions for ${values.roleName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills Test Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create role-specific assessments to verify candidate skills before the interview.
          </p>
        </div>
        <Button onClick={() => setActiveTab("builder")} variant={activeTab === "builder" ? "default" : "outline"}>
          <Plus className="mr-2 h-4 w-4" />
          New Test
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            Recommendations
            {recommendations.filter(r => r.status === "pending").length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {recommendations.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-builder">Builder</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedTest} data-testid="tab-preview">Preview</TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Recommendations</h3>
                  <p className="text-sm text-muted-foreground/70 max-w-sm text-center mt-2">
                    When candidates are analyzed in Resume Logic and have a good fit score, they'll appear here for skills testing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((rec) => (
                <Card key={rec.id} data-testid={`recommendation-${rec.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-candidate-name-${rec.id}`}>{rec.candidateName}</span>
                          <Badge variant={rec.status === "pending" ? "default" : "secondary"}>
                            {rec.status === "pending" ? "Needs Test" : rec.status === "test_created" ? "Test Created" : rec.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{rec.jobTitle}</span>
                          <span className="text-primary font-medium">• {rec.fitScore}% fit</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.skillsNeeded.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {rec.status === "pending" && (
                          <Button
                            size="sm"
                            data-testid={`button-create-test-${rec.id}`}
                            onClick={() => {
                              form.setValue("roleName", rec.jobTitle);
                              form.setValue("skills", rec.skillsNeeded.join(", "));
                              setPendingRecommendationId(rec.id);
                              setActiveTab("builder");
                              toast({
                                title: "Form Pre-filled",
                                description: "Skills test form has been populated. Generate the test to complete.",
                              });
                            }}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Create Test
                          </Button>
                        )}
                        {rec.status === "test_created" && (
                          <Button
                            size="sm"
                            variant="default"
                            data-testid={`button-send-test-${rec.id}`}
                            onClick={() => {
                              setSelectedRecommendation(rec);
                              setCandidateEmail("");
                              setGeneratedInvitation(null);
                              setSendDialogOpen(true);
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send to Candidate
                          </Button>
                        )}
                        {rec.status === "sent" && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Clock className="mr-1 h-3 w-3" />
                            Awaiting Response
                          </Badge>
                        )}
                        {rec.status === "completed" && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-rec-${rec.id}`}
                          onClick={() => setDeleteConfirmId(rec.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>
                  Define the parameters for the AI to generate relevant questions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Role</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Backend Developer" {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skills to Test</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. SQL, Python, System Design" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of technical skills.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isGenerating}>
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
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-lg">AI Capability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Scenario-based Questions</p>
                      <p className="text-xs text-muted-foreground">Generates real-world coding or logic problems, not just trivia.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Automated Scoring</p>
                      <p className="text-xs text-muted-foreground">Multiple choice is auto-graded. Open text is AI-evaluated.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Anti-Cheating Logic</p>
                      <p className="text-xs text-muted-foreground">Questions are randomized and timed to prevent simple Googling.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {generatedTest ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{generatedTest.roleName} Assessment</CardTitle>
                        <CardDescription className="mt-1">
                          {generatedTest.skills.join(" • ")}
                        </CardDescription>
                      </div>
                      <Badge>{generatedTest.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {generatedTest.questions.map((q, i) => (
                      <div key={q.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {i + 1}
                          </span>
                          <div className="space-y-3 w-full">
                            <p className="font-medium text-sm">{q.text}</p>
                            {q.type === "multiple_choice" && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 cursor-pointer text-sm">
                                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                            {q.type === "open_text" && (
                              <div className="h-20 w-full rounded border border-muted bg-muted/20 p-2 text-xs text-muted-foreground italic">
                                Candidate writes answer here...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6">
                    <Button variant="outline" onClick={() => setActiveTab("builder")}>Back to Edit</Button>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview as Candidate
                      </Button>
                      <Button>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Copy Test Link
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Test Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Candidates Completed</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">--%</div>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No test generated yet. Go to Builder tab.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
              <CardDescription>
                Recent candidate performance. Candidates with 70%+ can be sent to interview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium text-sm bg-muted/50">
                  <div>Candidate</div>
                  <div>Role</div>
                  <div>Score</div>
                  <div>Date</div>
                  <div className="text-right">Action</div>
                </div>
                {testResults.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No results yet. Send the test link to candidates to start collecting data.
                  </div>
                ) : (
                  testResults.map((result) => (
                    <div 
                      key={result.id} 
                      className="grid grid-cols-5 gap-4 p-4 items-center border-t text-sm"
                      data-testid={`result-row-${result.id}`}
                    >
                      <div className="font-medium" data-testid={`text-result-name-${result.id}`}>
                        {result.candidateName}
                      </div>
                      <div className="text-muted-foreground">{result.roleName}</div>
                      <div>
                        <Badge 
                          variant={result.score >= 70 ? "default" : "secondary"}
                          className={result.score >= 70 ? "bg-green-600" : ""}
                        >
                          {result.score}%
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(result.skillScores).map(([skill, score]) => (
                            <span key={skill} className="mr-2">
                              {skill}: {score}%
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-muted-foreground">{result.completedAt}</div>
                      <div className="text-right">
                        {result.score >= 70 ? (
                          result.sentToInterview ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Sent
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => sendToInterview.mutate(result)}
                              disabled={sendToInterview.isPending}
                              data-testid={`button-send-interview-${result.id}`}
                            >
                              {sendToInterview.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              Send to Interview
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Below threshold
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recommendation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteRecommendation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRecommendation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Skills Test to Candidate</DialogTitle>
            <DialogDescription>
              {selectedRecommendation && (
                <>
                  Send a {selectedRecommendation.jobTitle} skills test to {selectedRecommendation.candidateName}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!generatedInvitation ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Candidate Email</label>
                <Input
                  type="email"
                  placeholder="candidate@email.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  data-testid="input-candidate-email"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedRecommendation && candidateEmail) {
                      const latestTest = savedTests[savedTests.length - 1];
                      if (latestTest) {
                        createInvitation.mutate({
                          testId: latestTest.id,
                          candidateName: selectedRecommendation.candidateName,
                          candidateEmail,
                          jobTitle: selectedRecommendation.jobTitle,
                        });
                      }
                    }
                  }}
                  disabled={!candidateEmail || createInvitation.isPending}
                  data-testid="button-generate-link"
                >
                  {createInvitation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Generate Test Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Test Link</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInvitation.testLink);
                      toast({
                        title: "Link Copied",
                        description: "Test link copied to clipboard.",
                      });
                    }}
                    data-testid="button-copy-link"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
                <code className="block text-xs break-all bg-background p-2 rounded border">
                  {generatedInvitation.testLink}
                </code>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Send this link to the candidate via email:
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (selectedRecommendation) {
                      const subject = encodeURIComponent(`Skills Assessment for ${selectedRecommendation.jobTitle} Position`);
                      const body = encodeURIComponent(
`Dear ${selectedRecommendation.candidateName},

We're excited to move forward with your application for the ${selectedRecommendation.jobTitle} position! 

As part of our hiring process, we'd like you to complete a skills assessment. This test will help us better understand your technical abilities.

Please complete the assessment at your earliest convenience using the link below:

${generatedInvitation.testLink}

The assessment typically takes 15-30 minutes to complete. Please find a quiet environment where you can focus without interruptions.

If you have any questions or technical difficulties, please reply to this email.

Best regards,
HR Team`
                      );
                      window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`, '_blank');
                    }
                  }}
                  data-testid="button-send-email"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Open Email Client
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={() => {
                  setSendDialogOpen(false);
                  setGeneratedInvitation(null);
                  setSelectedRecommendation(null);
                  setCandidateEmail("");
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock Generator
function generateMockTest(values: any): Test {
  const { roleName, skills, questionCount } = values;
  const count = parseInt(questionCount);
  const skillList = skills.split(",").map((s: string) => s.trim());

  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const isMulti = Math.random() > 0.3;
    const skill = skillList[i % skillList.length] || "General";
    
    if (isMulti) {
      questions.push({
        id: i,
        type: "multiple_choice",
        text: `Which of the following is a best practice when using ${skill} for high-scale applications?`,
        options: [
          "Always use global state",
          "Implement aggressive caching",
          "Disable all logging",
          "Run everything on the main thread"
        ]
      });
    } else {
      questions.push({
        id: i,
        type: "open_text",
        text: `Explain how you would handle a race condition in a ${skill}-based system. Describe your approach.`,
      });
    }
  }

  return {
    id: "test-" + Math.random().toString(36).substr(2, 9),
    roleName,
    skills: skillList,
    questions,
    status: "active",
    candidatesCompleted: 0,
    avgScore: 0
  };
}
