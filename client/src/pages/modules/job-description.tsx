import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wand2, Copy, Users, MapPin, DollarSign, Briefcase } from "lucide-react";

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
                    <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`job-item-${job.id}`}>
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
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-xs">
                            {job.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-candidate-count-${job.id}`}>
                            <Users className="h-3 w-3" />
                            {job.candidateCount} candidates
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
