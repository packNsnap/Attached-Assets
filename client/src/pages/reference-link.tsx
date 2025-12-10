import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Loader2, UserCheck, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

type ReferenceEntry = {
  id: string;
  name: string;
  email: string;
  relationship: string;
};

type LinkInfo = {
  candidateName: string;
  createdAt: string;
};

export default function ReferenceLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [references, setReferences] = useState<ReferenceEntry[]>([
    { id: "1", name: "", email: "", relationship: "" }
  ]);

  useEffect(() => {
    async function fetchLinkInfo() {
      try {
        const response = await fetch(`/api/reference-link/${token}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Link not found");
          return;
        }
        const data = await response.json();
        setLinkInfo(data);
      } catch (err) {
        setError("Failed to load reference request");
      } finally {
        setIsLoading(false);
      }
    }
    if (token) {
      fetchLinkInfo();
    }
  }, [token]);

  const addReference = () => {
    setReferences([
      ...references,
      { id: Date.now().toString(), name: "", email: "", relationship: "" }
    ]);
  };

  const removeReference = (id: string) => {
    if (references.length > 1) {
      setReferences(references.filter(r => r.id !== id));
    }
  };

  const updateReference = (id: string, field: keyof ReferenceEntry, value: string) => {
    setReferences(references.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleSubmit = async () => {
    const validRefs = references.filter(r => r.name && r.email);
    if (validRefs.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reference-link/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          references: validRefs.map(r => ({
            name: r.name,
            email: r.email,
            relationship: r.relationship || null
          }))
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to submit references");
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to submit references");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = references.some(r => r.name && r.email);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Unable to Load</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-semibold">Thank You!</h2>
              <p className="text-muted-foreground">
                Your references have been submitted successfully. The hiring team will reach out to them soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Reference Submission</CardTitle>
            <CardDescription className="text-base">
              Hi {linkInfo?.candidateName}, please provide your professional references below.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your References</CardTitle>
            <CardDescription>
              Please provide contact details for people who can speak to your professional experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {references.map((ref, index) => (
              <div
                key={ref.id}
                data-testid={`reference-form-${index}`}
                className="space-y-4 p-4 border rounded-lg relative"
              >
                {references.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeReference(ref.id)}
                    data-testid={`button-remove-ref-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div className="pr-10">
                  <h4 className="font-medium">Reference {index + 1}</h4>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`name-${ref.id}`}>Full Name *</Label>
                    <Input
                      id={`name-${ref.id}`}
                      data-testid={`input-name-${index}`}
                      value={ref.name}
                      onChange={(e) => updateReference(ref.id, "name", e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`email-${ref.id}`}>Email Address *</Label>
                    <Input
                      id={`email-${ref.id}`}
                      data-testid={`input-email-${index}`}
                      type="email"
                      value={ref.email}
                      onChange={(e) => updateReference(ref.id, "email", e.target.value)}
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`relationship-${ref.id}`}>Relationship to You</Label>
                  <Input
                    id={`relationship-${ref.id}`}
                    data-testid={`input-relationship-${index}`}
                    value={ref.relationship}
                    onChange={(e) => updateReference(ref.id, "relationship", e.target.value)}
                    placeholder="e.g., Former Manager, Colleague, etc."
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addReference}
              className="w-full"
              data-testid="button-add-another"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Reference
            </Button>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              data-testid="button-submit-references"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Submit References
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Your references will only be contacted as part of the hiring process.
        </p>
      </div>
    </div>
  );
}
