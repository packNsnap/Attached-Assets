import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  FileSearch,
  ClipboardCheck,
  Users,
  MessageSquare,
  Shield,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  AlertTriangle,
  Eye,
  Target,
  Lightbulb,
  BarChart3,
  BookOpen,
  UserPlus,
  Award,
  ChevronRight,
  Briefcase,
  GripVertical,
  PieChart,
  Activity,
  Gauge,
  Lock,
  ShieldCheck,
  Database,
  EyeOff,
  Upload,
  X,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";
import demoVideo from "@assets/My_Movie_1765611752383.mp4";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const sampleReportFlags = [
  { type: "red", title: "Timeline Overlap Detected", description: "Two full-time roles overlap by 18 months (2019-2021). This requires clarification." },
  { type: "red", title: "Copy-Paste Error Found", description: "Resume mentions 'excited to join Google' but was submitted to a different company." },
  { type: "yellow", title: "Inflated Title Possible", description: "VP of Engineering at a 4-person startup with entry-level responsibilities listed." },
  { type: "yellow", title: "AI-Generated Language", description: "Summary contains generic buzzwords: 'results-driven', 'dynamic professional', 'proven track record'." },
  { type: "yellow", title: "Skills Without Evidence", description: "Claims 'Expert in Python' but no technical roles or projects demonstrate this skill." },
  { type: "green", title: "Education Verified Plausible", description: "Degree timeline aligns with career start date. No red flags detected." },
  { type: "green", title: "Career Progression Logical", description: "Role advancement from Analyst to Manager over 6 years follows typical patterns." },
  { type: "green", title: "Contact Information Consistent", description: "Email domain matches stated current employer. No mismatches found." },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: FileSearch,
    title: "AI Job Descriptions",
    description: "Create compelling, bias-free job descriptions with AI-powered salary benchmarking.",
    highlight: "Save 2+ hours per posting",
    color: "from-blue-500 to-cyan-500",
    hasAI: true
  },
  {
    icon: Brain,
    title: "Resume Logic Analysis",
    description: "Detect AI-generated resumes, analyze authenticity, and get deep candidate insights.",
    highlight: "Spot fake resumes instantly",
    color: "from-purple-500 to-pink-500",
    featured: true,
    hasAI: true
  },
  {
    icon: ClipboardCheck,
    title: "Skills Test Builder",
    description: "Auto-generate role-specific assessments with AI scoring and tracking.",
    highlight: "Objective evaluation",
    color: "from-green-500 to-emerald-500",
    hasAI: true
  },
  {
    icon: MessageSquare,
    title: "Interview Assistant",
    description: "AI-generated questions based on resume analysis and role requirements.",
    highlight: "Never run out of questions",
    color: "from-orange-500 to-amber-500",
    hasAI: true
  },
  {
    icon: Users,
    title: "Candidate Management",
    description: "Track candidates with notes, documents, and complete assessment history.",
    highlight: "Complete profiles",
    color: "from-indigo-500 to-violet-500"
  },
  {
    icon: TrendingUp,
    title: "Hiring Pipeline",
    description: "Visualize your hiring funnel with drag-and-drop stages and analytics.",
    highlight: "Visual workflow",
    color: "from-rose-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Reference Check",
    description: "Streamlined reference collection with automated outreach and feedback forms.",
    highlight: "Faster verification",
    color: "from-teal-500 to-cyan-500",
    hasAI: true
  },
  {
    icon: BookOpen,
    title: "HR Policies & Docs",
    description: "Generate compliant HR policies with state-specific guidance and legal references.",
    highlight: "AI policy creation",
    color: "from-yellow-500 to-orange-500",
    hasAI: true
  },
  {
    icon: UserPlus,
    title: "Employee Onboarding",
    description: "AI-generated onboarding plans with task tracking and 30/60/90 day goals.",
    highlight: "Structured onboarding",
    color: "from-lime-500 to-green-500",
    hasAI: true
  },
  {
    icon: Award,
    title: "Performance Goals",
    description: "AI-powered SMART goal generation with status tracking for employees.",
    highlight: "Data-driven goals",
    color: "from-fuchsia-500 to-purple-500",
    hasAI: true
  }
];

const aiFeatures = [
  {
    icon: AlertTriangle,
    title: "Copy-Paste & Template Errors",
    description: "Catch wrong company names, mismatched emails, and leftover template text that candidates forgot to change.",
    stats: "Instant detection"
  },
  {
    icon: Eye,
    title: "Timeline & Career Gaps",
    description: "Automatically calculate overlapping jobs, impossible timelines, and hidden employment gaps.",
    stats: "Math-verified"
  },
  {
    icon: Target,
    title: "Inflated Titles & Claims",
    description: "Flag VP titles at 5-person startups, unrealistic progression, and skills without evidence.",
    stats: "Context-aware"
  },
  {
    icon: Lightbulb,
    title: "AI-Generated Fluff",
    description: "Detect buzzword-heavy summaries, generic phrases, and polished language that lacks substance.",
    stats: "85%+ accuracy"
  }
];

const comparisonData = [
  { feature: "AI Job Description Generation", hrNexus: true, traditional: false },
  { feature: "AI Resume Analysis & Detection", hrNexus: true, traditional: false },
  { feature: "Automated Skills Testing", hrNexus: true, traditional: "Limited" },
  { feature: "Real-Time Analytics Dashboard", hrNexus: true, traditional: "Basic" },
  { feature: "AI Performance Goal Generation", hrNexus: true, traditional: false },
  { feature: "Customizable Workspace", hrNexus: true, traditional: false },
  { feature: "Onboarding with Task Tracking", hrNexus: true, traditional: true },
  { feature: "State-Specific HR Policies", hrNexus: true, traditional: "Manual" },
  { feature: "Starting Price", hrNexus: "Free / Low Cost", traditional: "$5,000+/year" },
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sampleReportOpen, setSampleReportOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      window.location.href = "/auth";
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      window.location.href = "/auth";
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play();
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Resume Logik" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Logik
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Button variant="ghost" asChild data-testid="link-features">
                <a href="/features">Features</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-how-it-works">
                <a href="/how-it-works">How It Works</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-who-its-for">
                <a href="/who-its-for">Who It's For</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-what-we-catch">
                <a href="/what-we-catch">What We Catch</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-common-mistakes">
                <a href="/common-mistakes">Common Mistakes</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-pricing">
                <a href="/pricing">Pricing</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-login">
                <a href="/auth">Log In</a>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild data-testid="link-get-started">
                <a href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="sm:hidden">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600" asChild>
                <a href="/auth">Start Free</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Scan a Resume
            </DialogTitle>
          </DialogHeader>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-muted-foreground/25 hover:border-blue-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your resume here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Sign up free to see your full integrity report
          </p>
        </DialogContent>
      </Dialog>

      {/* Sample Report Modal */}
      <Dialog open={sampleReportOpen} onOpenChange={setSampleReportOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Sample Integrity Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              This is an example of what our AI-powered analysis reveals. Each flag helps you make informed decisions.
            </p>
            {sampleReportFlags.map((flag, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  flag.type === "red" && "bg-red-50 dark:bg-red-950/20 border-l-red-500",
                  flag.type === "yellow" && "bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500",
                  flag.type === "green" && "bg-green-50 dark:bg-green-950/20 border-l-green-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    flag.type === "red" && "bg-red-500",
                    flag.type === "yellow" && "bg-yellow-500",
                    flag.type === "green" && "bg-green-500"
                  )}>
                    {flag.type === "red" && <AlertTriangle className="h-3.5 w-3.5 text-white" />}
                    {flag.type === "yellow" && <Eye className="h-3.5 w-3.5 text-white" />}
                    {flag.type === "green" && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{flag.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
              <a href="/auth">
                Try It Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Left Side Decorative Elements */}
        <div className="absolute left-4 lg:left-8 xl:left-16 top-32 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
            >
              <Brain className="h-7 w-7 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 ml-8"
            >
              <ClipboardCheck className="h-6 w-6 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25"
            >
              <FileSearch className="h-5 w-5 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side Decorative Elements */}
        <div className="absolute right-4 lg:right-8 xl:right-16 top-32 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25"
            >
              <BarChart3 className="h-7 w-7 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 mr-8"
            >
              <MessageSquare className="h-6 w-6 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25"
            >
              <Target className="h-5 w-5 text-white" />
            </motion.div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Resume Integrity Scoring
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Resume Integrity Scoring for{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Real-World Hiring
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 px-4">
              Catch inconsistencies, questionable timelines, and skill mismatches fast.
              Decision support only—no auto-rejections.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 px-4">
              <Button size="lg" onClick={() => setUploadModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6" data-testid="button-scan-resume">
                <Upload className="mr-2 h-5 w-5" />
                Scan a Resume
              </Button>
              <Button size="lg" variant="outline" onClick={() => setSampleReportOpen(true)} className="text-lg px-8 py-6" data-testid="button-view-sample">
                <Eye className="mr-2 h-5 w-5" />
                View Sample Report
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              No credit card • 10-second scan • Decision support only
            </p>

            <button
              onClick={() => setSampleReportOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-flex items-center gap-1"
              data-testid="link-try-sample"
            >
              <Eye className="h-4 w-4" />
              Try Sample Resume
            </button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>10-second scan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Flags gaps + overlaps</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Explains every score</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What the Scan Catches Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <Eye className="h-3.5 w-3.5 mr-2" />
              AI-Powered Analysis
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What the Scan{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Catches
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See exactly what our AI flags in seconds — from timeline issues to copy-paste artifacts.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Sample Report Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border bg-background shadow-xl overflow-hidden"
            >
              <div className="border-b px-5 py-4 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Sample Integrity Report</span>
                </div>
                <Badge variant="secondary" className="text-xs">Demo</Badge>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Integrity Score</p>
                    <p className="text-2xl font-bold text-blue-600">72</p>
                    <p className="text-xs text-muted-foreground">/100</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">AI Likelihood</p>
                    <p className="text-2xl font-bold text-purple-600">45%</p>
                    <p className="text-xs text-muted-foreground">Moderate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Skills Match</p>
                    <p className="text-2xl font-bold text-green-600">68%</p>
                    <p className="text-xs text-muted-foreground">Good</p>
                  </div>
                </div>

                {/* Flags Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Flags Found (5)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500">
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs">Timeline overlap: 2 roles, 18 months</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500">
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs">Copy-paste error: wrong company name</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500">
                      <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs">Inflated title: VP at 4-person startup</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500">
                      <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs">AI-generated summary detected</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border-l-2 border-l-green-500">
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs">Education timeline verified</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setSampleReportOpen(true)} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  View Full Sample Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Right: 8 Flag Tiles */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Users, title: "Name Mismatch", description: "Different names across resume sections or documents.", color: "from-red-500 to-rose-500" },
                { icon: Calendar, title: "Timeline Overlap", description: "Multiple full-time roles during the same period.", color: "from-red-500 to-orange-500" },
                { icon: FileText, title: "Copy-Paste Artifact", description: "Wrong company names, leftover template text.", color: "from-yellow-500 to-amber-500" },
                { icon: Award, title: "Inflated Title Risk", description: "VP/Director titles at very small companies.", color: "from-yellow-500 to-orange-500" },
                { icon: Target, title: "Skills Mismatch", description: "Claimed expertise without supporting experience.", color: "from-purple-500 to-pink-500" },
                { icon: Shield, title: "Contact Inconsistency", description: "Email domain doesn't match stated employer.", color: "from-blue-500 to-cyan-500" },
                { icon: BookOpen, title: "Education Anomaly", description: "Degree dates don't align with career start.", color: "from-indigo-500 to-purple-500" },
                { icon: Sparkles, title: "Generic AI Phrasing", description: "Buzzword-heavy, substance-light language.", color: "from-pink-500 to-rose-500" },
              ].map((flag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                    flag.color
                  )}>
                    <flag.icon className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{flag.title}</h4>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              The Cost Isn't Time.{" "}
              <span className="text-red-500">It's False Confidence.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Bad hires rarely come from obviously bad resumes. They come from resumes that look fine.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Polished ≠ Accurate",
                description: "Beautiful formatting and professional language don't guarantee truthful content. AI makes everyone look good.",
                icon: "✨"
              },
              {
                title: "Reviewers Skim",
                description: "Under time pressure, hiring managers assume HR checked. HR assumes candidates vetted themselves.",
                icon: "⏱️"
              },
              {
                title: "You Stay in Control",
                description: "ResumeLogik helps you pause, question, and verify — without making decisions for you.",
                icon: "🎯"
              }
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-background border shadow-sm"
              >
                <div className="text-4xl mb-4">{problem.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{problem.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Detection Feature Highlight */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <Brain className="h-3.5 w-3.5 mr-2" />
              What We Catch That Humans Miss
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                6 Categories of Resume Red Flags
              </span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              The average recruiter spends 2-3 minutes per resume. In that time, subtle issues slip through.
              ResumeLogik analyzes every detail in seconds.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6"
            >
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base">{feature.title}</h3>
                      <Badge variant="secondary" className="text-xs">{feature.stats}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock Resume Analysis Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-background border shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-sm sm:text-base">Resume Analysis Results</h3>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    AI Detected
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>AI Writing Likelihood</span>
                      <span className="font-semibold text-amber-600">85%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Specificity Score</span>
                      <span className="font-semibold text-amber-600">40%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[40%] bg-gradient-to-r from-green-400 to-amber-500 rounded-full" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Generic Phrases</span>
                      <span className="font-semibold text-red-600">70%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[70%] bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 sm:p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> This resume exhibits multiple AI writing patterns including uniform structure and optimized buzzword placement.
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Detected Clichés:</p>
                  <div className="flex flex-wrap gap-2">
                    {["strong track record", "attention to detail", "problem solving", "team player"].map((phrase) => (
                      <Badge key={phrase} variant="outline" className="text-xs">
                        "{phrase}"
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Flagged Resume Reviews Are More Reliable - NEW */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
              Smarter Analysis
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Why Flagged Resume Reviews Are{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                More Reliable
              </span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="prose prose-sm dark:prose-invert max-w-none"
            >
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                ResumeLogik uses a multi-stage analysis approach. Most resumes are evaluated using lightweight automated checks designed for efficiency and consistency.
              </p>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                When multiple risk indicators are detected, the system escalates the resume to a secondary high-confidence review. This review uses a more advanced reasoning model trained to evaluate career plausibility, timeline realism, and internal consistency, rather than formatting or keyword density.
              </p>

              <p className="font-semibold text-foreground mb-4">This escalation process ensures:</p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground">Advanced analysis is applied only when warranted</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground">Routine resumes are not over-processed</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground">Flagged results reflect compounded risk signals, not a single anomaly</span>
                </li>
              </ul>

              <p className="font-semibold text-foreground mb-4">As a result, flagged assessments are:</p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground"><strong>More explainable</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground"><strong>More consistent</strong> across candidates</span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground"><strong>Less prone to false positives</strong></span>
                </li>
              </ul>

              <p className="text-sm text-muted-foreground mt-6 pt-6 border-t italic">
                ResumeLogik does not make hiring decisions. It provides a second-opinion risk assessment to support informed human review.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden border shadow-xl">
                <video
                  ref={videoRef}
                  src={demoVideo}
                  controls
                  autoPlay
                  muted
                  className="w-full h-auto bg-black"
                  poster={logoImage}
                  data-testid="video-flagged-reviews"
                />
              </div>
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Customizable Workspace Section - NEW */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <GripVertical className="h-3.5 w-3.5 mr-2" />
                Your Workspace, Your Way
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Customize Your{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Workflow
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Drag and drop to reorder your sidebar modules. Put what matters most at your fingertips. Your preferences are saved automatically.
              </p>
              <ul className="space-y-3">
                {[
                  "Drag modules to prioritize your workflow",
                  "AI-powered modules marked with badges",
                  "Dark and light mode support",
                  "Mobile-friendly responsive design"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock Sidebar */}
              <div className="p-4 rounded-2xl bg-background border shadow-xl max-w-xs mx-auto">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <img src={logoImage} alt="Resume Logik" className="h-8 w-8 object-contain" />
                  <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Resume Logik</span>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Brain, name: "Resume Logic", ai: true, active: true },
                    { icon: BarChart3, name: "Analytics", ai: false },
                    { icon: ClipboardCheck, name: "Skills Tests", ai: true },
                    { icon: Target, name: "Performance", ai: true },
                    { icon: Users, name: "Hiring Pipeline", ai: false },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                        item.active ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20" : "hover:bg-muted/50"
                      )}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center",
                        item.active ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-muted"
                      )}>
                        <item.icon className={cn("h-3.5 w-3.5", item.active ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <span className={cn("text-sm flex-1", item.active && "font-semibold")}>{item.name}</span>
                      {item.ai && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0">AI</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -z-10 inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section - NEW */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" />
              Enterprise-Grade Security
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Be Compliant &{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Secure
              </span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Consumer AI tools like ChatGPT aren't designed for processing candidate PII.
              Resume Logik uses secure, isolated API models where your data is protected.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-4xl mx-auto">
            {[
              {
                icon: Lock,
                title: "Stays Encrypted",
                description: "All candidate data is encrypted at rest and in transit"
              },
              {
                icon: EyeOff,
                title: "Never Trains Public Models",
                description: "Your data is never used to train external AI systems"
              },
              {
                icon: ShieldCheck,
                title: "HR Privacy Standards",
                description: "Meets standard HR privacy and compliance expectations"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center max-w-2xl mx-auto"
          >
            <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">
              <strong className="text-foreground">No resumes or candidate data are ever exposed to public AI systems.</strong>{" "}
              Your hiring data stays private, secure, and compliant.
            </p>
          </motion.div>
        </div>
      </section>

      {/* All Features Grid */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4 px-4 py-2">
              <Zap className="h-3.5 w-3.5 mr-2" />
              Complete HR Suite
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Hire & Manage
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              10 powerful modules designed specifically for small businesses. No enterprise complexity, just what works.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={cn(
                  "group p-4 sm:p-5 rounded-xl border bg-background hover:shadow-lg transition-all duration-300 cursor-pointer",
                  feature.featured && "ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5"
                )}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                  feature.color
                )}>
                  <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-xs sm:text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2 hidden sm:block">{feature.description}</p>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {feature.highlight}
                </Badge>
                {feature.hasAI && (
                  <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] ml-1">
                    AI
                  </Badge>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <Activity className="h-3.5 w-3.5 mr-2" />
              Real-Time Analytics
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your HR Dashboard,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                At a Glance
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track KPIs, pipeline stages, hiring trends, and team performance with real-time data — not placeholder metrics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl border bg-background shadow-2xl overflow-hidden">
              <div className="border-b px-4 sm:px-6 py-4 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <img src={logoImage} alt="Resume Logik" className="h-8 w-8 object-contain" />
                  <span className="font-semibold hidden sm:inline">Resume Logik</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Live Data</span>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { label: "Active Jobs", value: "12", change: "+3 this week", color: "text-blue-600" },
                    { label: "Total Candidates", value: "248", change: "+45 this month", color: "text-purple-600" },
                    { label: "Interviews Scheduled", value: "18", change: "6 today", color: "text-green-600" },
                    { label: "Offers Extended", value: "5", change: "80% acceptance", color: "text-orange-600" },
                  ].map((kpi, i) => (
                    <div key={i} className="p-3 sm:p-4 rounded-xl bg-muted/50 border">
                      <p className="text-xs sm:text-sm text-muted-foreground">{kpi.label}</p>
                      <p className={cn("text-xl sm:text-2xl font-bold", kpi.color)}>{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.change}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 rounded-xl bg-muted/30 border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-purple-500" />
                      Pipeline Stages
                    </h4>
                    <div className="space-y-3">
                      {[
                        { stage: "Applied", count: 86, color: "bg-blue-500", width: "100%" },
                        { stage: "Screening", count: 45, color: "bg-purple-500", width: "52%" },
                        { stage: "Interview", count: 28, color: "bg-orange-500", width: "32%" },
                        { stage: "Offer", count: 12, color: "bg-green-500", width: "14%" },
                        { stage: "Hired", count: 5, color: "bg-emerald-500", width: "6%" },
                      ].map((stage, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm w-20 text-muted-foreground">{stage.stage}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", stage.color)} style={{ width: stage.width }} />
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8">{stage.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-500" />
                      Hiring Efficiency
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Avg. Time to Hire", value: "18 days", trend: "↓ 3 days" },
                        { label: "Interview Rate", value: "32%", trend: "↑ 5%" },
                        { label: "Offer Acceptance", value: "80%", trend: "↑ 10%" },
                        { label: "Quality Score", value: "4.2/5", trend: "Stable" },
                      ].map((metric, i) => (
                        <div key={i} className="text-center p-3 rounded-lg bg-background/50">
                          <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                          <p className="text-base sm:text-lg font-bold">{metric.value}</p>
                          <p className="text-xs text-green-600">{metric.trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl scale-110" />
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Resume Logik vs Traditional ATS
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              See why growing businesses choose Resume Logik over expensive enterprise solutions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border overflow-hidden shadow-lg overflow-x-auto"
          >
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-sm">Feature</th>
                  <th className="px-4 sm:px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <img src={logoImage} alt="Resume Logik" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
                      <span className="text-sm">Resume Logik</span>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-muted-foreground text-sm">Traditional ATS</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">{row.feature}</td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {row.hrNexus === true ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-green-600">{row.hrNexus}</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {row.traditional === true ? (
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : row.traditional === false ? (
                        <span className="text-muted-foreground">✕</span>
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground">{row.traditional}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-white text-center"
          >
            {[
              { stat: "85%", label: "AI Resume Detection Accuracy" },
              { stat: "2hrs", label: "Saved Per Job Posting" },
              { stat: "10+", label: "HR Modules Included" },
              { stat: "$0", label: "To Get Started" },
            ].map((item, index) => (
              <div key={index}>
                <div className="text-3xl sm:text-5xl font-bold mb-2">{item.stat}</div>
                <div className="text-white/80 text-sm sm:text-base">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hiring Process
            </span>
            ?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8">
            Join small businesses who've ditched overpriced ATS systems for something that actually works.
          </p>
          
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 w-full sm:w-auto" asChild data-testid="button-final-cta">
            <a href="/auth">
              Start Using Resume Logik Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>

          <p className="mt-6 text-xs sm:text-sm text-muted-foreground">
            No credit card required • Free forever plan available • Set up in minutes
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={logoImage} alt="Resume Logik" className="h-10 object-contain" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              © 2025 Resume Logik. AI-powered HR for modern businesses.
            </p>
            <div className="flex gap-6 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
