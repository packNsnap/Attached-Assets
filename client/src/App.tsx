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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes Wrapper */}
      <Route path="/:rest*">
        {(params) => {
          // Simple auth check - in real app check actual auth state
          // For now we just render the layout
          return (
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/jobs" component={JobDescriptionModule} />
                
                {/* Dynamically generate routes for all modules */}
                {MODULES.filter(m => m.path !== "/" && m.path !== "/jobs").map(module => (
                  <Route key={module.path} path={module.path} component={ModulePlaceholder} />
                ))}
                
                <Route component={NotFound} />
              </Switch>
            </Layout>
          );
        }}
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
