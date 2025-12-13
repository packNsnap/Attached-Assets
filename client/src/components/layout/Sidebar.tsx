import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, User, ExternalLink, GripVertical, RotateCcw, X, Shield, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { UsageDisplay } from "@/components/UsageDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useModuleOrder } from "@/hooks/useModuleOrder";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoImage from "@/assets/logo.png";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { orderedModules, reorderModules, resetOrder } = useModuleOrder();

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/stripe/subscription-status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription-status", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLAnchorElement | null>(null);

  const handleLogout = () => {
    window.location.href = "/";
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.currentTarget.style.opacity = "0.5";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnd = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLAnchorElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLAnchorElement>, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderModules(draggedIndex, toIndex);
      toast({
        title: "Sidebar reordered",
        description: "Your sidebar order has been saved.",
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetOrder = () => {
    resetOrder();
    toast({
      title: "Sidebar reset",
      description: "Sidebar order has been reset to default.",
    });
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-gradient-to-b from-background to-muted/30">
      {/* Header with gradient branding */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 group" onClick={handleLinkClick}>
          <img 
            src={logoImage} 
            alt="Resume Logik" 
            className="h-9 w-9 object-contain"
          />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResetOrder}
                  data-testid="button-reset-sidebar"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset sidebar order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ModeToggle />
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onClose}
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            Drag to reorder
          </p>
        </div>
        <nav className="grid gap-1 px-3">
          {orderedModules.map((module, index) => {
            const Icon = module.icon;
            const isActive = location === module.path;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
              <Link 
                key={module.path} 
                href={module.path}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-foreground shadow-sm border border-blue-500/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  isDragging && "opacity-50",
                  isDragOver && "border-t-2 border-t-blue-500"
                )}
                data-testid={`sidebar-item-${module.path.slice(1)}`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
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

      {/* Usage & User section */}
      <div className="border-t p-4 bg-muted/30 space-y-4">
        <div className="p-3 rounded-xl bg-background/50 border">
          <UsageDisplay />
        </div>
        
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50 border">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
        </div>
        <div className="grid gap-2">
          {subscriptionData?.plan === "free" && (
            <Button 
              size="sm"
              className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              asChild
            >
              <Link href="/pricing" onClick={handleLinkClick} data-testid="sidebar-upgrade-button">
                <Rocket className="h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          )}
          {user?.email === "admin@resumelogik.com" && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start gap-2 hover:bg-muted border-amber-500/30 text-amber-600 dark:text-amber-400"
              asChild
            >
              <Link href="/admin" onClick={handleLinkClick} data-testid="sidebar-admin-link">
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          )}
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
