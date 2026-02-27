import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <nav className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            <span className="font-bold gradient-text">SecureExam AI</span>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-1">Welcome, <span className="gradient-text">{user?.name}</span></h1>
          <p className="text-muted-foreground mb-8">{user?.college}</p>

          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI-Proctored Assessment</h2>
                <p className="text-sm text-muted-foreground">MCQ, Short Answer & Coding • 30 minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              {[
                { label: "Questions", value: "5" },
                { label: "Duration", value: "30 min" },
                { label: "Languages", value: "4" },
              ].map((s) => (
                <div key={s.label} className="bg-secondary rounded-xl p-4">
                  <div className="text-2xl font-bold gradient-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-warning font-medium">⚠️ This exam is AI-proctored. Tab switching, copy-paste, and other malpractice will be detected and penalized automatically.</p>
            </div>

            <button
              onClick={() => navigate("/permissions")}
              className="w-full py-3 rounded-xl gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition pulse-glow"
            >
              ✨ Begin Assessment
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
