import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Users, Gift, Calendar, Shield, X, ChevronDown, ChevronUp, BarChart3, Briefcase, UserCheck, FileText, Zap } from "lucide-react";

type AdminUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: string | null;
  freeAccessUntil: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  plan: string;
};

type UserUsage = {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: string | null;
  };
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  usage: {
    plan: string;
    jobs: { current: number; limit: number };
    candidates: { current: number; limit: number };
    baselineAnalyses: { current: number; limit: number };
    jobDescriptions: { current: number; limit: number };
    skillsTests: { current: number; limit: number };
    interviewSets: { current: number; limit: number };
    policies: { current: number; limit: number };
    bulkUpload: boolean;
    periodEnd: string;
  };
  counts: {
    activeJobs: number;
    totalJobs: number;
    activeCandidates: number;
    totalCandidates: number;
  };
};

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' },
  { value: 'starter', label: 'Starter', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  { value: 'growth', label: 'Growth', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
];

function getPlanBadge(plan: string) {
  const planOption = PLAN_OPTIONS.find(p => p.value === plan) || PLAN_OPTIONS[0];
  return (
    <Badge className={planOption.color}>
      {planOption.label}
    </Badge>
  );
}

function UsageBar({ current, limit, label }: { current: number; limit: number; label: string }) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress value={percentage} className="h-1.5" />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [accessDays, setAccessDays] = useState("30");
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: userUsage, isLoading: isLoadingUsage } = useQuery<UserUsage>({
    queryKey: ["/api/admin/users", expandedUserId, "usage"],
    queryFn: async () => {
      if (!expandedUserId) return null;
      const res = await fetch(`/api/admin/users/${expandedUserId}/usage`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    enabled: !!expandedUserId,
  });

  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/free-access`, { days });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsGrantDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Access Granted",
        description: `Free access has been granted for ${accessDays} days.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant access",
        variant: "destructive",
      });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}/free-access`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Access Revoked",
        description: "Free access has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive",
      });
    },
  });

  const setTierMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/tier`, { plan });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", variables.userId, "usage"] });
      setIsTierDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Tier Updated",
        description: `User tier has been changed to ${selectedTier}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tier",
        variant: "destructive",
      });
    },
  });

  const handleGrantAccess = () => {
    if (selectedUser && accessDays) {
      grantAccessMutation.mutate({
        userId: selectedUser.id,
        days: parseInt(accessDays, 10),
      });
    }
  };

  const handleSetTier = () => {
    if (selectedUser && selectedTier) {
      setTierMutation.mutate({
        userId: selectedUser.id,
        plan: selectedTier,
      });
    }
  };

  const hasActiveAccess = (user: AdminUser) => {
    if (!user.freeAccessUntil) return false;
    return new Date(user.freeAccessUntil) > new Date();
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const planCounts = PLAN_OPTIONS.reduce((acc, plan) => {
    acc[plan.value] = users.filter(u => u.plan === plan.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Access Denied</p>
              <p className="text-sm">You don't have permission to view this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users, tiers, and access permissions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planCounts['starter'] + planCounts['growth'] + planCounts['enterprise']}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {planCounts['starter']} Starter, {planCounts['growth']} Growth, {planCounts['enterprise']} Enterprise
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Access Active</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(hasActiveAccess).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isAdmin === "true").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage user accounts, tiers, and usage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Free Access Until</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <Fragment key={user.id}>
                      <TableRow data-testid={`user-row-${user.id}`} className="cursor-pointer" onClick={() => toggleExpand(user.id)}>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {expandedUserId === user.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "—"}
                        {user.isAdmin === "true" && (
                          <Badge variant="secondary" className="ml-2">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>{getPlanBadge(user.plan)}</TableCell>
                      <TableCell>
                        {user.freeAccessUntil ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(user.freeAccessUntil), "MMM d, yyyy")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedTier(user.plan);
                              setIsTierDialogOpen(true);
                            }}
                            data-testid={`change-tier-${user.id}`}
                          >
                            Change Tier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setAccessDays("30");
                              setIsGrantDialogOpen(true);
                            }}
                            data-testid={`grant-access-${user.id}`}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            Grant Access
                          </Button>
                          {hasActiveAccess(user) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => revokeAccessMutation.mutate(user.id)}
                              disabled={revokeAccessMutation.isPending}
                              data-testid={`revoke-access-${user.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          {isLoadingUsage ? (
                            <div className="text-center py-4 text-muted-foreground">Loading usage data...</div>
                          ) : userUsage ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Usage Statistics</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Period ends: {userUsage.usage.periodEnd ? format(new Date(userUsage.usage.periodEnd), "MMM d, yyyy") : "N/A"}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <Card className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-medium">Active Jobs</span>
                                  </div>
                                  <p className="text-xl font-bold">{userUsage.counts.activeJobs}</p>
                                  <p className="text-xs text-muted-foreground">of {userUsage.counts.totalJobs} total</p>
                                </Card>
                                <Card className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <UserCheck className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs font-medium">Active Candidates</span>
                                  </div>
                                  <p className="text-xl font-bold">{userUsage.counts.activeCandidates}</p>
                                  <p className="text-xs text-muted-foreground">of {userUsage.counts.totalCandidates} total</p>
                                </Card>
                                <Card className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-xs font-medium">Subscription</span>
                                  </div>
                                  <p className="text-sm font-medium capitalize">{userUsage.subscription.plan}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{userUsage.subscription.status}</p>
                                </Card>
                                <Card className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-xs font-medium">Bulk Upload</span>
                                  </div>
                                  <p className="text-sm font-medium">{userUsage.usage.bulkUpload ? "Enabled" : "Disabled"}</p>
                                </Card>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium">Resource Usage</h4>
                                  <UsageBar 
                                    current={userUsage.usage.jobs.current} 
                                    limit={userUsage.usage.jobs.limit} 
                                    label="Active Jobs" 
                                  />
                                  <UsageBar 
                                    current={userUsage.usage.candidates.current} 
                                    limit={userUsage.usage.candidates.limit} 
                                    label="Candidates" 
                                  />
                                  <UsageBar 
                                    current={userUsage.usage.baselineAnalyses.current} 
                                    limit={userUsage.usage.baselineAnalyses.limit} 
                                    label="Resume Analyses" 
                                  />
                                </div>
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium">Feature Usage</h4>
                                  <UsageBar 
                                    current={userUsage.usage.jobDescriptions.current} 
                                    limit={userUsage.usage.jobDescriptions.limit} 
                                    label="Job Descriptions" 
                                  />
                                  <UsageBar 
                                    current={userUsage.usage.skillsTests.current} 
                                    limit={userUsage.usage.skillsTests.limit} 
                                    label="Skills Tests" 
                                  />
                                  <UsageBar 
                                    current={userUsage.usage.interviewSets.current} 
                                    limit={userUsage.usage.interviewSets.limit} 
                                    label="Interview Sets" 
                                  />
                                  <UsageBar 
                                    current={userUsage.usage.policies.current} 
                                    limit={userUsage.usage.policies.limit} 
                                    label="HR Policies" 
                                  />
                                </div>
                              </div>

                              {userUsage.subscription.stripeCustomerId && (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    Stripe Customer: <code className="bg-muted px-1 rounded">{userUsage.subscription.stripeCustomerId}</code>
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">No usage data available</div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Free Access</DialogTitle>
            <DialogDescription>
              Give {selectedUser?.email || "this user"} free access to all features.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right">
                Duration
              </Label>
              <Input
                id="days"
                type="number"
                min="1"
                value={accessDays}
                onChange={(e) => setAccessDays(e.target.value)}
                className="col-span-3"
                placeholder="Number of days"
                data-testid="input-access-days"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Access will expire on{" "}
              {accessDays && !isNaN(parseInt(accessDays))
                ? format(
                    new Date(Date.now() + parseInt(accessDays) * 24 * 60 * 60 * 1000),
                    "MMMM d, yyyy"
                  )
                : "..."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={grantAccessMutation.isPending || !accessDays}
              data-testid="button-confirm-grant"
            >
              {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Set the subscription tier for {selectedUser?.email || "this user"}. This will override any existing subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right">
                Tier
              </Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="col-span-3" data-testid="select-tier">
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value} data-testid={`tier-option-${plan.value}`}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Current tier: <span className="font-medium capitalize">{selectedUser?.plan || "free"}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTierDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSetTier}
              disabled={setTierMutation.isPending || !selectedTier}
              data-testid="button-confirm-tier"
            >
              {setTierMutation.isPending ? "Updating..." : "Update Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
