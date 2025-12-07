import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, Plus, Trash2, Eye, Link as LinkIcon, CheckCircle2, ListChecks, BrainCircuit, Inbox, ArrowRight, User, Briefcase } from "lucide-react";
import type { SkillsTestRecommendation } from "@shared/schema";

import { Button } from "@/components/ui/button";
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

export default function SkillsTestModule() {
  const [activeTab, setActiveTab] = useState("builder");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<Test | null>(null);
  const [pendingRecommendationId, setPendingRecommendationId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [] } = useQuery<SkillsTestRecommendation[]>({
    queryKey: ["/api/skills-test-recommendations"],
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      difficulty: "Intermediate",
      skills: "",
      questionCount: "5",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newTest = generateMockTest(values);
      setGeneratedTest(newTest);
      setIsGenerating(false);
      setActiveTab("preview");
      
      if (pendingRecommendationId) {
        updateRecommendationStatus.mutate({ id: pendingRecommendationId, status: "test_created" });
        setPendingRecommendationId(null);
      }
      
      toast({
        title: "Test Generated",
        description: `Created ${newTest.questions.length} questions for ${values.roleName}.`,
      });
    }, 2000);
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
                Recent candidate performance on this test.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm bg-muted/50">
                  <div>Candidate</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div>Date</div>
                </div>
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No results yet. Send the test link to candidates to start collecting data.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
