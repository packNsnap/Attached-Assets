import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Briefcase,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const audiences = [
  {
    title: "Small & Mid-Sized Businesses (SMBs)",
    subtitle: "Ideal for Growing Companies",
    description: "Hiring mistakes are expensive — especially when you don't have a full HR team.",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
    benefits: [
      "Screen resumes faster without cutting corners",
      "Catch inconsistencies early",
      "Avoid over-reliance on \"gut feel\"",
      "Create a more structured, repeatable hiring process",
    ],
    tagline: "Instead of reading every resume line-by-line, your team reviews what actually matters.",
  },
  {
    title: "In-House HR & People Ops",
    subtitle: "Built for HR Teams",
    description: "When resume volume increases, consistency usually drops.",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    benefits: [
      "Applying the same analysis logic to every candidate",
      "Highlighting issues that might be overlooked during manual review",
      "Reducing bias caused by inconsistent reviewer standards",
      "Creating documented, explainable screening insights",
    ],
    tagline: "It acts as a second set of eyes — not a decision-maker.",
  },
  {
    title: "Recruiting Agencies & Talent Partners",
    subtitle: "Designed for Recruiters & Staffing Firms",
    description: "Speed matters — but quality matters more.",
    icon: Briefcase,
    color: "from-green-500 to-emerald-500",
    benefits: [
      "Pre-screen candidates faster without sacrificing accuracy",
      "Identify resumes that need follow-up before submission",
      "Reduce back-and-forth with clients over candidate quality",
      "Present stronger, more defensible shortlists",
    ],
    tagline: "You stay in control of placement decisions. ResumeLogik helps protect your reputation.",
  },
  {
    title: "Department Leads & First-Line Reviewers",
    subtitle: "Useful for Hiring Managers",
    description: "Not every hiring manager is trained to spot resume issues.",
    icon: UserCheck,
    color: "from-orange-500 to-amber-500",
    benefits: [
      "Flags inconsistencies in plain language",
      "Helps non-HR reviewers know what to question",
      "Improves interview quality by surfacing targeted follow-ups",
      "Saves time without removing judgment",
    ],
    tagline: "The result: better interviews, fewer surprises.",
  },
];

const beforeAfter = {
  before: [
    "Manual resume reviews",
    "Inconsistent screening criteria",
    "Missed red flags",
    "Time wasted on poor-fit candidates",
  ],
  after: [
    "AI-assisted resume analysis in minutes",
    "Clear risk indicators and explanations",
    "Faster shortlisting",
    "Better interview preparation",
  ],
};

const improves = [
  "Identify potential inconsistencies early",
  "Spot resumes that appear inflated or overly polished",
  "Catch copy-paste errors and timeline issues",
  "Ask smarter interview questions",
  "Create consistency across reviewers",
];

const doesNot = [
  "Make hiring decisions",
  "Reject candidates automatically",
  "Verify background information",
  "Replace interviews or reference checks",
];

const impactScenarios = [
  "Resume volume is high",
  "Teams are short-staffed",
  "Hiring timelines are tight",
  "Consistency matters",
  "Bad hires are costly",
];

export default function WhoItsForPage() {
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
                <span className="text-sm font-medium text-foreground cursor-pointer">Who It's For</span>
              </Link>
              <Link href="/what-we-catch">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">What We Catch</span>
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
            <Badge variant="outline" className="mb-4 px-4 py-1">
              <Users className="w-3 h-3 mr-2" />
              Built for Hiring Teams
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Who ResumeLogik Is For
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              ResumeLogik is built for companies that hire people — not paperwork.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              If your team reviews resumes, screens candidates, or supports hiring decisions, ResumeLogik gives you a faster, more consistent way to spot risks, gaps, and inconsistencies before they turn into bad hires.
            </p>
            <p className="mt-6 text-primary font-medium">
              This is not automation for automation's sake. It's clarity at the earliest stage of hiring.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {audiences.map((audience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${audience.color} flex items-center justify-center mb-4`}>
                      <audience.icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{audience.subtitle}</p>
                    <h3 className="text-xl font-bold mb-3">{audience.title}</h3>
                    <p className="text-muted-foreground mb-4">{audience.description}</p>
                    <p className="text-sm font-medium mb-3">ResumeLogik helps by:</p>
                    <ul className="space-y-2 mb-4">
                      {audience.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
                      {audience.tagline}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-3xl font-bold mb-4">How ResumeLogik Speeds Up Hiring Workflows</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-red-200 dark:border-red-900/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-bold">Before ResumeLogik</h3>
                </div>
                <ul className="space-y-3">
                  {beforeAfter.before.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-900/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold">With ResumeLogik</h3>
                </div>
                <ul className="space-y-3">
                  {beforeAfter.after.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mt-8 text-lg font-medium text-primary">
            You spend less time filtering — and more time deciding.
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
            <h2 className="text-3xl font-bold mb-4">What ResumeLogik Improves</h2>
            <p className="text-muted-foreground">(Without Replacing Humans)</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">ResumeLogik helps teams:</h3>
                </div>
                <ul className="space-y-3">
                  {improves.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-bold">It does not:</h3>
                </div>
                <ul className="space-y-3">
                  {doesNot.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-4">Compliance-Conscious by Design</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ResumeLogik is intentionally built as a risk-prevention and decision-support platform, not a background screening service.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-sm font-medium">No external data sources</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-sm font-medium">No employment or education verification</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-sm font-medium">No consumer reports</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-sm font-medium">No eligibility or hiring determinations</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground">
            All insights are derived solely from resume content provided by the employer.
          </p>
          <p className="text-center font-medium text-primary mt-2">
            You remain fully in control of hiring decisions at every stage.
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
            <Target className="w-12 h-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-4">When ResumeLogik Makes the Biggest Impact</h2>
            <p className="text-muted-foreground">ResumeLogik is especially valuable when:</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {impactScenarios.map((scenario, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-2 px-4">
                {scenario}
              </Badge>
            ))}
          </div>

          <p className="text-center text-lg font-medium">
            If resumes are part of your hiring process, ResumeLogik fits.
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
            <div className="space-y-3 text-lg opacity-90 mb-8">
              <p>ResumeLogik helps hiring teams:</p>
              <div className="flex flex-wrap justify-center gap-4 my-4">
                <span className="bg-white/20 px-4 py-2 rounded-full">Move faster</span>
                <span className="bg-white/20 px-4 py-2 rounded-full">Miss less</span>
                <span className="bg-white/20 px-4 py-2 rounded-full">Ask better questions</span>
                <span className="bg-white/20 px-4 py-2 rounded-full">Reduce hiring risk</span>
              </div>
              <p>All without crossing compliance lines or automating decisions that belong to people.</p>
            </div>
            <div className="space-y-2 text-xl font-semibold mb-8">
              <p>It doesn't tell you who to hire.</p>
              <p>It helps you see what to look at.</p>
            </div>
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
