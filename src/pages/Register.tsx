import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !college) {
      setError("All fields are required");
      return;
    }
    const ok = register(name, email, password, college);
    if (!ok) {
      setError("Email already registered");
      return;
    }
    setShowSuccess(true);
    setTimeout(() => navigate("/login"), 4000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="glass-strong rounded-2xl p-10 max-w-md text-center glow-primary">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 gradient-text">Registration Successful!</h2>
              <p className="text-muted-foreground leading-relaxed italic">
                Don't try to cheat, don't try to peek,<br />
                Smart AI sees you every week.<br />
                Study smart and do your best,<br />
                Honest minds will beat the rest!
              </p>
              <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">SecureExam AI</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Register to start your secure examination</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
          )}
          {[
            { label: "Full Name", value: name, set: setName, type: "text", placeholder: "John Doe" },
            { label: "Email", value: email, set: setEmail, type: "email", placeholder: "john@example.com" },
            { label: "Password", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
            { label: "College Name", value: college, set: setCollege, type: "text", placeholder: "MIT" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
          ))}
          <button type="submit" className="w-full py-3 rounded-lg gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Register
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
