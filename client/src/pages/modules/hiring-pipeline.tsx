import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Mail, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  GripVertical,
  Briefcase,
  Filter,
  UserCircle,
  FileText,
  ClipboardCheck,
  Users
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import type { Candidate, Job, ResumeAnalysis, SkillsTestRecommendation, InterviewRecommendation, SkillsTestInvitation } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type JobWithCandidates = Job & { candidateCount: number };

type CandidateAssessments = {
  resumeAnalysis: ResumeAnalysis[];
  skillsTests: SkillsTestRecommendation[];
  skillsTestInvitations: SkillsTestInvitation[];
  interviews: InterviewRecommendation[];
};

type Stage = "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Rejected";

const STAGES: Stage[] = ["Applied", "Screened", "Interview", "Offer", "Hired", "Rejected"];

export default function HiringPipelineModule() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-with-candidates"],
    queryFn: async () => {
      const res = await fetch("/api/jobs-with-candidates");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json() as Promise<JobWithCandidates[]>;
    },
    refetchInterval: 5000,
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return res.json() as Promise<Candidate[]>;
    },
    refetchInterval: 5000,
  });

  const { data: unreadNotesData = [] } = useQuery({
    queryKey: ["candidates-unread-notes"],
    queryFn: async () => {
      const res = await fetch("/api/candidates/unread-notes");
      if (!res.ok) throw new Error("Failed to fetch unread notes");
      return res.json() as Promise<{ candidateId: string; unreadCount: number }[]>;
    },
    refetchInterval: 5000,
  });

  const unreadNotesMap = unreadNotesData.reduce((acc, item) => {
    acc[item.candidateId] = item.unreadCount;
    return acc;
  }, {} as Record<string, number>);

  const [assessmentsMap, setAssessmentsMap] = useState<Record<string, CandidateAssessments>>({});

  const fetchAssessments = async (candidateId: string) => {
    if (assessmentsMap[candidateId]) return;
    try {
      const res = await fetch(`/api/candidates/${candidateId}/assessments`);
      if (res.ok) {
        const data = await res.json() as CandidateAssessments;
        setAssessmentsMap(prev => ({ ...prev, [candidateId]: data }));
      }
    } catch (e) {
      console.error("Failed to fetch assessments", e);
    }
  };

  // Fetch assessments when candidates change
  useEffect(() => {
    candidates.forEach(c => fetchAssessments(c.id));
  }, [candidates]);

  const filteredCandidates = selectedJobId === "all" 
    ? candidates 
    : selectedJobId === "unassigned"
    ? candidates.filter(c => !c.jobId)
    : candidates.filter(c => c.jobId === selectedJobId);
  
  const unassignedCount = candidates.filter(c => !c.jobId).length;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    }
  });

  const moveCandidate = (id: string, newStage: Stage) => {
    updateStageMutation.mutate(
      { id, stage: newStage },
      {
        onSuccess: () => {
          toast({
            title: "Stage Updated",
            description: `Moved candidate to ${newStage}`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update candidate stage",
            variant: "destructive",
          });
        }
      }
    );
  };

  const getStageColor = (stage: Stage) => {
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

  const handleSendEmail = () => {
    setEmailOpen(false);
    toast({
      title: "Email Sent",
      description: `Update sent to ${selectedCandidate?.email}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-muted-foreground">Loading candidates...</div>
      </div>
    );
  }

  const module = getModuleByPath("/hiring");

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <PageHeader
          title="Hiring Pipeline"
          description="Manage candidates through the hiring process."
          icon={module.icon}
          gradient={module.color}
        >
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-[200px]" data-testid="select-job-filter">
                  <SelectValue placeholder="Filter by position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions ({candidates.length})</SelectItem>
                  <SelectItem value="unassigned" data-testid="option-job-unassigned">Unassigned ({unassignedCount})</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id} data-testid={`option-job-${job.id}`}>
                      {job.title} ({job.candidateCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" data-testid="button-search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button data-testid="button-add-candidate">
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-4 min-w-[1200px]">
          {STAGES.map((stage) => (
            <div key={stage} className="flex-1 min-w-[280px] flex flex-col rounded-lg bg-muted/40 border">
              <div className="p-3 border-b bg-muted/40 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("rounded-full px-2 font-semibold", getStageColor(stage))} data-testid={`badge-count-${stage.toLowerCase()}`}>
                    {filteredCandidates.filter(c => c.stage === stage).length}
                  </Badge>
                  <span className="font-medium text-sm">{stage}</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {filteredCandidates.filter(c => c.stage === stage).map((candidate) => {
                    const job = jobs.find(j => j.id === candidate.jobId);
                    return (
                    <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-shadow group relative bg-card" data-testid={`card-candidate-${candidate.id}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-sm" data-testid={`text-candidate-name-${candidate.id}`}>{candidate.name}</h3>
                            <p className="text-xs text-muted-foreground" data-testid={`text-candidate-role-${candidate.id}`}>{candidate.role}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-menu-${candidate.id}`}>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Move to</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {STAGES.filter(s => s !== stage).map(s => (
                                <DropdownMenuItem key={s} onClick={() => moveCandidate(candidate.id, s)} data-testid={`menu-item-move-${s.toLowerCase()}`}>
                                  {s}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedCandidate(candidate);
                                setEmailOpen(true);
                              }} data-testid={`menu-item-email-${candidate.id}`}>
                                <Mail className="mr-2 h-3 w-3" />
                                Email Candidate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigate(`/candidates?id=${candidate.id}`);
                              }} data-testid={`menu-item-profile-${candidate.id}`}>
                                <UserCircle className="mr-2 h-3 w-3" />
                                View Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20" data-testid={`tag-${tag.toLowerCase()}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {unreadNotesMap[candidate.id] > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/candidates?id=${candidate.id}`);
                                  }}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                  data-testid={`badge-unread-notes-${candidate.id}`}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {unreadNotesMap[candidate.id]} new
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{unreadNotesMap[candidate.id]} unread note{unreadNotesMap[candidate.id] > 1 ? 's' : ''}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {/* Assessment Scores */}
                        {assessmentsMap[candidate.id] && (
                          <TooltipProvider>
                            <div className="flex gap-2 flex-wrap">
                              {assessmentsMap[candidate.id].resumeAnalysis.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/resume-analyzer");
                                      }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                      data-testid={`link-resume-score-${candidate.id}`}
                                    >
                                      <FileText className="h-3 w-3" />
                                      {assessmentsMap[candidate.id].resumeAnalysis[0].fitScore}%
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resume Score: {assessmentsMap[candidate.id].resumeAnalysis[0].fitScore}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {(() => {
                                const completedInvitations = assessmentsMap[candidate.id].skillsTestInvitations?.filter(inv => inv.status === "completed" && inv.score !== null) || [];
                                if (completedInvitations.length > 0) {
                                  const latestScore = completedInvitations[0].score;
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate("/skills-test");
                                          }}
                                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                          data-testid={`link-skills-score-${candidate.id}`}
                                        >
                                          <ClipboardCheck className="h-3 w-3" />
                                          {latestScore}%
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Skills Test Score: {latestScore}%</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                } else if (assessmentsMap[candidate.id].skillsTests.length > 0) {
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate("/skills-test");
                                          }}
                                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                          data-testid={`link-skills-pending-${candidate.id}`}
                                        >
                                          <ClipboardCheck className="h-3 w-3" />
                                          Pending
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Skills Test: Pending ({assessmentsMap[candidate.id].skillsTests[0].fitScore}% fit)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                }
                                return null;
                              })()}
                              {assessmentsMap[candidate.id].interviews.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/interviews");
                                      }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                      data-testid={`link-interview-score-${candidate.id}`}
                                    >
                                      <Users className="h-3 w-3" />
                                      {assessmentsMap[candidate.id].interviews[0].testScore}%
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Interview Score: {assessmentsMap[candidate.id].interviews[0].testScore}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        )}
                        
                        {job && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            <Briefcase className="h-3 w-3" />
                            {job.title}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {candidate.appliedDate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Candidate</DialogTitle>
            <DialogDescription>
              Send an update to {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input defaultValue={`Update on your application for ${selectedCandidate?.role}`} data-testid="input-email-subject" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                className="min-h-[150px]"
                defaultValue={`Hi ${selectedCandidate?.name},\n\nThank you for your interest in the ${selectedCandidate?.role} position. We have reviewed your application and...`}
                data-testid="input-email-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} data-testid="button-cancel-email">Cancel</Button>
            <Button onClick={handleSendEmail} data-testid="button-send-email">
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
