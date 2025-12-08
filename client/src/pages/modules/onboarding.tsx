import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, GraduationCap, Copy, Download, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";

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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  employeeName: z.string().min(2, "Employee name is required"),
  role: z.string().min(2, "Role is required"),
  department: z.string().min(1, "Department is required"),
  startDate: z.string().min(1, "Start date is required"),
  onboardingType: z.string().min(1, "Onboarding type is required"),
});

type FormValues = z.infer<typeof formSchema>;

type ChecklistItem = {
  id: string;
  task: string;
  category: string;
  day: string;
  completed: boolean;
};

type GeneratedPlan = {
  employeeName: string;
  role: string;
  items: ChecklistItem[];
} | null;

export default function OnboardingModule() {
  const [result, setResult] = useState<GeneratedPlan>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: "",
      role: "",
      department: "",
      startDate: "",
      onboardingType: "",
    },
  });

  function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateChecklist(values);
      setResult(generated);
      setIsGenerating(false);
      toast({
        title: "Onboarding Plan Created",
        description: `${generated?.items.length} tasks generated for ${values.employeeName}.`,
      });
    }, 800);
  }

  const toggleItem = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      items: result.items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  };

  const completedCount = result?.items.filter(i => i.completed).length || 0;
  const totalCount = result?.items.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const copyToClipboard = () => {
    if (!result) return;
    const text = result.items.map(i => `[${i.completed ? 'x' : ' '}] ${i.day}: ${i.task} (${i.category})`).join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Checklist copied successfully.",
    });
  };

  const downloadAsText = () => {
    if (!result) return;
    const text = `ONBOARDING PLAN: ${result.employeeName}\nRole: ${result.role}\n\n` +
      result.items.map(i => `[${i.completed ? 'x' : ' '}] ${i.day}: ${i.task} (${i.category})`).join('\n');
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onboarding_${result.employeeName.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = result ? Array.from(new Set(result.items.map(i => i.category))) : [];

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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-department">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
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
                </div>

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
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Onboarding: {result.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{result.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{progress}%</div>
                    <p className="text-xs text-muted-foreground">{completedCount}/{totalCount} tasks</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {categories.map(cat => (
                    <Badge key={cat} variant="secondary">{cat}</Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={downloadAsText} data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {result.items.map((item) => (
                      <div 
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                        data-testid={`task-row-${item.id}`}
                      >
                        <Checkbox 
                          checked={item.completed}
                          onCheckedChange={() => toggleItem(item.id)}
                          data-testid={`checkbox-${item.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.task}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{item.day}</Badge>
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          </div>
                        </div>
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
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

function generateChecklist(values: FormValues): GeneratedPlan {
  const { employeeName, role, department, onboardingType } = values;
  
  const baseTasks: ChecklistItem[] = [
    { id: "1", task: "Send welcome email with first-day details", category: "Pre-boarding", day: "Day -3", completed: false },
    { id: "2", task: "Set up workstation/laptop", category: "IT Setup", day: "Day -1", completed: false },
    { id: "3", task: "Create email and system accounts", category: "IT Setup", day: "Day -1", completed: false },
    { id: "4", task: "Prepare welcome kit and swag", category: "Pre-boarding", day: "Day -1", completed: false },
    { id: "5", task: "Complete new hire paperwork (I-9, W-4, etc.)", category: "HR Admin", day: "Day 1", completed: false },
    { id: "6", task: "Office tour and introductions", category: "Orientation", day: "Day 1", completed: false },
    { id: "7", task: "Meet with manager for role overview", category: "Orientation", day: "Day 1", completed: false },
    { id: "8", task: "Review company handbook and policies", category: "Training", day: "Day 1", completed: false },
    { id: "9", task: "Set up direct deposit and benefits enrollment", category: "HR Admin", day: "Day 1", completed: false },
    { id: "10", task: "Team lunch/welcome meeting", category: "Culture", day: "Day 1", completed: false },
    { id: "11", task: "Complete security and compliance training", category: "Training", day: "Day 2", completed: false },
    { id: "12", task: "Review team processes and workflows", category: "Training", day: "Day 2", completed: false },
    { id: "13", task: "Set up Slack/Teams and join relevant channels", category: "IT Setup", day: "Day 2", completed: false },
    { id: "14", task: "1:1 with direct manager - set initial goals", category: "Goals", day: "Day 3", completed: false },
    { id: "15", task: "Meet with key stakeholders", category: "Networking", day: "Day 3-5", completed: false },
    { id: "16", task: "Complete role-specific training modules", category: "Training", day: "Week 1", completed: false },
    { id: "17", task: "Shadow team members on key processes", category: "Training", day: "Week 1", completed: false },
    { id: "18", task: "First project assignment", category: "Work", day: "Week 2", completed: false },
    { id: "19", task: "Check-in meeting with HR", category: "HR Admin", day: "Week 2", completed: false },
    { id: "20", task: "30-day review with manager", category: "Goals", day: "Day 30", completed: false },
  ];

  const departmentTasks: Record<string, ChecklistItem[]> = {
    engineering: [
      { id: "eng1", task: "Set up development environment", category: "IT Setup", day: "Day 1", completed: false },
      { id: "eng2", task: "Review codebase and architecture docs", category: "Training", day: "Day 2-3", completed: false },
      { id: "eng3", task: "Complete first code review", category: "Work", day: "Week 1", completed: false },
      { id: "eng4", task: "Deploy first feature to staging", category: "Work", day: "Week 2", completed: false },
    ],
    design: [
      { id: "des1", task: "Set up design tools (Figma, etc.)", category: "IT Setup", day: "Day 1", completed: false },
      { id: "des2", task: "Review design system and brand guidelines", category: "Training", day: "Day 2", completed: false },
      { id: "des3", task: "Meet with product team", category: "Networking", day: "Day 3", completed: false },
    ],
    sales: [
      { id: "sal1", task: "CRM training (Salesforce/HubSpot)", category: "Training", day: "Day 2", completed: false },
      { id: "sal2", task: "Review sales playbook", category: "Training", day: "Day 3", completed: false },
      { id: "sal3", task: "Shadow sales calls", category: "Training", day: "Week 1", completed: false },
      { id: "sal4", task: "First independent prospect call", category: "Work", day: "Week 2", completed: false },
    ],
    marketing: [
      { id: "mkt1", task: "Review brand guidelines and voice", category: "Training", day: "Day 2", completed: false },
      { id: "mkt2", task: "Access analytics tools", category: "IT Setup", day: "Day 2", completed: false },
      { id: "mkt3", task: "Review current campaigns", category: "Training", day: "Day 3", completed: false },
    ],
  };

  const extendedTasks: ChecklistItem[] = [
    { id: "ext1", task: "Cross-functional team meetings", category: "Networking", day: "Week 3", completed: false },
    { id: "ext2", task: "Lead a team meeting", category: "Work", day: "Week 3", completed: false },
    { id: "ext3", task: "60-day performance review", category: "Goals", day: "Day 60", completed: false },
    { id: "ext4", task: "90-day comprehensive review", category: "Goals", day: "Day 90", completed: false },
  ];

  let allTasks = [...baseTasks];
  
  if (departmentTasks[department]) {
    allTasks = [...allTasks, ...departmentTasks[department]];
  }

  if (onboardingType === "extended" || onboardingType === "executive") {
    allTasks = [...allTasks, ...extendedTasks];
  }

  if (onboardingType === "remote") {
    allTasks = allTasks.map(t => 
      t.task === "Office tour and introductions" 
        ? { ...t, task: "Virtual office tour and team introductions" }
        : t
    );
    allTasks.push({ id: "rem1", task: "Ship equipment to home address", category: "IT Setup", day: "Day -5", completed: false });
    allTasks.push({ id: "rem2", task: "Virtual coffee chat with teammates", category: "Culture", day: "Week 1", completed: false });
  }

  allTasks.sort((a, b) => {
    const dayOrder = (day: string) => {
      if (day.startsWith("Day -")) return -parseInt(day.split("-")[1]);
      if (day.startsWith("Day ")) return parseInt(day.split(" ")[1]);
      if (day.startsWith("Week ")) return parseInt(day.split(" ")[1]) * 7;
      return 100;
    };
    return dayOrder(a.day) - dayOrder(b.day);
  });

  return {
    employeeName,
    role,
    items: allTasks,
  };
}
