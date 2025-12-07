import { useState } from "react";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Mail, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  GripVertical 
} from "lucide-react";
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

type Stage = "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Rejected";

type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: Stage;
  email: string;
  tags: string[];
  appliedDate: string;
};

const INITIAL_CANDIDATES: Candidate[] = [
  { id: "c1", name: "Sarah Miller", role: "Frontend Engineer", stage: "Applied", email: "sarah.m@example.com", tags: ["React", "Senior"], appliedDate: "2 days ago" },
  { id: "c2", name: "David Chen", role: "Product Designer", stage: "Screened", email: "david.c@example.com", tags: ["Figma", "UX"], appliedDate: "1 week ago" },
  { id: "c3", name: "James Wilson", role: "Backend Engineer", stage: "Interview", email: "j.wilson@example.com", tags: ["Node.js", "Postgres"], appliedDate: "3 days ago" },
  { id: "c4", name: "Emily Davis", role: "Marketing Lead", stage: "Offer", email: "emily.d@example.com", tags: ["Growth", "B2B"], appliedDate: "2 weeks ago" },
  { id: "c5", name: "Michael Brown", role: "Sales Rep", stage: "Rejected", email: "m.brown@example.com", tags: ["Junior"], appliedDate: "1 month ago" },
];

const STAGES: Stage[] = ["Applied", "Screened", "Interview", "Offer", "Hired", "Rejected"];

export default function HiringPipelineModule() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const { toast } = useToast();

  const moveCandidate = (id: string, newStage: Stage) => {
    setCandidates(prev => prev.map(c => 
      c.id === id ? { ...c, stage: newStage } : c
    ));
    toast({
      title: "Stage Updated",
      description: `Moved candidate to ${newStage}`,
    });
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

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hiring Pipeline</h1>
          <p className="text-muted-foreground mt-2">
            Manage candidates through the hiring process.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-4 min-w-[1200px]">
          {STAGES.map((stage) => (
            <div key={stage} className="flex-1 min-w-[280px] flex flex-col rounded-lg bg-muted/40 border">
              <div className="p-3 border-b bg-muted/40 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("rounded-full px-2 font-semibold", getStageColor(stage))}>
                    {candidates.filter(c => c.stage === stage).length}
                  </Badge>
                  <span className="font-medium text-sm">{stage}</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {candidates.filter(c => c.stage === stage).map((candidate) => (
                    <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-shadow group relative bg-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-sm">{candidate.name}</h3>
                            <p className="text-xs text-muted-foreground">{candidate.role}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Move to</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {STAGES.filter(s => s !== stage).map(s => (
                                <DropdownMenuItem key={s} onClick={() => moveCandidate(candidate.id, s)}>
                                  {s}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedCandidate(candidate);
                                setEmailOpen(true);
                              }}>
                                <Mail className="mr-2 h-3 w-3" />
                                Email Candidate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {candidate.appliedDate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
              <Input defaultValue={`Update on your application for ${selectedCandidate?.role}`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                className="min-h-[150px]"
                defaultValue={`Hi ${selectedCandidate?.name},\n\nThank you for your interest in the ${selectedCandidate?.role} position. We have reviewed your application and...`} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
