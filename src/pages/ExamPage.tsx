import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Shield, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Exam Questions ---
const questions = [
  { id: 1, type: "mcq", question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
  { id: 2, type: "mcq", question: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: 1 },
  { id: 3, type: "mcq", question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Language", "Sequential Query Language", "Standard Query Language"], answer: 0 },
  { id: 4, type: "short", question: "Explain the difference between TCP and UDP in 2-3 sentences." },
  { id: 5, type: "code", question: "Write a function in any language (Python/JS/Java) that reverses a string without using built-in reverse methods." },
];

const EXAM_DURATION = 30 * 60; // 30 minutes in seconds

const ExamPage = () => {
  const { user, addExamResult } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [violations, setViolations] = useState<Array<{ type: string; points: number; timestamp: string; message: string }>>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isRedFlash, setIsRedFlash] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef(Date.now());

  // --- AI Voice ---
  const speak = useCallback((text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch {}
  }, []);

  // --- Alarm effect ---
  const triggerAlarm = useCallback(() => {
    setIsRedFlash(true);
    setIsShaking(true);
    setTimeout(() => { setIsRedFlash(false); setIsShaking(false); }, 5000);
  }, []);

  // --- Add violation ---
  const addViolation = useCallback((type: string, points: number, message: string, voiceMsg: string) => {
    setViolations((prev) => [...prev, { type, points, timestamp: new Date().toISOString(), message }]);
    setSuspicionScore((prev) => prev + points);
    setWarningMessage(message);
    setShowWarning(true);
    triggerAlarm();
    speak(voiceMsg);
    setTimeout(() => setShowWarning(false), 5000);
  }, [triggerAlarm, speak]);

  // --- Submit exam ---
  const submitExam = useCallback((reason: string) => {
    if (submitted) return;
    setSubmitted(true);

    // Stop camera
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }

    // Exit fullscreen
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    // Calculate score
    let score = 0;
    questions.forEach((q) => {
      if (q.type === "mcq" && answers[q.id] === String(q.answer)) score += 20;
      if (q.type === "short" && answers[q.id]?.trim().length > 10) score += 20;
      if (q.type === "code" && answers[q.id]?.trim().length > 20) score += 20;
    });

    const result = {
      userId: user?.id || "",
      userName: user?.name || "",
      college: user?.college || "",
      score,
      suspicionScore: suspicionScore,
      violations,
      timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000),
      submissionReason: reason,
      submittedAt: new Date().toISOString(),
      ip: "192.168.1." + Math.floor(Math.random() * 255),
      device: navigator.userAgent.slice(0, 60),
    };
    addExamResult(result);
    navigate("/results", { state: result });
  }, [submitted, answers, suspicionScore, violations, user, addExamResult, navigate]);

  // --- Timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitExam("Time expired");
          return 0;
        }
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
          const newCount = prev + 1;
          addViolation("Tab Switch", 20, `Tab switch detected (#${newCount})`, "Hey! This user is switching tabs and cheating! Come catch him immediately!");
          if (newCount >= 3) {
            setTimeout(() => submitExam("Excessive tab switching (3+)"), 2000);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [submitted, addViolation, submitExam]);

  // --- Fullscreen exit detection ---
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
    document.addEventListener("paste", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    return () => {
      document.removeEventListener("paste", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
    };
  }, [submitted, addViolation]);

  // --- Right-click ---
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (submitted) return;
      e.preventDefault();
      addViolation("Right Click", 10, "Right-click detected", "Right clicking is not allowed during the exam.");
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [submitted, addViolation]);

  // --- Camera ---
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {});
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

  const q = questions[currentQ];

  return (
    <div className={`min-h-screen bg-background relative ${isShaking ? "shake-animation" : ""}`}>
      {/* Red flash overlay */}
      {isRedFlash && <div className="fixed inset-0 z-50 pointer-events-none red-flash" />}

      {/* Warning modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-xl p-4 glow-danger flex items-center gap-3 max-w-md"
          >
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <span className="text-sm font-medium">{warningMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm gradient-text">SecureExam AI</span>
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
        {/* Question navigation */}
        <div className="flex gap-2 mb-6">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                i === currentQ ? "gradient-bg text-primary-foreground" : answers[questions[i].id] ? "bg-success/20 text-success border border-success/30" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <motion.div key={currentQ} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium uppercase">
              {q.type === "mcq" ? "Multiple Choice" : q.type === "short" ? "Short Answer" : "Coding"}
            </span>
            <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
          </div>

          <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

          {q.type === "mcq" && q.options && (
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: String(i) })}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    answers[q.id] === String(i) ? "gradient-bg text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "short" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              rows={4}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          )}

          {q.type === "code" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              rows={12}
              placeholder="// Write your code here..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-6 py-2.5 rounded-lg bg-secondary text-foreground font-medium disabled:opacity-40 hover:bg-secondary/80 transition"
            >
              Previous
            </button>
            {currentQ === questions.length - 1 ? (
              <button
                onClick={() => submitExam("Manual submission")}
                className="px-6 py-2.5 rounded-lg gradient-bg text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                className="px-6 py-2.5 rounded-lg gradient-bg text-primary-foreground font-medium hover:opacity-90 transition"
              >
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
            <motion.div
              className={`h-full rounded-full transition-all ${
                suspicionScore <= 30 ? "bg-success" : suspicionScore <= 60 ? "bg-warning" : "bg-destructive"
              }`}
              animate={{ width: `${Math.min(suspicionScore, 100)}%` }}
            />
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
