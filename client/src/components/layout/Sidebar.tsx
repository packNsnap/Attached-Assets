import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MODULES, APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, User, Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    window.location.href = "/";
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-gradient-to-b from-background to-muted/30">
      {/* Header with gradient branding */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>
        <ModeToggle />
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-3">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = location === module.path;
            
            return (
              <Link 
                key={module.path} 
                href={module.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-foreground shadow-sm border border-blue-500/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? `bg-gradient-to-br ${module.color} shadow-md`
                    : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-white" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "block truncate",
                    isActive && "font-semibold"
                  )}>
                    {module.title}
                  </span>
                </div>
                {module.featured && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0">
                    AI
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section with enhanced styling */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-background/50 border">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">HR Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
          </div>
        </div>
        <div className="grid gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-start gap-2 hover:bg-muted"
            asChild
          >
            <Link href="/">
              <ExternalLink className="h-4 w-4" />
              View Landing Page
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
