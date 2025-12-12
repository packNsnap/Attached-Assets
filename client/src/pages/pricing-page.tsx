import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Building2, Crown, ArrowRight, Users, FileText, Brain, ClipboardCheck, MessageSquare, Calendar, BookOpen, Mail, Briefcase, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const allFeatures = [
  { icon: Brain, text: "Resume Logic Analyzer" },
  { icon: FileText, text: "AI Job Description Generator" },
  { icon: ClipboardCheck, text: "AI Skills Test Builder" },
  { icon: MessageSquare, text: "Interview Question Generator" },
  { icon: Zap, text: "Workflow Automations" },
  { icon: BookOpen, text: "Offer Letter / Onboarding Docs" },
  { icon: BookOpen, text: "HR Policies & Handbooks" },
  { icon: Mail, text: "Reference Email Generator" },
  { icon: Calendar, text: "Calendar Scheduling" },
  { icon: FileText, text: "All Templates" },
  { icon: Users, text: "Unlimited Users per Company" },
];

const pricingTiers = [
  {
    name: "Free",
    planKey: "free",
    subtitle: "Free Forever",
    price: "$0",
    period: "/ month",
    description: "Perfect for solopreneurs, micro-businesses, or first-time testers.",
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-200 dark:border-slate-700",
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    limits: [
      "1 active job position",
      "3 candidates per month",
      "10 AI actions per candidate",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    popular: false,
    stripeProductName: null,
  },
  {
    name: "Growth",
    planKey: "growth",
    subtitle: "Growing Teams",
    price: "$29",
    period: "/ month",
    description: "Ideal for small businesses hiring occasionally throughout the year.",
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    limits: [
      "5 active job positions",
      "25 candidates per month",
      "15 AI actions per candidate",
    ],
    cta: "Start with Growth",
    ctaVariant: "outline" as const,
    popular: false,
    stripeProductName: "Growth",
  },
  {
    name: "Pro",
    planKey: "pro",
    subtitle: "Most Popular",
    price: "$49.99",
    period: "/ month",
    description: "For growing companies, agencies, or businesses hiring regularly.",
    color: "from-blue-500 to-purple-600",
    borderColor: "border-purple-300 dark:border-purple-700",
    bgColor: "bg-gradient-to-b from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20",
    limits: [
      "20 active job positions",
      "150 candidates per month",
      "20 AI actions per candidate",
    ],
    cta: "Start with Pro",
    ctaVariant: "default" as const,
    popular: true,
    stripeProductName: "Pro",
  },
  {
    name: "Enterprise",
    planKey: "enterprise",
    subtitle: "Custom Solutions",
    price: "$150",
    period: "/ month",
    description: "Unlimited scale with custom integrations and dedicated support.",
    color: "from-orange-500 to-red-600",
    borderColor: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    limits: [
      "Unlimited job positions",
      "1000+ candidates per month",
      "10 AI actions per candidate",
      "SSO & Custom Integrations",
      "Priority Support & Onboarding",
    ],
    cta: "Start with Enterprise",
    ctaVariant: "outline" as const,
    popular: false,
    stripeProductName: "Enterprise",
  },
];

export default function PricingPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: productsData } = useQuery({
    queryKey: ["/api/stripe/products"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/products", { credentials: "include" });
      if (!res.ok) return { products: [] };
      return res.json();
    },
    retry: false,
  });

  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: ["/api/stripe/subscription-status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription-status", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing. Your account has been upgraded.",
      });
      refetchSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("canceled") === "true") {
      toast({
        title: "Checkout canceled",
        description: "You can try again whenever you're ready.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, refetchSubscription]);

  const handleCheckout = async (tier: typeof pricingTiers[0]) => {
    if (!tier.stripeProductName) {
      window.location.href = "/api/login";
      return;
    }

    const product = productsData?.products?.find(
      (p: any) => p.product_name === tier.stripeProductName
    );

    if (!product?.price_id) {
      toast({
        title: "Product not available",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(tier.planKey);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          priceId: product.price_id,
          plan: tier.planKey,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/api/login";
          return;
        }
        throw new Error("Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create portal session");

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentPlan = subscriptionData?.plan || "free";

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
              {subscriptionData?.hasActiveSubscription && (
                <Button variant="outline" onClick={handleManageSubscription} data-testid="button-manage-subscription">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
              <Button variant="ghost" asChild data-testid="link-login">
                <a href="/api/login">Log In</a>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild data-testid="link-get-started">
                <a href="/api/login">
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

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Simple, Transparent Pricing
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                One Platform,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Every Feature Included
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All plans include the complete HR suite. The only difference is how much you can use it.
              No hidden fees, no feature gating.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1">
                      <Crown className="h-3.5 w-3.5 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full ${tier.bgColor} ${tier.borderColor} ${tier.popular ? 'border-2 shadow-xl shadow-purple-500/10' : ''}`}>
                  <CardHeader className="pb-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                      {tier.name === "Free" && <Sparkles className="h-6 w-6 text-white" />}
                      {tier.name === "Growth" && <Zap className="h-6 w-6 text-white" />}
                      {tier.name === "Pro" && <Briefcase className="h-6 w-6 text-white" />}
                      {tier.name === "Enterprise" && <Building2 className="h-6 w-6 text-white" />}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription className="text-sm">{tier.subtitle}</CardDescription>
                    </div>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">Plan Limits:</p>
                      {tier.limits.map((limit, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm">{limit}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full ${tier.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                      variant={tier.ctaVariant}
                      disabled={checkoutLoading === tier.planKey || currentPlan === tier.planKey}
                      onClick={() => handleCheckout(tier)}
                      data-testid={`button-tier-${tier.name.toLowerCase()}`}
                    >
                      {checkoutLoading === tier.planKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : currentPlan === tier.planKey ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          {tier.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Every Plan Includes the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Full HR Suite
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No feature gating. Every tool, every template, every automation — included in all plans.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {allFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-background rounded-xl p-4 border shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">What counts as an "AI action"?</h3>
              <p className="text-muted-foreground">
                AI actions include running the Resume Logic analyzer, generating interview questions, 
                creating skills tests, or generating job descriptions. Each candidate gets 2 AI actions, 
                so you can analyze their resume and generate interview questions.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can change your plan at any time. Upgrades take effect immediately, 
                and downgrades apply at the start of your next billing cycle.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">What happens if I exceed my limits?</h3>
              <p className="text-muted-foreground">
                We'll notify you when you're approaching your limits. You can upgrade your plan 
                or wait until the next month when your limits reset.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Is there a contract or commitment?</h3>
              <p className="text-muted-foreground">
                No contracts! All plans are month-to-month. Cancel anytime with no penalties.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600" id="contact">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start free today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8"
                asChild
                data-testid="button-pricing-cta"
              >
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
                asChild
                data-testid="button-contact-sales"
              >
                <a href="mailto:sales@resumelogik.com">
                  Contact Sales
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/">
              <a className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">Resume Logik</span>
              </a>
            </Link>
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
