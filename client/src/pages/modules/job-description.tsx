import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wand2, Copy, Users, MapPin, DollarSign, Briefcase, Pencil, Trash2, X, Eye, ChevronDown, ChevronUp } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { InsertJob, Job } from "@shared/schema";

type JobWithCandidates = Job & { candidateCount: number };

const formSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  level: z.string().min(1, "Level is required"),
  location: z.string().min(1, "Location is required"),
  skills: z.string().min(2, "Please list a few key skills"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedContent = {
  description: string;
  salaryRange: {
    min: number;
    max: number;
  };
} | null;

export default function JobDescriptionModule() {
  const [result, setResult] = useState<GeneratedContent>(null);
  const [editingJob, setEditingJob] = useState<JobWithCandidates | null>(null);
  const [viewingJob, setViewingJob] = useState<JobWithCandidates | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    level: "",
    location: "",
    skills: "",
    salaryMin: 0,
    salaryMax: 0,
    status: "active",
    description: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedJobs = [] } = useQuery({
    queryKey: ["jobs-with-candidates"],
    queryFn: async () => {
      const res = await fetch("/api/jobs-with-candidates");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json() as Promise<JobWithCandidates[]>;
    }
  });

  const { data: allCandidates = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return res.json();
    }
  });

  const unassignedCandidateCount = allCandidates.filter((c: any) => !c.jobId).length;
  const totalCandidateCount = allCandidates.length;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      level: "",
      location: "",
      skills: "",
      notes: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: InsertJob) => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData)
      });
      if (!res.ok) throw new Error("Failed to create job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      toast({
        title: "Job Created",
        description: "Job description saved successfully to database.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save job to database",
        variant: "destructive",
      });
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/generate-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error("Failed to generate job description");
      return res.json();
    },
    onSuccess: (data, variables) => {
      setResult(data);
      
      const skillList = variables.skills.split(",").map(s => s.trim()).filter(Boolean);
      
      const jobData: InsertJob = {
        title: variables.title,
        level: variables.level,
        location: variables.location,
        skills: skillList,
        description: data.description,
        salaryMin: data.salaryRange.min,
        salaryMax: data.salaryRange.max,
        status: "active"
      };
      
      createJobMutation.mutate(jobData);
    },
    onError: () => {
      toast({
        title: "AI Error",
        description: "Failed to generate job description. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertJob> }) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      setEditingJob(null);
      toast({
        title: "Job Updated",
        description: "Job has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      toast({
        title: "Job Deleted",
        description: "Job has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  });

  const openEditDialog = (job: JobWithCandidates) => {
    setEditForm({
      title: job.title,
      level: job.level,
      location: job.location,
      skills: job.skills.join(", "),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      status: job.status,
      description: job.description
    });
    setEditingJob(job);
  };

  const handleUpdateJob = () => {
    if (!editingJob) return;
    updateJobMutation.mutate({
      id: editingJob.id,
      data: {
        title: editForm.title,
        level: editForm.level,
        location: editForm.location,
        skills: editForm.skills.split(",").map(s => s.trim()).filter(Boolean),
        salaryMin: editForm.salaryMin,
        salaryMax: editForm.salaryMax,
        status: editForm.status,
        description: editForm.description
      }
    });
  };

  function onSubmit(values: FormValues) {
    generateMutation.mutate(values);
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.description);
    toast({
      title: "Copied to clipboard",
      description: "Ready to use in your ATS.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Description Generator</h1>
        <p className="text-muted-foreground mt-2">
          Enter role details and AI will generate a professional job description with market salary.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>Fill in the position requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Frontend Engineer" {...field} data-testid="input-job-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid-Level</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                            <SelectItem value="Onsite">On-site</SelectItem>
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
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="React, TypeScript, Node.js" {...field} data-testid="input-skills" />
                      </FormControl>
                      <FormDescription>
                        Comma-separated skills
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Team culture, benefits, unique aspects..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={generateMutation.isPending || createJobMutation.isPending} data-testid="button-generate">
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI Generating...
                    </>
                  ) : createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Market Salary Range</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="text-3xl font-bold">
                      ${result.salaryRange.min.toLocaleString()} - ${result.salaryRange.max.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-2">/ year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {form.getValues("level")} level, {form.getValues("location")} location
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                    <div className="whitespace-pre-wrap leading-relaxed font-mono bg-muted/30 p-4 rounded border max-h-96 overflow-y-auto">
                      {result.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Wand2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Fill the form and generate</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Saved Positions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Saved Positions
              </CardTitle>
              <Badge variant="secondary" data-testid="badge-job-count">{savedJobs.length}</Badge>
            </div>
            <CardDescription>All open positions you're hiring for</CardDescription>
            {totalCandidateCount > 0 && (
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-muted-foreground">{totalCandidateCount} total candidates</span>
                {unassignedCandidateCount > 0 && (
                  <Badge variant="outline" className="text-xs" data-testid="badge-unassigned-count">
                    {unassignedCandidateCount} unassigned
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {savedJobs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No positions created yet</p>
                  <p className="text-xs mt-1">Generate your first job description</p>
                </div>
              ) : (
                <div className="divide-y">
                  {savedJobs.map((job) => (
                    <Collapsible 
                      key={job.id} 
                      open={expandedJobId === job.id}
                      onOpenChange={(open) => setExpandedJobId(open ? job.id : null)}
                    >
                      <div className="p-4 hover:bg-muted/50 transition-colors" data-testid={`job-item-${job.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate" data-testid={`text-job-title-${job.id}`}>{job.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">{job.level}</Badge>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {job.skills.slice(0, 3).map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{job.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <CollapsibleTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  data-testid={`button-view-job-${job.id}`}
                                >
                                  {expandedJobId === job.id ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => openEditDialog(job)}
                                data-testid={`button-edit-job-${job.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this job?")) {
                                    deleteJobMutation.mutate(job.id);
                                  }
                                }}
                                data-testid={`button-delete-job-${job.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-xs">
                              {job.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-candidate-count-${job.id}`}>
                              <Users className="h-3 w-3" />
                              {job.candidateCount} candidates
                            </div>
                          </div>
                        </div>
                        <CollapsibleContent className="mt-3">
                          <div className="border-t pt-3 space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">All Skills</h5>
                              <div className="flex flex-wrap gap-1">
                                {job.skills.map((skill, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">Job Description</h5>
                              <div className="text-xs bg-muted/30 p-3 rounded border max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {job.description}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  navigator.clipboard.writeText(job.description);
                                  toast({ title: "Copied", description: "Job description copied to clipboard" });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Description
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => openEditDialog(job)}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit Position
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Position</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                data-testid="input-edit-job-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">Level</Label>
                <Select
                  value={editForm.level}
                  onValueChange={(v) => setEditForm(p => ({ ...p, level: v }))}
                >
                  <SelectTrigger data-testid="select-edit-job-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Select
                  value={editForm.location}
                  onValueChange={(v) => setEditForm(p => ({ ...p, location: v }))}
                >
                  <SelectTrigger data-testid="select-edit-job-location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-skills">Required Skills (comma-separated)</Label>
              <Input
                id="edit-skills"
                value={editForm.skills}
                onChange={(e) => setEditForm(p => ({ ...p, skills: e.target.value }))}
                data-testid="input-edit-job-skills"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salary-min">Minimum Salary</Label>
                <Input
                  id="edit-salary-min"
                  type="number"
                  value={editForm.salaryMin}
                  onChange={(e) => setEditForm(p => ({ ...p, salaryMin: Number(e.target.value) }))}
                  data-testid="input-edit-job-salary-min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary-max">Maximum Salary</Label>
                <Input
                  id="edit-salary-max"
                  type="number"
                  value={editForm.salaryMax}
                  onChange={(e) => setEditForm(p => ({ ...p, salaryMax: Number(e.target.value) }))}
                  data-testid="input-edit-job-salary-max"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}
              >
                <SelectTrigger data-testid="select-edit-job-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="min-h-[200px] font-mono text-xs"
                data-testid="textarea-edit-job-description"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingJob(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateJob}
                disabled={updateJobMutation.isPending}
                data-testid="button-save-job-edit"
              >
                {updateJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
