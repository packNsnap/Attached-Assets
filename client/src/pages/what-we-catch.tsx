import { motion } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  Copy,
  TrendingUp,
  Calendar,
  Bot,
  CheckCircle2,
  ArrowRight,
  XCircle,
  Search,
  Zap,
  Shield,
  Target,
  FileWarning,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const catchCategories = [
  {
    icon: Copy,
    title: "Copy-Paste Errors",
    description: "Wrong company names, mismatched emails, or leftover template text that candidates forgot to change.",
    examples: [
      "Resume says 'Dear [Company Name]' in summary",
      "Email domain doesn't match the stated employer",
      "Same bullet points across different job entries",
      "Wrong name in the header vs. email signature",
    ],
    humanMisses: "Humans skim and miss template artifacts",
    aiCatches: "AI flags inconsistencies between sections",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: TrendingUp,
    title: "Inflated Titles & Responsibilities",
    description: "Job titles that don't match the described responsibilities, or claims that seem unrealistic for the role level.",
    examples: [
      "'VP of Operations' at a 3-person startup with entry-level tasks",
      "'Led a team of 50' but was there for only 6 months",
      "Technical skills listed that don't align with job descriptions",
      "'Director' title with individual contributor responsibilities",
    ],
    humanMisses: "Impressive titles can cloud judgment",
    aiCatches: "AI cross-references titles with stated responsibilities",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Timeline Inconsistencies",
    description: "Overlapping jobs, impossible gaps, or career progressions that don't add up mathematically.",
    examples: [
      "Two full-time jobs with overlapping dates",
      "Graduated in 2018 but started first job in 2015",
      "5 years of experience but tenure adds up to 2 years",
      "Unexplained 3-year gap hidden by 'creative' date formatting",
    ],
    humanMisses: "Manual date math is tedious and error-prone",
    aiCatches: "AI automatically calculates and validates all timelines",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI-Generated Fluff",
    description: "Overly polished, generic language that lacks specificity — a hallmark of ChatGPT-generated resumes.",
    examples: [
      "Buzzword-heavy summaries with no concrete achievements",
      "'Results-driven professional' with no actual results listed",
      "Identical phrasing patterns across different sections",
      "Unusually perfect grammar but vague on details",
    ],
    humanMisses: "Polished writing looks professional at first glance",
    aiCatches: "AI detects generic patterns and lack of specificity",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: FileWarning,
    title: "Credential Red Flags",
    description: "Education claims that don't quite add up or certifications that seem misaligned with career stage.",
    examples: [
      "Degree from institution with no record of that program",
      "'MBA' but no undergraduate degree listed",
      "20 certifications earned in a single year",
      "Advanced certifications without prerequisite experience",
    ],
    humanMisses: "Verifying every credential is impractical",
    aiCatches: "AI flags implausible credential combinations",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Target,
    title: "Skills Mismatch",
    description: "Listed skills that don't match the roles described, or technical claims that don't align with experience level.",
    examples: [
      "'Expert in Python' but no technical roles in history",
      "Claims 10 years of React experience (React is 11 years old)",
      "Advanced skills listed but no projects to demonstrate them",
      "Skill list that exactly matches job posting keywords",
    ],
    humanMisses: "Hard to spot keyword stuffing without context",
    aiCatches: "AI validates skills against actual experience described",
    color: "from-indigo-500 to-purple-500",
  },
];

const comparisonExamples = [
  {
    category: "Copy-Paste Error",
    resumeText: '"I am excited to join Google and contribute to your innovative culture..." ',
    issue: "Resume was submitted to a different company",
    humanView: "Might skim past the introduction paragraph",
    aiView: "Flags company name mismatch with application",
    severity: "high",
  },
  {
    category: "Timeline Issue",
    resumeText: "Senior Manager at ABC Corp (2019-2022) | Director at XYZ Inc (2020-2023)",
    issue: "Two senior full-time roles overlapping by 2 years",
    humanView: "Dates are formatted differently, easy to miss",
    aiView: "Automatically calculates overlap: 24 months conflict",
    severity: "high",
  },
  {
    category: "AI-Generated Content",
    resumeText: '"Dynamic, results-oriented professional with a proven track record of delivering exceptional outcomes..."',
    issue: "No specific achievements, pure buzzwords",
    humanView: "Sounds professional and polished",
    aiView: "Detects generic patterns, flags lack of specifics",
    severity: "medium",
  },
  {
    category: "Inflated Title",
    resumeText: '"VP of Engineering at TechStartup (5 employees)"',
    issue: "VP title at a 5-person company with junior-level tasks",
    humanView: "VP title is impressive on paper",
    aiView: "Cross-references title with company size and responsibilities",
    severity: "medium",
  },
];

const stats = [
  { value: "70%+", label: "of candidates use AI to write resumes" },
  { value: "40%", label: "of resumes contain some exaggeration" },
  { value: "2-3min", label: "average time recruiters spend per resume" },
  { value: "85%+", label: "detection accuracy with ResumeLogik" },
];

export default function WhatWeCatchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer">
                ResumeLogik
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/features">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Features</span>
              </Link>
              <Link href="/how-it-works">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">How It Works</span>
              </Link>
              <Link href="/who-its-for">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Who It's For</span>
              </Link>
              <Link href="/what-we-catch">
                <span className="text-sm font-medium text-foreground cursor-pointer">What We Catch</span>
              </Link>
              <Link href="/common-mistakes">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Common Mistakes</span>
              </Link>
              <Link href="/pricing">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</span>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1 border-orange-500/30 bg-orange-500/10">
              <Eye className="w-3 h-3 mr-2" />
              AI-Powered Detection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              What We Catch That Humans Miss
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              The average recruiter spends 2-3 minutes per resume. In that time, subtle red flags slip through.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ResumeLogik analyzes every detail in seconds — catching copy-paste errors, timeline gaps, inflated titles, and AI-generated fluff that human reviewers routinely miss.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Six Categories of Resume Red Flags</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real issues we catch every day — not theoretical problems, but actual resume mistakes that cost companies time and money.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {catchCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {category.examples.map((example, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Human:</strong> {category.humanMisses}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>AI:</strong> {category.aiCatches}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Side-by-Side: What Humans See vs. What AI Catches</h2>
            <p className="text-muted-foreground">Real examples of how AI analysis differs from human review</p>
          </motion.div>

          <div className="space-y-6">
            {comparisonExamples.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-muted/50 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <Badge variant={example.severity === "high" ? "destructive" : "secondary"}>
                          {example.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {example.severity === "high" ? "High Priority Flag" : "Medium Priority Flag"}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-muted/30 rounded-lg p-4 mb-4 font-mono text-sm border-l-4 border-primary">
                        {example.resumeText}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Issue:</strong> {example.issue}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-sm">Human Review</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{example.humanView}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-sm">AI Analysis</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{example.aiView}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why This Matters</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A bad hire can cost 30-50% of their annual salary. Catching resume issues early saves time, money, and team morale.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Save Screening Time</h3>
                <p className="text-sm text-muted-foreground">
                  AI flags issues in seconds, not minutes. Review more candidates faster.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Reduce Hiring Risk</h3>
                <p className="text-sm text-muted-foreground">
                  Catch red flags before they become expensive problems post-hire.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Search className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Ask Better Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Use AI insights to guide more targeted interview conversations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-muted/50 rounded-2xl p-8 border"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">Important: AI Assists, You Decide</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  What ResumeLogik Does
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Flags potential issues for review</li>
                  <li>Provides context and explanations</li>
                  <li>Surfaces patterns humans might miss</li>
                  <li>Saves time on initial screening</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  What ResumeLogik Doesn't Do
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Make hiring decisions for you</li>
                  <li>Verify employment or credentials</li>
                  <li>Access external databases</li>
                  <li>Replace human judgment</li>
                </ul>
              </div>
            </div>
            <p className="text-center mt-6 text-sm text-muted-foreground italic">
              Every flag is a signal for investigation, not a verdict. You stay in control.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Stop Missing What Matters
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join teams that use AI to catch resume issues before they become costly hiring mistakes. Start screening smarter today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 hover:bg-white/10">
                  See How It Works
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ResumeLogik. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
