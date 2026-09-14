import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, BarChart3, AlertTriangle, LogOut, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { riskLabel, summarizeEvents, formatClock } from "@/lib/proctoring";
import ProctorSettings from "@/components/ProctorSettings";

const AdminPanel = () => {
  const { user, logout, examResults } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  const exportCsv = () => {
    const header = ["Student", "College", "Score", "Suspicion", "Risk", "Violations", "IP", "IP Changes", "Reason", "Submitted"];
    const rows = examResults.map((r) => [
      r.userName, r.college, r.score, r.suspicionScore, riskLabel(r.suspicionScore),
      r.violations?.length || 0, r.ip || "unknown", r.ipChanges ?? 0, r.submissionReason, r.submittedAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "secureexam-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };


  const totalStudents = new Set(examResults.map((r) => r.userId)).size;
  const avgScore = examResults.length ? Math.round(examResults.reduce((s, r) => s + r.score, 0) / examResults.length) : 0;
  const avgSuspicion = examResults.length ? Math.round(examResults.reduce((s, r) => s + r.suspicionScore, 0) / examResults.length) : 0;
  const highRiskCount = examResults.filter((r) => r.suspicionScore > 60).length;

  const stats = [
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-primary" },
    { label: "Avg Score", value: avgScore, icon: BarChart3, color: "text-success" },
    { label: "Avg Suspicion", value: avgSuspicion, icon: AlertTriangle, color: "text-warning" },
    { label: "High Risk", value: highRiskCount, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            <span className="font-bold gradient-text">Admin Panel</span>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
              <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Suspicion distribution bar */}
        {examResults.length > 0 && (
          <div className="glass rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Suspicion Distribution</h3>
            <div className="flex gap-2 h-32 items-end">
              {examResults.map((r, i) => {
                const h = Math.max(10, (r.suspicionScore / 100) * 100);
                const color = r.suspicionScore <= 30 ? "bg-success" : r.suspicionScore <= 60 ? "bg-warning" : "bg-destructive";
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex-1 rounded-t-md ${color} min-w-[20px] max-w-[40px]`}
                    title={`${r.userName}: ${r.suspicionScore}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Results table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Exam Results</h3>
            {examResults.length > 0 && (
              <button onClick={exportCsv} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg gradient-bg text-primary-foreground font-medium">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>
          {examResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No exam submissions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">College</th>
                    <th className="text-left p-4">Score</th>
                    <th className="text-left p-4">Suspicion</th>
                    <th className="text-left p-4">Risk</th>
                    <th className="text-left p-4">Violations</th>
                    <th className="text-left p-4">Max People</th>
                    <th className="text-left p-4">IP Address</th>
                    <th className="text-left p-4">IP Changes</th>
                    <th className="text-left p-4">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((r, i) => {
                    const risk = riskLabel(r.suspicionScore);
                    const riskColor = risk === "Low" ? "text-success" : risk === "Medium" ? "text-warning" : "text-destructive";
                    const summary = r.proctorSummary || summarizeEvents((r.violations || []) as any);
                    const open = expanded === i;
                    return (
                      <>
                        <tr key={i} onClick={() => setExpanded(open ? null : i)} className="border-b border-border/50 hover:bg-secondary/50 transition cursor-pointer">
                          <td className="p-4 font-medium">{r.userName}</td>
                          <td className="p-4 text-muted-foreground">{r.college}</td>
                          <td className="p-4">{r.score}</td>
                          <td className="p-4">{r.suspicionScore}</td>
                          <td className={`p-4 font-semibold ${riskColor}`}>{risk}</td>
                          <td className="p-4">{r.violations?.length || 0}</td>
                          <td className="p-4">{(summary as any).maxPeopleDetected ?? 1}</td>
                          <td className="p-4 font-mono text-xs">{r.ip || "unknown"}</td>
                          <td className="p-4">{r.ipChanges ?? 0}</td>
                          <td className="p-4 text-muted-foreground text-xs">{r.submissionReason}</td>
                        </tr>
                        {open && (
                          <tr key={`${i}-detail`} className="bg-secondary/30">
                            <td colSpan={10} className="p-4">
                              <div className="text-xs font-semibold mb-2">Proctoring Timeline</div>
                              {(r.violations || []).length === 0 ? (
                                <div className="text-xs text-muted-foreground">No proctoring events recorded.</div>
                              ) : (
                                <div className="space-y-1">
                                  {(r.violations || []).map((v: any, j: number) => (
                                    <div key={j} className="flex items-center justify-between text-xs bg-background/40 rounded-md px-3 py-2">
                                      <span className="font-medium">{v.type}</span>
                                      <span className="text-muted-foreground truncate mx-3">{v.details || v.message}</span>
                                      <span className="font-mono text-destructive">+{v.points}</span>
                                      <span className="text-muted-foreground ml-3">{formatClock(v.timestamp)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ProctorSettings />
      </div>
    </div>
  );
};

export default AdminPanel;
