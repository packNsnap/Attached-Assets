import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search,
  Mail,
  Calendar,
  Briefcase,
  X,
  ChevronRight,
  Phone,
  MapPin,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Candidate, Job } from "@shared/schema";

type JobWithCandidates = Job & { candidateCount: number };
type Stage = "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Rejected";

const STAGES: Stage[] = ["Applied", "Screened", "Interview", "Offer", "Hired", "Rejected"];

export default function CandidatesModule() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-with-candidates"],
    queryFn: async () => {
      const res = await fetch("/api/jobs-with-candidates");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json() as Promise<JobWithCandidates[]>;
    }
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return res.json() as Promise<Candidate[]>;
    }
  });

  useEffect(() => {
    if (candidates.length > 0 && searchString) {
      const params = new URLSearchParams(searchString);
      const candidateId = params.get("id");
      if (candidateId) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
          setSelectedCandidate(candidate);
        }
      }
    }
  }, [candidates, searchString]);

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/candidates/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      if (selectedCandidate) {
        setSelectedCandidate(data);
      }
      toast({
        title: "Stage Updated",
        description: `Candidate moved to ${data.stage}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update candidate stage",
        variant: "destructive",
      });
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string | null }) => {
      const res = await fetch(`/api/candidates/${id}/job`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      if (!res.ok) throw new Error("Failed to update job");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      if (selectedCandidate) {
        setSelectedCandidate(data);
      }
      toast({
        title: "Position Updated",
        description: data.jobId ? "Candidate assigned to position" : "Candidate unassigned",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update candidate position",
        variant: "destructive",
      });
    }
  });

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = searchQuery === "" || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    
    const matchesJob = jobFilter === "all" || 
      (jobFilter === "unassigned" ? !c.jobId : c.jobId === jobFilter);
    
    return matchesSearch && matchesStage && matchesJob;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Applied": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Screened": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Interview": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Offer": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "Hired": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100";
    }
  };

  const getStageProgress = (stage: string) => {
    const index = STAGES.indexOf(stage as Stage);
    if (stage === "Rejected") return 0;
    if (stage === "Hired") return 100;
    return Math.round((index / (STAGES.length - 2)) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-muted-foreground">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="shrink-0 mb-6">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Candidates</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all candidates in your hiring process.
        </p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-2 mb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search candidates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-candidates"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-stage-filter">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-job-filter">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No candidates found matching your filters.
                </div>
              ) : (
                filteredCandidates.map((candidate) => {
                  const job = jobs.find(j => j.id === candidate.jobId);
                  const isSelected = selectedCandidate?.id === candidate.id;
                  return (
                    <Card 
                      key={candidate.id} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedCandidate(candidate)}
                      data-testid={`card-candidate-${candidate.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-semibold" data-testid={`text-candidate-name-${candidate.id}`}>
                                {candidate.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{candidate.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn("rounded-full", getStageColor(candidate.stage))} data-testid={`badge-stage-${candidate.id}`}>
                              {candidate.stage}
                            </Badge>
                            {job && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Briefcase className="h-3 w-3" />
                                {job.title}
                              </div>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {selectedCandidate ? (
          <Card className="w-[400px] shrink-0 flex flex-col">
            <CardHeader className="shrink-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle data-testid="text-profile-name">{selectedCandidate.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.role}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedCandidate(null)}
                  data-testid="button-close-profile"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1">
              <div className="px-6 pb-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Pipeline Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{selectedCandidate.stage}</span>
                      <span className="text-muted-foreground">{getStageProgress(selectedCandidate.stage)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          selectedCandidate.stage === "Rejected" ? "bg-red-500" : "bg-primary"
                        )}
                        style={{ width: `${getStageProgress(selectedCandidate.stage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Update Stage</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGES.map(stage => (
                      <Button
                        key={stage}
                        variant={selectedCandidate.stage === stage ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          if (selectedCandidate.stage !== stage) {
                            updateStageMutation.mutate({ id: selectedCandidate.id, stage });
                          }
                        }}
                        disabled={updateStageMutation.isPending}
                        data-testid={`button-stage-${stage.toLowerCase()}`}
                      >
                        <div className={cn("w-2 h-2 rounded-full mr-2", getStageColor(stage).split(' ')[0])} />
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Assigned Position</h4>
                  <Select 
                    value={selectedCandidate.jobId || "none"} 
                    onValueChange={(value) => {
                      updateJobMutation.mutate({ 
                        id: selectedCandidate.id, 
                        jobId: value === "none" ? null : value 
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-assign-job">
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No position assigned</SelectItem>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-profile-email">{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Applied: {selectedCandidate.appliedDate}</span>
                    </div>
                  </div>
                </div>

                {selectedCandidate.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.tags.map(tag => (
                          <Badge key={tag} variant="secondary" data-testid={`tag-${tag.toLowerCase()}`}>
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="pt-2">
                  <Button className="w-full" variant="outline" data-testid="button-email-candidate">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Candidate
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </Card>
        ) : (
          <Card className="w-[400px] shrink-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8" />
              </div>
              <p className="font-medium">Select a candidate</p>
              <p className="text-sm mt-1">Click on a candidate to view their profile</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
