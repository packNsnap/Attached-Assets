import { useQuery } from "@tanstack/react-query";
import { PLAN_LIMITS, PlanType, LimitKey, FeatureKey } from "@shared/schema";

export interface UsageData {
  plan: PlanType;
  candidates: { current: number; limit: number };
  jobDescriptions: { current: number; limit: number };
  skillsTests: { current: number; limit: number };
  interviewSets: { current: number; limit: number };
  pdfExports: { current: number; limit: number };
  periodEnd: string;
}

export function usePlanFeatures() {
  const { data: usageData, isLoading, error, refetch } = useQuery<UsageData>({
    queryKey: ["/api/usage-summary"],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const plan = usageData?.plan || "free";
  const planConfig = PLAN_LIMITS[plan];

  const hasFeature = (featureKey: FeatureKey): boolean => {
    const value = planConfig.features[featureKey];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0 || value === -1;
    return false;
  };

  const getLimit = (limitKey: LimitKey): number => {
    return planConfig.limits[limitKey];
  };

  const isUnlimited = (limitKey: LimitKey): boolean => {
    return (planConfig.limits[limitKey] as number) === -1;
  };

  const getUsage = (limitKey: LimitKey) => {
    if (!usageData) return { current: 0, limit: 0, remaining: 0, percentUsed: 0, isUnlimited: false };
    
    const mapping: Record<LimitKey, keyof UsageData | null> = {
      candidates_max: "candidates",
      resume_scans_per_candidate: null,
      job_descriptions_per_month: "jobDescriptions",
      skills_tests_per_month: "skillsTests",
      interview_sets_per_month: "interviewSets",
      pdf_exports_per_month: "pdfExports",
      bulk_upload_max: null,
    };

    const key = mapping[limitKey];
    if (!key || typeof usageData[key] !== "object") {
      return { current: 0, limit: -1, remaining: -1, percentUsed: 0, isUnlimited: true };
    }

    const usage = usageData[key] as { current: number; limit: number };
    const unlimited = usage.limit === -1;
    const remaining = unlimited ? -1 : Math.max(0, usage.limit - usage.current);
    const percentUsed = unlimited ? 0 : Math.min(100, Math.round((usage.current / usage.limit) * 100));

    return {
      current: usage.current,
      limit: usage.limit,
      remaining,
      percentUsed,
      isUnlimited: unlimited,
    };
  };

  const canUseFeature = (limitKey: LimitKey): boolean => {
    const usage = getUsage(limitKey);
    if (usage.isUnlimited) return true;
    return usage.remaining > 0;
  };

  return {
    plan,
    planConfig,
    usageData,
    isLoading,
    error,
    refetch,
    hasFeature,
    getLimit,
    isUnlimited,
    getUsage,
    canUseFeature,
    isPaidPlan: plan !== "free",
    isProOrHigher: plan === "pro" || plan === "enterprise",
    isEnterprise: plan === "enterprise",
  };
}

export function formatPlanName(plan: PlanType): string {
  const names: Record<PlanType, string> = {
    free: "Free",
    basic: "Basic",
    growth: "Growth",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  return names[plan] || "Free";
}

export function getPlanPrice(plan: PlanType): string {
  return PLAN_LIMITS[plan].displayPrice;
}
