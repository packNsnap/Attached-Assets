import { motion } from "framer-motion";
import {
  FileText,
  Search,
  AlertTriangle,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
  Zap,
  Clock,
  MessageSquare,
  Scale,
  ArrowRight,
  Brain,
  Target,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const steps = [
  {
    number: "01",
    title: "Resume Content Intake",
    description: "The system analyzes the resume text exactly as submitted.",
    details: ["No enrichment", "No verification", "No external lookups"],
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Structural & Consistency Analysis",
    description: "AI evaluates internal consistency across the document.",
    details: [
      "Name, contact, and formatting alignment",
      "Timeline sequencing (gaps, overlaps, unrealistic progression)",
      "Role and responsibility consistency",
      "Education and credential plausibility",
      "Skill alignment relative to stated roles",
    ],
    icon: Search,
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    title: "Authenticity & Risk Signal Detection",
    description: "The platform flags potential risk signals such as:",
    details: [
      "Overly polished or AI-generated language patterns",
      "Skill inflation or role mismatch",
      "Copy-paste errors (wrong names, emails, mismatched companies)",
      "Inconsistent job descriptions across time",
      "Unrealistic career acceleration or compression",
    ],
    icon: AlertTriangle,
    color: "from-orange-500 to-red-500",
  },
  {
    number: "04",
    title: "Scoring & Categorization",
    description: "Results are grouped into actionable categories.",
    details: [
      "Low concern indicators",
      "Moderate review indicators",
      "High-attention risk indicators",
      "Plain-language explanations for each flag",
    ],
    icon: BarChart3,
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "05",
    title: "Human Review & Decision Support",
    description: "You decide what matters. You decide next steps.",
    details: [
      "You decide what to ignore",
      "ResumeLogik never auto-rejects candidates",
      "Never determines eligibility",
    ],
    icon: Users,
    color: "from-indigo-500 to-purple-500",
  },
];

const notDoList = [
  { text: "No employment verification", icon: XCircle },
  { text: "No education verification", icon: XCircle },
  { text: "No criminal history checks", icon: XCircle },
  { text: "No credit reports", icon: XCircle },
  { text: "No identity validation", icon: XCircle },
  { text: "No third-party data sources", icon: XCircle },
  { text: "No hiring recommendations", icon: XCircle },
];

const benefits = [
  {
    title: "Faster Pre-Screening",
    description: "Identify potential issues early without manual resume deep dives.",
    icon: Zap,
  },
  {
    title: "Reduced Hiring Risk",
    description: "Catch inconsistencies and red flags before they become costly mistakes.",
    icon: Shield,
  },
  {
    title: "Better Interview Quality",
    description: "Use flagged areas to guide targeted interview questions.",
    icon: MessageSquare,
  },
  {
    title: "Consistency Across Reviewers",
    description: "Apply the same analytical lens across all candidates.",
    icon: Target,
  },
  {
    title: "Compliance-Friendly Design",
    description: "No external data. No automated decisions. No hidden checks.",
    icon: Scale,
  },
  {
    title: "Time Savings",
    description: "Review more candidates in less time with AI-assisted insights.",
    icon: Clock,
  },
];

export default function HowItWorksPage() {
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
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Features
                </span>
              </Link>
              <Link href="/how-it-works">
                <span className="text-sm font-medium text-foreground cursor-pointer">
                  How It Works
                </span>
              </Link>
              <Link href="/pricing">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Pricing
                </span>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
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
            <Badge variant="outline" className="mb-4 px-4 py-1">
              <Brain className="w-3 h-3 mr-2" />
              AI-Powered Analysis
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              How ResumeLogik Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              AI-Powered Resume Risk Analysis & Hiring Support
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ResumeLogik is an AI-powered resume analysis and risk-prevention platform designed to help employers, recruiters, and agencies make more informed, consistent, and defensible hiring decisions — without replacing human judgment or performing background checks.
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
            className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20"
          >
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <XCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">We do not make hiring decisions.</p>
              </div>
              <div>
                <XCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">We do not verify employment or education.</p>
              </div>
              <div>
                <XCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">We do not access external databases.</p>
              </div>
            </div>
            <div className="text-center mt-6 pt-6 border-t border-primary/20">
              <p className="text-xl font-semibold text-primary">
                ResumeLogik provides decision support, not decisions.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">What ResumeLogik Actually Does</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ResumeLogik analyzes only the information voluntarily provided by a candidate, typically in the form of a resume or application content uploaded by the employer.
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Using proprietary AI logic, the platform evaluates patterns, inconsistencies, and risk indicators commonly associated with resume fraud, exaggeration, or misalignment — then presents those findings in a clear, structured format for human review.
            </p>
            <p className="mt-4 font-medium text-primary">
              Think of ResumeLogik as a pre-screening intelligence layer that helps you ask better questions — not an automated gatekeeper.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">The AI Analysis Process</h2>
            <p className="text-muted-foreground">Step-by-step breakdown of how we analyze resumes</p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-muted-foreground">{step.number}</span>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                        {step.number === "03" && (
                          <p className="mt-4 text-sm italic text-muted-foreground border-l-2 border-orange-500 pl-3">
                            These are signals, not accusations.
                          </p>
                        )}
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
            <h2 className="text-3xl font-bold mb-4">What ResumeLogik Does Not Do</h2>
            <p className="text-muted-foreground">To be explicit about our boundaries</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {notDoList.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
              >
                <Card className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-red-500" />
                    <span className="font-medium">{item.text}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-muted/50 rounded-xl p-6 border"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Why ResumeLogik Is Not a CRA
            </h3>
            <p className="text-muted-foreground mb-4">
              ResumeLogik does not meet the definition of a consumer report under the Fair Credit Reporting Act (FCRA) because:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span>All analysis is derived solely from employer-submitted resume content</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span>No external databases or verification services are used</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span>No factual determinations are made about a candidate's background</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                <span>No pass/fail or hire/no-hire recommendations are issued</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic">
              The platform provides analytical insights, not factual findings. ResumeLogik functions as a risk-prevention and decision-support tool, similar to resume review checklists or internal screening heuristics — enhanced with AI for scale and consistency.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Your Role as the Decision-Maker</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All hiring decisions remain entirely with the employer. ResumeLogik is designed to:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Eye className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Reduce blind spots</h3>
                <p className="text-muted-foreground">Surface issues that might be missed in manual review</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Target className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Improve consistency</h3>
                <p className="text-muted-foreground">Apply the same analytical standards across all reviewers</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Clock className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Surface issues earlier</h3>
                <p className="text-muted-foreground">Catch potential problems earlier in the hiring funnel</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Scale className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Support fairer decisions</h3>
                <p className="text-muted-foreground">Enable more documented and defensible decision-making</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground">
            It is one input among many — not a substitute for interviews, reference checks, background screenings, or professional judgment.
          </p>
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
            <h2 className="text-3xl font-bold mb-4">Key Benefits to Employers & Recruiters</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <benefit.icon className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">Designed for Responsible AI Use</h2>
            <p className="text-muted-foreground">ResumeLogik was built with intentional boundaries</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Eye className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Transparency over automation</h3>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Assistance over authority</h3>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Brain className="w-10 h-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold mb-2">Insight over judgment</h3>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground">
            The platform supports ethical, explainable AI that works alongside human decision-makers — not around them.
          </p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bottom Line</h2>
            <div className="space-y-4 text-lg opacity-90 mb-8">
              <p>ResumeLogik helps you see what's easy to miss,</p>
              <p>question what looks too perfect,</p>
              <p>and hire with more confidence — without crossing compliance lines.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-xl font-semibold">
                You stay in control. The AI stays in its lane.
              </div>
            </div>
            <div className="mt-8">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
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
