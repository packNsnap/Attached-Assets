import { useState } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    title: "AI Job Description Generator",
    description: "Create compelling, bias-free job descriptions with AI-powered salary benchmarking in seconds.",
    highlight: "Save 2+ hours per job posting",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Brain,
    title: "Resume Logic Analysis",
    description: "Detect AI-generated resumes, analyze authenticity signals, and get deep candidate insights.",
    highlight: "Spot fake resumes instantly",
    color: "from-purple-500 to-pink-500",
    featured: true
  },
  {
    icon: ClipboardCheck,
    title: "Skills Test Builder",
    description: "Auto-generate role-specific assessments with AI scoring. Send tests and track completions.",
    highlight: "Objective candidate evaluation",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: MessageSquare,
    title: "Interview Assistant",
    description: "Get AI-generated questions based on resume analysis, skills gaps, and role requirements.",
    highlight: "Never run out of questions",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: Users,
    title: "Candidate Management",
    description: "Track candidates through your pipeline with notes, documents, and assessment history.",
    highlight: "Complete candidate profiles",
    color: "from-indigo-500 to-violet-500"
  },
  {
    icon: TrendingUp,
    title: "Hiring Pipeline",
    description: "Visualize your hiring funnel with drag-and-drop stages and real-time analytics.",
    highlight: "Visual workflow management",
    color: "from-rose-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Reference Check Orchestration",
    description: "Streamline reference collection with automated outreach and structured feedback forms.",
    highlight: "Faster reference verification",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: BookOpen,
    title: "HR Policies & Documentation",
    description: "Generate and manage HR policies, employee handbooks, and compliance documents.",
    highlight: "AI-assisted policy creation",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: UserPlus,
    title: "Employee Onboarding",
    description: "Create onboarding checklists, track progress, and ensure smooth employee transitions.",
    highlight: "Structured onboarding flows",
    color: "from-lime-500 to-green-500"
  },
  {
    icon: Award,
    title: "Performance Management",
    description: "Set goals, track achievements, and conduct reviews with AI-powered insights.",
    highlight: "Data-driven performance",
    color: "from-fuchsia-500 to-purple-500"
  }
];

const aiFeatures = [
  {
    icon: AlertTriangle,
    title: "AI Resume Detection",
    description: "Our advanced algorithms analyze writing patterns, structure, and authenticity signals to flag AI-generated content.",
    stats: "85%+ accuracy"
  },
  {
    icon: Eye,
    title: "Authenticity Scoring",
    description: "Get detailed breakdowns of generic writing, specificity levels, and cliché phrases that indicate AI assistance.",
    stats: "10+ signals analyzed"
  },
  {
    icon: Target,
    title: "Skills Gap Analysis",
    description: "Automatically identify missing skills compared to job requirements and generate targeted interview questions.",
    stats: "Real-time matching"
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description: "Receive AI-powered suggestions for interview questions, test topics, and candidate evaluation criteria.",
    stats: "Personalized insights"
  }
];

const comparisonData = [
  { feature: "AI Job Description Generation", hrNexus: true, traditional: false },
  { feature: "AI Resume Analysis & Detection", hrNexus: true, traditional: false },
  { feature: "Automated Skills Testing", hrNexus: true, traditional: "Limited" },
  { feature: "Interview Question Generation", hrNexus: true, traditional: false },
  { feature: "Candidate Pipeline Management", hrNexus: true, traditional: true },
  { feature: "Reference Check Automation", hrNexus: true, traditional: "Manual" },
  { feature: "Onboarding Workflows", hrNexus: true, traditional: true },
  { feature: "Performance Tracking", hrNexus: true, traditional: true },
  { feature: "Starting Price", hrNexus: "Free / Low Cost", traditional: "$5,000+/year" },
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Logik
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild data-testid="link-login">
                <Link href="/auth">Log In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild data-testid="link-get-started">
                <Link href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
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
            {/* Floating module icons */}
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

            {/* Decorative lines */}
            <div className="absolute -left-4 top-20 w-20 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <div className="absolute -left-2 top-40 w-16 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
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
            {/* Floating module icons */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25"
            >
              <Briefcase className="h-7 w-7 text-white" />
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
              className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/25"
            >
              <Users className="h-5 w-5 text-white" />
            </motion.div>

            {/* Decorative dots */}
            <div className="absolute -right-2 top-16 flex flex-col gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500/40" />
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
              <div className="h-1 w-1 rounded-full bg-pink-500/40" />
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              AI-Powered HR for the Modern Workplace
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                Hire Smarter,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Not Harder
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              The complete HR platform that small businesses actually need. AI-powered tools to write job descriptions, 
              <span className="text-foreground font-semibold"> detect fake resumes</span>, build skills tests, and manage your entire hiring pipeline — 
              <span className="text-blue-600 dark:text-blue-400 font-semibold"> without the enterprise price tag</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6" asChild data-testid="button-start-free">
                <Link href="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild data-testid="button-see-features">
                <a href="#features">
                  See All Features
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Set up in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Traditional ATS Systems Are{" "}
              <span className="text-red-500">Broken</span> for Small Businesses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise HR software costs thousands per year and still can't detect AI-generated resumes flooding your inbox.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "$5,000+ Per Year",
                description: "Most ATS platforms charge enterprise prices that small businesses can't afford.",
                icon: "💸"
              },
              {
                title: "Can't Detect AI Resumes",
                description: "70% of job seekers now use AI to write resumes. Traditional systems can't tell the difference.",
                icon: "🤖"
              },
              {
                title: "Complex & Overwhelming",
                description: "Features designed for Fortune 500 companies, not growing teams that need simplicity.",
                icon: "😵"
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
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Detection Feature Highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <Brain className="h-3.5 w-3.5 mr-2" />
              Our Flagship Feature
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Generated Resume Detection
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The hiring landscape has changed. ChatGPT and other AI tools make it easy to create polished resumes — 
              but how do you know who's authentic?
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <Badge variant="secondary" className="text-xs">{feature.stats}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
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
              <div className="p-6 rounded-2xl bg-background border shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Resume Analysis Results</h3>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    AI Detected
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>AI Writing Likelihood</span>
                      <span className="font-semibold text-amber-600">85%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Specificity Score</span>
                      <span className="font-semibold text-amber-600">40%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[40%] bg-gradient-to-r from-green-400 to-amber-500 rounded-full" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Generic Phrases</span>
                      <span className="font-semibold text-red-600">70%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[70%] bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> This resume exhibits multiple AI writing patterns including uniform structure, perfect grammar, and optimized buzzword placement.
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

              {/* Decorative Elements */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2">
              <Zap className="h-3.5 w-3.5 mr-2" />
              Complete HR Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Hire & Manage
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              10 powerful modules designed specifically for small businesses. No enterprise complexity, just what works.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={cn(
                  "group p-5 rounded-xl border bg-background hover:shadow-lg transition-all duration-300 cursor-pointer",
                  feature.featured && "ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5"
                )}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                  feature.color
                )}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{feature.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {feature.highlight}
                </Badge>
                {feature.featured && (
                  <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Resume Logik vs Traditional ATS
            </h2>
            <p className="text-lg text-muted-foreground">
              See why growing businesses choose Resume Logik over expensive enterprise solutions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border overflow-hidden shadow-lg"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span>Resume Logik</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-muted-foreground">Traditional ATS</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-6 py-4 text-sm">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.hrNexus === true ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-green-600">{row.hrNexus}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.traditional === true ? (
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : row.traditional === false ? (
                        <span className="text-muted-foreground">✕</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.traditional}</span>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-white text-center"
          >
            {[
              { stat: "85%", label: "AI Resume Detection Accuracy" },
              { stat: "2hrs", label: "Saved Per Job Posting" },
              { stat: "10+", label: "HR Modules Included" },
              { stat: "$0", label: "To Get Started" },
            ].map((item, index) => (
              <div key={index}>
                <div className="text-5xl font-bold mb-2">{item.stat}</div>
                <div className="text-white/80">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hiring Process
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join small businesses who've ditched overpriced ATS systems for something that actually works.
          </p>
          
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-10 py-7" asChild data-testid="button-final-cta">
            <Link href="/auth">
              Start Using Resume Logik Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Free forever plan available • Set up in minutes
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Resume Logik</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Resume Logik. AI-powered HR for modern businesses.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
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
