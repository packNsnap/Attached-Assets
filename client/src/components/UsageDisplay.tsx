import { usePlanFeatures, formatPlanName } from "@/hooks/usePlanFeatures";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, ArrowUpRight, FileSearch, FileText, ClipboardCheck, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export function UsageDisplay() {
  const { plan, usageData, isLoading, getUsage } = usePlanFeatures();

  if (isLoading || !usageData) {
    return (
      <div className="p-3 rounded-xl bg-background/50 border space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-2 bg-muted rounded" />
        <div className="h-2 bg-muted rounded" />
      </div>
    );
  }

  const planColors: Record<string, string> = {
    free: "bg-slate-500",
    basic: "bg-green-500",
    growth: "bg-purple-500",
    pro: "bg-blue-500",
    enterprise: "bg-amber-500",
  };

  const planColor = planColors[plan] || "bg-slate-500";

  const usageItems = [
    { key: "candidates_max" as const, label: "Candidates", icon: FileSearch },
    { key: "job_descriptions_per_month" as const, label: "Job Descriptions", icon: FileText },
    { key: "skills_tests_per_month" as const, label: "Skills Tests", icon: ClipboardCheck },
    { key: "interview_sets_per_month" as const, label: "Interviews", icon: MessageSquare },
  ];

  const formatLimit = (current: number, limit: number) => {
    if (limit === -1) return `${current} / ∞`;
    return `${current} / ${limit}`;
  };

  const periodEnd = usageData?.periodEnd ? new Date(usageData.periodEnd) : new Date();
  const daysLeft = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-3" data-testid="usage-display">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${planColor} text-white text-xs`}>
            <Crown className="h-3 w-3 mr-1" />
            {formatPlanName(plan)}
          </Badge>
        </div>
        {plan !== "enterprise" && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
            <Link href="/pricing">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>

      {usageItems.map(({ key, label, icon: Icon }) => {
        const usage = getUsage(key);
        if (usage.isUnlimited) return null;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </div>
              <span className={`font-medium ${usage.percentUsed >= 90 ? "text-destructive" : ""}`}>
                {formatLimit(usage.current, usage.limit)}
              </span>
            </div>
            <Progress 
              value={usage.percentUsed} 
              className={`h-1.5 ${usage.percentUsed >= 90 ? "[&>div]:bg-destructive" : ""}`}
              data-testid={`progress-${key}`}
            />
          </div>
        );
      })}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{daysLeft > 0 ? `Resets in ${daysLeft} days` : "Resets today"}</span>
        <Link href="/usage" className="text-blue-500 hover:underline" data-testid="link-view-all-usage">
          View all
        </Link>
      </div>
    </div>
  );
}
