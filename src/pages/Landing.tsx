import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, Mic, Camera, Monitor, AlertTriangle, BarChart3, Lock } from "lucide-react";

const features = [
  { icon: Eye, title: "Tab Switch Detection", desc: "Detects when candidates switch tabs and triggers instant alerts", color: "text-primary" },
  { icon: Lock, title: "Copy-Paste Block", desc: "Prevents copying, pasting, and cutting during examination", color: "text-destructive" },
  { icon: Monitor, title: "Fullscreen Lock", desc: "Forces fullscreen mode and detects exit attempts", color: "text-warning" },
  { icon: AlertTriangle, title: "DevTools Detection", desc: "Identifies developer tools usage and browser extensions", color: "text-accent" },
  { icon: Mic, title: "AI Voice Alerts", desc: "Real-time voice warnings using AI speech synthesis", color: "text-success" },
  { icon: Camera, title: "Camera Monitoring", desc: "WebRTC-based motion detection and behavior analysis", color: "text-primary" },
  { icon: Shield, title: "Extension Detection", desc: "Detects AI assistants and browser extension overlays", color: "text-destructive" },
  { icon: BarChart3, title: "Admin Analytics", desc: "Comprehensive dashboard with suspicion scoring", color: "text-accent" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(190 95% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(190 95% 50% / 0.3) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold gradient-text">SecureExam AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Login
          </button>
          <button onClick={() => navigate("/register")} className="px-5 py-2 text-sm font-medium rounded-lg gradient-bg text-primary-foreground hover:opacity-90 transition-opacity">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Proctoring
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 max-w-4xl leading-[1.1]"
        >
          Smart AI-Based{" "}
          <span className="gradient-text">Anti-Cheating</span>{" "}
          Exam Platform
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
        >
          Continuous, secure, explainable assessments powered by real-time AI monitoring.
          MCQs, coding tests, and short answers — all proctored automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-4"
        >
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3.5 rounded-xl gradient-bg text-primary-foreground font-semibold text-lg pulse-glow hover:opacity-90 transition-all"
          >
            ✨ Start Exam
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 rounded-xl glass font-semibold text-lg hover:bg-card/80 transition-all"
          >
            Admin Login
          </button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-4"
        >
          AI Monitoring <span className="gradient-text">Features</span>
        </motion.h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Multi-layered detection system ensuring exam integrity at every level
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass rounded-xl p-6 cursor-default group"
            >
              <f.icon className={`w-8 h-8 ${f.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Why <span className="gradient-text">SecureExam AI</span>?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Traditional online exams fail because monitoring and enforcement are weak. Candidates exploit tab switching, AI tools, browser extensions, and copy-paste to cheat.
            SecureExam AI uses AI-native behavioral monitoring with automated enforcement — replacing human proctors with scalable, real-time AI supervision.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[
              { label: "Hiring", icon: "🏢" },
              { label: "University", icon: "🎓" },
              { label: "Certification", icon: "📜" },
              { label: "Interviews", icon: "💼" },
            ].map((u) => (
              <div key={u.label} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{u.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center text-sm text-muted-foreground">
        © 2026 SecureExam AI. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
