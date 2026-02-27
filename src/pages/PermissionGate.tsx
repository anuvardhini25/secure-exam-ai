import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Mic, Maximize, Volume2, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PermissionGate = () => {
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);
  const [volumeOk, setVolumeOk] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOk(true);
    } catch { /* denied */ }
  }, []);

  const requestMic = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicOk(true);
    } catch { /* denied */ }
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenOk(true);
    } catch { /* denied */ }
  }, []);

  const confirmVolume = () => setVolumeOk(true);

  const allReady = cameraOk && micOk && fullscreenOk && volumeOk;

  const steps = [
    { icon: Camera, label: "Camera Access", done: cameraOk, action: requestCamera },
    { icon: Mic, label: "Microphone Access", done: micOk, action: requestMic },
    { icon: Maximize, label: "Fullscreen Mode", done: fullscreenOk, action: requestFullscreen },
    { icon: Volume2, label: "Volume Enforcement", done: volumeOk, action: confirmVolume },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Permission Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Grant all permissions before starting the exam</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-4">
          {/* Camera preview */}
          {cameraOk && (
            <div className="rounded-xl overflow-hidden border border-border mb-4">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-40 object-cover bg-secondary" />
            </div>
          )}

          {steps.map((s) => (
            <button
              key={s.label}
              onClick={s.action}
              disabled={s.done}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                s.done ? "bg-success/10 border border-success/30" : "bg-secondary hover:bg-secondary/80 border border-border"
              }`}
            >
              {s.done ? <CheckCircle className="w-6 h-6 text-success" /> : <s.icon className="w-6 h-6 text-muted-foreground" />}
              <span className={`font-medium ${s.done ? "text-success" : ""}`}>{s.label}</span>
              {!s.done && <span className="ml-auto text-xs text-muted-foreground">Click to grant</span>}
            </button>
          ))}

          <button
            onClick={() => navigate("/exam")}
            disabled={!allReady}
            className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all mt-4 ${
              allReady ? "gradient-bg text-primary-foreground pulse-glow cursor-pointer" : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            {allReady ? "🚀 Start Exam" : "Grant All Permissions"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PermissionGate;
