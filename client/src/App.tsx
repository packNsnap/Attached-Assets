import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import PricingPage from "@/pages/pricing-page";
import FeaturesPage from "@/pages/features-page";
import { Layout } from "@/components/layout/Layout";
import JobDescriptionModule from "@/pages/modules/job-description";
import ResumeAnalyzerModule from "@/pages/modules/resume-analyzer";
import SkillsTestModule from "@/pages/modules/skills-test";
import InterviewAssistantModule from "@/pages/modules/interview-assistant";
import HiringPipelineModule from "@/pages/modules/hiring-pipeline";
import ReferenceCheckModule from "@/pages/modules/reference-check";
import PoliciesDocsModule from "@/pages/modules/policies-docs";
import OnboardingModule from "@/pages/modules/onboarding";
import PerformanceModule from "@/pages/modules/performance";
import AnalyticsModule from "@/pages/modules/analytics";
import CandidatesModule from "@/pages/modules/candidates";
import SkillsTestPublic from "@/pages/public/SkillsTestPublic";
import ReferenceLinkPage from "@/pages/reference-link";
import AdminPage from "@/pages/admin";
import UsageDashboard from "@/pages/usage-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/test/:token" component={SkillsTestPublic} />
      <Route path="/reference-link/:token" component={ReferenceLinkPage} />
      
      {/* Protected Routes Wrapper */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/jobs" component={JobDescriptionModule} />
            <Route path="/resume-analyzer" component={ResumeAnalyzerModule} />
            <Route path="/skills-test" component={SkillsTestModule} />
            <Route path="/interviews" component={InterviewAssistantModule} />
            <Route path="/candidates" component={CandidatesModule} />
            <Route path="/hiring" component={HiringPipelineModule} />
            <Route path="/references" component={ReferenceCheckModule} />
            <Route path="/policies" component={PoliciesDocsModule} />
            <Route path="/onboarding" component={OnboardingModule} />
            <Route path="/performance" component={PerformanceModule} />
            <Route path="/analytics" component={AnalyticsModule} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/usage" component={UsageDashboard} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hr-ui-theme">
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
