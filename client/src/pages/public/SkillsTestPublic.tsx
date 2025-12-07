import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Clock, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: number;
  type: "multiple_choice" | "open_text";
  text: string;
  options?: string[];
  correctAnswer?: string;
};

function isValidQuestion(q: any): q is Question {
  return (
    q &&
    typeof q === "object" &&
    typeof q.id === "number" &&
    typeof q.text === "string" &&
    (q.type === "multiple_choice" || q.type === "open_text") &&
    (q.options === undefined || (Array.isArray(q.options) && q.options.every((opt: any) => typeof opt === "string")))
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
  };
};

export default function SkillsTestPublic() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ score: number } | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Test Not Available</h2>
              <p className="mt-2 text-muted-foreground">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="mt-4 text-xl font-semibold">Test Already Completed</h2>
              <p className="mt-2 text-muted-foreground">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="mt-4 text-xl font-semibold">Test Submitted!</h2>
              <p className="mt-2 text-muted-foreground">
                Thank you for completing the {data.test.roleName} assessment.
              </p>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-3xl font-bold text-primary">{submissionResult.score}%</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                The employer will review your results and contact you if they'd like to proceed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invitation, test } = data;
  const questions = filterValidQuestions(test.questions);
  
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Test Configuration Error</h2>
              <p className="mt-2 text-muted-foreground">
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
  const allAnswered = questions.every((_, idx) => answers[idx] !== undefined && answers[idx] !== "");

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: value }));
  };

  const handleSubmit = () => {
    const responses = Object.entries(answers).map(([idx, answer]) => ({
      questionIndex: parseInt(idx),
      answer,
    }));
    submitMutation.mutate(responses);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{test.roleName} Skills Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Hello {invitation.candidateName}, please complete this assessment for the {invitation.jobTitle} position.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-start gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                {currentQuestionIndex + 1}
              </span>
              <span data-testid={`question-text-${currentQuestionIndex}`}>{currentQuestion.text}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
              <RadioGroup
                value={answers[currentQuestionIndex] || ""}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} data-testid={`option-${currentQuestionIndex}-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestionIndex] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="min-h-[150px]"
                data-testid={`answer-textarea-${currentQuestionIndex}`}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous"
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={!answers[currentQuestionIndex]}
                  data-testid="button-next"
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
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
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 flex justify-center gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`h-3 w-3 rounded-full transition-colors ${
                idx === currentQuestionIndex
                  ? "bg-primary"
                  : answers[idx]
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              }`}
              data-testid={`question-dot-${idx}`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Clock className="inline h-3 w-3 mr-1" />
          Take your time. Your progress is not saved until you submit.
        </p>
      </div>
    </div>
  );
}
