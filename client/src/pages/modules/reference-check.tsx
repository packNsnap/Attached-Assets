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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const module = getModuleByPath("/modules/reference-check");

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
      navigator.clipboard.writeText(data.url);
      toast({ title: "Link created and copied!", description: "Share this link with the candidate to collect references." });
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
    mutationFn: async (refId: string) => {
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
      return response.json();
    },
    onSuccess: (data, refId) => {
      if (data.mailto) {
        window.location.href = data.mailto;
        markEmailSentMutation.mutate(refId);
      } else {
        toast({ title: "Error", description: "Failed to generate email link.", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to generate reference email.", variant: "destructive" });
    },
  });

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
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" data-testid="tab-manual-entry">
              <UserCheck className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="candidate-link" data-testid="tab-candidate-link">
              <Link className="h-4 w-4 mr-2" />
              Candidate Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Reference Contacts</CardTitle>
                  <CardDescription>Add and manage references for {selectedCandidate?.name}</CardDescription>
                </div>
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
              </CardHeader>
              <CardContent>
                {isLoadingRefs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : references.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No references added yet.</p>
                    <p className="text-sm">Click "Add Reference" to get started.</p>
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
                          <Badge
                            variant={ref.status === "email_sent" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {ref.status === "email_sent" ? "Contacted" : "Pending"}
                          </Badge>
                          {ref.status === "pending_contact" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-email-${ref.id}`}
                                disabled={generateEmailMutation.isPending}
                                onClick={() => generateEmailMutation.mutate(ref.id)}
                              >
                                {generateEmailMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-1" />
                                )}
                                Email
                              </Button>
                            </>
                          )}
                          {ref.emailSentAt && (
                            <span className="text-xs text-muted-foreground">
                              Sent {format(new Date(ref.emailSentAt), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidate-link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Request References via Link
                </CardTitle>
                <CardDescription>
                  Generate a secure link to send to {selectedCandidate?.name}. They can submit their own references through the link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  data-testid="button-generate-link"
                  onClick={() => createLinkMutation.mutate()}
                  disabled={createLinkMutation.isPending}
                >
                  {createLinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate New Link
                </Button>

                {referenceLinks.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="font-medium text-sm">Generated Links</h4>
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
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>References from Candidate</CardTitle>
                <CardDescription>
                  References submitted by the candidate through the link will appear here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {references.filter(r => r.source === "candidate_link").length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Send className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No references submitted yet.</p>
                    <p className="text-sm">Share the link with the candidate to collect references.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {references.filter(r => r.source === "candidate_link").map((ref) => (
                      <div
                        key={ref.id}
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
                          <Badge variant="outline">From Candidate</Badge>
                          <Badge
                            variant={ref.status === "email_sent" ? "default" : "secondary"}
                          >
                            {ref.status === "email_sent" ? "Contacted" : "Pending"}
                          </Badge>
                          {ref.status === "pending_contact" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={generateEmailMutation.isPending}
                              onClick={() => generateEmailMutation.mutate(ref.id)}
                            >
                              {generateEmailMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4 mr-1" />
                              )}
                              Email
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
