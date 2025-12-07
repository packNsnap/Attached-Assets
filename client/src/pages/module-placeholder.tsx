import { MODULES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ModulePlaceholder() {
  const [location] = useLocation();
  const currentModule = MODULES.find(m => m.path === location);

  if (!currentModule) return <div>Module not found</div>;

  const Icon = currentModule.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{currentModule.title}</h1>
          <p className="text-muted-foreground">{currentModule.description}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            The {currentModule.title} module is currently under construction. 
            Check back later for AI-powered features.
          </CardDescription>
          <div className="mt-8">
            <Button variant="outline">Return Dashboard</Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
