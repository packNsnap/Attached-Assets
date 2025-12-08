import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, BookOpen, Copy, Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getModuleByPath } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  policyType: z.string().min(1, "Policy type is required"),
  industry: z.string().min(1, "Industry is required"),
  teamSize: z.string().min(1, "Team size is required"),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedPolicy = {
  title: string;
  content: string;
  sections: string[];
} | null;

export default function PoliciesDocsModule() {
  const [result, setResult] = useState<GeneratedPolicy>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      policyType: "",
      industry: "",
      teamSize: "",
      additionalNotes: "",
    },
  });

  function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generatePolicy(values);
      setResult(generated);
      setIsGenerating(false);
      toast({
        title: "Policy Generated",
        description: "Your HR policy document is ready.",
      });
    }, 1000);
  }

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    toast({
      title: "Copied to clipboard",
      description: "Policy content copied successfully.",
    });
  };

  const downloadAsText = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const module = getModuleByPath("/policies");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Policies & Documents"
        description="Generate professional HR policies and document templates for your organization."
        icon={module.icon}
        gradient={module.color}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
            <CardDescription>Configure your policy document</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corporation" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-policy-type">
                            <SelectValue placeholder="Select policy type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote-work">Remote Work Policy</SelectItem>
                          <SelectItem value="pto">PTO & Leave Policy</SelectItem>
                          <SelectItem value="code-of-conduct">Code of Conduct</SelectItem>
                          <SelectItem value="anti-harassment">Anti-Harassment Policy</SelectItem>
                          <SelectItem value="expense">Expense Reimbursement Policy</SelectItem>
                          <SelectItem value="social-media">Social Media Policy</SelectItem>
                          <SelectItem value="dress-code">Dress Code Policy</SelectItem>
                          <SelectItem value="confidentiality">Confidentiality Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-team-size">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific requirements or clauses to include..."
                          className="min-h-[80px]"
                          {...field} 
                          data-testid="input-additional-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating} data-testid="button-generate">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate Policy
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{result.title}</CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {result.sections.map((section, i) => (
                        <Badge key={i} variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={downloadAsText} data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded border max-h-[500px] overflow-y-auto font-mono" data-testid="text-policy-content">
                  {result.content}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/10 border-dashed h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Fill the form to generate a policy document</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function generatePolicy(values: FormValues): GeneratedPolicy {
  const { companyName, policyType, industry, teamSize } = values;
  
  const policyNames: Record<string, string> = {
    "remote-work": "Remote Work Policy",
    "pto": "Paid Time Off & Leave Policy",
    "code-of-conduct": "Code of Conduct",
    "anti-harassment": "Anti-Harassment Policy",
    "expense": "Expense Reimbursement Policy",
    "social-media": "Social Media Policy",
    "dress-code": "Dress Code Policy",
    "confidentiality": "Confidentiality Agreement",
  };

  const title = `${companyName} - ${policyNames[policyType] || "HR Policy"}`;
  
  const policies: Record<string, { content: string; sections: string[] }> = {
    "remote-work": {
      sections: ["Eligibility", "Work Hours", "Equipment", "Communication"],
      content: `${companyName.toUpperCase()}
REMOTE WORK POLICY

Effective Date: ${new Date().toLocaleDateString()}
Industry: ${industry}
Applicable to: All ${teamSize} employees

1. PURPOSE
This policy establishes guidelines for remote work arrangements at ${companyName}. We believe flexible work options enhance productivity and work-life balance.

2. ELIGIBILITY
- All employees who have completed their probationary period
- Roles that can be performed effectively outside the office
- Employees in good standing with satisfactory performance reviews

3. WORK HOURS & AVAILABILITY
- Core hours: 10:00 AM - 3:00 PM (local time zone)
- Employees must be available during core hours for meetings
- Flexible scheduling outside core hours with manager approval
- Weekly working hours remain unchanged

4. EQUIPMENT & WORKSPACE
- ${companyName} will provide: laptop, monitor, keyboard, mouse
- Employees must maintain a dedicated, secure workspace
- High-speed internet (minimum 25 Mbps) required
- Equipment stipend: $500 for home office setup

5. COMMUNICATION EXPECTATIONS
- Respond to messages within 2 business hours during work hours
- Camera on during video meetings unless otherwise agreed
- Daily check-in with team via designated channels
- Weekly 1:1 meetings with direct manager

6. SECURITY & CONFIDENTIALITY
- Use company VPN when accessing sensitive systems
- Lock computer when stepping away
- No work in public spaces without privacy screen
- Report any security incidents immediately

7. PERFORMANCE MANAGEMENT
- Regular performance reviews remain unchanged
- Focus on output and deliverables, not hours logged
- Clear goals and expectations set by managers

This policy may be updated as ${companyName} evolves its remote work practices.

Acknowledged by: ____________________
Date: ____________________`
    },
    "pto": {
      sections: ["Annual Leave", "Sick Leave", "Holidays", "Special Leave"],
      content: `${companyName.toUpperCase()}
PAID TIME OFF & LEAVE POLICY

Effective Date: ${new Date().toLocaleDateString()}

1. ANNUAL LEAVE ENTITLEMENT
- 0-2 years: 15 days per year
- 3-5 years: 20 days per year
- 6+ years: 25 days per year

2. SICK LEAVE
- 10 paid sick days per year
- Doctor's note required for absences over 3 consecutive days
- Unused sick days do not carry over

3. COMPANY HOLIDAYS
${companyName} observes the following holidays:
- New Year's Day
- Memorial Day
- Independence Day
- Labor Day
- Thanksgiving (2 days)
- Christmas Eve & Day
- Additional floating holiday

4. SPECIAL LEAVE
- Bereavement: 3-5 days depending on relationship
- Jury Duty: Full pay for duration
- Parental Leave: 12 weeks paid
- Marriage: 5 days

5. REQUEST PROCESS
- Submit requests via HR system minimum 2 weeks in advance
- Manager approval required for all leave
- Emergency leave: Notify manager ASAP

6. CARRYOVER
- Maximum 5 days can be carried to next year
- Must be used by March 31

Contact HR with any questions about this policy.`
    },
    "code-of-conduct": {
      sections: ["Ethics", "Workplace Behavior", "Conflicts of Interest", "Reporting"],
      content: `${companyName.toUpperCase()}
CODE OF CONDUCT

1. OUR VALUES
At ${companyName}, we are committed to:
- Integrity in all our actions
- Respect for every individual
- Excellence in our work
- Accountability for our decisions

2. PROFESSIONAL BEHAVIOR
All employees are expected to:
- Treat colleagues, clients, and partners with respect
- Communicate professionally and constructively
- Maintain a positive and collaborative work environment
- Arrive on time and meet deadlines

3. ETHICS & INTEGRITY
- Always act honestly and transparently
- Never misrepresent information
- Protect confidential information
- Follow all applicable laws and regulations

4. CONFLICTS OF INTEREST
- Disclose any potential conflicts to your manager
- Do not accept gifts over $50 from vendors
- Outside employment requires HR approval
- Do not use company resources for personal gain

5. WORKPLACE SAFETY
- Report unsafe conditions immediately
- Follow all safety procedures
- Keep workspaces clean and organized
- Participate in safety training

6. DIGITAL CONDUCT
- Use company technology responsibly
- Protect passwords and access credentials
- Do not access inappropriate content
- Follow data privacy guidelines

7. REPORTING VIOLATIONS
- Report concerns to your manager or HR
- Anonymous reporting available through ethics hotline
- No retaliation for good-faith reports
- Investigations conducted confidentially

Violations may result in disciplinary action up to termination.`
    },
    "anti-harassment": {
      sections: ["Definitions", "Prohibited Conduct", "Reporting", "Investigation"],
      content: `${companyName.toUpperCase()}
ANTI-HARASSMENT POLICY

1. COMMITMENT
${companyName} is committed to providing a work environment free from harassment, discrimination, and retaliation. This policy applies to all employees, contractors, vendors, and visitors.

2. DEFINITIONS
Harassment includes unwelcome conduct based on:
- Race, color, or national origin
- Religion or creed
- Sex, gender, or sexual orientation
- Age or disability
- Any other protected characteristic

3. PROHIBITED CONDUCT
The following behaviors are strictly prohibited:
- Verbal: Slurs, jokes, comments, epithets
- Physical: Assault, unwanted touching, blocking movement
- Visual: Offensive posters, drawings, emails, gestures
- Sexual: Unwanted advances, requests for favors, inappropriate comments

4. REPORTING PROCEDURES
If you experience or witness harassment:
- Report to your manager, HR, or any member of leadership
- Email: hr@${companyName.toLowerCase().replace(/\s+/g, "")}.com
- Anonymous hotline available 24/7

5. INVESTIGATION PROCESS
- All complaints investigated promptly and thoroughly
- Confidentiality maintained to extent possible
- Both parties interviewed separately
- Findings documented and appropriate action taken

6. NO RETALIATION
Retaliation against anyone who reports harassment or participates in an investigation is strictly prohibited and will result in disciplinary action.

7. CONSEQUENCES
Violations will result in appropriate disciplinary action, which may include termination of employment.

${companyName} takes all complaints seriously. Thank you for helping maintain a respectful workplace.`
    },
    "expense": {
      sections: ["Eligible Expenses", "Limits", "Submission", "Approval"],
      content: `${companyName.toUpperCase()}
EXPENSE REIMBURSEMENT POLICY

1. PURPOSE
This policy outlines procedures for business expense reimbursement at ${companyName}.

2. ELIGIBLE EXPENSES
- Travel: Airfare, hotels, rental cars, rideshare
- Meals: Business meals with clients or during travel
- Office Supplies: Pre-approved items only
- Professional Development: Conferences, training, courses
- Client Entertainment: With prior approval

3. EXPENSE LIMITS
- Meals (per day): $75
- Hotel (per night): $200 (higher in major cities with approval)
- Mileage: IRS standard rate
- Client entertainment: $100 per person (requires approval)

4. NON-REIMBURSABLE EXPENSES
- Personal items
- Alcohol (except approved client entertainment)
- Traffic violations or parking tickets
- Personal travel extensions
- Upgrades without approval

5. SUBMISSION REQUIREMENTS
- Submit within 30 days of expense
- Original itemized receipts required for all expenses over $25
- Use company expense management system
- Include business purpose for each expense

6. APPROVAL PROCESS
- Expenses under $100: Manager approval
- Expenses $100-$500: Director approval
- Expenses over $500: VP approval required

7. REIMBURSEMENT TIMELINE
- Approved expenses reimbursed within 2 pay periods
- Direct deposit to employee bank account

Questions? Contact accounts payable or HR.`
    },
    "social-media": {
      sections: ["Personal Use", "Company Accounts", "Guidelines", "Confidentiality"],
      content: `${companyName.toUpperCase()}
SOCIAL MEDIA POLICY

1. PURPOSE
This policy provides guidelines for social media use to protect both ${companyName} and our employees.

2. PERSONAL SOCIAL MEDIA
When posting about work-related topics:
- Make clear views are your own, not ${companyName}'s
- Do not share confidential or proprietary information
- Be respectful of colleagues, clients, and competitors
- Do not use company logos without approval

3. COMPANY SOCIAL MEDIA ACCOUNTS
- Only authorized personnel may post on behalf of ${companyName}
- All content must be approved before posting
- Respond to inquiries professionally and promptly
- Escalate complaints or issues to appropriate teams

4. GENERAL GUIDELINES
DO:
- Use good judgment
- Protect confidential information
- Be authentic and transparent
- Add value to conversations

DON'T:
- Share trade secrets or financial information
- Make disparaging comments
- Engage in arguments or flame wars
- Post during work hours without approval

5. MONITORING
${companyName} may monitor public social media for brand mentions and compliance. This is not intended to restrict lawful employee discussions.

6. CONSEQUENCES
Violations may result in:
- Required removal of content
- Disciplinary action
- Termination for serious violations

When in doubt, don't post. Consult with HR or Communications if unsure.`
    },
    "dress-code": {
      sections: ["Daily Attire", "Client Meetings", "Casual Days", "Exceptions"],
      content: `${companyName.toUpperCase()}
DRESS CODE POLICY

1. PURPOSE
${companyName} maintains a professional environment while allowing comfort. This policy outlines appropriate workplace attire.

2. BUSINESS CASUAL (DAILY)
Acceptable:
- Collared shirts, blouses, sweaters
- Slacks, khakis, professional skirts/dresses
- Closed-toe shoes, clean sneakers
- Modest patterns and colors

Not Acceptable:
- Ripped or torn clothing
- Graphic t-shirts with offensive content
- Flip-flops or beach sandals
- Athletic wear (unless approved for specific events)

3. BUSINESS PROFESSIONAL (CLIENT MEETINGS)
- Suits or blazers
- Dress shirts and ties (optional)
- Professional dresses or pantsuits
- Polished dress shoes

4. CASUAL FRIDAYS
- Jeans allowed (no rips or tears)
- Casual tops (no offensive graphics)
- Clean sneakers acceptable
- Still maintain professionalism

5. INDUSTRY CONSIDERATIONS
As a ${industry} company, additional considerations:
- Safety gear required in applicable areas
- Closed-toe shoes in production areas
- ID badges visible at all times

6. EXCEPTIONS
- Religious or cultural accommodations available
- Medical accommodations with HR approval
- Special events may have different requirements

7. ENFORCEMENT
Managers are responsible for addressing dress code issues privately and professionally.

Present yourself as a representative of ${companyName}.`
    },
    "confidentiality": {
      sections: ["Scope", "Obligations", "Exceptions", "Duration"],
      content: `${companyName.toUpperCase()}
CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement is entered into by the undersigned employee of ${companyName}.

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes but is not limited to:
- Trade secrets and proprietary processes
- Business strategies and plans
- Financial information and projections
- Customer and vendor lists
- Employee information
- Technical data and software
- Marketing plans and research
- Any information marked "Confidential"

2. OBLIGATIONS
The employee agrees to:
- Keep all Confidential Information strictly confidential
- Use Confidential Information only for company purposes
- Not disclose to any third party without written consent
- Take reasonable measures to protect confidentiality
- Return all materials upon termination

3. EXCEPTIONS
This agreement does not apply to information that:
- Is publicly available through no fault of employee
- Was known to employee prior to employment
- Is disclosed pursuant to legal requirement
- Is independently developed by employee

4. DURATION
These obligations:
- Begin on date of employment
- Continue for 2 years following termination
- Trade secrets protected indefinitely

5. REMEDIES
Breach may result in:
- Immediate termination
- Legal action for damages
- Injunctive relief

6. ACKNOWLEDGMENT
I have read and understand this Agreement.

Employee Signature: ____________________
Printed Name: ____________________
Date: ____________________

Witness: ____________________
Date: ____________________`
    }
  };

  const policyData = policies[policyType] || policies["code-of-conduct"];
  
  return {
    title,
    content: policyData.content,
    sections: policyData.sections,
  };
}
