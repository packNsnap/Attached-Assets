import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, gradient, badge, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0",
          gradient
        )}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
