import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay md:hidden ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
        data-testid="sidebar-overlay"
      />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar */}
      <div className={`mobile-sidebar md:hidden ${sidebarOpen ? "open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume Logik
          </span>
          <div className="w-10" />
        </div>

        {/* Subtle background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 md:p-8 max-w-7xl relative">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
