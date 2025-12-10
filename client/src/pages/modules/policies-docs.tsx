import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, BookOpen, Copy, Download, FileText, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  policyType: z.string().min(1, "Policy type is required"),
  industry: z.string().min(1, "Industry is required"),
  state: z.string().min(1, "State is required"),
  teamSize: z.string().min(1, "Team size is required"),
  additionalNotes: z.string().optional(),
});

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia"
];

const INDUSTRIES = [
  { value: "technology", label: "Technology / Software" },
  { value: "healthcare", label: "Healthcare / Medical" },
  { value: "finance", label: "Finance / Banking" },
  { value: "insurance", label: "Insurance" },
  { value: "retail", label: "Retail / E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "hospitality", label: "Hospitality / Tourism" },
  { value: "real-estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation / Logistics" },
  { value: "energy", label: "Energy / Utilities" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "media", label: "Media / Entertainment" },
  { value: "legal", label: "Legal Services" },
  { value: "consulting", label: "Consulting / Professional Services" },
  { value: "nonprofit", label: "Non-Profit / NGO" },
  { value: "government", label: "Government / Public Sector" },
  { value: "agriculture", label: "Agriculture / Farming" },
  { value: "pharmaceutical", label: "Pharmaceutical / Biotech" },
  { value: "aerospace", label: "Aerospace / Defense" },
  { value: "automotive", label: "Automotive" },
  { value: "food-beverage", label: "Food & Beverage" },
  { value: "staffing", label: "Staffing / Recruiting" },
  { value: "other", label: "Other" },
];

type FormValues = z.infer<typeof formSchema>;

type Source = {
  title: string;
  url: string;
};

type GeneratedPolicy = {
  policy_markdown: string;
  compliance_notes: string[];
  disclaimer: string;
  sources: Source[];
};

export default function PoliciesDocsModule() {
  const [result, setResult] = useState<GeneratedPolicy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      policyType: "",
      industry: "",
      state: "",
      teamSize: "",
      additionalNotes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/policies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_name: values.companyName,
          policy_type: values.policyType,
          industry: values.industry,
          state: values.state,
          team_size: values.teamSize,
          additional_requirements: values.additionalNotes || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate policy");
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: "Policy Generated",
        description: "Your HR policy document is ready.",
      });
    } catch (err: any) {
      setError(err.message || "We couldn't generate this policy. Please try again or consult legal counsel.");
      toast({
        title: "Error",
        description: err.message || "Failed to generate policy",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.policy_markdown);
    toast({
      title: "Copied to clipboard",
      description: "Policy content copied successfully.",
    });
  };

  const downloadAsMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.policy_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.getValues("companyName").replace(/\s+/g, "_")}_Policy.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactElement[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-1 mb-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-primary">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={index} className="text-base font-medium mt-3 mb-2">
            {trimmed.replace('#### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        listItems.push(trimmed.replace(/^[-*]\s/, ''));
      } else if (trimmed.match(/^\d+\.\s/)) {
        inList = true;
        listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      } else if (trimmed === '') {
        flushList();
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        flushList();
        elements.push(
          <p key={index} className="font-semibold mt-3 mb-1">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      } else {
        flushList();
        if (trimmed) {
          elements.push(
            <p key={index} className="text-sm mb-2 leading-relaxed">
              {trimmed}
            </p>
          );
        }
      }
    });

    flushList();
    return elements;
  };

  const policyNames: Record<string, string> = {
    "remote-work": "Remote Work Policy",
    "pto": "Paid Time Off & Leave Policy",
    "code-of-conduct": "Code of Conduct",
    "anti-harassment": "Anti-Harassment Policy",
    "expense": "Expense Reimbursement Policy",
    "social-media": "Social Media Policy",
    "dress-code": "Dress Code Policy",
    "confidentiality": "Confidentiality Agreement",
  };

  const module = getModuleByPath("/policies");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Policies & Documents"
        description="Generate professional HR policies and document templates for your organization."
        icon={module.icon}
        gradient={module.color}
      />

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <span className="font-semibold">⚖️ Legal Notice</span> — Policies generated here are based on general best practices and should be reviewed by qualified legal counsel before implementation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
            <CardDescription>Configure your policy document</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corporation" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-policy-type">
                            <SelectValue placeholder="Select policy type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote-work">Remote Work Policy</SelectItem>
                          <SelectItem value="pto">PTO & Leave Policy</SelectItem>
                          <SelectItem value="code-of-conduct">Code of Conduct</SelectItem>
                          <SelectItem value="anti-harassment">Anti-Harassment Policy</SelectItem>
                          <SelectItem value="expense">Expense Reimbursement Policy</SelectItem>
                          <SelectItem value="social-media">Social Media Policy</SelectItem>
                          <SelectItem value="dress-code">Dress Code Policy</SelectItem>
                          <SelectItem value="confidentiality">Confidentiality Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind.value} value={ind.value}>
                              {ind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
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
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-team-size">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific requirements, state regulations, or clauses to include..."
                          className="min-h-[80px]"
                          {...field} 
                          data-testid="input-additional-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-generate">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Policy...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate Policy
                    </>
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {policyNames[form.getValues("policyType")] || "Policy Draft"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Generated for {form.getValues("companyName")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Policy
                    </Button>
                    <Button size="sm" onClick={downloadAsMarkdown} data-testid="button-download">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-policy-content">
                      {renderMarkdown(result.policy_markdown)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    Compliance Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.compliance_notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Reference Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.sources.map((source, i) => (
                      <li key={i}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                          data-testid={`source-link-${i}`}
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  {result.disclaimer}
                </p>
              </div>
            </>
          ) : (
            <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Fill the form to generate a policy document</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
