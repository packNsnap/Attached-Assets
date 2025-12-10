import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, GraduationCap, Copy, Mail, ChevronDown, ChevronUp, CheckCircle2, Calendar, User, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

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
} | null;

export default function OnboardingModule() {
  const [result, setResult] = useState<GeneratedPlan>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openEmails, setOpenEmails] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Fetch candidates
  const { data: candidatesData = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter active candidates (those not yet onboarded)
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

  // Handle candidate selection
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate onboarding plan");
      }

      const data = await res.json();
      setResult(data);
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

  const copyEmail = (email: EmailTemplate) => {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Email content copied successfully.",
    });
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

  const module = getModuleByPath("/onboarding");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Onboarding"
        description="Create personalized onboarding checklists and plans for new hires."
        icon={module.icon}
        gradient={module.color}
      />

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <CardDescription>Tasks organized by week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {result.tasks_by_week.map((week) => (
                          <div key={week.week} className="space-y-3">
                            <h3 className="font-semibold text-sm text-primary">{week.title}</h3>
                            <div className="space-y-2">
                              {week.tasks.map((task, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg border bg-muted/30"
                                  data-testid={`task-${week.week}-${idx}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{task.title}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                    </div>
                                  </div>
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
                              ))}
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
                            {result.thirty_sixty_ninety.day_30.map((goal, idx) => (
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
                            {result.thirty_sixty_ninety.day_60.map((goal, idx) => (
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
                            {result.thirty_sixty_ninety.day_90.map((goal, idx) => (
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
                        { key: "welcome_email_hr", label: "Welcome Email (HR)", email: result.emails.welcome_email_hr },
                        { key: "manager_intro_email", label: "Manager Intro Email", email: result.emails.manager_intro_email },
                        { key: "it_request_email", label: "IT Request Email", email: result.emails.it_request_email },
                      ].map(({ key, label, email }) => (
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
