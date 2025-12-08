import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto p-8 max-w-7xl relative">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
