import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Briefcase, Clock, Target, Calendar, DollarSign } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const hiringData = [
  { month: "Jan", applications: 45, hires: 3, interviews: 12 },
  { month: "Feb", applications: 52, hires: 4, interviews: 15 },
  { month: "Mar", applications: 78, hires: 6, interviews: 22 },
  { month: "Apr", applications: 65, hires: 5, interviews: 18 },
  { month: "May", applications: 89, hires: 7, interviews: 25 },
  { month: "Jun", applications: 95, hires: 8, interviews: 28 },
];

const departmentData = [
  { name: "Engineering", value: 35, color: "#3b82f6" },
  { name: "Sales", value: 22, color: "#10b981" },
  { name: "Marketing", value: 15, color: "#f59e0b" },
  { name: "Design", value: 12, color: "#8b5cf6" },
  { name: "Operations", value: 10, color: "#ef4444" },
  { name: "HR", value: 6, color: "#06b6d4" },
];

const timeToHireData = [
  { month: "Jan", days: 32 },
  { month: "Feb", days: 28 },
  { month: "Mar", days: 35 },
  { month: "Apr", days: 25 },
  { month: "May", days: 22 },
  { month: "Jun", days: 20 },
];

const sourceData = [
  { source: "LinkedIn", hires: 12, applications: 89 },
  { source: "Indeed", hires: 8, applications: 156 },
  { source: "Referrals", hires: 15, applications: 34 },
  { source: "Career Site", hires: 6, applications: 78 },
  { source: "Other", hires: 4, applications: 45 },
];

type StatCardProps = {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
};

function StatCard({ title, value, change, icon, description }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && (
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : isNegative ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              {isPositive ? '+' : ''}{change}%
            </div>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsModule() {
  const [timeRange, setTimeRange] = useState("6m");

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track key metrics and performance indicators across your HR operations.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]" data-testid="select-time-range">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last month</SelectItem>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Employees" 
          value={156} 
          change={8}
          icon={<Users className="h-4 w-4 text-primary" />}
          description="vs last period"
        />
        <StatCard 
          title="Open Positions" 
          value={12}
          change={-15}
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          description="actively hiring"
        />
        <StatCard 
          title="Avg Time to Hire" 
          value="22 days"
          change={-12}
          icon={<Clock className="h-4 w-4 text-primary" />}
          description="improved efficiency"
        />
        <StatCard 
          title="Offer Acceptance" 
          value="85%"
          change={5}
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hiringData}>
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
                  {[
                    { stage: "New Applications", count: 45, color: "bg-slate-500" },
                    { stage: "Screening", count: 28, color: "bg-blue-500" },
                    { stage: "Phone Interview", count: 15, color: "bg-purple-500" },
                    { stage: "Technical", count: 8, color: "bg-orange-500" },
                    { stage: "Final Round", count: 5, color: "bg-green-500" },
                    { stage: "Offer", count: 3, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{item.stage}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${(item.count / 45) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-medium">{item.count}</div>
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
                <CardTitle>Headcount by Department</CardTitle>
                <CardDescription>Distribution of employees across teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-headcount-pie">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Details</CardTitle>
                <CardDescription>Team sizes and growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{dept.value} employees</Badge>
                        <span className="text-sm text-muted-foreground">{Math.round((dept.value / 100) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Time to Hire Trend</CardTitle>
                <CardDescription>Average days from application to offer acceptance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-time-to-hire">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeToHireData}>
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
                        dataKey="days" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                        name="Days to Hire"
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
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Cost per Hire</p>
                      <p className="text-2xl font-bold">$4,250</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Quality of Hire Score</p>
                      <p className="text-2xl font-bold">8.5/10</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div>
                      <p className="text-sm text-muted-foreground">90-Day Retention</p>
                      <p className="text-2xl font-bold">94%</p>
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical">
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
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {sourceData.map((source) => {
              const conversionRate = ((source.hires / source.applications) * 100).toFixed(1);
              return (
                <Card key={source.source}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{source.source}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{source.applications}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{source.hires}</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
