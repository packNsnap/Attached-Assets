import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MessageSquare, Mic, Play, Save, Star, ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  candidateName: z.string().min(2, "Candidate name is required"),
  jobDescription: z.string().min(10, "Job description is required"),
});

type Question = {
  id: number;
  category: "Technical" | "Behavioral" | "Cultural";
  text: string;
  rubric: string; // What a good answer looks like
};

type InterviewSession = {
  id: string;
  candidateName: string;
  questions: Question[];
  status: "active" | "completed";
};

export default function InterviewAssistantModule() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateName: "",
      jobDescription: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSession = generateMockSession(values);
      setSession(newSession);
      setIsGenerating(false);
      toast({
        title: "Interview Guide Ready",
        description: "Questions and rubrics generated.",
      });
    }, 2000);
  }

  const handleScore = (value: number[]) => {
    setScores(prev => ({ ...prev, [currentQuestionIndex]: value[0] }));
  };

  const handleNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
  };

  const nextQuestion = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      toast({
        title: "Interview Completed",
        description: "All questions covered. Summary saved.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Assistant</h1>
        <p className="text-muted-foreground mt-2">
          AI-generated structured interview questions with real-time scoring rubrics.
        </p>
      </div>

      {!session ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Start New Interview</CardTitle>
            <CardDescription>
              Enter details to generate a tailored interview script.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="candidateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Alex Johnson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the job description here to tailor the questions..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Guide...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Interview
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 h-[600px]">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{session.candidateName}</CardTitle>
              <CardDescription>Interview Progress</CardDescription>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {session.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg text-sm transition-colors flex items-start gap-3",
                      currentQuestionIndex === idx 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 border",
                      currentQuestionIndex === idx ? "border-primary-foreground" : "border-muted-foreground"
                    )}>
                      {scores[idx] ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold block mb-0.5">{q.category}</span>
                      <span className="opacity-90 line-clamp-1">{q.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-muted/20">
              <Button variant="outline" className="w-full" onClick={() => setSession(null)}>
                End Session
              </Button>
            </div>
          </Card>

          {/* Active Question Area */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline">{session.questions[currentQuestionIndex].category}</Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {session.questions[currentQuestionIndex].text}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  What to look for (Rubric)
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {session.questions[currentQuestionIndex].rubric}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Candidate Score</label>
                    <span className="text-sm font-bold text-primary">
                      {scores[currentQuestionIndex] ? scores[currentQuestionIndex] + "/5" : "Not scored"}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0]}
                    value={[scores[currentQuestionIndex] || 0]}
                    max={5}
                    step={1}
                    onValueChange={handleScore}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interviewer Notes</label>
                  <Textarea
                    placeholder="Record key points from the candidate's answer..."
                    className="min-h-[120px]"
                    value={notes[currentQuestionIndex] || ""}
                    onChange={handleNote}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/10 flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button onClick={nextQuestion}>
                {currentQuestionIndex === session.questions.length - 1 ? "Finish Interview" : "Next Question"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mock Generator
function generateMockSession(values: any): InterviewSession {
  return {
    id: "session-" + Date.now(),
    candidateName: values.candidateName,
    status: "active",
    questions: [
      {
        id: 1,
        category: "Behavioral",
        text: "Tell me about a time you had to handle a difficult stakeholder or team member. How did you resolve the conflict?",
        rubric: "Look for: Specific example (STAR method), emotional intelligence, focus on resolution rather than blame, and a positive outcome."
      },
      {
        id: 2,
        category: "Technical",
        text: "Describe a challenging technical problem you solved recently. What trade-offs did you have to consider?",
        rubric: "Look for: Depth of technical understanding, awareness of constraints (performance vs. cost), and clarity in explaining complex concepts."
      },
      {
        id: 3,
        category: "Cultural",
        text: "What kind of work environment allows you to be most productive?",
        rubric: "Look for: Alignment with our remote/async culture, self-motivation, and communication style."
      },
      {
        id: 4,
        category: "Technical",
        text: "How do you approach testing and quality assurance in your development process?",
        rubric: "Look for: Experience with unit/integration tests, TDD mentality, and view of quality as a team responsibility."
      }
    ]
  };
}
