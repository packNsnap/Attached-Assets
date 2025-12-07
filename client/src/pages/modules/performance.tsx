import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Target, Plus, Trash2, TrendingUp, Award, AlertCircle } from "lucide-react";

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
import { Slider } from "@/components/ui/slider";

const goalSchema = z.object({
  title: z.string().min(2, "Goal title is required"),
  description: z.string().min(10, "Please provide more detail"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  targetDate: z.string().min(1, "Target date is required"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  targetDate: string;
  progress: number;
  status: "on-track" | "at-risk" | "completed" | "not-started";
};

export default function PerformanceModule() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "",
      targetDate: "",
    },
  });

  function onSubmit(values: GoalFormValues) {
    const newGoal: Goal = {
      id: Date.now().toString(),
      ...values,
      progress: 0,
      status: "not-started",
    };
    setGoals([...goals, newGoal]);
    form.reset();
    setIsAdding(false);
    toast({
      title: "Goal Created",
      description: `"${values.title}" has been added to your goals.`,
    });
  }

  const updateProgress = (id: string, progress: number) => {
    setGoals(goals.map(g => {
      if (g.id !== id) return g;
      let status: Goal["status"] = "not-started";
      if (progress === 100) status = "completed";
      else if (progress >= 50) status = "on-track";
      else if (progress > 0) status = "at-risk";
      return { ...g, progress, status };
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast({
      title: "Goal Removed",
      description: "The goal has been deleted.",
    });
  };

  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const completedGoals = goals.filter(g => g.status === "completed").length;
  const atRiskGoals = goals.filter(g => g.status === "at-risk").length;

  const getStatusIcon = (status: Goal["status"]) => {
    switch (status) {
      case "completed": return <Award className="h-4 w-4 text-green-500" />;
      case "on-track": return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "at-risk": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Goal["status"]) => {
    const variants: Record<string, string> = {
      "completed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "on-track": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "at-risk": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return variants[status] || variants["not-started"];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      default: return "text-green-500";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance & Goals</h1>
          <p className="text-muted-foreground mt-2">
            Set, track, and manage employee performance goals.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} data-testid="button-add-goal">
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Goals</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-goals">{goals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-overall-progress">{overallProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-500" data-testid="text-completed">{completedGoals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At Risk</CardDescription>
            <CardTitle className="text-3xl text-orange-500" data-testid="text-at-risk">{atRiskGoals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Goal Form */}
        {isAdding && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>New Goal</CardTitle>
              <CardDescription>Define a new performance objective</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
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
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the goal, success criteria, and key milestones..."
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="input-goal-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="professional">Professional Development</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                              <SelectItem value="leadership">Leadership</SelectItem>
                              <SelectItem value="technical">Technical Skills</SelectItem>
                              <SelectItem value="collaboration">Collaboration</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Completion Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-target-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" data-testid="button-create-goal">
                      <Target className="mr-2 h-4 w-4" />
                      Create Goal
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)} data-testid="button-cancel">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        <div className={`space-y-4 ${isAdding ? '' : 'lg:col-span-2'}`}>
          {goals.length === 0 ? (
            <Card className="bg-muted/10 border-dashed h-64 flex items-center justify-center">
              <CardContent className="text-center">
                <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No goals yet. Click "Add Goal" to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${isAdding ? '' : 'md:grid-cols-2'}`}>
              {goals.map((goal) => (
                <Card key={goal.id} className="relative" data-testid={`card-goal-${goal.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(goal.status)}
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoal(goal.id)}
                        data-testid={`button-delete-${goal.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getStatusBadge(goal.status)}>
                        {goal.status.replace("-", " ")}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                        {goal.priority} priority
                      </Badge>
                      <Badge variant="secondary">{goal.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Slider
                        value={[goal.progress]}
                        onValueChange={([v]) => updateProgress(goal.id, v)}
                        max={100}
                        step={5}
                        className="cursor-pointer"
                        data-testid={`slider-progress-${goal.id}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
