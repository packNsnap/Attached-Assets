import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, MODULES } from "@/lib/constants";
import { Briefcase, Sparkles, ArrowRight, Shield, Zap, Users, LogIn } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const features = [
    { icon: Sparkles, text: "AI-Powered Insights", color: "from-purple-500 to-pink-500" },
    { icon: Zap, text: "Streamlined Workflows", color: "from-blue-500 to-cyan-500" },
    { icon: Users, text: "Team Collaboration", color: "from-green-500 to-emerald-500" },
    { icon: Shield, text: "Secure & Compliant", color: "from-orange-500 to-amber-500" },
  ];

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{APP_NAME}</h1>
              <p className="text-purple-300 text-sm">AI-Powered HR Platform</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Transform Your
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              HR Workflows
            </span>
          </h2>
          
          <p className="text-lg text-slate-300 mb-10 max-w-md">
            Streamline hiring, onboarding, and performance management with intelligent automation.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Module preview */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Powered modules:</span>
            <div className="flex -space-x-2">
              {MODULES.slice(1, 6).map((module, index) => (
                <div
                  key={index}
                  className={`h-8 w-8 rounded-lg ${module.bgColor} flex items-center justify-center border-2 border-slate-900 shadow-lg`}
                  title={module.title}
                >
                  <module.icon className="h-4 w-4 text-white" />
                </div>
              ))}
              <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center border-2 border-slate-900 text-xs text-white font-medium">
                +{MODULES.length - 6}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-muted-foreground text-center text-sm">
              AI-powered HR workflow automation
            </p>
          </div>

          <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Secure connection</span>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome to {APP_NAME}</CardTitle>
              <CardDescription className="text-base">
                Sign in or create an account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={handleLogin}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 group text-lg"
                data-testid="button-login"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In / Sign Up
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-muted-foreground">
                    Supported options
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm text-muted-foreground">Google</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm text-muted-foreground">GitHub</span>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Email/password signup also available
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
