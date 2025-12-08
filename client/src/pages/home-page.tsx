import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/lib/constants";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Users, Calendar, Gift, Brain, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Job, Candidate } from "@shared/schema";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const openRoles = jobs.filter(j => j.status === "open" || j.status === "active").length;
  const activeCandidates = candidates.length;
  const interviewsThisWeek = candidates.filter(c => c.stage === "interview").length;
  const offersPending = candidates.filter(c => c.stage === "offer").length;

  const stats = [
    { label: "Open Roles", value: String(openRoles), icon: Sparkles, color: "from-blue-500 to-cyan-500" },
    { label: "Active Candidates", value: String(activeCandidates), icon: Users, color: "from-purple-500 to-pink-500" },
    { label: "Interviews This Week", value: String(interviewsThisWeek), icon: Calendar, color: "from-orange-500 to-amber-500" },
    { label: "Offers Pending", value: String(offersPending), icon: Gift, color: "from-green-500 to-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with gradient text */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
            Welcome back
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">Here's an overview of your hiring pipeline.</p>
      </div>

      {/* Stats Grid with gradient backgrounds */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={cn(
                "absolute inset-0 opacity-5 bg-gradient-to-br",
                stat.color
              )} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md",
                  stat.color
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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

      {/* Quick Actions with module colors */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.filter(m => m.path !== "/dashboard").slice(0, 6).map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.path} href={module.path} className="block group">
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-blue-500/20 relative overflow-hidden">
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br",
                    module.color
                  )} />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md transition-all group-hover:shadow-lg group-hover:scale-110",
                        module.color
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                    <CardTitle className="mt-4 text-lg group-hover:text-foreground transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {module.description}
                    </CardDescription>
                    {module.featured && (
                      <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white w-fit">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Powered
                      </Badge>
                    )}
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
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
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
                    <p className="text-xs text-muted-foreground truncate">
                      {module.description}
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
