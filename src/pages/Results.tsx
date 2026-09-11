import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, Award, Download, Globe } from "lucide-react";
import { summarizeEvents, formatClock, type ProctorEvent } from "@/lib/proctoring";


const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state as any;

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No results found</p>
          <button onClick={() => navigate("/")} className="text-primary hover:underline">Go home</button>
        </div>
      </div>
    );
  }

  const riskLevel = result.suspicionScore <= 30 ? "Low" : result.suspicionScore <= 60 ? "Medium" : "High";
  const riskColor = result.suspicionScore <= 30 ? "text-success" : result.suspicionScore <= 60 ? "text-warning" : "text-destructive";
  const RiskIcon = result.suspicionScore <= 30 ? CheckCircle : result.suspicionScore <= 60 ? AlertTriangle : XCircle;

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const events: ProctorEvent[] = result.violations || [];
  const summary = result.proctorSummary || summarizeEvents(events);


  // Circular chart
  const circumference = 2 * Math.PI * 45;
  const scorePercent = result.score / 100;
  const suspicionPercent = Math.min(result.suspicionScore / 100, 1);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="w-10 h-10 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Exam Results</h1>
          <p className="text-sm text-muted-foreground">{result.submissionReason}</p>
        </div>

        {/* Score circles */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { label: "Exam Score", value: result.score, color: "hsl(190, 95%, 50%)", percent: scorePercent },
            { label: "Suspicion Score", value: result.suspicionScore, color: result.suspicionScore <= 30 ? "hsl(152, 69%, 45%)" : result.suspicionScore <= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)", percent: suspicionPercent },
          ].map((c) => (
            <motion.div key={c.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 flex flex-col items-center">
              <svg width="110" height="110" className="mb-3">
                <circle cx="55" cy="55" r="45" fill="none" stroke="hsl(222, 30%, 18%)" strokeWidth="8" />
                <motion.circle
                  cx="55" cy="55" r="45" fill="none" stroke={c.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * (1 - c.percent) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  transform="rotate(-90 55 55)"
                />
                <text x="55" y="55" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-2xl font-bold" fontSize="24">{c.value}</text>
              </svg>
              <span className="text-sm text-muted-foreground">{c.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Info cards */}
        <div className="glass rounded-2xl p-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4" /> Risk Level</span>
            <span className={`font-bold flex items-center gap-1 ${riskColor}`}><RiskIcon className="w-4 h-4" /> {riskLevel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Time Taken</span>
            <span className="font-medium">{formatTime(result.timeTaken)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Violations</span>
            <span className="font-medium">{result.violations?.length || 0}</span>
          </div>
        </div>

        {/* Proctoring session details */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Proctoring Session</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Candidate", result.userName],
              ["College", result.college],
              ["Started", result.startedAt ? formatClock(result.startedAt) : "—"],
              ["Submitted", formatClock(result.submittedAt)],
              ["IP Address", result.ip || "unknown"],
              ["Initial IP", result.initialIp || result.ip || "unknown"],
              ["IP Changes", String(result.ipChanges ?? 0)],
              ["Device", result.device],
            ].map(([k, v]) => (
              <div key={k as string} className="bg-secondary rounded-lg p-3">
                <div className="text-[11px] text-muted-foreground">{k}</div>
                <div className="font-medium break-all">{v as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detection statistics */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Detection Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(summary).map(([k, v]) => (
              <div key={k} className="bg-secondary rounded-lg p-3">
                <div className="text-lg font-bold">{v as number}</div>
                <div className="text-[11px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Violation timeline */}
        {events.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Proctoring Timeline</h3>
            <div className="space-y-2">
              {events.map((v: ProctorEvent, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-secondary rounded-lg p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{v.type}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{v.details || (v as any).message}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-destructive font-mono">+{v.points}</div>
                    <div className="text-[11px] text-muted-foreground">{formatClock(v.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 py-3 rounded-xl bg-secondary font-semibold hover:bg-secondary/80 transition flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Report
          </button>
          <button onClick={() => navigate("/")} className="flex-1 py-3 rounded-xl gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition">
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default Results;
