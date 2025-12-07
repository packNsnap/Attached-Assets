import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/home-page";
import ModulePlaceholder from "@/pages/module-placeholder";
import { Layout } from "@/components/layout/Layout";
import { MODULES } from "@/lib/constants";

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
                
                {/* Dynamically generate routes for all modules */}
                {MODULES.filter(m => m.path !== "/").map(module => (
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
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
