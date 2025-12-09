import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserCheck, CheckCircle2, AlertCircle, Clock } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  referenceName: z.string().min(2, "Reference name is required"),
  referenceEmail: z.string().email("Valid email is required"),
  referenceRelationship: z.string().min(1, "Relationship is required"),
  consentGiven: z.boolean().refine(val => val === true, "Consent is required to proceed"),
});

type FormValues = z.infer<typeof formSchema>;

type RequestData = {
  candidateName: string;
  positionAppliedFor: string;
  status: string;
} | null;

type PageState = "loading" | "form" | "success" | "error" | "expired" | "already_submitted";

export default function ReferenceSubmitPublic() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [requestData, setRequestData] = useState<RequestData>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceName: "",
      referenceEmail: "",
      referenceRelationship: "",
      consentGiven: false,
    },
  });

  useEffect(() => {
    async function fetchReferenceRequest() {
      try {
        const response = await fetch(`/api/reference/${token}`);
        if (response.ok) {
          const data = await response.json();
          setRequestData(data);
          setPageState("form");
        } else if (response.status === 410) {
          setPageState("expired");
        } else if (response.status === 400 || response.status === 409) {
          setPageState("already_submitted");
        } else {
          const error = await response.json();
          setErrorMessage(error.error || "Reference request not found");
          setPageState("error");
        }
      } catch (error) {
        setErrorMessage("Failed to load reference request");
        setPageState("error");
      }
    }

    if (token) {
      fetchReferenceRequest();
    }
  }, [token]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reference/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setPageState("success");
        toast({
          title: "Reference Submitted",
          description: "Thank you for providing your reference details.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.error || "Failed to submit reference",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit reference. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {pageState === "loading" && (
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </CardContent>
        )}

        {pageState === "error" && (
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Request Not Found</h2>
            <p className="mt-2 text-muted-foreground">{errorMessage}</p>
          </CardContent>
        )}

        {pageState === "expired" && (
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-orange-500" />
            <h2 className="mt-4 text-xl font-semibold">Link Expired</h2>
            <p className="mt-2 text-muted-foreground">
              This reference request link has expired. Please contact the hiring team for a new link.
            </p>
          </CardContent>
        )}

        {pageState === "already_submitted" && (
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">Already Submitted</h2>
            <p className="mt-2 text-muted-foreground">
              This reference request has already been submitted. Thank you!
            </p>
          </CardContent>
        )}

        {pageState === "success" && (
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">Thank You!</h2>
            <p className="mt-2 text-muted-foreground">
              Your reference details have been submitted successfully. The hiring team will be in touch with your reference soon.
            </p>
          </CardContent>
        )}

        {pageState === "form" && requestData && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Reference Submission</CardTitle>
                  <CardDescription>
                    For {requestData.candidateName}
                  </CardDescription>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {requestData.candidateName} has applied for the <strong>{requestData.positionAppliedFor}</strong> position 
                and has listed you as a professional reference. Please provide the following details.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="referenceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jane Smith" {...field} data-testid="input-reference-name" />
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
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. jane.smith@company.com" type="email" {...field} data-testid="input-reference-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Candidate</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-relationship">
                              <SelectValue placeholder="Select your relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Direct Manager">Direct Manager</SelectItem>
                            <SelectItem value="Colleague">Colleague</SelectItem>
                            <SelectItem value="Direct Report">Direct Report</SelectItem>
                            <SelectItem value="Client">Client</SelectItem>
                            <SelectItem value="Mentor">Mentor</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consentGiven"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-consent"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm that I have permission from my reference to share their contact information
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Submit Reference Details
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
