import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, Copy, CheckCircle2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  level: z.string().min(1, "Level is required"),
  location: z.string().min(1, "Location is required"),
  skills: z.string().min(2, "Please list a few key skills"),
  notes: z.string().optional(),
});

type GeneratedContent = {
  description: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
} | null;

export default function JobDescriptionModule() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      level: "",
      location: "",
      skills: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const generated = generateMockContent(values);
      setResult(generated);
      setIsGenerating(false);
      toast({
        title: "Job Description Generated",
        description: "AI has successfully drafted the job description.",
      });
    }, 2000);
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.description);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste this into your ATS or job board.",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Description Generator</h1>
          <p className="text-muted-foreground mt-2">
            Enter the role details and let our AI draft a comprehensive job description and salary range.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>
              Provide the core requirements for the position.
            </CardDescription>
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
                        <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
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
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Intern">Intern</SelectItem>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
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
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="On-site">On-site</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
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
                        <Input placeholder="e.g. React, TypeScript, Node.js" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of must-have skills.
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
                          placeholder="Any specific team culture notes, benefits, or unique requirements..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Job Description
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-primary">Generated Output</CardTitle>
                    <CardDescription>
                      Based on your inputs. Review and edit as needed.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Estimated Salary Range</h3>
                  <div className="text-3xl font-bold text-foreground">
                    ${result.salaryRange.min.toLocaleString()} - ${result.salaryRange.max.toLocaleString()}
                    <span className="text-lg font-normal text-muted-foreground ml-1">/ year</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    *Market estimation based on {form.getValues("level")} level and {form.getValues("location")} location.
                  </p>
                </div>

                <Separator />

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {result.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center bg-muted/10 border-dashed">
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Wand2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto mt-2">
                  Fill out the form on the left to generate a professional job description and salary insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock AI Logic
function generateMockContent(values: any): GeneratedContent {
  const { title, level, location, skills, notes } = values;
  
  // Simple logic to generate realistic-looking salary ranges
  let baseMin = 50000;
  let baseMax = 80000;

  if (level === "Mid-Level") { baseMin = 80000; baseMax = 120000; }
  if (level === "Senior") { baseMin = 120000; baseMax = 180000; }
  if (level === "Lead") { baseMin = 160000; baseMax = 220000; }
  if (level === "Executive") { baseMin = 200000; baseMax = 350000; }

  // Adjust for location
  if (location === "On-site" || location === "Hybrid") {
    baseMin += 10000;
    baseMax += 15000;
  }

  const skillList = skills.split(",").map((s: string) => s.trim()).filter(Boolean);

  const description = `
# ${title}

**Level:** ${level}
**Location:** ${location}

## About the Role
We are looking for a talented ${title} to join our growing team. In this role, you will be responsible for driving key initiatives and contributing to our core products. We value innovation, collaboration, and a passion for excellence.

## Key Responsibilities
• Design, develop, and maintain high-quality solutions for our core platform.
• Collaborate with cross-functional teams to define, design, and ship new features.
• Ensure the performance, quality, and responsiveness of applications.
• Identify and correct bottlenecks and fix bugs.
• Help maintain code quality, organization, and automation.

## Requirements
${skillList.map((s: string) => `• Proven experience with ${s}`).join("\n")}
• Strong problem-solving skills and attention to detail.
• Excellent communication and teamwork abilities.
• Bachelor's degree in a relevant field or equivalent experience.

## Why Join Us?
• Competitive compensation and benefits package.
• Flexible work environment (${location}).
• Opportunity to work with cutting-edge technologies.
• ${notes || "A culture that values growth and learning."}

## How to Apply
Please submit your resume and a brief cover letter outlining your experience and why you are a great fit for this role.
`.trim();

  return {
    description,
    salaryRange: {
      min: baseMin,
      max: baseMax,
      currency: "USD",
    },
  };
}
