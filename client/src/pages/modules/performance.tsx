import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Target, Plus, Trash2, TrendingUp, Award, AlertCircle, Sparkles, Calendar } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type PerformanceGoal = {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  goalTitle: string;
  goalDescription: string;
  status: string;
  dueDate: string;
  isAtRisk: string;
  createdAt: string;
};

type Summary = {
  total_goals: number;
  completed_goals: number;
  at_risk_goals: number;
  overall_progress: number;
};

type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: string;
};

const manualGoalSchema = z.object({
  goalTitle: z.string().min(2, "Goal title is required"),
  goalDescription: z.string().min(10, "Please provide more detail"),
  dueDate: z.string().min(1, "Due date is required"),
});

type ManualGoalFormValues = z.infer<typeof manualGoalSchema>;

const aiGoalSchema = z.object({
  industry: z.string().optional(),
  timeHorizon: z.string().min(1, "Time horizon is required"),
});

type AIGoalFormValues = z.infer<typeof aiGoalSchema>;

export default function PerformanceModule() {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_goals: 0, completed_goals: 0, at_risk_goals: 0, overall_progress: 0 });
  const [hiredEmployees, setHiredEmployees] = useState<Candidate[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addGoalMode, setAddGoalMode] = useState<"ai" | "manual" | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const manualForm = useForm<ManualGoalFormValues>({
    resolver: zodResolver(manualGoalSchema),
    defaultValues: {
      goalTitle: "",
      goalDescription: "",
      dueDate: "",
    },
  });

  const aiForm = useForm<AIGoalFormValues>({
    resolver: zodResolver(aiGoalSchema),
    defaultValues: {
      industry: "",
      timeHorizon: "90",
    },
  });

  // Fetch hired employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/candidates?include_all=true", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          const hired = data.filter((c: Candidate) => c.stage === "Hired");
          setHiredEmployees(hired);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch goals
  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const url = selectedEmployeeId === "all" 
        ? "/api/performance/goals" 
        : `/api/performance/goals?employee_id=${selectedEmployeeId}`;
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
        setSummary(data.summary || { total_goals: 0, completed_goals: 0, at_risk_goals: 0, overall_progress: 0 });
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [selectedEmployeeId]);

  const handleStatusChange = async (goalId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/performance/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchGoals();
        toast({ title: "Status Updated", description: "Goal status has been updated." });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/performance/goals/${goalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        fetchGoals();
        toast({ title: "Goal Deleted", description: "The goal has been removed." });
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ title: "Error", description: "Failed to delete goal.", variant: "destructive" });
    }
  };

  const handleGenerateAIGoals = async (values: AIGoalFormValues) => {
    if (!selectedEmployee) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/performance/goals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.name,
          role: selectedEmployee.role,
          industry: values.industry,
          time_horizon: values.timeHorizon,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        fetchGoals();
        setAddGoalMode(null);
        setSelectedEmployee(null);
        aiForm.reset();
        toast({ 
          title: "Goals Generated", 
          description: `${data.goals.length} SMART goals have been created for ${selectedEmployee.name}.` 
        });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to generate goals.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error generating goals:", error);
      toast({ title: "Error", description: "Failed to generate goals.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualGoal = async (values: ManualGoalFormValues) => {
    if (!selectedEmployee) return;
    
    setIsCreating(true);
    try {
      const response = await fetch("/api/performance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.name,
          role: selectedEmployee.role,
          goal_title: values.goalTitle,
          goal_description: values.goalDescription,
          due_date: values.dueDate,
        }),
      });
      
      if (response.ok) {
        fetchGoals();
        setAddGoalMode(null);
        setSelectedEmployee(null);
        manualForm.reset();
        toast({ title: "Goal Created", description: "The goal has been added." });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to create goal.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({ title: "Error", description: "Failed to create goal.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string, isAtRisk: string) => {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
    }
    if (isAtRisk === "true") {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">At Risk</Badge>;
    }
    if (status === "in_progress") {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Not Started</Badge>;
  };

  const module = getModuleByPath("/performance");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Performance & Goals"
        description="Set, track, and manage employee performance goals with AI assistance."
        icon={module.icon}
        gradient={module.color}
      >
        <Dialog open={addGoalMode !== null} onOpenChange={(open) => { if (!open) { setAddGoalMode(null); setSelectedEmployee(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setAddGoalMode("ai")} data-testid="button-add-goal">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Performance Goal</DialogTitle>
              <DialogDescription>
                {!selectedEmployee 
                  ? "Select a hired employee to add goals for."
                  : addGoalMode === "ai" 
                    ? "Generate AI-suggested SMART goals."
                    : "Create a manual goal."}
              </DialogDescription>
            </DialogHeader>
            
            {!selectedEmployee ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select Employee:</p>
                {hiredEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No hired employees found. Move candidates to "Hired" stage first.</p>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {hiredEmployees.map((emp) => (
                        <Button
                          key={emp.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setSelectedEmployee(emp)}
                          data-testid={`button-select-employee-${emp.id}`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-muted-foreground">{emp.role}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedEmployee.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={addGoalMode === "ai" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddGoalMode("ai")}
                    data-testid="button-mode-ai"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Goals
                  </Button>
                  <Button
                    variant={addGoalMode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddGoalMode("manual")}
                    data-testid="button-mode-manual"
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Manual
                  </Button>
                </div>

                {addGoalMode === "ai" && (
                  <Form {...aiForm}>
                    <form onSubmit={aiForm.handleSubmit(handleGenerateAIGoals)} className="space-y-4">
                      <FormField
                        control={aiForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Healthcare, Technology" {...field} data-testid="input-industry" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={aiForm.control}
                        name="timeHorizon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Horizon</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-time-horizon">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="60">60 Days</SelectItem>
                                <SelectItem value="90">90 Days</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-generate-goals">
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate SMART Goals
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                {addGoalMode === "manual" && (
                  <Form {...manualForm}>
                    <form onSubmit={manualForm.handleSubmit(handleCreateManualGoal)} className="space-y-4">
                      <FormField
                        control={manualForm.control}
                        name="goalTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Increase sales by 20%" {...field} data-testid="input-goal-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={manualForm.control}
                        name="goalDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the goal with specific metrics..."
                                className="min-h-[80px]"
                                {...field} 
                                data-testid="input-goal-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={manualForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-due-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isCreating} data-testid="button-create-goal">
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-4 w-4" />
                            Create Goal
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)} data-testid="button-back">
                  ← Back to employee list
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Employee Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Employee:</label>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-[250px]" data-testid="select-employee-filter">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {hiredEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Goals</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-goals">{summary.total_goals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-overall-progress">{summary.overall_progress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={summary.overall_progress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-500" data-testid="text-completed">{summary.completed_goals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At Risk</CardDescription>
            <CardTitle className="text-3xl text-orange-500" data-testid="text-at-risk">{summary.at_risk_goals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
          <CardDescription>Track and manage employee goals</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No goals yet. Click "Add Goal" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id} data-testid={`row-goal-${goal.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{goal.goalTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{goal.goalDescription}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{goal.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{goal.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={goal.status} 
                        onValueChange={(value) => handleStatusChange(goal.id, value)}
                      >
                        <SelectTrigger className="w-[130px]" data-testid={`select-status-${goal.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(goal.status, goal.isAtRisk)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteGoal(goal.id)}
                        data-testid={`button-delete-${goal.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
