import { motion } from "framer-motion";
import { Camera, CameraOff, Users, ScanFace, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { CAMERA_STATUS_LABEL, type CameraStatus } from "@/hooks/useCamera";

interface Props {
  attach: (el: HTMLVideoElement | null) => void;
  status: CameraStatus;
  errorMessage?: string;
  onRetry?: () => void;
  peopleCount: number;
  faceVisible: boolean;
  lookingAway: boolean;
  modelLoading: boolean;
  modelReady: boolean;
  modelError?: string;
  online?: boolean;
  compact?: boolean;
}

const ProctorMonitor = ({
  attach,
  status,
  errorMessage,
  onRetry,
  peopleCount,
  faceVisible,
  lookingAway,
  modelLoading,
  modelReady,
  modelError,
  online = true,
  compact = false,
}: Props) => {
  const camOk = status === "active";
  const camColor = camOk ? "text-success" : status === "requesting" ? "text-warning" : "text-destructive";
  const peopleColor = peopleCount === 1 ? "text-success" : peopleCount === 0 ? "text-warning" : "text-destructive";

  return (
    <div className={`glass rounded-xl overflow-hidden ${compact ? "w-56" : "w-full"}`}>
      <div className="relative bg-secondary">
        <video
          ref={attach}
          autoPlay
          muted
          playsInline
          className={`w-full object-cover bg-secondary ${compact ? "h-32" : "h-52"}`}
        />
        {/* Live proctoring indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-2 py-1 text-[10px] font-semibold">
          <motion.span
            animate={{ opacity: camOk ? [1, 0.2, 1] : 0.4 }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-2 h-2 rounded-full ${camOk ? "bg-destructive" : "bg-muted-foreground"}`}
          />
          PROCTORING {camOk ? "LIVE" : "PAUSED"}
        </div>
        {!camOk && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 px-3 text-center">
            <CameraOff className="w-6 h-6 text-destructive" />
            <span className="text-xs font-semibold">{CAMERA_STATUS_LABEL[status]}</span>
            {errorMessage && <span className="text-[10px] text-muted-foreground">{errorMessage}</span>}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md gradient-bg text-primary-foreground font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Retry camera
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Camera className="w-3.5 h-3.5" /> Camera
          </span>
          <span className={`font-semibold ${camColor}`}>{CAMERA_STATUS_LABEL[status]}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> People Detected
          </span>
          <span className={`font-semibold ${peopleColor}`}>
            {modelReady ? peopleCount : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ScanFace className="w-3.5 h-3.5" /> Face
          </span>
          <span
            className={`font-semibold ${
              peopleCount > 1 ? "text-destructive" : faceVisible ? (lookingAway ? "text-warning" : "text-success") : "text-warning"
            }`}
          >
            {peopleCount > 1 ? "Multiple faces" : faceVisible ? (lookingAway ? "Looking away" : "Face detected") : "Not detected"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} Network
          </span>
          <span className={`font-semibold ${online ? "text-success" : "text-destructive"}`}>
            {online ? "Connected" : "Offline"}
          </span>
        </div>

        {modelLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading AI detection model…
          </div>
        )}
        {modelError && <div className="text-destructive">{modelError}</div>}
      </div>
    </div>
  );
};

export default ProctorMonitor;
