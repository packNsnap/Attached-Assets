import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/home-page";
import ModulePlaceholder from "@/pages/module-placeholder";
import { Layout } from "@/components/layout/Layout";
import { MODULES } from "@/lib/constants";
import JobDescriptionModule from "@/pages/modules/job-description";
import ResumeAnalyzerModule from "@/pages/modules/resume-analyzer";
import SkillsTestModule from "@/pages/modules/skills-test";
import InterviewAssistantModule from "@/pages/modules/interview-assistant";
import HiringPipelineModule from "@/pages/modules/hiring-pipeline";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes Wrapper */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/jobs" component={JobDescriptionModule} />
            <Route path="/resume-analyzer" component={ResumeAnalyzerModule} />
            <Route path="/skills-test" component={SkillsTestModule} />
            <Route path="/interviews" component={InterviewAssistantModule} />
            <Route path="/hiring" component={HiringPipelineModule} />
            
            {/* Dynamically generate routes for all modules */}
            {MODULES.filter(m => m.path !== "/" && m.path !== "/jobs" && m.path !== "/resume-analyzer" && m.path !== "/skills-test" && m.path !== "/interviews" && m.path !== "/hiring").map(module => (
              <Route key={module.path} path={module.path} component={ModulePlaceholder} />
            ))}
            
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
