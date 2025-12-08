import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserCheck, Copy, Mail, Send } from "lucide-react";
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

const formSchema = z.object({
  candidateName: z.string().min(2, "Candidate name is required"),
  position: z.string().min(2, "Position is required"),
  referenceName: z.string().min(2, "Reference name is required"),
  referenceEmail: z.string().email("Valid email required"),
  referenceRelationship: z.string().min(1, "Relationship is required"),
  templateType: z.string().min(1, "Template type is required"),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedEmail = {
  subject: string;
  body: string;
} | null;

export default function ReferenceCheckModule() {
  const [result, setResult] = useState<GeneratedEmail>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateName: "",
      position: "",
      referenceName: "",
      referenceEmail: "",
      referenceRelationship: "",
      templateType: "",
    },
  });

  function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateEmail(values);
      setResult(generated);
      setIsGenerating(false);
      toast({
        title: "Email Generated",
        description: "Reference request email is ready to send.",
      });
    }, 800);
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    toast({
      title: "Copied to clipboard",
      description: "Email content copied successfully.",
    });
  };

  const openMailClient = () => {
    if (!result) return;
    const email = form.getValues("referenceEmail");
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
    window.open(mailtoLink, "_blank");
  };

  const module = getModuleByPath("/references");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Reference Check"
        description="Generate professional reference request emails for your candidates."
        icon={module.icon}
        gradient={module.color}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reference Details</CardTitle>
            <CardDescription>Enter candidate and reference information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Email Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="formal">Formal Request</SelectItem>
                          <SelectItem value="friendly">Friendly Request</SelectItem>
                          <SelectItem value="brief">Brief Request</SelectItem>
                          <SelectItem value="detailed">Detailed Questionnaire</SelectItem>
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
                      <UserCheck className="mr-2 h-4 w-4" />
                      Generate Reference Request
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
                    <CardTitle className="text-lg">Generated Email</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        <Mail className="h-3 w-3 mr-1" />
                        {form.getValues("referenceEmail")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={openMailClient} data-testid="button-send">
                      <Send className="h-4 w-4 mr-2" />
                      Open Mail
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm font-medium">{result.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Body:</p>
                  <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded border max-h-80 overflow-y-auto">
                    {result.body}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Fill the form to generate a reference request email</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function generateEmail(values: FormValues): GeneratedEmail {
  const { candidateName, position, referenceName, referenceRelationship, templateType } = values;
  
  const templates: Record<string, { subject: string; body: string }> = {
    formal: {
      subject: `Reference Request for ${candidateName} - ${position} Position`,
      body: `Dear ${referenceName},

I hope this message finds you well. I am reaching out regarding ${candidateName}, who has applied for the ${position} position at our organization and has listed you as a professional reference.

${candidateName} has indicated that you served as their ${referenceRelationship} and would be able to speak to their professional qualifications and work ethic.

We would greatly appreciate if you could take a few minutes to share your perspective on the following:

1. How long did you work with ${candidateName} and in what capacity?
2. What were their primary responsibilities?
3. How would you describe their work quality and reliability?
4. What are their key strengths?
5. Are there any areas where they could improve?
6. Would you recommend them for a ${position} role?

Your feedback will remain confidential and will only be used to assist in our hiring decision.

Thank you for your time and assistance. Please feel free to respond to this email or contact me directly if you have any questions.

Best regards,
[Your Name]
[Company Name]`
    },
    friendly: {
      subject: `Quick Reference Check for ${candidateName}`,
      body: `Hi ${referenceName},

I hope you're doing well! I'm reaching out because ${candidateName} is being considered for a ${position} role with our team, and they mentioned you as someone who could speak to their work.

Since you worked together as their ${referenceRelationship}, we'd love to hear your honest thoughts about what it was like working with them.

A few things we're curious about:
- How was your experience working with ${candidateName}?
- What stood out about their work?
- Any feedback you think would help us understand them better?

No need for a formal response—just your genuine impressions would be really helpful!

Thanks so much for taking the time.

Cheers,
[Your Name]`
    },
    brief: {
      subject: `Reference Check: ${candidateName}`,
      body: `Dear ${referenceName},

${candidateName} has applied for a ${position} position and provided your name as a reference (${referenceRelationship}).

Could you briefly confirm:
- Your working relationship with ${candidateName}
- Whether you would recommend them for this type of role

A short reply would be greatly appreciated.

Thank you,
[Your Name]`
    },
    detailed: {
      subject: `Professional Reference Questionnaire for ${candidateName}`,
      body: `Dear ${referenceName},

Thank you for agreeing to provide a reference for ${candidateName}, who is being considered for our ${position} position.

As their former ${referenceRelationship}, your insights are invaluable. Please complete the following questionnaire:

PROFESSIONAL RELATIONSHIP
1. What was your professional relationship with ${candidateName}?
2. How long did you work together?
3. What were their main responsibilities?

PERFORMANCE & SKILLS
4. How would you rate their technical/professional skills? (1-5)
5. How would you rate their communication skills? (1-5)
6. How would you rate their ability to work in a team? (1-5)
7. How would you rate their problem-solving abilities? (1-5)

WORK ETHIC
8. How would you describe their reliability and punctuality?
9. How did they handle pressure or tight deadlines?
10. Can you provide an example of a significant achievement?

AREAS FOR DEVELOPMENT
11. What areas could ${candidateName} improve upon?
12. How did they respond to feedback or criticism?

OVERALL RECOMMENDATION
13. Would you hire or work with ${candidateName} again?
14. Any additional comments you'd like to share?

Please respond at your earliest convenience. All responses will be kept confidential.

Best regards,
[Your Name]
[Company Name]`
    }
  };

  return templates[templateType] || templates.formal;
}
