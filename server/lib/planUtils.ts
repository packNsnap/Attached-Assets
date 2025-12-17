import { PLAN_LIMITS, PlanType, LimitKey, FeatureKey, MonthlyUsage } from "@shared/schema";

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function getLimit(plan: PlanType, limitKey: LimitKey): number {
  const planConfig = getPlanLimits(plan);
  return planConfig.limits[limitKey];
}

export function hasFeature(plan: PlanType, featureKey: FeatureKey): boolean {
  const planConfig = getPlanLimits(plan);
  const value = planConfig.features[featureKey];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0 || value === -1;
  return false;
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  message?: string;
}

export function checkUsageLimit(
  plan: PlanType,
  limitKey: LimitKey,
  currentUsed: number,
  increment: number = 1
): UsageCheckResult {
  const limit = getLimit(plan, limitKey);
  
  if (isUnlimited(limit)) {
    return {
      allowed: true,
      current: currentUsed,
      limit: -1,
      remaining: -1,
      isUnlimited: true,
    };
  }

  const afterIncrement = currentUsed + increment;
  const allowed = afterIncrement <= limit;
  
  return {
    allowed,
    current: currentUsed,
    limit,
    remaining: Math.max(0, limit - currentUsed),
    isUnlimited: false,
    message: allowed ? undefined : `Plan limit reached: You've used ${currentUsed}/${limit} for this feature. Upgrade your plan to continue.`,
  };
}

export function assertWithinLimit(params: {
  plan: PlanType;
  limitKey: LimitKey;
  used: number;
  increment?: number;
}): void {
  const { plan, limitKey, used, increment = 1 } = params;
  const result = checkUsageLimit(plan, limitKey, used, increment);
  
  if (!result.allowed) {
    const error = new Error(result.message || "Plan limit reached: Upgrade your plan to continue.");
    (error as any).statusCode = 403;
    (error as any).type = "PLAN_LIMIT_EXCEEDED";
    throw error;
  }
}

export function assertHasFeature(plan: PlanType, featureKey: FeatureKey): void {
  if (!hasFeature(plan, featureKey)) {
    const error = new Error(`Upgrade required to use this feature: ${featureKey.replace(/_/g, ' ')}`);
    (error as any).statusCode = 403;
    (error as any).type = "FEATURE_NOT_AVAILABLE";
    throw error;
  }
}

export function getUsageFieldForLimit(limitKey: LimitKey): keyof MonthlyUsage | null {
  const mapping: Record<LimitKey, keyof MonthlyUsage | null> = {
    resume_scans_per_month: 'resumeScansUsed',
    job_desc_per_month: 'jobDescUsed',
    bulk_upload_max_batch: null, // Special handling - not a counter
    skills_tests_per_month: 'skillsTestsUsed',
    interview_generations_per_month: 'interviewGenerationsUsed',
    pdf_exports_per_month: 'pdfExportsUsed',
  };
  return mapping[limitKey];
}

export function formatPlanName(plan: PlanType): string {
  const names: Record<PlanType, string> = {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro / Agency',
    enterprise: 'Enterprise',
  };
  return names[plan] || 'Free';
}
