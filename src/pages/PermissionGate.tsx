import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Maximize, Volume2, CheckCircle, Shield, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useIpMonitor } from "@/hooks/useIpMonitor";
import ProctorMonitor from "@/components/ProctorMonitor";

const PermissionGate = () => {
  const [micOk, setMicOk] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);
  const [volumeOk, setVolumeOk] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const camera = useCamera({ enabled: true });
  const detection = useFaceDetection({ videoRef: camera.videoRef, enabled: camera.isActive });
  const ipMonitor = useIpMonitor({ enabled: true, pollIntervalMs: 60000 });

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const requestMic = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
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

  const cameraOk = camera.isActive;
  const facePresent = detection.peopleCount === 1;
  const allReady = cameraOk && micOk && fullscreenOk && volumeOk && facePresent && ipMonitor.online;

  const steps = [
    { icon: Camera, label: "Camera Access", done: cameraOk, action: camera.retry },
    { icon: Mic, label: "Microphone Access", done: micOk, action: requestMic },
    { icon: Maximize, label: "Fullscreen Mode", done: fullscreenOk, action: requestFullscreen },
    { icon: Volume2, label: "Volume Enforcement", done: volumeOk, action: confirmVolume },
  ];

  const checks = [
    { label: "AI detection model loaded", done: detection.modelReady },
    {
      label:
        detection.peopleCount > 1
          ? `Only one person allowed (${detection.peopleCount} detected)`
          : "Exactly one person in frame",
      done: facePresent,
    },
    { label: "Network connection stable", done: ipMonitor.online },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Camera &amp; Proctoring Check</h1>
          <p className="text-sm text-muted-foreground mt-1">Grant all permissions and pass the checks before starting</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-4">
          <ProctorMonitor
            attach={camera.attach}
            status={camera.status}
            errorMessage={camera.errorMessage}
            onRetry={camera.retry}
            peopleCount={detection.peopleCount}
            faceVisible={detection.faceVisible}
            lookingAway={detection.lookingAway}
            modelLoading={detection.modelLoading}
            modelReady={detection.modelReady}
            modelError={detection.modelError}
            online={ipMonitor.online}
          />

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

          <div className="space-y-2 pt-2">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${c.done ? "bg-success" : "bg-warning animate-pulse"}`} />
                <span className={c.done ? "text-success" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/exam")}
            disabled={!allReady}
            className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all mt-4 ${
              allReady ? "gradient-bg text-primary-foreground pulse-glow cursor-pointer" : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            {allReady ? "🚀 Start Exam" : "Complete All Checks"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PermissionGate;
