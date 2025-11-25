"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Loader2,
  MessageCircle,
  Sparkles,
  TrendingDown,
  Users,
  BookOpen,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const exampleQuestions = [
  {
    icon: TrendingDown,
    color: "text-red-600 bg-red-100",
    question: "Which subjects have the weakest performance this semester?",
    category: "Performance",
  },
  {
    icon: Users,
    color: "text-amber-600 bg-amber-100",
    question: "List at-risk students in CS201 with low marks & poor attendance",
    category: "At-Risk Students",
  },
  {
    icon: BookOpen,
    color: "text-blue-600 bg-blue-100",
    question:
      "What is the average attendance rate for Computer Science students?",
    category: "Attendance",
  },
  {
    icon: Calendar,
    color: "text-purple-600 bg-purple-100",
    question: "Show me semester performance trends across all subjects",
    category: "Trends",
  },
];

type ConversationItem = {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
};

export default function AcademicAssistantPage() {
  const [question, setQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationItem[]
  >([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to answer when it appears
  useEffect(() => {
    if (currentAnswer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentAnswer]);

  // Simulated streaming effect for GPT-4o mini
  useEffect(() => {
    if (currentAnswer && streamingText.length < currentAnswer.length) {
      const timeout = setTimeout(() => {
        setStreamingText(currentAnswer.slice(0, streamingText.length + 2));
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [currentAnswer, streamingText]);

  const handleAsk = async () => {
    setError(null);
    setCurrentAnswer(null);
    setStreamingText("");

    const trimmed = question.trim();
    if (!trimmed) {
      setError("Please type a question first.");
      toast.error("Question required", {
        description: "Please enter a question to get AI insights",
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/academic-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);

      setCurrentAnswer(data.answer);
      setStreamingText("");

      // Add to conversation history
      const newItem: ConversationItem = {
        id: Date.now().toString(),
        question: trimmed,
        answer: data.answer,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [newItem, ...prev]);

      toast.success("Analysis complete", {
        description: `GPT-4o mini responded in ${responseTime}s`,
      });

      // Clear question after successful response
      setQuestion("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unexpected error from assistant.";
      setError(errorMessage);
      toast.error("Failed to get AI response", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
    setCurrentAnswer(null);
    setError(null);
    textareaRef.current?.focus();
    toast.info("Example loaded", {
      description: "Click 'Get AI Insights' to analyze",
    });
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy text");
    }
  };

  const handleReset = () => {
    setQuestion("");
    setCurrentAnswer(null);
    setError(null);
    setStreamingText("");
    textareaRef.current?.focus();
    toast.info("Cleared", {
      description: "Ready for a new question",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <section className="w-full pb-8">
      {/* Header with gradient background */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-6 pb-8 bg-linear-to-br from-indigo-50 via-purple-50 to-transparent border-b border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-md border border-indigo-200">
            <Brain className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-4xl font-bold text-gray-900">
                AI Academic Assistant
              </h2>
              <div className="px-3 py-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full shadow-md">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  GPT-4o Mini
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Get instant insights about student performance, attendance, and
              academic trends
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Main Card */}
        <Card className="relative overflow-hidden border-2 border-indigo-200 shadow-xl">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 via-transparent to-purple-50/50 pointer-events-none" />

          <CardHeader className="relative bg-linear-to-r from-white to-gray-50 border-b pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-2xl text-gray-900">
                <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                Ask Your Question
              </div>
              {(currentAnswer || question) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Question
                </Button>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2 ml-14">
              Powered by GPT-4o mini for fast, accurate academic insights
            </p>
          </CardHeader>

          <CardContent className="relative space-y-6 pt-6">
            {/* Info Banner */}
            <div className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900 mb-1">
                    Try asking questions about:
                  </p>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Student performance and grades
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Subject-wise analysis and trends
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Attendance patterns and at-risk students
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example Questions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Start Examples
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {exampleQuestions.map((example, idx) => {
                  const Icon = example.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example.question)}
                      className="group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${example.color} shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {example.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 group-hover:text-gray-900 line-clamp-2">
                            {example.question}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Use this question
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Your Question
              </label>
              <Textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question about performance, subjects, marks, or attendance...&#10;&#10;💡 Tip: Press Cmd/Ctrl + Enter to submit"
                className="min-h-[140px] resize-y text-base p-4 border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-xl"
                disabled={loading}
              />

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {question.length > 0 && (
                    <span
                      className={question.length > 500 ? "text-amber-600" : ""}
                    >
                      {question.length} characters
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {question && !loading && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    className="min-w-[180px] h-12 text-base font-semibold bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Get AI Insights
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-linear-to-br from-red-50 to-red-100 border-2 border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Error
                    </p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="p-8 rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 animate-pulse" />
                    <Brain className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 mb-1">
                      Analyzing Your Data
                    </p>
                    <p className="text-sm text-gray-600">
                      GPT-4o mini is processing your question...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Typically responds in 2-5 seconds
                  </div>
                </div>
              </div>
            )}

            {/* Answer Display */}
            {currentAnswer && !loading && (
              <div
                ref={answerRef}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      AI Analysis Results
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(streamingText || currentAnswer, "current")
                    }
                    className="gap-2"
                  >
                    {copiedId === "current" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  {/* Decorative elements */}
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-linear-to-b from-indigo-500 to-purple-500 rounded-full" />

                  <div className="p-6 rounded-xl bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 shadow-lg ml-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-800 leading-7 whitespace-pre-wrap">
                        {streamingText || currentAnswer}
                        {streamingText &&
                          streamingText.length < currentAnswer.length && (
                            <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1" />
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up suggestions */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-2">
                    💡 Follow-up suggestions:
                  </p>
                  <p className="text-xs text-blue-700">
                    Try asking more specific questions about individual
                    students, time periods, or request comparative analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Conversation History */}
            {conversationHistory.length > 0 && !currentAnswer && !loading && (
              <div className="pt-6 border-t-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  Recent Conversations
                </h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {conversationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">
                          Q: {item.question}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(item.answer, item.id)}
                          className="shrink-0"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {item.answer}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {item.timestamp.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-3">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                GPT-4o mini delivers insights in seconds with optimized
                performance
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trend Detection</h3>
              <p className="text-sm text-gray-600">
                Identify patterns and trends in student performance data
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-emerald-300 transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="p-3 bg-emerald-100 rounded-lg w-fit mb-3">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Student Insights</h3>
              <p className="text-sm text-gray-600">
                Get detailed analysis on individual or groups of students
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
