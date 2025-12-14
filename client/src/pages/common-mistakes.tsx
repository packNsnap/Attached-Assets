import { motion } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  XCircle,
  Shield,
  Target,
  Brain,
  FileWarning,
  RefreshCw,
  UserX,
  MessageSquare,
  Scale,
  Zap,
  Search,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const blindSpots = [
  {
    text: "Names, emails, or companies that don't match across sections",
    missed: "Often missed under time pressure.",
  },
  {
    text: "Career jumps that are technically possible but statistically unlikely",
    missed: "Often missed under time pressure.",
  },
  {
    text: "Skills listed without evidence of usage",
    missed: "Often missed under time pressure.",
  },
  {
    text: "Job descriptions that repeat across different employers",
    missed: "Often missed under time pressure.",
  },
  {
    text: "Timelines that only work if the candidate worked two full-time roles simultaneously",
    missed: "Often missed under time pressure.",
  },
  {
    text: "AI-written summaries that say everything and prove nothing",
    missed: "Often missed under time pressure.",
  },
];

const outcomes = [
  {
    icon: RefreshCw,
    text: "Wasted interview cycles",
    description: "Hours spent interviewing candidates who shouldn't have passed screening",
  },
  {
    icon: MessageSquare,
    text: "Client complaints",
    description: "For agencies: presenting candidates that don't hold up under scrutiny",
  },
  {
    icon: TrendingDown,
    text: "Team credibility loss",
    description: "When hiring managers question HR's vetting process",
  },
  {
    icon: UserX,
    text: "Re-hiring the same role months later",
    description: "The hidden cost of a bad hire that seemed fine on paper",
  },
  {
    icon: AlertTriangle,
    text: '"We should\'ve caught that" moments',
    description: "The uncomfortable realization after issues surface post-hire",
  },
];

const whoItsFor = [
  "Want fewer surprises after hire",
  "Care about consistency across reviewers",
  "Know resumes are getting harder to trust",
  "Want help without losing control",
];

const whyMistakesGetThrough = [
  { issue: "Reviewers skim", icon: Eye },
  { issue: "Hiring managers assume HR checked", icon: Users },
  { issue: "Recruiters assume candidates vetted themselves", icon: Search },
  { issue: "Everyone is busy", icon: Clock },
];

export default function CommonMistakesPage() {
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
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">What We Catch</span>
              </Link>
              <Link href="/common-mistakes">
                <span className="text-sm font-medium text-foreground cursor-pointer">Common Mistakes</span>
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
            <Badge variant="outline" className="mb-4 px-4 py-1 border-amber-500/30 bg-amber-500/10">
              <Shield className="w-3 h-3 mr-2" />
              Before You Buy
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              The Hiring Mistakes Most Teams Don't Realize They're Making
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Most companies don't think they have a hiring problem. They think they have a time problem.
            </p>
            <p className="text-lg text-primary font-medium max-w-2xl mx-auto">
              The cost isn't time. The cost is false confidence.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">"Looks Good" Is the Most Dangerous Signal</h2>
                    <p className="text-muted-foreground">
                      Bad hires rarely come from "obviously bad" resumes. They come from resumes that look fine.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-background/50 border">
                    <p className="font-semibold mb-2 text-amber-600 dark:text-amber-400">Polished ≠ Accurate</p>
                    <p className="text-sm text-muted-foreground">
                      Beautiful formatting and professional language don't guarantee truthful content.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border">
                    <p className="font-semibold mb-2 text-amber-600 dark:text-amber-400">Confidence ≠ Consistency</p>
                    <p className="text-sm text-muted-foreground">
                      Strong claims mean nothing if they contradict other parts of the resume.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border">
                    <p className="font-semibold mb-2 text-amber-600 dark:text-amber-400">Length ≠ Experience</p>
                    <p className="text-sm text-muted-foreground">
                      More words often mask lack of substance, especially with AI-generated content.
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-center text-muted-foreground italic">
                  AI-generated resumes amplify this problem. ResumeLogik doesn't judge quality — it checks coherence.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">The Most Common Resume Blind Spots</h2>
            <p className="text-muted-foreground">Concrete, painful examples that slip through every day</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {blindSpots.map((spot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <FileWarning className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-2">{spot.text}</p>
                        <p className="text-sm text-muted-foreground italic">{spot.missed}</p>
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why These Mistakes Get Through Anyway</h2>
            <p className="text-muted-foreground">Let's be blunt about the reality</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {whyMistakesGetThrough.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card className="text-center h-full">
                  <CardContent className="p-6">
                    <item.icon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">{item.issue}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center border border-primary/20"
          >
            <Brain className="w-12 h-12 mx-auto text-primary mb-4" />
            <p className="text-xl font-semibold mb-2">ResumeLogik doesn't get tired.</p>
            <p className="text-xl font-semibold mb-2">It doesn't rush.</p>
            <p className="text-xl font-semibold text-primary">It doesn't assume.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-red-500/5 to-orange-500/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">What This Actually Prevents</h2>
            <p className="text-muted-foreground">Tied to outcomes, not fear</p>
          </motion.div>

          <div className="space-y-4">
            {outcomes.map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                        <outcome.icon className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{outcome.text}</p>
                        <p className="text-sm text-muted-foreground">{outcome.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 text-muted-foreground italic">
            ResumeLogik reduces the odds of these outcomes — it doesn't guarantee perfection. That honesty builds trust.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">This Is Not About Rejecting More Candidates</h2>
            <p className="text-muted-foreground">Important compliance-safe positioning</p>
          </motion.div>

          <Card className="border-green-500/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    ResumeLogik Does NOT:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                      <span>Auto-reject candidates</span>
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                      <span>Score people as "good" or "bad"</span>
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                      <span>Decide eligibility</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ResumeLogik DOES:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span>Help you pause</span>
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span>Help you question</span>
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span>Help you verify — before it's expensive</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <h2 className="text-3xl font-bold mb-4">Who This Page Is Really For</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {whoItsFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card className="h-full border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="font-medium">Teams who {item.toLowerCase()}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-lg font-medium text-primary">
            If that's you, ResumeLogik fits.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              It's Not Marketing Hype
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              It's professional self-awareness. Catch the mistakes that cost teams time, money, and credibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 hover:bg-white/10">
                  View Pricing
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
