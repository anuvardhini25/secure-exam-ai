import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = login(email, password);
    if (!ok) {
      setError("Invalid credentials");
      return;
    }
    const user = JSON.parse(localStorage.getItem("secureexam_user") || "{}");
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">SecureExam AI</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

          <div className="bg-primary/10 rounded-lg p-3 text-xs text-primary">
            <strong>Admin:</strong> admin@secureexam.ai / admin123
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Sign In
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
