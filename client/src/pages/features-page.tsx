import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Brain,
  Zap,
  Shield,
  Eye,
  BarChart3,
  Lock,
  TrendingUp,
  Lightbulb,
  Award,
  AlertTriangle,
  Target,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

const features = [
  {
    category: "Resume Ingestion & Parsing",
    description: "How candidates are analyzed at intake",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    items: [
      {
        feature: "Resume parsing",
        basic: true,
        screening: true,
        ats: true,
        us: true,
        advantage: null,
      },
      {
        feature: "Structured extraction",
        basic: "Basic",
        screening: "Medium",
        ats: "Medium",
        us: "Advanced",
        advantage: "us",
      },
      {
        feature: "Multiple re-analysis per candidate",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Detects parsing inconsistencies",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
    ],
    why: "Others parse once and move on. ResumeLogik treats resumes as iterative artifacts, which mirrors real recruiter behavior.",
  },
  {
    category: "Job Fit & Skill Matching",
    description: "How candidates align with role requirements",
    icon: Target,
    color: "from-green-500 to-emerald-500",
    items: [
      {
        feature: "Keyword matching",
        basic: true,
        screening: true,
        ats: true,
        us: true,
        advantage: null,
      },
      {
        feature: "Semantic skill matching",
        basic: false,
        screening: "Limited",
        ats: "Add-on",
        us: true,
        advantage: "us",
      },
      {
        feature: "Missing vs inflated skill detection",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Role-specific fit explanation",
        basic: false,
        screening: "Limited",
        ats: "Limited",
        us: true,
        advantage: "us",
      },
    ],
    why: "Others score. ResumeLogik explains mismatches and exaggerations.",
  },
  {
    category: "Career Timeline Analysis",
    description: "Understanding work history realism",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    items: [
      {
        feature: "Employment dates",
        basic: true,
        screening: true,
        ats: true,
        us: true,
        advantage: null,
      },
      {
        feature: "Gap detection",
        basic: false,
        screening: "Basic",
        ats: "Basic",
        us: true,
        advantage: "us",
      },
      {
        feature: "Overlap detection",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Promotion velocity logic",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Timeline plausibility",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
    ],
    why: "Most hiring platforms ignore work history timeline patterns. ResumeLogik analyzes them to catch fabricated or misaligned career progressions—catching what other tools miss.",
  },
  {
    category: "Plausibility & Fraud Detection",
    description: "The core differentiator — is this resume credible?",
    icon: Shield,
    color: "from-red-500 to-orange-500",
    items: [
      {
        feature: "Detects 'too perfect' resumes",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Flags unrealistic career jumps",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Skill-scope vs tenure mismatch",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Automatic escalation to deeper analysis",
        basic: false,
        screening: false,
        ats: false,
        us: "Automatic",
        advantage: "us",
      },
      {
        feature: "Explainable fraud signals",
        basic: false,
        screening: "Very limited",
        ats: false,
        us: true,
        advantage: "us",
      },
    ],
    why: "Every red flag comes with a clear, documented reason. You get the confidence to act on ResumeLogik's insights and defend your hiring decisions to leadership or legal teams.",
  },
  {
    category: "Explainability & Trust",
    description: "Making AI decisions auditable and defensible",
    icon: Eye,
    color: "from-indigo-500 to-violet-500",
    items: [
      {
        feature: "Single score output",
        basic: true,
        screening: true,
        ats: true,
        us: false,
        advantage: null,
      },
      {
        feature: "Reasoned breakdown",
        basic: false,
        screening: "Limited",
        ats: "Limited",
        us: true,
        advantage: "us",
      },
      {
        feature: "Primary vs secondary red flags",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Confidence scoring",
        basic: false,
        screening: "Limited",
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Audit-friendly explanations",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
    ],
    why: "Enterprise-grade behavior at SMB-friendly pricing. Compliance and trust drive buyer decisions.",
  },
  {
    category: "Automation Behavior",
    description: "Smart cost and risk management",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    items: [
      {
        feature: "Manual deep review",
        basic: false,
        screening: true,
        ats: false,
        us: false,
        advantage: null,
      },
      {
        feature: "Automatic deep review",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Controlled escalation",
        basic: false,
        screening: false,
        ats: false,
        us: "Tier-based",
        advantage: "us",
      },
      {
        feature: "Cost-aware AI routing",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
    ],
    why: "Smarter automation saves time and protects your hiring budget. ResumeLogik only escalates cases that genuinely need deeper AI analysis, cutting unnecessary costs while improving accuracy.",
  },
  {
    category: "Content Generation",
    description: "Secondary value — supporting features",
    icon: Lightbulb,
    color: "from-cyan-500 to-blue-500",
    items: [
      {
        feature: "Job descriptions",
        basic: "Limited",
        screening: true,
        ats: true,
        us: true,
        advantage: null,
      },
      {
        feature: "Interview questions",
        basic: "Limited",
        screening: true,
        ats: "Limited",
        us: true,
        advantage: "us",
      },
      {
        feature: "Skills tests",
        basic: false,
        screening: "Limited",
        ats: "Limited",
        us: true,
        advantage: "us",
      },
      {
        feature: "HR policies",
        basic: false,
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Onboarding docs",
        basic: false,
        screening: false,
        ats: "Limited",
        us: true,
        advantage: "us",
      },
    ],
    why: "Streamline your entire hiring workflow beyond resume evaluation. Job descriptions, interview prep, skills tests, and onboarding docs—all powered by AI—save your team hours every week.",
  },
  {
    category: "Pricing & Accessibility",
    description: "Who can afford to win with you?",
    icon: Award,
    color: "from-emerald-500 to-teal-500",
    items: [
      {
        feature: "Entry price",
        basic: "$0–$29",
        screening: "$67–$99",
        ats: "$100–$300+",
        us: "$59",
        advantage: "us",
      },
      {
        feature: "Flat monthly pricing",
        basic: "Limited",
        screening: false,
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "SMB-friendly",
        basic: true,
        screening: "Limited",
        ats: false,
        us: true,
        advantage: "us",
      },
      {
        feature: "Enterprise-ready logic",
        basic: false,
        screening: "Limited",
        ats: true,
        us: true,
        advantage: "us",
      },
    ],
    why: "Get enterprise-grade hiring intelligence at SMB pricing. No expensive per-seat licenses, no hidden costs—just one flat monthly price for unlimited candidates and all features.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Logik
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild data-testid="link-pricing">
                <a href="/pricing">Pricing</a>
              </Button>
              <Button variant="ghost" asChild data-testid="link-login">
                <a href="/auth">Log In</a>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild data-testid="link-get-started">
                <a href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Complete Feature Breakdown
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                How ResumeLogik Compares
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Most tools rank resumes. <strong>ResumeLogik evaluates whether they make sense.</strong>
            </p>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Below is a straight, feature-by-feature comparison against the three types of competitors in this space: basic resume parsers, AI screening platforms, and full ATS systems.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {features.map((featureGroup, groupIndex) => {
            const IconComponent = featureGroup.icon;
            return (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: groupIndex * 0.1 }}
              >
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${featureGroup.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold">{featureGroup.category}</h2>
                      <p className="text-sm text-muted-foreground">{featureGroup.description}</p>
                    </div>
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="grid grid-cols-12 gap-3 text-sm font-semibold">
                      <div className="col-span-4 sm:col-span-3">Feature</div>
                      <div className="col-span-2 text-center hidden sm:block">Basic</div>
                      <div className="col-span-2 text-center hidden sm:block">AI Tools</div>
                      <div className="col-span-2 text-center hidden sm:block">ATS</div>
                      <div className="col-span-3 sm:col-span-2 text-center">ResumeLogik</div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {featureGroup.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`grid grid-cols-12 gap-3 px-4 sm:px-6 py-4 text-sm border-t items-center ${
                          itemIndex % 2 === 1 ? "bg-muted/30" : ""
                        }`}
                      >
                        <div className="col-span-4 sm:col-span-3 font-medium">{item.feature}</div>
                        <div className="col-span-2 text-center hidden sm:block">
                          {typeof item.basic === "boolean" ? (
                            item.basic ? (
                              <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
                            ) : (
                              <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded-full" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">{item.basic}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-center hidden sm:block">
                          {typeof item.screening === "boolean" ? (
                            item.screening ? (
                              <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
                            ) : (
                              <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded-full" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">{item.screening}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-center hidden sm:block">
                          {typeof item.ats === "boolean" ? (
                            item.ats ? (
                              <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
                            ) : (
                              <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded-full" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">{item.ats}</span>
                          )}
                        </div>
                        <div className="col-span-3 sm:col-span-2 text-center font-semibold">
                          {typeof item.us === "boolean" ? (
                            item.us ? (
                              <CheckCircle2 className="h-5 w-5 mx-auto text-blue-600" />
                            ) : (
                              <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded-full" />
                            )
                          ) : (
                            <span className="text-xs text-blue-600 font-semibold">{item.us}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">Why you win:</span> {featureGroup.why}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Positioning Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Hiring Teams Choose ResumeLogik</h2>
              <p className="text-lg text-muted-foreground mb-8">
                The core difference between ResumeLogik and other hiring tools:
              </p>
            </div>

            <Card className="border-2 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-8">
                <p className="text-lg font-semibold text-center text-blue-900 dark:text-blue-100 italic">
                  "Most tools rank resumes. ResumeLogik evaluates whether they make sense."
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-8">
                <p className="text-base text-muted-foreground mb-4">
                  Or for enterprise conversations:
                </p>
                <p className="text-base font-medium text-foreground">
                  "ResumeLogik provides automated, explainable plausibility and risk analysis for candidate resumes — something traditional ATS platforms and basic AI screeners do not offer."
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="text-amber-900 dark:text-amber-100">Your Competitive Reality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-2">What Makes ResumeLogik Worth the Investment:</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>✓ Catches fabrication and resume inconsistencies most tools miss</li>
                    <li>✓ Explains every concern in writing—documented for legal compliance</li>
                    <li>✓ Saves you from costly bad hires through smarter resume evaluation</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Who else is solving this problem?</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>✓ Manual screening (expensive and inconsistent)</li>
                    <li>✓ Traditional ATS tools (they rank, they don't evaluate)</li>
                    <li>✓ Basic AI screeners (they miss the red flags that matter)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              See how ResumeLogik's intelligent resume evaluation works in practice.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                asChild
              >
                <a href="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-pricing">
                <a href="/pricing">View Pricing</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
