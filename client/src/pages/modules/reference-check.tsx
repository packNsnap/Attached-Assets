import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCheck, Copy, Mail, Link, ExternalLink, Plus, Trash2, Users, Send, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import type { Candidate, Reference, ReferenceLink } from "@shared/schema";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ReferenceCheckModule() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [newRefName, setNewRefName] = useState("");
  const [newRefEmail, setNewRefEmail] = useState("");
  const [newRefRelationship, setNewRefRelationship] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeEmail, setActiveEmail] = useState<{
    refId: string;
    to: string;
    subject: string;
    body: string;
    mailto: string;
  } | null>(null);
  const [activeLinkEmail, setActiveLinkEmail] = useState<{
    to: string;
    subject: string;
    body: string;
    link: string;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const module = getModuleByPath("/references");

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const { data: references = [], isLoading: isLoadingRefs } = useQuery<Reference[]>({
    queryKey: [`/api/candidates/${selectedCandidateId}/references`],
    enabled: !!selectedCandidateId,
  });

  const { data: referenceLinks = [] } = useQuery<ReferenceLink[]>({
    queryKey: [`/api/candidates/${selectedCandidateId}/reference-links`],
    enabled: !!selectedCandidateId,
  });

  const createReferenceMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; relationship?: string }) => {
      const response = await fetch(`/api/candidates/${selectedCandidateId}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create reference");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/candidates/${selectedCandidateId}/references`] });
      setNewRefName("");
      setNewRefEmail("");
      setNewRefRelationship("");
      setIsAddDialogOpen(false);
      toast({ title: "Reference added", description: "Reference contact has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add reference.", variant: "destructive" });
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/candidates/${selectedCandidateId}/reference-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create link");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/candidates/${selectedCandidateId}/reference-links`] });
      const referenceLink = `${window.location.origin}/reference-link/${data.token}`;
      
      // Create editable email template with candidate's email
      const subject = `Reference Request for ${selectedCandidate?.name}`;
      const body = `Hi ${selectedCandidate?.name},

We would like to request references for your application to the ${selectedCandidate?.role} position at our organization.

Please provide a minimum of 2 references through the following secure link:
${referenceLink}

The link will allow references to submit their information directly.

Thank you!

Best regards`;

      setActiveLinkEmail({
        to: selectedCandidate?.email || "",
        subject,
        body,
        link: referenceLink,
      });

      toast({ title: "Link created!", description: "Email template is ready to customize and send." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create reference link.", variant: "destructive" });
    },
  });

  const markEmailSentMutation = useMutation({
    mutationFn: async (refId: string) => {
      const response = await fetch(`/api/references/${refId}/email-sent`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark email sent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/candidates/${selectedCandidateId}/references`] });
      toast({ title: "Marked as sent", description: "Reference has been marked as contacted." });
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: async ({ refId, refEmail }: { refId: string; refEmail: string }) => {
      const response = await fetch(`/api/references/${refId}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateName: selectedCandidate?.name,
          candidateRole: selectedCandidate?.role,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate reference email");
      }
      return { ...(await response.json()), refId, refEmail };
    },
    onSuccess: (data) => {
      if (data.mailto) {
        try {
          const mailtoUrl = new URL(data.mailto);
          const subject = decodeURIComponent(mailtoUrl.searchParams.get("subject") || "");
          const body = decodeURIComponent(mailtoUrl.searchParams.get("body") || "");
          setActiveEmail({
            refId: data.refId,
            to: data.refEmail,
            subject,
            body,
            mailto: data.mailto,
          });
          markEmailSentMutation.mutate(data.refId);
          toast({ title: "Email Generated", description: "Use the buttons to open your email client or copy the content." });
        } catch {
          toast({ title: "Error", description: "Failed to parse email link.", variant: "destructive" });
        }
      } else {
        toast({ title: "Error", description: "Failed to generate email link.", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to generate reference email.", variant: "destructive" });
    },
  });

  const handleCopyEmail = () => {
    if (!activeEmail) return;
    const fullEmail = `To: ${activeEmail.to}\nSubject: ${activeEmail.subject}\n\n${activeEmail.body}`;
    navigator.clipboard.writeText(fullEmail);
    toast({ title: "Copied!", description: "Email content copied to clipboard." });
  };

  const handleCopyLinkEmail = () => {
    if (!activeLinkEmail) return;
    const fullEmail = `To: ${activeLinkEmail.to}\nSubject: ${activeLinkEmail.subject}\n\n${activeLinkEmail.body}`;
    navigator.clipboard.writeText(fullEmail);
    toast({ title: "Copied!", description: "Email template copied to clipboard." });
  };

  const handleOpenLinkEmail = () => {
    if (!activeLinkEmail) return;
    const mailto = `mailto:${encodeURIComponent(activeLinkEmail.to)}?subject=${encodeURIComponent(activeLinkEmail.subject)}&body=${encodeURIComponent(activeLinkEmail.body)}`;
    window.open(mailto);
  };

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={module?.title || "Reference Check"}
        description={module?.description || "Manage reference checks for candidates"}
        icon={module?.icon || UserCheck}
        gradient={module?.color || "from-teal-500 to-cyan-500"}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Candidate
          </CardTitle>
          <CardDescription>Choose a candidate to manage their references</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
            <SelectTrigger data-testid="select-candidate">
              <SelectValue placeholder="Select a candidate..." />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name} - {candidate.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCandidateId && (
        <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Add references manually or generate a link for {selectedCandidate?.name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-reference">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Reference
                        </Button>
                      </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Reference Contact</DialogTitle>
                      <DialogDescription>
                        Enter the details for a reference you want to contact.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="ref-name">Name</Label>
                        <Input
                          id="ref-name"
                          data-testid="input-ref-name"
                          value={newRefName}
                          onChange={(e) => setNewRefName(e.target.value)}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-email">Email</Label>
                        <Input
                          id="ref-email"
                          data-testid="input-ref-email"
                          type="email"
                          value={newRefEmail}
                          onChange={(e) => setNewRefEmail(e.target.value)}
                          placeholder="john@company.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-relationship">Relationship (optional)</Label>
                        <Input
                          id="ref-relationship"
                          data-testid="input-ref-relationship"
                          value={newRefRelationship}
                          onChange={(e) => setNewRefRelationship(e.target.value)}
                          placeholder="Former Manager"
                        />
                      </div>
                      <Button
                        data-testid="button-save-reference"
                        onClick={() => {
                          if (newRefName && newRefEmail) {
                            createReferenceMutation.mutate({
                              name: newRefName,
                              email: newRefEmail,
                              relationship: newRefRelationship || undefined,
                            });
                          }
                        }}
                        disabled={!newRefName || !newRefEmail || createReferenceMutation.isPending}
                        className="w-full"
                      >
                        {createReferenceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save Reference
                      </Button>
                    </div>
                  </DialogContent>
                    </Dialog>
                    <Button
                      data-testid="button-generate-link"
                      variant="outline"
                      onClick={() => createLinkMutation.mutate()}
                      disabled={createLinkMutation.isPending}
                    >
                      {createLinkMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Link className="h-4 w-4 mr-2" />
                      )}
                      Generate Link
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {activeLinkEmail && (
              <Card className="border-primary/50 bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Template - Customize & Send
                  </CardTitle>
                  <CardDescription>
                    Edit the template below and send to your reference contacts. Minimum 2 references required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email-to" className="text-sm">
                      To (Email Addresses)
                    </Label>
                    <Input
                      id="email-to"
                      data-testid="input-email-to"
                      placeholder="reference1@example.com, reference2@example.com"
                      value={activeLinkEmail.to}
                      onChange={(e) =>
                        setActiveLinkEmail({ ...activeLinkEmail, to: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-subject" className="text-sm">
                      Subject
                    </Label>
                    <Input
                      id="email-subject"
                      data-testid="input-email-subject"
                      value={activeLinkEmail.subject}
                      onChange={(e) =>
                        setActiveLinkEmail({ ...activeLinkEmail, subject: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-body" className="text-sm">
                      Message Body
                    </Label>
                    <Textarea
                      id="email-body"
                      data-testid="textarea-email-body"
                      value={activeLinkEmail.body}
                      onChange={(e) =>
                        setActiveLinkEmail({ ...activeLinkEmail, body: e.target.value })
                      }
                      className="mt-1 min-h-40 font-mono text-xs"
                    />
                  </div>

                  <div className="bg-muted p-3 rounded-md border">
                    <p className="text-xs font-medium mb-2">Reference Link (included in body):</p>
                    <code className="text-xs break-all text-muted-foreground">
                      {activeLinkEmail.link}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(activeLinkEmail.link);
                        toast({ title: "Copied!", description: "Reference link copied to clipboard." });
                      }}
                      className="mt-2"
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleCopyLinkEmail}
                      data-testid="button-copy-template"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Email Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenLinkEmail}
                      disabled={!activeLinkEmail.to}
                      data-testid="button-open-email-client"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Email Client
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveLinkEmail(null)}
                      data-testid="button-dismiss-template"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {referenceLinks.length > 0 && !activeLinkEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Generated Links</CardTitle>
                  <CardDescription>Links available for {selectedCandidate?.name} to submit references</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {referenceLinks.map((link) => (
                    <div
                      key={link.id}
                      data-testid={`link-card-${link.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Created {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `${window.location.origin}/reference-link/${link.token}`;
                            navigator.clipboard.writeText(url);
                            toast({ title: "Copied!", description: "Link copied to clipboard." });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.open(`/reference-link/${link.token}`, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All References</CardTitle>
                <CardDescription>References for {selectedCandidate?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRefs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : references.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No references yet.</p>
                    <p className="text-sm">Add references manually or generate a link for the candidate to submit them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {references.map((ref) => (
                      <div
                        key={ref.id}
                        data-testid={`reference-card-${ref.id}`}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{ref.name}</div>
                          <div className="text-sm text-muted-foreground">{ref.email}</div>
                          {ref.relationship && (
                            <div className="text-sm text-muted-foreground">{ref.relationship}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {ref.source === "candidate_link" ? "From Candidate" : "Manual"}
                          </Badge>
                          <Badge
                            variant={ref.status === "email_sent" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {ref.status === "email_sent" ? "Contacted" : "Pending"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-email-${ref.id}`}
                            disabled={generateEmailMutation.isPending}
                            onClick={() => generateEmailMutation.mutate({ refId: ref.id, refEmail: ref.email })}
                          >
                            {generateEmailMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-1" />
                            )}
                            Generate Email
                          </Button>
                          {ref.emailSentAt && (
                            <span className="text-xs text-muted-foreground">
                              Sent {format(new Date(ref.emailSentAt), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {activeEmail && (
                      <Card className="mt-4 border-primary/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Generated Email
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm">
                            <span className="font-medium">To:</span> {activeEmail.to}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Subject:</span> {activeEmail.subject}
                          </div>
                          <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                            {activeEmail.body}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleCopyEmail}
                              data-testid="button-copy-email"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={activeEmail.mailto} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open in Email Client
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveEmail(null)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
