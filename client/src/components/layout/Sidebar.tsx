import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MODULES, APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    // Mock logout
    window.location.href = "/auth";
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground">AI</span>
          </div>
          {APP_NAME}
        </div>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = location === module.path;
            
            return (
              <Link key={module.path} href={module.path}>
                <a className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70"
                )}>
                  <Icon className="h-4 w-4" />
                  {module.title}
                </a>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">HR Admin</p>
            <p className="text-xs text-sidebar-foreground/60">admin@company.com</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 border-sidebar-border bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
