import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/lib/constants";
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Open Roles", value: "12" },
    { label: "Active Candidates", value: "48" },
    { label: "Interviews This Week", value: "8" },
    { label: "Offers Pending", value: "3" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here's an overview of your hiring pipeline.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.filter(m => m.path !== "/" && m.path !== "/admin").slice(0, 6).map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.path} href={module.path}>
                <a className="block group">
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                      <CardTitle className="mt-4 text-lg">{module.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Assistant Ready
            </h3>
            <p className="text-sm text-muted-foreground">
              Your AI modules are ready to help write JDs, analyze resumes, and generate policies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
