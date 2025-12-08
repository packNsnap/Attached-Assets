import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME, MODULES } from "@/lib/constants";
import { Briefcase, Sparkles, ArrowRight, Shield, Zap, Users, LogIn, Loader2, Mail, Lock, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("signin");
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const features = [
    { icon: Sparkles, text: "AI-Powered Insights", color: "from-purple-500 to-pink-500" },
    { icon: Zap, text: "Streamlined Workflows", color: "from-blue-500 to-cyan-500" },
    { icon: Users, text: "Team Collaboration", color: "from-green-500 to-emerald-500" },
    { icon: Shield, text: "Secure & Compliant", color: "from-orange-500 to-amber-500" },
  ];

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Invalid email or password");
      }
      return json;
    },
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Could not create account");
      }
      return json;
    },
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "Could not create account",
      });
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ email, password, firstName, lastName });
  };

  const handleOAuthLogin = () => {
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

      {/* Right Panel - Login/Signup */}
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid="input-signin-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          data-testid="input-signin-password"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                      disabled={loginMutation.isPending}
                      data-testid="button-signin"
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-firstname"
                            type="text"
                            placeholder="John"
                            className="pl-10"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            data-testid="input-signup-firstname"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">Last Name</Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          data-testid="input-signup-lastname"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid="input-signup-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          data-testid="input-signup-password"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                      disabled={registerMutation.isPending}
                      data-testid="button-signup"
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12"
                onClick={handleOAuthLogin}
                data-testid="button-oauth-login"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google / GitHub
              </Button>
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
