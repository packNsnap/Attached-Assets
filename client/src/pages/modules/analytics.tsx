import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Briefcase, Clock, Target, Calendar, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AnalyticsData = {
  kpis: {
    totalEmployees: number;
    openPositions: number;
    avgTimeToHire: number;
    offerAcceptanceRate: number;
  };
  pipelineStages: Array<{ stage: string; count: number }>;
  conversions: Record<string, number>;
  headcountOverTime: { labels: string[]; data: number[] };
  hiringTrends: Array<{ month: string; applications: number; interviews: number; hires: number }>;
  sourceData: Array<{ source: string; applications: number; hires: number }>;
  departmentData: Array<{ name: string; value: number; color: string }>;
  efficiency: {
    avgDaysToFill: number;
    interviewToHireRatio: number;
  };
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
};

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

const stageColors: Record<string, string> = {
  "Applied": "bg-slate-500",
  "Screening": "bg-blue-500",
  "Phone Interview": "bg-purple-500",
  "Technical": "bg-orange-500",
  "Final Round": "bg-green-500",
  "Offer": "bg-emerald-500",
  "Hired": "bg-teal-500",
};

export default function AnalyticsModule() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics", { credentials: "include" });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const module = getModuleByPath("/analytics");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  const maxPipelineCount = Math.max(...data.pipelineStages.map(s => s.count), 1);

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="HR Analytics"
        description="Track key metrics and performance indicators across your HR operations."
        icon={module.icon}
        gradient={module.color}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Employees" 
          value={data.kpis.totalEmployees} 
          icon={<Users className="h-4 w-4 text-primary" />}
          description="hired candidates"
        />
        <StatCard 
          title="Open Positions" 
          value={data.kpis.openPositions}
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          description="actively hiring"
        />
        <StatCard 
          title="Avg Time to Hire" 
          value={`${data.kpis.avgTimeToHire} days`}
          icon={<Clock className="h-4 w-4 text-primary" />}
          description="from application"
        />
        <StatCard 
          title="Offer Acceptance" 
          value={`${data.kpis.offerAcceptanceRate}%`}
          icon={<Target className="h-4 w-4 text-primary" />}
          description="acceptance rate"
        />
      </div>

      <Tabs defaultValue="hiring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hiring" data-testid="tab-hiring">Hiring Pipeline</TabsTrigger>
          <TabsTrigger value="headcount" data-testid="tab-headcount">Headcount</TabsTrigger>
          <TabsTrigger value="efficiency" data-testid="tab-efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources">Recruiting Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="hiring" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Funnel</CardTitle>
                <CardDescription>Applications, interviews, and hires over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-hiring-funnel">
                  {data.hiringTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.hiringTrends}>
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
                        <Legend />
                        <Bar dataKey="applications" fill="#94a3b8" name="Applications" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="interviews" fill="#3b82f6" name="Interviews" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="hires" fill="#10b981" name="Hires" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hiring data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Summary</CardTitle>
                <CardDescription>Current candidates by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.pipelineStages.map((item) => (
                    <div key={item.stage} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{item.stage}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stageColors[item.stage] || 'bg-gray-500'} rounded-full transition-all`}
                          style={{ width: `${(item.count / maxPipelineCount) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-medium" data-testid={`text-stage-count-${item.stage.toLowerCase().replace(/\s/g, '-')}`}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="headcount" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Headcount by Role</CardTitle>
                <CardDescription>Distribution of hired employees across roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-headcount-pie">
                  {data.departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.departmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {data.departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hired employees yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Details</CardTitle>
                <CardDescription>Team sizes</CardDescription>
              </CardHeader>
              <CardContent>
                {data.departmentData.length > 0 ? (
                  <div className="space-y-4">
                    {data.departmentData.map((dept) => (
                      <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                          <span className="font-medium">{dept.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{dept.value} employee{dept.value !== 1 ? 's' : ''}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {data.kpis.totalEmployees > 0 ? Math.round((dept.value / data.kpis.totalEmployees) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hired employees yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hires Over Time</CardTitle>
                <CardDescription>Number of hires per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-time-to-hire">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.headcountOverTime.labels.map((label, i) => ({
                      month: label,
                      hires: data.headcountOverTime.data[i]
                    }))}>
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
                      <Line 
                        type="monotone" 
                        dataKey="hires" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2 }}
                        name="Hires"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiring Efficiency Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Days to Fill Position</p>
                      <p className="text-2xl font-bold" data-testid="text-avg-days-to-fill">{data.efficiency.avgDaysToFill} days</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Interview to Hire Ratio</p>
                      <p className="text-2xl font-bold" data-testid="text-interview-hire-ratio">{data.efficiency.interviewToHireRatio}:1</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Candidates in Pipeline</p>
                      <p className="text-2xl font-bold" data-testid="text-total-pipeline">
                        {data.pipelineStages.reduce((sum, s) => sum + s.count, 0)}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recruiting Source Analysis</CardTitle>
              <CardDescription>Performance comparison of different recruiting channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" data-testid="chart-recruiting-sources">
                {data.sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="source" type="category" className="text-xs" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="applications" fill="#94a3b8" name="Applications" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="hires" fill="#10b981" name="Hires" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No source data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {data.sourceData.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {data.sourceData.map((source) => {
                const conversionRate = source.applications > 0 
                  ? ((source.hires / source.applications) * 100).toFixed(1) 
                  : "0.0";
                return (
                  <Card key={source.source}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{source.source}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold" data-testid={`text-source-apps-${source.source.toLowerCase()}`}>{source.applications}</p>
                          <p className="text-xs text-muted-foreground">Applications</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500" data-testid={`text-source-hires-${source.source.toLowerCase()}`}>{source.hires}</p>
                          <p className="text-xs text-muted-foreground">Hires</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t text-center">
                        <Badge variant="secondary" className="text-sm">
                          {conversionRate}% conversion
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
