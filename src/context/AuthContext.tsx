import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  role: "student" | "admin";
}

interface ExamResult {
  userId: string;
  userName: string;
  college: string;
  score: number;
  suspicionScore: number;
  violations: Violation[];
  timeTaken: number;
  submissionReason: string;
  submittedAt: string;
  ip: string;
  device: string;
}

interface Violation {
  type: string;
  points: number;
  timestamp: string;
  message: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, college: string) => boolean;
  logout: () => void;
  examResults: ExamResult[];
  addExamResult: (result: ExamResult) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("secureexam_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    const stored = localStorage.getItem("secureexam_results");
    return stored ? JSON.parse(stored) : [];
  });

  const register = (name: string, email: string, _password: string, college: string): boolean => {
    const users = JSON.parse(localStorage.getItem("secureexam_users") || "[]");
    if (users.find((u: any) => u.email === email)) return false;
    const newUser = { id: crypto.randomUUID(), name, email, college, role: "student" as const, password: _password };
    users.push(newUser);
    localStorage.setItem("secureexam_users", JSON.stringify(users));
    return true;
  };

  const login = (email: string, password: string): boolean => {
    // Admin shortcut
    if (email === "admin@secureexam.ai" && password === "admin123") {
      const adminUser: User = { id: "admin", name: "Admin", email, college: "SecureExam", role: "admin" };
      setUser(adminUser);
      localStorage.setItem("secureexam_user", JSON.stringify(adminUser));
      return true;
    }
    const users = JSON.parse(localStorage.getItem("secureexam_users") || "[]");
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) return false;
    const u: User = { id: found.id, name: found.name, email: found.email, college: found.college, role: "student" };
    setUser(u);
    localStorage.setItem("secureexam_user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("secureexam_user");
  };

  const addExamResult = (result: ExamResult) => {
    const updated = [...examResults, result];
    setExamResults(updated);
    localStorage.setItem("secureexam_results", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, examResults, addExamResult }}>
      {children}
    </AuthContext.Provider>
  );
};
