import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, GraduationCap, Copy, Mail, ChevronDown, ChevronUp, CheckCircle2, Calendar, User, Target, Eye, CheckSquare, Square } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  candidateId: z.string().optional(),
  employeeName: z.string().min(2, "Employee name is required"),
  role: z.string().min(2, "Role is required"),
  startDate: z.string().min(1, "Start date is required"),
  onboardingType: z.string().min(1, "Onboarding type is required"),
});

type FormValues = z.infer<typeof formSchema>;

type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: string;
  email?: string;
};

type Task = {
  id: string;
  title: string;
  owner: string;
  relative_day: number;
  description: string;
};

type WeekTasks = {
  week: number;
  title: string;
  tasks: Task[];
};

type Goal = {
  goal: string;
  details: string;
};

type EmailTemplate = {
  subject: string;
  body: string;
};

type GeneratedPlan = {
  planId?: string;
  tasks_by_week: WeekTasks[];
  thirty_sixty_ninety: {
    day_30: Goal[];
    day_60: Goal[];
    day_90: Goal[];
  };
  emails: {
    welcome_email_hr: EmailTemplate;
    manager_intro_email: EmailTemplate;
    it_request_email: EmailTemplate;
  };
};

type OnboardingPlan = {
  id: string;
  candidateId?: string;
  employeeName: string;
  role: string;
  startDate: string;
  onboardingType: string;
  status: string;
  planJson: GeneratedPlan;
  completedTaskIds: string[];
  createdAt: string;
  completedAt?: string;
};

export default function OnboardingModule() {
  const [result, setResult] = useState<GeneratedPlan | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openEmails, setOpenEmails] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidates
  const { data: candidatesData = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch active onboarding plans
  const { data: activePlans = [], refetch: refetchPlans } = useQuery({
    queryKey: ["onboarding-plans", "active"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/plans?status=active", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter active candidates
  const activeCandidates = (candidatesData as Candidate[]).filter(
    c => c.stage && !["Onboarded", "Rejected", "Withdrawn"].includes(c.stage)
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateId: "",
      employeeName: "",
      role: "",
      startDate: "",
      onboardingType: "",
    },
  });

  const handleCandidateSelect = (candidateId: string) => {
    const candidate = activeCandidates.find(c => c.id === candidateId);
    if (candidate) {
      form.setValue("candidateId", candidateId);
      form.setValue("employeeName", candidate.name);
      form.setValue("role", candidate.role);
    }
  };

  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_name: values.employeeName,
          role: values.role,
          start_date: values.startDate,
          onboarding_type: values.onboardingType,
          candidate_id: values.candidateId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate onboarding plan");
      }

      const data = await res.json();
      setResult(data);
      setCurrentPlanId(data.planId);
      setCompletedTaskIds([]);
      refetchPlans();
      toast({
        title: "Onboarding Plan Created",
        description: `Plan generated for ${values.employeeName}.`,
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate onboarding plan");
      toast({
        title: "Error",
        description: err.message || "Failed to generate onboarding plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const viewPlan = (plan: OnboardingPlan) => {
    setResult(plan.planJson);
    setCurrentPlanId(plan.id);
    setCompletedTaskIds(plan.completedTaskIds || []);
    form.setValue("employeeName", plan.employeeName);
    form.setValue("role", plan.role);
    form.setValue("startDate", plan.startDate);
    form.setValue("onboardingType", plan.onboardingType);
    form.setValue("candidateId", plan.candidateId || "");
  };

  const markPlanCompleted = async (planId: string) => {
    try {
      const res = await fetch(`/api/onboarding/plans/${planId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete plan");
      refetchPlans();
      if (currentPlanId === planId) {
        setResult(null);
        setCurrentPlanId(null);
        setCompletedTaskIds([]);
        form.reset();
      }
      toast({ title: "Plan Completed", description: "Onboarding plan marked as completed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!currentPlanId) return;
    const isCompleted = completedTaskIds.includes(taskId);
    const previousState = [...completedTaskIds];
    const newCompleted = isCompleted
      ? completedTaskIds.filter(id => id !== taskId)
      : [...completedTaskIds, taskId];

    setCompletedTaskIds(newCompleted);

    try {
      const res = await fetch(`/api/onboarding/plans/${currentPlanId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ task_id: taskId, completed: !isCompleted }),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
      refetchPlans();
    } catch {
      setCompletedTaskIds(previousState);
      toast({ title: "Error", description: "Failed to update task status", variant: "destructive" });
    }
  };

  const copyEmail = (email: EmailTemplate) => {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Email content copied successfully." });
  };

  const openInEmailClient = (email: EmailTemplate) => {
    const mailto = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.location.href = mailto;
  };

  const toggleEmail = (key: string) => {
    setOpenEmails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getOwnerColor = (owner: string) => {
    switch (owner.toLowerCase()) {
      case "hr": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "manager": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "it": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "employee": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getTotalTasks = (plan: GeneratedPlan) => {
    let total = 0;
    if (plan.tasks_by_week) {
      for (const week of plan.tasks_by_week) {
        total += week.tasks?.length || 0;
      }
    }
    return total;
  };

  const module = getModuleByPath("/onboarding");

  const currentTotalTasks = result ? getTotalTasks(result) : 0;
  const currentProgress = currentTotalTasks > 0 ? Math.round((completedTaskIds.length / currentTotalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Onboarding"
        description="Create personalized onboarding checklists and plans for new hires."
        icon={module.icon}
        gradient={module.color}
      />

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <span className="font-semibold">✨ AI-Generated</span> — Onboarding plans are personalized by AI based on the candidate's role and profile.
        </p>
      </div>

      {/* Active Onboarding Plans */}
      {(activePlans as OnboardingPlan[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Onboarding Plans</CardTitle>
            <CardDescription>Track progress for employees currently being onboarded</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activePlans as OnboardingPlan[]).map((plan) => {
                  const total = getTotalTasks(plan.planJson);
                  const completed = (plan.completedTaskIds || []).length;
                  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <TableRow key={plan.id} data-testid={`plan-row-${plan.id}`}>
                      <TableCell className="font-medium">{plan.employeeName}</TableCell>
                      <TableCell>{plan.role}</TableCell>
                      <TableCell>{plan.startDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPct} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">{completed} / {total}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => viewPlan(plan)} data-testid={`view-plan-${plan.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => markPlanCompleted(plan.id)} data-testid={`complete-plan-${plan.id}`}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Completed
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Hire Details</CardTitle>
            <CardDescription>Enter information about the new employee</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select a Candidate (Optional)</FormLabel>
                      <Select onValueChange={handleCandidateSelect} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-candidate">
                            <SelectValue placeholder="Pick an active candidate..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeCandidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.name} - {candidate.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sarah Johnson" {...field} data-testid="input-employee-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Product Designer" {...field} data-testid="input-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="onboardingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onboarding Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-onboarding-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard (2 weeks)</SelectItem>
                          <SelectItem value="extended">Extended (4 weeks)</SelectItem>
                          <SelectItem value="executive">Executive (6 weeks)</SelectItem>
                          <SelectItem value="remote">Remote Employee</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-generate">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Generate Onboarding Plan
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              {currentPlanId && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{completedTaskIds.length} / {currentTotalTasks} tasks</Badge>
                    <Progress value={currentProgress} className="w-32 h-2" />
                    <span className="text-sm text-muted-foreground">{currentProgress}% complete</span>
                  </div>
                </div>
              )}
              <Tabs defaultValue="checklist" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="306090" data-testid="tab-306090">30/60/90</TabsTrigger>
                  <TabsTrigger value="emails" data-testid="tab-emails">Emails</TabsTrigger>
                </TabsList>

                <TabsContent value="checklist" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Onboarding Checklist
                      </CardTitle>
                      <CardDescription>Tasks organized by week - click to mark as done</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6">
                          {result.tasks_by_week?.map((week) => (
                            <div key={week.week} className="space-y-3">
                              <h3 className="font-semibold text-sm text-primary">{week.title}</h3>
                              <div className="space-y-2">
                                {week.tasks?.map((task) => {
                                  const isCompleted = completedTaskIds.includes(task.id);
                                  return (
                                    <div
                                      key={task.id}
                                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isCompleted 
                                          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
                                          : "bg-muted/30 hover:bg-muted/50"
                                      }`}
                                      onClick={() => currentPlanId && toggleTask(task.id)}
                                      data-testid={`task-${task.id}`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <button
                                          type="button"
                                          className="mt-0.5 shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            currentPlanId && toggleTask(task.id);
                                          }}
                                        >
                                          {isCompleted ? (
                                            <CheckSquare className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <Square className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                            {task.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                          <div className="flex gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                              <Calendar className="h-3 w-3 mr-1" />
                                              Day {task.relative_day}
                                            </Badge>
                                            <Badge className={`text-xs ${getOwnerColor(task.owner)}`}>
                                              <User className="h-3 w-3 mr-1" />
                                              {task.owner}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="306090" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        30 / 60 / 90 Day Plan
                      </CardTitle>
                      <CardDescription>Goals and milestones for the first 90 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Badge className="bg-green-500">30</Badge>
                              First 30 Days
                            </h3>
                            <div className="space-y-2">
                              {result.thirty_sixty_ninety?.day_30?.map((goal, idx) => (
                                <div key={idx} className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/10">
                                  <p className="text-sm font-medium">{goal.goal}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{goal.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Badge className="bg-blue-500">60</Badge>
                              First 60 Days
                            </h3>
                            <div className="space-y-2">
                              {result.thirty_sixty_ninety?.day_60?.map((goal, idx) => (
                                <div key={idx} className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/10">
                                  <p className="text-sm font-medium">{goal.goal}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{goal.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Badge className="bg-purple-500">90</Badge>
                              First 90 Days
                            </h3>
                            <div className="space-y-2">
                              {result.thirty_sixty_ninety?.day_90?.map((goal, idx) => (
                                <div key={idx} className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/10">
                                  <p className="text-sm font-medium">{goal.goal}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{goal.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="emails" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Templates
                      </CardTitle>
                      <CardDescription>Ready-to-send emails for the onboarding process</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { key: "welcome_email_hr", label: "Welcome Email (HR)", email: result.emails?.welcome_email_hr },
                          { key: "manager_intro_email", label: "Manager Intro Email", email: result.emails?.manager_intro_email },
                          { key: "it_request_email", label: "IT Request Email", email: result.emails?.it_request_email },
                        ].map(({ key, label, email }) => email && (
                          <Collapsible key={key} open={openEmails[key]} onOpenChange={() => toggleEmail(key)}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                data-testid={`email-toggle-${key}`}
                              >
                                <span className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {label}
                                </span>
                                {openEmails[key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-3 p-4 border rounded-lg bg-muted/30">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                                <Input value={email.subject} readOnly className="mt-1" />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Body</label>
                                <Textarea
                                  value={email.body}
                                  readOnly
                                  className="mt-1 min-h-[150px] text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyEmail(email)}
                                  data-testid={`copy-email-${key}`}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openInEmailClient(email)}
                                  data-testid={`mailto-${key}`}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Open in Email
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Fill the form to generate an onboarding plan</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
