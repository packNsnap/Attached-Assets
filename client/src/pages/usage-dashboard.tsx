import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Briefcase, 
  Users, 
  FileSearch, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  BookOpen,
  Upload,
  ArrowRight,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface UsageCategory {
  current: number;
  limit: number;
}

interface UsageSummary {
  plan: string;
  jobs: UsageCategory;
  candidates: UsageCategory;
  baselineAnalyses: UsageCategory;
  jobDescriptions: UsageCategory;
  skillsTests: UsageCategory;
  interviewSets: UsageCategory;
  policies: UsageCategory;
  bulkUpload: boolean;
  periodEnd: string;
}

const planDisplayNames: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise"
};

const planColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  starter: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  growth: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
};

function UsageCard({ 
  icon: Icon, 
  title, 
  current, 
  limit, 
  description 
}: { 
  icon: React.ElementType;
  title: string;
  current: number;
  limit: number;
  description: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;
  
  return (
    <Card data-testid={`usage-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              Near Limit
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold" data-testid={`usage-current-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {current}
            </span>
            <span className="text-sm text-muted-foreground" data-testid={`usage-limit-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              / {isUnlimited ? "Unlimited" : limit}
            </span>
          </div>
          {!isUnlimited && (
            <Progress 
              value={percentage} 
              className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsageDashboard() {
  const { data: usage, isLoading, error } = useQuery<UsageSummary>({
    queryKey: ["/api/usage"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load usage data</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const periodEndDate = new Date(usage.periodEnd);

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="usage-dashboard-title">
            Usage Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your monthly usage across all features
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Badge className={`text-sm px-3 py-1 ${planColors[usage.plan] || planColors.free}`} data-testid="current-plan-badge">
            {planDisplayNames[usage.plan] || "Free"} Plan
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span data-testid="period-reset-date">
              Resets {format(periodEndDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UsageCard
          icon={Briefcase}
          title="Active Jobs"
          current={usage.jobs.current}
          limit={usage.jobs.limit}
          description="Open job positions"
        />
        <UsageCard
          icon={Users}
          title="Candidates"
          current={usage.candidates.current}
          limit={usage.candidates.limit}
          description="Candidates added this month"
        />
        <UsageCard
          icon={FileSearch}
          title="Resume Analyses"
          current={usage.baselineAnalyses.current}
          limit={usage.baselineAnalyses.limit}
          description="AI resume analysis runs"
        />
        <UsageCard
          icon={FileText}
          title="Job Descriptions"
          current={usage.jobDescriptions.current}
          limit={usage.jobDescriptions.limit}
          description="AI-generated job descriptions"
        />
        <UsageCard
          icon={ClipboardCheck}
          title="Skills Tests"
          current={usage.skillsTests.current}
          limit={usage.skillsTests.limit}
          description="AI skills test created"
        />
        <UsageCard
          icon={MessageSquare}
          title="Interview Sets"
          current={usage.interviewSets.current}
          limit={usage.interviewSets.limit}
          description="Interview question sets generated"
        />
        <UsageCard
          icon={BookOpen}
          title="HR Policies"
          current={usage.policies.current}
          limit={usage.policies.limit}
          description="AI-generated HR policies"
        />
      </div>

      {usage.bulkUpload && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium">Bulk Upload Enabled</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your plan includes bulk resume upload. Upload multiple resumes at once to streamline your hiring process.
            </p>
          </CardContent>
        </Card>
      )}

      {!usage.bulkUpload && (
        <Card className="border-dashed bg-muted/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Bulk Upload</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bulk resume upload is available on Growth and Enterprise plans.
            </p>
          </CardContent>
        </Card>
      )}

      {usage.plan === "free" && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-lg">Need more capacity?</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade your plan to unlock higher limits and advanced features like bulk upload.
                </p>
              </div>
              <Button asChild data-testid="upgrade-plan-button">
                <Link href="/pricing">
                  View Plans <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(usage.plan === "starter" || usage.plan === "growth") && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-lg">Need more capacity?</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to {usage.plan === "starter" ? "Growth" : "Enterprise"} for higher limits and additional features.
                </p>
              </div>
              <Button asChild variant="outline" data-testid="upgrade-plan-button">
                <Link href="/pricing">
                  Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
