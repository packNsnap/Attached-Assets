import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Zap, Crown, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

interface UsageSummary {
  plan: "starter" | "eco" | "pro" | "enterprise";
  jobs: { current: number; limit: number };
  candidates: { current: number; limit: number };
  periodEnd: string;
}

const planLabels = {
  starter: { label: "Starter", color: "bg-slate-500" },
  eco: { label: "Eco", color: "bg-green-500" },
  pro: { label: "Pro", color: "bg-purple-500" },
  enterprise: { label: "Enterprise", color: "bg-orange-500" },
};

export function UsageDisplay() {
  const { data: usage, isLoading } = useQuery<UsageSummary>({
    queryKey: ["/api/usage"],
  });

  if (isLoading || !usage) {
    return (
      <div className="p-3 rounded-xl bg-background/50 border space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-2 bg-muted rounded" />
        <div className="h-2 bg-muted rounded" />
      </div>
    );
  }

  const planInfo = planLabels[usage.plan];
  const jobsPercent = usage.jobs.limit === -1 ? 0 : (usage.jobs.current / usage.jobs.limit) * 100;
  const candidatesPercent = usage.candidates.limit === -1 ? 0 : (usage.candidates.current / usage.candidates.limit) * 100;

  const formatLimit = (current: number, limit: number) => {
    if (limit === -1) return `${current} / ∞`;
    return `${current} / ${limit}`;
  };

  const periodEnd = new Date(usage.periodEnd);
  const daysLeft = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-3" data-testid="usage-display">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${planInfo.color} text-white text-xs`}>
            <Crown className="h-3 w-3 mr-1" />
            {planInfo.label}
          </Badge>
        </div>
        {usage.plan !== "enterprise" && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
            <Link href="/pricing">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span>Jobs</span>
          </div>
          <span className="font-medium">{formatLimit(usage.jobs.current, usage.jobs.limit)}</span>
        </div>
        {usage.jobs.limit !== -1 && (
          <Progress 
            value={jobsPercent} 
            className="h-1.5" 
            data-testid="progress-jobs"
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Candidates</span>
          </div>
          <span className="font-medium">{formatLimit(usage.candidates.current, usage.candidates.limit)}</span>
        </div>
        {usage.candidates.limit !== -1 && (
          <Progress 
            value={candidatesPercent} 
            className="h-1.5"
            data-testid="progress-candidates"
          />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {daysLeft > 0 ? `Resets in ${daysLeft} days` : "Resets today"}
      </p>
    </div>
  );
}
