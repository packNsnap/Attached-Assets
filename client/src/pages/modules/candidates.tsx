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
  Tag,
  Plus,
  FileText,
  Linkedin,
  Globe,
  Trash2,
  ExternalLink,
  User,
  StickyNote,
  FolderOpen,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate, Job, CandidateNote, CandidateDocument, ResumeAnalysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

type JobWithCandidates = Job & { candidateCount: number };
type Stage = "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Rejected";

const STAGES: Stage[] = ["Applied", "Screened", "Interview", "Offer", "Hired", "Rejected"];
const NOTE_TYPES = ["general", "interview", "feedback", "screening", "reference"];
const DOCUMENT_TYPES = ["resume", "cover_letter", "portfolio", "certificate", "other"];
const SOURCE_OPTIONS = ["LinkedIn", "Indeed", "Referral", "Company Website", "Job Fair", "Other"];

export default function CandidatesModule() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "",
    source: "",
    linkedinUrl: "",
    portfolioUrl: "",
    tags: "",
    appliedDate: new Date().toISOString().split('T')[0]
  });

  const [newNote, setNewNote] = useState({ content: "", authorName: "", noteType: "general" });
  const [newDocument, setNewDocument] = useState({ fileName: "", fileUrl: "", fileType: "", documentType: "resume" });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

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

  const { data: notes = [] } = useQuery({
    queryKey: ["candidate-notes", selectedCandidate?.id],
    queryFn: async () => {
      if (!selectedCandidate) return [];
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json() as Promise<CandidateNote[]>;
    },
    enabled: !!selectedCandidate
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["candidate-documents", selectedCandidate?.id],
    queryFn: async () => {
      if (!selectedCandidate) return [];
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json() as Promise<CandidateDocument[]>;
    },
    enabled: !!selectedCandidate
  });

  const { data: resumeAnalyses = [], isLoading: analysisLoading } = useQuery({
    queryKey: ["resume-analysis", selectedCandidate?.id],
    queryFn: async () => {
      if (!selectedCandidate) return [];
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/assessments`);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      const data = await res.json();
      return (data.resumeAnalysis || []) as ResumeAnalysis[];
    },
    enabled: !!selectedCandidate
  });

  const [isRerunningAnalysis, setIsRerunningAnalysis] = useState(false);

  const rerunAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCandidate) throw new Error("No candidate selected");
      const resumeDoc = documents.find(d => d.documentType === "Resume" && d.resumeText);
      if (!resumeDoc?.resumeText) throw new Error("No resume text found");
      
      const assignedJob = jobs.find(j => j.id === selectedCandidate.jobId);
      
      setIsRerunningAnalysis(true);
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeDoc.resumeText,
          jobDescription: assignedJob?.description || "",
          jobSkills: assignedJob?.skills || [],
          jobTitle: assignedJob?.title || selectedCandidate.role,
          jobLevel: assignedJob?.level || "",
          candidateId: selectedCandidate.id,
          jobId: assignedJob?.id
        })
      });
      if (!res.ok) throw new Error("Failed to analyze resume");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-analysis", selectedCandidate?.id] });
      toast({ title: "Analysis Complete", description: "Resume has been re-analyzed." });
      setIsRerunningAnalysis(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to analyze resume", variant: "destructive" });
      setIsRerunningAnalysis(false);
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

  const createCandidateMutation = useMutation({
    mutationFn: async (data: typeof newCandidate) => {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          stage: "Applied"
        })
      });
      if (!res.ok) throw new Error("Failed to create candidate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-with-candidates"] });
      setAddDialogOpen(false);
      setNewCandidate({
        name: "", email: "", phone: "", location: "", role: "", source: "",
        linkedinUrl: "", portfolioUrl: "", tags: "",
        appliedDate: new Date().toISOString().split('T')[0]
      });
      toast({ title: "Candidate Added", description: "New candidate has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add candidate", variant: "destructive" });
    }
  });

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
      if (selectedCandidate) setSelectedCandidate(data);
      toast({ title: "Stage Updated", description: `Candidate moved to ${data.stage}` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update candidate stage", variant: "destructive" });
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
      if (selectedCandidate) setSelectedCandidate(data);
      toast({ title: "Position Updated", description: data.jobId ? "Candidate assigned to position" : "Candidate unassigned" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update candidate position", variant: "destructive" });
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: typeof newNote) => {
      if (!selectedCandidate) throw new Error("No candidate selected");
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-notes", selectedCandidate?.id] });
      setNewNote({ content: "", authorName: "", noteType: "general" });
      toast({ title: "Note Added", description: "Note has been added to candidate profile." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!selectedCandidate) throw new Error("No candidate selected");
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-notes", selectedCandidate?.id] });
      toast({ title: "Note Deleted", description: "Note has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof newDocument) => {
      if (!selectedCandidate) throw new Error("No candidate selected");
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to add document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-documents", selectedCandidate?.id] });
      setNewDocument({ fileName: "", fileUrl: "", fileType: "", documentType: "resume" });
      toast({ title: "Document Added", description: "Document has been linked to candidate profile." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add document", variant: "destructive" });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!selectedCandidate) throw new Error("No candidate selected");
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-documents", selectedCandidate?.id] });
      toast({ title: "Document Deleted", description: "Document has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async ({ file, candidateId }: { file: File; candidateId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateId", candidateId);
      
      const res = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload resume");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-documents", selectedCandidate?.id] });
      if (selectedCandidate) setSelectedCandidate(data.candidate);
      setResumeFile(null);
      setIsUploadingResume(false);
      toast({ title: "Resume Uploaded", description: "Resume is now available for analysis." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload resume", variant: "destructive" });
      setIsUploadingResume(false);
    }
  });

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = searchQuery === "" || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    const matchesJob = jobFilter === "all" || (jobFilter === "unassigned" ? !c.jobId : c.jobId === jobFilter);
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

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "interview": return "bg-purple-100 text-purple-700";
      case "feedback": return "bg-blue-100 text-blue-700";
      case "screening": return "bg-amber-100 text-amber-700";
      case "reference": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
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
      <div className="shrink-0 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Candidates</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all candidates in your hiring process.
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-candidate">
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    value={newCandidate.name} 
                    onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))}
                    data-testid="input-candidate-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newCandidate.email} 
                    onChange={e => setNewCandidate(p => ({ ...p, email: e.target.value }))}
                    data-testid="input-candidate-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={newCandidate.phone} 
                    onChange={e => setNewCandidate(p => ({ ...p, phone: e.target.value }))}
                    data-testid="input-candidate-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={newCandidate.location} 
                    onChange={e => setNewCandidate(p => ({ ...p, location: e.target.value }))}
                    data-testid="input-candidate-location"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Position Applied *</Label>
                  <Input 
                    id="role" 
                    value={newCandidate.role} 
                    onChange={e => setNewCandidate(p => ({ ...p, role: e.target.value }))}
                    data-testid="input-candidate-role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select 
                    value={newCandidate.source} 
                    onValueChange={v => setNewCandidate(p => ({ ...p, source: v }))}
                  >
                    <SelectTrigger data-testid="select-candidate-source">
                      <SelectValue placeholder="How did they apply?" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input 
                    id="linkedin" 
                    value={newCandidate.linkedinUrl} 
                    onChange={e => setNewCandidate(p => ({ ...p, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    data-testid="input-candidate-linkedin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio URL</Label>
                  <Input 
                    id="portfolio" 
                    value={newCandidate.portfolioUrl} 
                    onChange={e => setNewCandidate(p => ({ ...p, portfolioUrl: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-candidate-portfolio"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input 
                  id="tags" 
                  value={newCandidate.tags} 
                  onChange={e => setNewCandidate(p => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. Senior, Remote, Urgent"
                  data-testid="input-candidate-tags"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appliedDate">Applied Date</Label>
                <Input 
                  id="appliedDate" 
                  type="date"
                  value={newCandidate.appliedDate} 
                  onChange={e => setNewCandidate(p => ({ ...p, appliedDate: e.target.value }))}
                  data-testid="input-candidate-applied-date"
                />
              </div>
              <Button 
                onClick={() => createCandidateMutation.mutate(newCandidate)}
                disabled={!newCandidate.name || !newCandidate.email || !newCandidate.role || createCandidateMutation.isPending}
                data-testid="button-submit-candidate"
              >
                {createCandidateMutation.isPending ? "Adding..." : "Add Candidate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  {candidates.length === 0 ? "No candidates yet. Click 'Add Candidate' to get started." : "No candidates found matching your filters."}
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
                      onClick={() => { setSelectedCandidate(candidate); setActiveTab("profile"); }}
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
          <Card className="w-[450px] shrink-0 flex flex-col">
            <CardHeader className="shrink-0 pb-2">
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
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-6 grid grid-cols-4">
                <TabsTrigger value="profile" data-testid="tab-profile">
                  <User className="h-4 w-4 mr-1" /> Profile
                </TabsTrigger>
                <TabsTrigger value="analysis" data-testid="tab-analysis">
                  <BarChart3 className="h-4 w-4 mr-1" /> Analysis
                </TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">
                  <StickyNote className="h-4 w-4 mr-1" /> Notes
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  <FolderOpen className="h-4 w-4 mr-1" /> Docs
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="profile" className="px-6 pb-6 space-y-5 mt-4">
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
                    <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="text-profile-email">{selectedCandidate.email}</span>
                      </div>
                      {selectedCandidate.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedCandidate.phone}</span>
                        </div>
                      )}
                      {selectedCandidate.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedCandidate.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Applied: {selectedCandidate.appliedDate}</span>
                      </div>
                      {selectedCandidate.source && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>Source: {selectedCandidate.source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.resumeUrl && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Resume</h4>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-1" /> View Uploaded Resume
                          </a>
                        </Button>
                      </div>
                    </>
                  )}

                  {(selectedCandidate.linkedinUrl || selectedCandidate.portfolioUrl) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Links</h4>
                        <div className="flex gap-2">
                          {selectedCandidate.linkedinUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4 mr-1" /> LinkedIn
                              </a>
                            </Button>
                          )}
                          {selectedCandidate.portfolioUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4 mr-1" /> Portfolio
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

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
                </TabsContent>

                <TabsContent value="analysis" className="px-6 pb-6 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">Resume Analysis</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rerunAnalysisMutation.mutate()}
                      disabled={isRerunningAnalysis || !documents.some(d => d.documentType === "Resume" && d.resumeText)}
                      data-testid="button-rerun-analysis"
                    >
                      {isRerunningAnalysis ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" /> Run Analysis
                        </>
                      )}
                    </Button>
                  </div>

                  {analysisLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : resumeAnalyses.length === 0 ? (
                    <Card className="p-6">
                      <div className="text-center space-y-2">
                        <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No resume analysis yet.</p>
                        <p className="text-xs text-muted-foreground">
                          {documents.some(d => d.documentType === "Resume" && d.resumeText) 
                            ? "Click 'Run Analysis' to analyze the candidate's resume."
                            : "Upload a resume first to run analysis."
                          }
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {resumeAnalyses.map((analysis, index) => {
                        const findings = (() => {
                          try {
                            return JSON.parse(analysis.findings) as { type: string; message: string; details: string }[];
                          } catch {
                            return [];
                          }
                        })();
                        
                        return (
                          <Card key={analysis.id} className="p-4 space-y-4">
                            {index === 0 && (
                              <Badge variant="secondary" className="mb-2">Latest Analysis</Badge>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Fit Score</p>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-2xl font-bold",
                                    analysis.fitScore >= 70 ? "text-green-600" : 
                                    analysis.fitScore >= 50 ? "text-yellow-600" : "text-red-600"
                                  )} data-testid="text-fit-score">
                                    {analysis.fitScore}%
                                  </span>
                                </div>
                                <Progress value={analysis.fitScore} className="h-1.5" />
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Logic Risk</p>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-2xl font-bold",
                                    analysis.logicScore < 30 ? "text-green-600" : 
                                    analysis.logicScore < 60 ? "text-yellow-600" : "text-red-600"
                                  )} data-testid="text-logic-score">
                                    {analysis.logicScore}%
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.logicScore < 30 ? "Low Risk" : analysis.logicScore < 60 ? "Medium" : "High Risk"}
                                  </Badge>
                                </div>
                                <Progress value={analysis.logicScore} className="h-1.5" />
                              </div>
                            </div>

                            {analysis.jobTitle && (
                              <div className="text-xs text-muted-foreground">
                                Analyzed for: <span className="font-medium">{analysis.jobTitle}</span>
                              </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Skills Match</p>
                              <div className="flex flex-wrap gap-1">
                                {analysis.matchedSkills.map((skill, i) => (
                                  <Badge key={i} variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                                {analysis.missingSkills.map((skill, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              {analysis.extraSkills.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-xs text-muted-foreground mb-1">Extra skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.extraSkills.map((skill, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {findings.length > 0 && (
                              <>
                                <Separator />
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Key Findings</p>
                                  <div className="space-y-2">
                                    {findings.slice(0, 4).map((finding, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs">
                                        {finding.type === "good" && <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
                                        {finding.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />}
                                        {finding.type === "risk" && <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
                                        <div>
                                          <p className="font-medium">{finding.message}</p>
                                          <p className="text-muted-foreground">{finding.details}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            <Separator />
                            
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Summary</p>
                              <p className="text-sm">{analysis.summary}</p>
                            </div>

                            <div className="text-xs text-muted-foreground text-right">
                              {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="px-6 pb-6 space-y-4 mt-4">
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-medium">Add Note</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Your name"
                          value={newNote.authorName}
                          onChange={e => setNewNote(p => ({ ...p, authorName: e.target.value }))}
                          data-testid="input-note-author"
                        />
                        <Select value={newNote.noteType} onValueChange={v => setNewNote(p => ({ ...p, noteType: v }))}>
                          <SelectTrigger data-testid="select-note-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTE_TYPES.map(t => (
                              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea 
                        placeholder="Write your note here..."
                        value={newNote.content}
                        onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
                        rows={3}
                        data-testid="input-note-content"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => createNoteMutation.mutate(newNote)}
                        disabled={!newNote.content || !newNote.authorName || createNoteMutation.isPending}
                        data-testid="button-add-note"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Note
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No notes yet for this candidate.</p>
                    ) : (
                      notes.map(note => (
                        <Card key={note.id} className="p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{note.authorName}</span>
                                <Badge className={cn("text-xs", getNoteTypeColor(note.noteType))}>
                                  {note.noteType}
                                </Badge>
                              </div>
                              <p className="text-sm">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="px-6 pb-6 space-y-4 mt-4">
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-medium">Upload Resume (PDF or Word Doc)</h4>
                    <div className="space-y-2">
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setResumeFile(e.target.files[0]);
                            }
                          }}
                          accept=".pdf,.doc,.docx"
                          data-testid="input-resume-file"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          {resumeFile ? (
                            <div className="text-sm font-medium text-foreground">{resumeFile.name}</div>
                          ) : (
                            <>
                              <div className="text-sm font-medium">Click to upload or drag and drop</div>
                              <div className="text-xs text-muted-foreground">PDF or DOCX (up to 10MB)</div>
                            </>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (resumeFile) {
                            setIsUploadingResume(true);
                            uploadResumeMutation.mutate({ file: resumeFile, candidateId: selectedCandidate.id });
                          }
                        }}
                        disabled={!resumeFile || uploadResumeMutation.isPending}
                        data-testid="button-upload-resume"
                      >
                        <Plus className="h-4 w-4 mr-1" /> {uploadResumeMutation.isPending ? "Uploading..." : "Upload Resume"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-medium">Add Document Link</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="File name"
                          value={newDocument.fileName}
                          onChange={e => setNewDocument(p => ({ ...p, fileName: e.target.value }))}
                          data-testid="input-doc-name"
                        />
                        <Select value={newDocument.documentType} onValueChange={v => setNewDocument(p => ({ ...p, documentType: v }))}>
                          <SelectTrigger data-testid="select-doc-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(t => (
                              <SelectItem key={t} value={t}>{t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input 
                        placeholder="File URL (e.g., Google Drive, Dropbox link)"
                        value={newDocument.fileUrl}
                        onChange={e => setNewDocument(p => ({ ...p, fileUrl: e.target.value }))}
                        data-testid="input-doc-url"
                      />
                      <Input 
                        placeholder="File type (e.g., pdf, docx)"
                        value={newDocument.fileType}
                        onChange={e => setNewDocument(p => ({ ...p, fileType: e.target.value }))}
                        data-testid="input-doc-filetype"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => createDocumentMutation.mutate(newDocument)}
                        disabled={!newDocument.fileName || !newDocument.fileUrl || !newDocument.fileType || createDocumentMutation.isPending}
                        data-testid="button-add-document"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Document
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No documents yet for this candidate.</p>
                    ) : (
                      documents.map(doc => (
                        <Card key={doc.id} className="p-3">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{doc.fileName}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{doc.documentType}</Badge>
                                  <span className="text-xs text-muted-foreground">{doc.fileType}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                asChild
                              >
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                data-testid={`button-delete-doc-${doc.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </Card>
        ) : (
          <Card className="w-[450px] shrink-0 flex items-center justify-center">
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
