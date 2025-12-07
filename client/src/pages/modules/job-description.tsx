import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Wand2, Copy } from "lucide-react";

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
import type { InsertJob } from "@shared/schema";

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

  function onSubmit(values: FormValues) {
    const generated = generateContent(values);
    setResult(generated);
    
    if (generated) {
      const skillList = values.skills.split(",").map(s => s.trim()).filter(Boolean);
      
      const jobData: InsertJob = {
        title: values.title,
        level: values.level,
        location: values.location,
        skills: skillList,
        description: generated.description,
        salaryMin: generated.salaryRange.min,
        salaryMax: generated.salaryRange.max,
        status: "active"
      };
      
      createJobMutation.mutate(jobData);
    }
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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Description Generator</h1>
        <p className="text-muted-foreground mt-2">
          Enter role details and AI will generate a professional job description with market salary.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

                <Button type="submit" className="w-full" disabled={createJobMutation.isPending} data-testid="button-generate">
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate & Save Job
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
      </div>
    </div>
  );
}

function generateContent(values: FormValues): GeneratedContent {
  const { title, level, location, skills } = values;
  
  const salaryRanges: Record<string, [number, number]> = {
    Junior: [60000, 85000],
    Mid: [90000, 130000],
    Senior: [130000, 180000],
    Lead: [170000, 240000],
  };

  let [min, max] = salaryRanges[level] || [60000, 85000];
  
  if (location === "Onsite") {
    min += 5000;
    max += 10000;
  }

  const skillList = skills.split(",").map(s => s.trim()).filter(Boolean);

  const description = `# ${title}

**Level:** ${level}
**Location:** ${location}

## About the Role
We're seeking a talented ${title} to join our engineering team. You'll work on impactful projects, mentor team members, and drive technical excellence across our platform.

## Key Responsibilities
• Design and implement scalable solutions
• Collaborate with cross-functional teams
• Conduct code reviews and share knowledge
• Troubleshoot and optimize performance
• Contribute to architecture decisions

## Requirements
${skillList.map((s, i) => `• ${i === 0 ? 'Proven experience with' : 'Knowledge of'} ${s}`).join("\n")}
• Strong problem-solving skills
• Excellent communication abilities
• Bachelor's degree or equivalent experience
• ${level === "Lead" ? "Team leadership experience" : "Collaborative mindset"}

## Why Join?
• Competitive compensation and benefits
• ${location === "Remote" ? "100% remote flexibility" : "Flexible work arrangements"}
• Professional development opportunities
• Collaborative, innovative culture

---

**How to Apply:** Submit your resume and brief cover letter describing your fit for the role.`;

  return {
    description,
    salaryRange: { min, max },
  };
}
