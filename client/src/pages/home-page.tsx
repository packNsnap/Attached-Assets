import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/lib/constants";
import { Link } from "wouter";
import { 
  ArrowRight, Sparkles, Users, Calendar, Gift, Brain, Zap, Clock, 
  Target, Briefcase, TrendingUp, BarChart3, CheckCircle, Loader2,
  ChevronRight, Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type AnalyticsData = {
  kpis: {
    totalEmployees: number;
    openPositions: number;
    avgTimeToHire: number;
    offerAcceptanceRate: number;
  };
  pipelineStages: Array<{ stage: string; count: number }>;
  hiringTrends: Array<{ month: string; applications: number; interviews: number; hires: number }>;
  departmentData: Array<{ name: string; value: number; color: string }>;
};

type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: string;
  appliedDate: string;
  createdAt: string;
};

type Job = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

const stageColors: Record<string, string> = {
  "Applied": "bg-slate-500",
  "Screening": "bg-blue-500",
  "Phone Interview": "bg-purple-500",
  "Technical": "bg-orange-500",
  "Final Round": "bg-green-500",
  "Offer": "bg-emerald-500",
  "Hired": "bg-teal-500",
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/stripe/subscription-status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription-status", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics", { credentials: "include" });
        if (response.ok) {
          const result = await response.json();
          setAnalytics(result);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, []);

  const openRoles = jobs.filter(j => j.status === "open" || j.status === "active").length;
  const activeCandidates = candidates.length;
  const hiredCount = candidates.filter(c => c.stage === "Hired").length;
  const totalPipeline = candidates.filter(c => c.stage !== "Hired" && c.stage !== "Rejected").length;

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const maxPipelineCount = analytics?.pipelineStages 
    ? Math.max(...analytics.pipelineStages.map(s => s.count), 1) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-muted-foreground">Your hiring pipeline at a glance</p>
        </div>
        <Link href="/analytics">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <BarChart3 className="h-3 w-3 mr-1" />
            View Full Analytics
            <ChevronRight className="h-3 w-3 ml-1" />
          </Badge>
        </Link>
      </div>

      {/* Top KPIs - Real Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500 to-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-open-positions">{openRoles}</div>
            <p className="text-xs text-muted-foreground">actively hiring</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-500 to-pink-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-pipeline-count">{totalPipeline}</div>
            <p className="text-xs text-muted-foreground">active candidates</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-green-500 to-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-hired-count">{hiredCount}</div>
            <p className="text-xs text-muted-foreground">total employees</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-orange-500 to-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time to Hire</CardTitle>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-avg-time">
              {isLoadingAnalytics ? "-" : `${analytics?.kpis.avgTimeToHire || 0}`}
            </div>
            <p className="text-xs text-muted-foreground">days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hiring Pipeline</CardTitle>
                <CardDescription>Current candidates by stage</CardDescription>
              </div>
              <Link href="/hiring">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  View Pipeline
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analytics?.pipelineStages ? (
              <div className="space-y-3">
                {analytics.pipelineStages.map((item) => (
                  <div key={item.stage} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium truncate">{item.stage}</div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stageColors[item.stage] || 'bg-gray-500'} rounded-full transition-all`}
                        style={{ width: `${(item.count / maxPipelineCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm font-bold">{item.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pipeline data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Candidates</CardTitle>
                <CardDescription>Latest applications</CardDescription>
              </div>
              <Link href="/candidates">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCandidates.length > 0 ? (
              <div className="space-y-3">
                {recentCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{candidate.role}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {candidate.stage}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No candidates yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hiring Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hiring Trends</CardTitle>
              <CardDescription>Applications, interviews, and hires over time</CardDescription>
            </div>
            <Link href="/analytics">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Full Report
                <ChevronRight className="h-3 w-3 ml-1" />
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analytics?.hiringTrends && analytics.hiringTrends.length > 0 ? (
            <div className="h-48" data-testid="chart-hiring-trends">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hiringTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="applications" fill="#94a3b8" name="Applications" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviews" fill="#3b82f6" name="Interviews" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hires" fill="#10b981" name="Hires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Add candidates to see hiring trends
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Feature Highlight */}
      <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        <CardContent className="flex items-center justify-between p-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                AI Resume Detection
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Featured
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Detect AI-generated resumes with 85%+ accuracy. Analyze authenticity and get deep candidate insights.
              </p>
            </div>
          </div>
          <Link 
            href="/resume-analyzer"
            className="shrink-0 h-10 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Try Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MODULES.filter(m => m.path !== "/dashboard" && m.path !== "/analytics").slice(0, 4).map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.path} href={module.path} className="block group">
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-blue-500/20 relative overflow-hidden">
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br",
                    module.color
                  )} />
                  <CardHeader className="relative pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md transition-all group-hover:shadow-lg group-hover:scale-110",
                        module.color
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-foreground transition-colors">
                          {module.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-xs line-clamp-2 mt-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Modules Grid */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">All Modules</h2>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {MODULES.filter(m => m.path !== "/dashboard").map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.path} href={module.path} className="block group">
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                    module.color
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
                      {module.title}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
