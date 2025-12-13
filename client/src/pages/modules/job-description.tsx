import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wand2, Copy, Users, MapPin, DollarSign, Briefcase, Pencil, Trash2, X, Eye, ChevronDown, ChevronUp, Search, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";

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

type ResearchResults = {
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  keywords: string[];
  uniqueSellingPoints: string[];
  summary: string;
} | null;

export default function JobDescriptionModule() {
  const [result, setResult] = useState<GeneratedContent>(null);
  const [researchResults, setResearchResults] = useState<ResearchResults>(null);
  const [researchOpen, setResearchOpen] = useState(true);
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
    },
    refetchInterval: 5000,
  });

  const { data: allCandidates = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return res.json();
    },
    refetchInterval: 5000,
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
      setResult(null);
      setResearchResults(null);
      form.reset();
      toast({
        title: "Job Created",
        description: "Job description saved successfully.",
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
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Description Generated",
        description: "Review the job description and click Save to create the position.",
      });
    },
    onError: () => {
      toast({
        title: "AI Error",
        description: "Failed to generate job description. Please try again.",
        variant: "destructive",
      });
    }
  });

  const researchMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/research-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error("Failed to research job description");
      return res.json();
    },
    onSuccess: (data) => {
      setResearchResults(data);
      setResearchOpen(true);
      toast({
        title: "Research Complete",
        description: "Found insights from real job postings. Review and use for your description.",
      });
    },
    onError: () => {
      toast({
        title: "Research Error",
        description: "Failed to research job description. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleResearch = () => {
    const values = form.getValues();
    if (!values.title || !values.level || !values.location) {
      toast({
        title: "Missing Fields",
        description: "Please fill in Job Title, Level, and Location before researching.",
        variant: "destructive",
      });
      return;
    }
    researchMutation.mutate(values);
  };

  const saveGeneratedJob = () => {
    if (!result) return;
    const values = form.getValues();
    const skillList = values.skills.split(",").map(s => s.trim()).filter(Boolean);
    
    const jobData: InsertJob = {
      title: values.title,
      level: values.level,
      location: values.location,
      skills: skillList,
      description: result.description,
      salaryMin: result.salaryRange.min,
      salaryMax: result.salaryRange.max,
      status: "active"
    };
    
    createJobMutation.mutate(jobData);
  };

  const regenerateDescription = () => {
    const values = form.getValues();
    generateMutation.mutate(values);
  };

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

  const module = getModuleByPath("/jobs");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Description Generator"
        description="Enter role details and AI will generate a professional job description with market salary."
        icon={module.icon}
        gradient={module.color}
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Form + Output */}
        <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Role Details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Fill in the position requirements</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm" 
                    size="sm"
                    disabled={researchMutation.isPending || generateMutation.isPending} 
                    onClick={handleResearch}
                    data-testid="button-research"
                  >
                    {researchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Research from Web
                      </>
                    )}
                  </Button>
                  <Button type="submit" className="flex-1 text-xs sm:text-sm" size="sm" disabled={generateMutation.isPending || createJobMutation.isPending} data-testid="button-generate">
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        AI Generating...
                      </>
                    ) : createJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Research Results */}
        {researchResults && (
          <Collapsible open={researchOpen} onOpenChange={setResearchOpen}>
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    Research Insights
                  </CardTitle>
                  {researchOpen ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                </CollapsibleTrigger>
                <CardDescription className="text-xs sm:text-sm">From real job postings for similar roles</CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground italic">{researchResults.summary}</p>
                  
                  <div className="grid gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Common Responsibilities</h4>
                      <ul className="text-sm space-y-1" data-testid="list-responsibilities">
                        {researchResults.responsibilities.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Typical Requirements</h4>
                      <ul className="text-sm space-y-1" data-testid="list-requirements">
                        {researchResults.requirements.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Popular Benefits</h4>
                      <div className="flex flex-wrap gap-1" data-testid="list-benefits">
                        {researchResults.benefits.slice(0, 6).map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Keywords to Include</h4>
                      <div className="flex flex-wrap gap-1" data-testid="list-keywords">
                        {researchResults.keywords.slice(0, 8).map((item, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {researchResults.uniqueSellingPoints.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Unique Selling Points</h4>
                        <ul className="text-sm space-y-1" data-testid="list-usp">
                          {researchResults.uniqueSellingPoints.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Output */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card className="border-primary/20">
                <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg">Market Salary Range</CardTitle>
                    <Button variant="outline" size="sm" className="text-xs h-7 sm:h-8" onClick={copyToClipboard}>
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
                      ${result.salaryRange.min.toLocaleString()} - ${result.salaryRange.max.toLocaleString()}
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1 sm:ml-2">/ year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {form.getValues("level")} level, {form.getValues("location")} location
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                  <div className="prose prose-sm max-w-none dark:prose-invert text-xs sm:text-sm">
                    <div className="whitespace-pre-wrap leading-relaxed font-mono bg-muted/30 p-3 sm:p-4 rounded border max-h-48 sm:max-h-72 overflow-y-auto">
                      {result.description}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs sm:text-sm"
                      size="sm"
                      onClick={regenerateDescription}
                      disabled={generateMutation.isPending}
                      data-testid="button-regenerate"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    <Button 
                      className="flex-1 text-xs sm:text-sm"
                      size="sm"
                      onClick={saveGeneratedJob}
                      disabled={createJobMutation.isPending}
                      data-testid="button-save-position"
                    >
                      {createJobMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Position"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-muted/10 border-dashed h-48 sm:h-64 lg:h-96 flex items-center justify-center">
              <CardContent className="text-center p-4">
                <Wand2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground/30 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">Fill the form and generate</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>

        {/* Right Column: Saved Positions */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                Saved Positions
              </CardTitle>
              <Badge variant="secondary" className="text-xs" data-testid="badge-job-count">{savedJobs.length}</Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">All open positions you're hiring for</CardDescription>
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
            <ScrollArea className="h-[350px] sm:h-[450px] lg:h-[500px]">
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
                      <div className="p-3 sm:p-4 hover:bg-muted/50 transition-colors" data-testid={`job-item-${job.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-medium text-xs sm:text-sm truncate" data-testid={`text-job-title-${job.id}`}>{job.title}</h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                              <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0">{job.level}</Badge>
                              <span className="flex items-center gap-0.5 sm:gap-1">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {job.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="text-[10px] sm:text-xs">{job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}</span>
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
                          <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <CollapsibleTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 sm:h-7 sm:w-7"
                                  data-testid={`button-view-job-${job.id}`}
                                >
                                  {expandedJobId === job.id ? (
                                    <ChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  ) : (
                                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 sm:h-7 sm:w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(job);
                                }}
                                data-testid={`button-edit-job-${job.id}`}
                              >
                                <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Are you sure you want to delete this job?")) {
                                    deleteJobMutation.mutate(job.id);
                                  }
                                }}
                                data-testid={`button-delete-job-${job.id}`}
                              >
                                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                            <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                              {job.status}
                            </Badge>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground" data-testid={`text-candidate-count-${job.id}`}>
                              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {job.candidateCount} candidates
                            </div>
                          </div>
                        </div>
                        <CollapsibleContent className="mt-2 sm:mt-3">
                          <div className="border-t pt-2 sm:pt-3 space-y-2 sm:space-y-3">
                            <div>
                              <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">All Skills</h5>
                              <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                {job.skills.map((skill, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Job Description</h5>
                              <div className="text-[10px] sm:text-xs bg-muted/30 p-2 sm:p-3 rounded border max-h-32 sm:max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {job.description}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                                onClick={() => {
                                  navigator.clipboard.writeText(job.description);
                                  toast({ title: "Copied", description: "Job description copied to clipboard" });
                                }}
                              >
                                <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                Copy Description
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                                onClick={() => openEditDialog(job)}
                              >
                                <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Job Position</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                data-testid="input-edit-job-title"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-level" className="text-xs sm:text-sm">Level</Label>
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
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-location" className="text-xs sm:text-sm">Location</Label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-salary-min" className="text-xs sm:text-sm">Minimum Salary</Label>
                <Input
                  id="edit-salary-min"
                  type="number"
                  value={editForm.salaryMin}
                  onChange={(e) => setEditForm(p => ({ ...p, salaryMin: Number(e.target.value) }))}
                  data-testid="input-edit-job-salary-min"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-salary-max" className="text-xs sm:text-sm">Maximum Salary</Label>
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
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-description" className="text-xs sm:text-sm">Job Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="min-h-[150px] sm:min-h-[200px] font-mono text-xs"
                data-testid="textarea-edit-job-description"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
              <Button
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                size="sm"
                onClick={() => setEditingJob(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-xs sm:text-sm"
                size="sm"
                onClick={handleUpdateJob}
                disabled={updateJobMutation.isPending}
                data-testid="button-save-job-edit"
              >
                {updateJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
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
