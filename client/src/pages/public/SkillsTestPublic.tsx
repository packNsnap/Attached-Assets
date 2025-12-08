import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Clock, AlertCircle, Send, Timer, AlertTriangle, Sparkles, BrainCircuit, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Question = {
  id: number;
  type: "multiple_choice";
  text: string;
  options: string[];
  correctAnswer?: string;
  bestAnswerIndex?: number;
  goodAnswerIndex?: number;
};

function isValidQuestion(q: any): q is Question {
  return (
    q &&
    typeof q === "object" &&
    typeof q.id === "number" &&
    typeof q.text === "string" &&
    q.type === "multiple_choice" &&
    Array.isArray(q.options) && q.options.every((opt: any) => typeof opt === "string")
  );
}

function filterValidQuestions(questions: any[]): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.filter(isValidQuestion);
}

type TestData = {
  invitation: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    status: string;
    expiresAt: string | null;
  };
  test: {
    id: string;
    roleName: string;
    difficulty: string;
    skills: string[];
    questions: Question[];
    timePerQuestion: number;
  };
};

export default function SkillsTestPublic() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ score: number } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(15);
  const [testStarted, setTestStarted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery<TestData>({
    queryKey: [`/api/public/skills-test/${token}`],
    enabled: !!token,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (responses: { questionIndex: number; answer: string }[]) => {
      const res = await fetch(`/api/public/skills-test/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit test");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setIsSubmitted(true);
      setSubmissionResult(result);
    },
  });

  const questions = data ? filterValidQuestions(data.test.questions) : [];
  const timePerQuestion = data?.test.timePerQuestion || 15;

  const advanceToNextQuestion = useCallback(() => {
    if (isSubmitting) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(timePerQuestion);
    } else {
      setIsSubmitting(true);
      const responses = Object.entries(answers).map(([idx, answer]) => ({
        questionIndex: parseInt(idx),
        answer: answer || "",
      }));
      for (let i = 0; i < questions.length; i++) {
        if (!responses.find(r => r.questionIndex === i)) {
          responses.push({ questionIndex: i, answer: "" });
        }
      }
      submitMutation.mutate(responses);
    }
  }, [currentQuestionIndex, questions.length, answers, timePerQuestion, submitMutation, isSubmitting]);

  useEffect(() => {
    if (!testStarted || isSubmitted || isSubmitting || !data) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          advanceToNextQuestion();
          return timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, isSubmitted, isSubmitting, data, advanceToNextQuestion, timePerQuestion]);

  useEffect(() => {
    if (testStarted && data) {
      setTimeRemaining(timePerQuestion);
    }
  }, [currentQuestionIndex, testStarted, data, timePerQuestion]);

  const handleStartTest = () => {
    setShowDisclaimer(false);
    setTestStarted(true);
    setTimeRemaining(timePerQuestion);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 animate-pulse">
            <BrainCircuit className="h-8 w-8 text-white" />
          </div>
          <p className="mt-6 text-lg text-muted-foreground">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/20 p-4">
        <Card className="max-w-md w-full shadow-xl border-red-200/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">Test Not Available</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                This test link may have expired, already been completed, or is invalid.
                Please contact the employer if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.invitation.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 p-4">
        <Card className="max-w-md w-full shadow-xl border-green-200/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">Test Already Completed</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                You have already submitted your responses for this assessment.
                The employer will review your results.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 p-4">
        <Card className="max-w-md w-full shadow-xl border-green-200/50 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">Test Submitted!</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Thank you for completing the {data.test.roleName} assessment.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                The employer will review your results and contact you if they'd like to proceed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invitation, test } = data;
  
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/20 p-4">
        <Card className="max-w-md w-full shadow-xl border-red-200/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">Test Configuration Error</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                This test has no valid questions. Please contact the employer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timerProgress = (timeRemaining / timePerQuestion) * 100;
  const isTimeLow = timeRemaining <= 5;

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: value }));
  };

  const handleNextQuestion = () => {
    if (isSubmitting) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(timePerQuestion);
    } else {
      setIsSubmitting(true);
      const responses = Object.entries(answers).map(([idx, answer]) => ({
        questionIndex: parseInt(idx),
        answer,
      }));
      submitMutation.mutate(responses);
    }
  };

  return (
    <>
      <Dialog open={showDisclaimer && !testStarted} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg border-amber-200/50" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 -mx-6 -mt-6 rounded-t-lg" />
          <DialogHeader className="pt-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Timer className="h-5 w-5 text-white" />
              </div>
              Timed Assessment
            </DialogTitle>
            <DialogDescription className="text-left pt-4 space-y-4">
              <p className="text-base">
                Welcome, <strong className="text-foreground">{invitation.candidateName}</strong>! You are about to begin the <strong className="text-foreground">{test.roleName}</strong> skills assessment for the <strong className="text-foreground">{invitation.jobTitle}</strong> position.
              </p>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Information
                </p>
                <ul className="text-sm text-amber-700 space-y-2 ml-6 list-disc">
                  <li>Each question has a <strong>{timePerQuestion} second</strong> time limit</li>
                  <li>Questions will automatically advance when time runs out</li>
                  <li><strong>You cannot go back</strong> to previous questions</li>
                  <li>Unanswered questions will receive 0 points</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Please make sure you're in a quiet environment with no distractions before starting.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              onClick={handleStartTest} 
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20" 
              data-testid="button-start-test"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              I Understand - Start Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {testStarted && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {test.roleName}
                  </h1>
                  <p className="text-sm text-muted-foreground">Skills Assessment</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Hello <span className="font-medium text-foreground">{invitation.candidateName}</span>, complete this assessment for the <span className="font-medium text-foreground">{invitation.jobTitle}</span> position.
              </p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="px-3 py-1">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              <Card className={`border-2 transition-all ${isTimeLow ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50' : 'border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900'}`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isTimeLow 
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 animate-pulse' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    } shadow-lg`}>
                      <Timer className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${isTimeLow ? 'text-red-700' : 'text-white/90'}`}>
                          Time Remaining
                        </span>
                        <span className={`text-2xl font-bold ${isTimeLow ? 'text-red-600' : 'text-white'}`} data-testid="timer-display">
                          {timeRemaining}s
                        </span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${
                            isTimeLow ? 'bg-gradient-to-r from-red-400 to-orange-400' : 'bg-gradient-to-r from-blue-400 to-purple-400'
                          }`}
                          style={{ width: `${timerProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-xl border-slate-200/80 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-600" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-start gap-4">
                  <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-base font-bold shrink-0 shadow-md">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="pt-1.5 leading-relaxed" data-testid={`question-text-${currentQuestionIndex}`}>
                    {currentQuestion.text}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
                  <RadioGroup
                    value={answers[currentQuestionIndex] || ""}
                    onValueChange={handleAnswerChange}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestionIndex] === option;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md' 
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleAnswerChange(option)}
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} data-testid={`option-${currentQuestionIndex}-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1 text-base leading-relaxed">
                            {option}
                          </Label>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                ) : (
                  <p className="text-muted-foreground">This question type is not supported in timed mode.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t bg-slate-50/50 py-4">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!answers[currentQuestionIndex]}
                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
                    data-testid="button-next"
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!answers[currentQuestionIndex] || submitMutation.isPending}
                    className="h-11 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Assessment
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div className="mt-8 flex justify-center gap-2 flex-wrap">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-3 w-3 rounded-full transition-all shadow-sm ${
                    idx === currentQuestionIndex
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 ring-4 ring-blue-500/20 scale-125"
                      : idx < currentQuestionIndex
                      ? answers[idx]
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-red-400 to-orange-400"
                      : "bg-slate-300"
                  }`}
                  data-testid={`question-dot-${idx}`}
                />
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Answer before time runs out. You cannot return to previous questions.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
