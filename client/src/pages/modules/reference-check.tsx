import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, UserCheck, Copy, Mail, FileText, Link, ExternalLink, CheckCircle2, User, Building } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import type { Candidate } from "@shared/schema";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  candidateName: z.string().min(2, "Candidate name is required"),
  position: z.string().min(2, "Position is required"),
  referenceName: z.string().optional(),
  referenceEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  referenceRelationship: z.string().optional(),
  templateType: z.string().optional(),
  resumeText: z.string().optional(),
  candidateEmail: z.string().email("Valid email required").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedResult = {
  selectedReference: {
    name: string;
    email: string;
    relationship: string;
    title: string | null;
    company: string | null;
  } | null;
  emailSubject: string | null;
  emailBody: string | null;
  questions: string[] | null;
  mailtoTemplate: string | null;
  candidateLinkRequestText: string | null;
  candidateEmail: string | null;
} | null;

export default function ReferenceCheckModule() {
  const [mode, setMode] = useState<"from_form" | "from_resume" | "request_link">("from_form");
  const [result, setResult] = useState<GeneratedResult>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [resumeAutoLoaded, setResumeAutoLoaded] = useState(false);
  const { toast } = useToast();

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateName: "",
      position: "",
      referenceName: "",
      referenceEmail: "",
      referenceRelationship: "",
      templateType: "formal",
      resumeText: "",
      candidateEmail: "",
    },
  });

  const handleCandidateSelect = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setResumeAutoLoaded(false);
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      form.setValue("candidateName", candidate.name);
      form.setValue("position", candidate.role);
      if (candidate.email) {
        form.setValue("candidateEmail", candidate.email);
      }
      
      setIsLoadingResume(true);
      try {
        const response = await fetch(`/api/candidates/${candidateId}/documents`, {
          credentials: "include"
        });
        if (response.ok) {
          const documents = await response.json();
          const resumeDoc = documents.find((doc: any) => doc.documentType === "resume" && doc.resumeText);
          if (resumeDoc?.resumeText) {
            form.setValue("resumeText", resumeDoc.resumeText);
            setResumeAutoLoaded(true);
          }
        }
      } catch (error) {
        console.error("Failed to load resume:", error);
      } finally {
        setIsLoadingResume(false);
      }
    }
  };

  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-reference-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          candidateName: values.candidateName,
          positionAppliedFor: values.position,
          referenceName: values.referenceName,
          referenceEmail: values.referenceEmail,
          relationshipToCandidate: values.referenceRelationship,
          emailTemplate: values.templateType,
          resumeText: values.resumeText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate reference check");
      }

      const data = await response.json();
      setResult({ ...data, candidateEmail: values.candidateEmail || null });
      toast({
        title: "Reference Check Generated",
        description: mode === "request_link" 
          ? "Candidate link request text is ready."
          : "AI-powered reference request email is ready.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate reference check.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully.`,
    });
  };

  const openMailClient = () => {
    if (!result?.mailtoTemplate) return;
    window.open(result.mailtoTemplate, "_blank");
  };

  const openOutlookForCandidate = () => {
    if (!result?.candidateLinkRequestText || !result?.candidateEmail) return;
    const subject = encodeURIComponent(`Reference Request for ${form.getValues("candidateName")} - ${form.getValues("position")}`);
    const body = encodeURIComponent(result.candidateLinkRequestText);
    window.open(`mailto:${result.candidateEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const module = getModuleByPath("/references");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Reference Check"
        description="AI-powered professional reference request emails with personalized questions."
        icon={module.icon}
        gradient={module.color}
      />

      <Tabs value={mode} onValueChange={(v) => { setMode(v as typeof mode); setResult(null); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="from_form" data-testid="tab-from-form">
            <User className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="from_resume" data-testid="tab-from-resume">
            <FileText className="h-4 w-4 mr-2" />
            From Resume
          </TabsTrigger>
          <TabsTrigger value="request_link" data-testid="tab-request-link">
            <Link className="h-4 w-4 mr-2" />
            Request Link
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "from_form" && "Reference Details"}
                {mode === "from_resume" && "Extract from Resume"}
                {mode === "request_link" && "Candidate Link Request"}
              </CardTitle>
              <CardDescription>
                {mode === "from_form" && "Enter the candidate and reference information manually"}
                {mode === "from_resume" && "Paste the candidate's resume to find potential references"}
                {mode === "request_link" && "Generate a link for the candidate to submit their references"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Candidate</label>
                    <Select value={selectedCandidateId} onValueChange={handleCandidateSelect}>
                      <SelectTrigger data-testid="select-candidate">
                        <SelectValue placeholder="Choose a candidate from your pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            <div className="flex items-center gap-2">
                              <span>{candidate.name}</span>
                              <Badge variant="outline" className="text-xs">{candidate.stage}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Or enter details manually below</p>
                  </div>

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="candidateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidate Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Smith" {...field} data-testid="input-candidate-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Applied For</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Software Engineer" {...field} data-testid="input-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {mode === "request_link" && (
                    <FormField
                      control={form.control}
                      name="candidateEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate Email</FormLabel>
                          <FormControl>
                            <Input placeholder="candidate@email.com" {...field} data-testid="input-candidate-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {mode === "from_form" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="referenceName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Jane Doe" {...field} data-testid="input-reference-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="referenceEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Email</FormLabel>
                              <FormControl>
                                <Input placeholder="jane@company.com" {...field} data-testid="input-reference-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="referenceRelationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Candidate</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-relationship">
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Direct Manager">Direct Manager</SelectItem>
                                <SelectItem value="Colleague">Colleague</SelectItem>
                                <SelectItem value="Direct Report">Direct Report</SelectItem>
                                <SelectItem value="Client">Client</SelectItem>
                                <SelectItem value="Mentor">Mentor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="templateType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-template">
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="brief">Brief</SelectItem>
                                <SelectItem value="detailed">Detailed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {mode === "from_resume" && (
                    <FormField
                      control={form.control}
                      name="resumeText"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Resume Text</FormLabel>
                            {isLoadingResume && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading resume...
                              </span>
                            )}
                            {resumeAutoLoaded && !isLoadingResume && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Auto-loaded from profile
                              </Badge>
                            )}
                          </div>
                          {resumeAutoLoaded && (
                            <p className="text-xs text-muted-foreground">
                              This field is prefilled with the resume saved in the candidate's profile. Review or edit the text below, or paste a different resume to override.
                            </p>
                          )}
                          <FormControl>
                            <Textarea 
                              placeholder="Paste the candidate's resume text here. The AI will identify potential references from their work history..."
                              className="min-h-[200px]"
                              {...field} 
                              data-testid="input-resume-text" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-generate">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        {mode === "request_link" ? "Generate Link Request" : "Generate Reference Request"}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {result ? (
              <>
                {mode === "request_link" && result.candidateLinkRequestText ? (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Candidate Link Request</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(result.candidateLinkRequestText!, "Link request text")} 
                            data-testid="button-copy-link-request"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          {result.candidateEmail && (
                            <Button 
                              size="sm" 
                              onClick={openOutlookForCandidate}
                              data-testid="button-open-outlook"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in Outlook
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>Send this to the candidate to request their references</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded border max-h-96 overflow-y-auto">
                        {result.candidateLinkRequestText}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {result.selectedReference && (
                      <Card className="border-green-200 bg-green-50/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            {mode === "from_resume" ? "Identified Reference" : "Reference Contact"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{result.selectedReference.name}</span>
                            {result.selectedReference.relationship && (
                              <Badge variant="secondary">{result.selectedReference.relationship}</Badge>
                            )}
                          </div>
                          {result.selectedReference.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {result.selectedReference.email}
                            </div>
                          )}
                          {(result.selectedReference.title || result.selectedReference.company) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building className="h-4 w-4" />
                              {[result.selectedReference.title, result.selectedReference.company].filter(Boolean).join(" at ")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {result.questions && result.questions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">AI-Generated Questions</CardTitle>
                          <CardDescription>Personalized reference check questions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.questions.map((q, idx) => (
                              <li key={idx} className="flex gap-3 text-sm">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                  {idx + 1}
                                </span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {result.emailSubject && result.emailBody && (
                      <Card className="border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Generated Email</CardTitle>
                              {result.selectedReference?.email && (
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {result.selectedReference.email}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => copyToClipboard(`Subject: ${result.emailSubject}\n\n${result.emailBody}`, "Email content")} 
                                data-testid="button-copy"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                              {result.mailtoTemplate && (
                                <Button size="sm" onClick={openMailClient} data-testid="button-send">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open in Email
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                            <p className="text-sm font-medium">{result.emailSubject}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Body:</p>
                            <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded border max-h-80 overflow-y-auto">
                              {result.emailBody}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            ) : (
              <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
                <CardContent className="text-center">
                  <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {mode === "from_form" && "Fill the form to generate an AI-powered reference request"}
                    {mode === "from_resume" && "Paste a resume to identify potential references"}
                    {mode === "request_link" && "Enter candidate details to generate a reference request link"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
