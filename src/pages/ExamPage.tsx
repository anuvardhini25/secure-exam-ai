import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Shield, Clock, AlertTriangle, Code, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useIpMonitor } from "@/hooks/useIpMonitor";
import { useDetectionEvents } from "@/hooks/useDetectionEvents";
import ProctorMonitor from "@/components/ProctorMonitor";
import {
  loadProctorConfig,
  categoryOf,
  severityForPoints,
  summarizeEvents,
  type ProctorEvent,
} from "@/lib/proctoring";


// --- Part A: MCQ + Short Answer ---
const partAQuestions = [
  { id: 1, type: "mcq" as const, question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
  { id: 2, type: "mcq" as const, question: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: 1 },
  { id: 3, type: "mcq" as const, question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Language", "Sequential Query Language", "Standard Query Language"], answer: 0 },
  { id: 4, type: "mcq" as const, question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"], answer: 1 },
  { id: 5, type: "short" as const, question: "Explain the difference between TCP and UDP in 2-3 sentences." },
];

// --- Part B: Coding Questions ---
const partBQuestions = [
  {
    id: 6,
    type: "code" as const,
    question: "Write a function that takes an array of integers and returns the second largest element. Handle edge cases like duplicate values.",
    boilerplate: {
      python: `def second_largest(arr):\n    # Write your code here\n    pass\n\n# Example: second_largest([3, 1, 4, 1, 5, 9]) → 5`,
      java: `public class Solution {\n    public static int secondLargest(int[] arr) {\n        // Write your code here\n        return 0;\n    }\n\n    // Example: secondLargest(new int[]{3, 1, 4, 1, 5, 9}) → 5\n}`,
      c: `#include <stdio.h>\n\nint secondLargest(int arr[], int n) {\n    // Write your code here\n    return 0;\n}\n\n// Example: secondLargest({3, 1, 4, 1, 5, 9}, 6) → 5`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint secondLargest(vector<int>& arr) {\n    // Write your code here\n    return 0;\n}\n\n// Example: secondLargest({3, 1, 4, 1, 5, 9}) → 5`,
    },
  },
  {
    id: 7,
    type: "code" as const,
    question: "Write a function to check if a given string is a valid palindrome, considering only alphanumeric characters and ignoring cases.",
    boilerplate: {
      python: `def is_palindrome(s):\n    # Write your code here\n    pass\n\n# Example: is_palindrome("A man, a plan, a canal: Panama") → True`,
      java: `public class Solution {\n    public static boolean isPalindrome(String s) {\n        // Write your code here\n        return false;\n    }\n\n    // Example: isPalindrome("A man, a plan, a canal: Panama") → true\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n\nint isPalindrome(char* s) {\n    // Write your code here\n    return 0;\n}\n\n// Example: isPalindrome("A man, a plan, a canal: Panama") → 1`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    // Write your code here\n    return false;\n}\n\n// Example: isPalindrome("A man, a plan, a canal: Panama") → true`,
    },
  },
];

const LANGUAGES = ["python", "java", "c", "cpp"] as const;
type Language = typeof LANGUAGES[number];
const LANG_LABELS: Record<Language, string> = { python: "Python", java: "Java", c: "C", cpp: "C++" };

const EXAM_DURATION = 30 * 60;

const ExamPage = () => {
  const { user, addExamResult } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeLangs, setCodeLangs] = useState<Record<number, Language>>({ 6: "python", 7: "python" });
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [violations, setViolations] = useState<ProctorEvent[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isRedFlash, setIsRedFlash] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [examPart, setExamPart] = useState<"A" | "B">("A");
  const [showPartTransition, setShowPartTransition] = useState(false);
  const startTimeRef = useRef(Date.now());
  const cfg = useRef(loadProctorConfig()).current;


  const currentQuestions = examPart === "A" ? partAQuestions : partBQuestions;
  const allQuestions = [...partAQuestions, ...partBQuestions];

  // --- AI Voice ---
  const speak = useCallback((text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1; u.volume = 1;
      speechSynthesis.speak(u);
    } catch {}
  }, []);

  // --- Alarm sound (Web Audio API, 7 seconds) ---
  const playAlarmSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 7;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "square"; osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      for (let t = 0; t < duration; t += 0.5) {
        osc1.frequency.setValueAtTime(800, ctx.currentTime + t);
        osc1.frequency.linearRampToValueAtTime(1200, ctx.currentTime + t + 0.25);
        osc1.frequency.linearRampToValueAtTime(800, ctx.currentTime + t + 0.5);
        osc2.frequency.setValueAtTime(600, ctx.currentTime + t);
        osc2.frequency.linearRampToValueAtTime(900, ctx.currentTime + t + 0.25);
        osc2.frequency.linearRampToValueAtTime(600, ctx.currentTime + t + 0.5);
      }
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + duration);
      osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc1.start(ctx.currentTime); osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + duration); osc2.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), (duration + 0.5) * 1000);
    } catch {}
  }, []);

  const triggerAlarm = useCallback(() => {
    setIsRedFlash(true); setIsShaking(true);
    playAlarmSound();
    setTimeout(() => { setIsRedFlash(false); setIsShaking(false); }, 7000);
  }, [playAlarmSound]);

  const addViolation = useCallback((type: string, points: number, message: string, voiceMsg: string) => {
    setViolations((prev) => [...prev, { type, points, timestamp: new Date().toISOString(), message }]);
    setSuspicionScore((prev) => prev + points);
    setWarningMessage(message); setShowWarning(true);
    triggerAlarm(); speak(voiceMsg);
    setTimeout(() => setShowWarning(false), 5000);
  }, [triggerAlarm, speak]);

  // --- Submit exam ---
  const submitExam = useCallback((reason: string) => {
    if (submitted) return;
    setSubmitted(true);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    let score = 0;
    allQuestions.forEach((q) => {
      if (q.type === "mcq" && answers[q.id] === String(q.answer)) score += 15;
      if (q.type === "short" && (answers[q.id]?.trim().length || 0) > 10) score += 10;
      if (q.type === "code" && (answers[q.id]?.trim().length || 0) > 20) score += 10;
    });

    const result = {
      userId: user?.id || "", userName: user?.name || "", college: user?.college || "",
      score, suspicionScore, violations,
      timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000),
      submissionReason: reason, submittedAt: new Date().toISOString(),
      ip: "192.168.1." + Math.floor(Math.random() * 255),
      device: navigator.userAgent.slice(0, 60),
    };
    addExamResult(result);
    navigate("/results", { state: result });
  }, [submitted, answers, suspicionScore, violations, user, addExamResult, navigate, allQuestions]);

  // --- Timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { submitExam("Time expired"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitExam]);

  // --- Tab switch detection ---
  useEffect(() => {
    const handler = () => {
      if (document.hidden && !submitted) {
        setTabSwitchCount((prev) => {
          const c = prev + 1;
          addViolation("Tab Switch", 20, `Tab switch detected (#${c})`, "Hey! This user is switching tabs and cheating! Come catch him immediately!");
          if (c >= 3) setTimeout(() => submitExam("Excessive tab switching (3+)"), 2000);
          return c;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [submitted, addViolation, submitExam]);

  // --- Fullscreen exit ---
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && !submitted) {
        addViolation("Fullscreen Exit", 20, "Fullscreen exit detected", "You have exited fullscreen mode. This is a violation.");
        setTimeout(() => document.documentElement.requestFullscreen().catch(() => {}), 1000);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [submitted, addViolation]);

  // --- Copy/Paste/Cut ---
  useEffect(() => {
    const block = (e: Event) => {
      if (submitted) return;
      e.preventDefault();
      addViolation("Copy/Paste", 30, "Copy/Paste attempt detected", "Pasting answers is not allowed. Malpractice detected.");
    };
    document.addEventListener("paste", block); document.addEventListener("copy", block); document.addEventListener("cut", block);
    return () => { document.removeEventListener("paste", block); document.removeEventListener("copy", block); document.removeEventListener("cut", block); };
  }, [submitted, addViolation]);

  // --- Right-click ---
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (submitted) return; e.preventDefault(); addViolation("Right Click", 10, "Right-click detected", "Right clicking is not allowed during the exam."); };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [submitted, addViolation]);

  // --- Camera ---
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; }).catch(() => {});
  }, []);

  // --- Auto-submit on high suspicion ---
  useEffect(() => {
    if (suspicionScore > 80 && !submitted) {
      speak("High risk cheating behavior detected. Exam is being submitted automatically.");
      setTimeout(() => submitExam("High suspicion score (>80)"), 3000);
    }
  }, [suspicionScore, submitted, speak, submitExam]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const riskLevel = suspicionScore <= 30 ? "Low" : suspicionScore <= 60 ? "Medium" : "High";
  const riskColor = suspicionScore <= 30 ? "text-success" : suspicionScore <= 60 ? "text-warning" : "text-destructive";

  const q = currentQuestions[currentQ];

  // --- Part transition ---
  const goToPartB = () => {
    setShowPartTransition(true);
    setTimeout(() => {
      setExamPart("B");
      setCurrentQ(0);
      setShowPartTransition(false);
    }, 2500);
  };

  // --- Language change for coding ---
  const handleLangChange = (qId: number, lang: Language) => {
    setCodeLangs((prev) => ({ ...prev, [qId]: lang }));
    // Set boilerplate if answer is empty or matches another boilerplate
    const cq = partBQuestions.find((bq) => bq.id === qId);
    if (cq) {
      const currentAnswer = answers[qId] || "";
      const isBoilerplate = Object.values(cq.boilerplate).some((b) => b === currentAnswer);
      if (!currentAnswer || isBoilerplate) {
        setAnswers((prev) => ({ ...prev, [qId]: cq.boilerplate[lang] }));
      }
    }
  };

  // Initialize boilerplate on first render for coding questions
  useEffect(() => {
    partBQuestions.forEach((cq) => {
      if (!answers[cq.id]) {
        setAnswers((prev) => ({ ...prev, [cq.id]: cq.boilerplate[codeLangs[cq.id] || "python"] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examPart]);

  return (
    <div className={`min-h-screen bg-background relative ${isShaking ? "shake-animation" : ""}`}>
      {isRedFlash && <div className="fixed inset-0 z-50 pointer-events-none red-flash" />}

      {/* Warning modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-xl p-4 glow-danger flex items-center gap-3 max-w-md">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <span className="text-sm font-medium">{warningMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Part transition overlay */}
      <AnimatePresence>
        {showPartTransition && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg"
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <Code className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Part A Complete!</h2>
              <p className="text-xl gradient-text font-semibold mb-2">Moving to Part B: Coding</p>
              <p className="text-muted-foreground">2 coding questions • Python, Java, C, C++</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm gradient-text">SecureExam AI</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            examPart === "A" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
          }`}>
            {examPart === "A" ? (
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Part A — MCQ</span>
            ) : (
              <span className="flex items-center gap-1"><Code className="w-3 h-3" /> Part B — Coding</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`font-mono font-bold ${timeLeft < 300 ? "text-destructive" : ""}`}>{formatTime(timeLeft)}</span>
          </div>
          <div className="text-sm">
            Risk: <span className={`font-bold ${riskColor}`}>{riskLevel} ({suspicionScore})</span>
          </div>
          <div className="w-20 h-14 rounded-lg overflow-hidden border border-border">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Exam content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Part indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            examPart === "A" ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}>
            <BookOpen className="w-3.5 h-3.5" /> Part A
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            examPart === "B" ? "gradient-bg text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}>
            <Code className="w-3.5 h-3.5" /> Part B
          </div>
        </div>

        {/* Question navigation */}
        <div className="flex gap-2 mb-6">
          {currentQuestions.map((cq, i) => (
            <button key={cq.id} onClick={() => setCurrentQ(i)}
              className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                i === currentQ ? "gradient-bg text-primary-foreground" : answers[cq.id] ? "bg-success/20 text-success border border-success/30" : "bg-secondary text-muted-foreground"
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <motion.div key={`${examPart}-${currentQ}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${
              q.type === "mcq" ? "bg-primary/10 text-primary" : q.type === "short" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
            }`}>
              {q.type === "mcq" ? "Multiple Choice" : q.type === "short" ? "Short Answer" : "Coding"}
            </span>
            <span className="text-xs text-muted-foreground">
              Part {examPart} — Question {currentQ + 1} of {currentQuestions.length}
            </span>
          </div>

          <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

          {/* MCQ */}
          {q.type === "mcq" && q.options && (
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: String(i) })}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    answers[q.id] === String(i) ? "gradient-bg text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                  }`}>
                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          )}

          {/* Short answer */}
          {q.type === "short" && (
            <textarea value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              rows={4} placeholder="Type your answer..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          )}

          {/* Coding with language selector */}
          {q.type === "code" && (
            <div>
              {/* Language tabs */}
              <div className="flex gap-1 mb-3 p-1 bg-secondary rounded-lg w-fit">
                {LANGUAGES.map((lang) => (
                  <button key={lang} onClick={() => handleLangChange(q.id, lang)}
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                      codeLangs[q.id] === lang ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {LANG_LABELS[lang]}
                  </button>
                ))}
              </div>

              {/* Code editor */}
              <div className="relative">
                <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-secondary/80 px-2 py-1 rounded font-mono">
                  {LANG_LABELS[codeLangs[q.id]]}
                </div>
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={16}
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
              className="px-6 py-2.5 rounded-lg bg-secondary text-foreground font-medium disabled:opacity-40 hover:bg-secondary/80 transition">
              Previous
            </button>

            {examPart === "A" && currentQ === currentQuestions.length - 1 ? (
              <button onClick={goToPartB}
                className="px-6 py-2.5 rounded-lg gradient-bg text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-2">
                Proceed to Part B <Code className="w-4 h-4" />
              </button>
            ) : examPart === "B" && currentQ === currentQuestions.length - 1 ? (
              <button onClick={() => submitExam("Manual submission")}
                className="px-6 py-2.5 rounded-lg gradient-bg text-primary-foreground font-medium hover:opacity-90 transition">
                Submit Exam
              </button>
            ) : (
              <button onClick={() => setCurrentQ(Math.min(currentQuestions.length - 1, currentQ + 1))}
                className="px-6 py-2.5 rounded-lg gradient-bg text-primary-foreground font-medium hover:opacity-90 transition">
                Next
              </button>
            )}
          </div>
        </motion.div>

        {/* Suspicion meter */}
        <div className="mt-6 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Suspicion Score</span>
            <span className={`text-sm font-bold ${riskColor}`}>{suspicionScore}/100</span>
          </div>
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div className={`h-full rounded-full transition-all ${
              suspicionScore <= 30 ? "bg-success" : suspicionScore <= 60 ? "bg-warning" : "bg-destructive"
            }`} animate={{ width: `${Math.min(suspicionScore, 100)}%` }} />
          </div>
          {violations.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              {violations.length} violation(s) recorded • Tab switches: {tabSwitchCount}/3
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
