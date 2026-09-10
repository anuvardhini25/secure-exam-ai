import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "permission-required"
  | "unavailable"
  | "disconnected"
  | "error";

export const CAMERA_STATUS_LABEL: Record<CameraStatus, string> = {
  idle: "Camera Idle",
  requesting: "Starting Camera…",
  active: "Camera Active",
  "permission-required": "Camera Permission Required",
  unavailable: "Camera Unavailable",
  disconnected: "Camera Disconnected",
  error: "Camera Error",
};

interface Options {
  enabled?: boolean;
  autoRecover?: boolean;
}

/**
 * Reusable, leak-free webcam hook. Guarantees a single MediaStream,
 * recovers from temporary interruptions and stops all tracks on cleanup.
 */
export const useCamera = ({ enabled = true, autoRecover = true }: Options = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const recoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const stop = useCallback(() => {
    if (recoverTimer.current) {
      clearTimeout(recoverTimer.current);
      recoverTimer.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current || streamRef.current) return;
    startingRef.current = true;
    setStatus("requesting");
    setErrorMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setErrorMessage("This browser does not support camera access.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          streamRef.current = null;
          if (!mountedRef.current) return;
          setStatus("disconnected");
          setErrorMessage("The camera stream stopped unexpectedly.");
          if (autoRecover) {
            recoverTimer.current = setTimeout(() => start(), 2500);
          }
        };
      });
      setStatus("active");
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        setStatus("permission-required");
        setErrorMessage("Camera access was blocked. Allow the camera in your browser and try again.");
      } else if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") {
        setStatus("unavailable");
        setErrorMessage("No camera was found on this device.");
      } else if (e?.name === "NotReadableError") {
        setStatus("error");
        setErrorMessage("The camera is being used by another application.");
        if (autoRecover) recoverTimer.current = setTimeout(() => start(), 3000);
      } else {
        setStatus("error");
        setErrorMessage(e?.message || "Unable to start the camera.");
      }
    } finally {
      startingRef.current = false;
    }
  }, [autoRecover]);

  const retry = useCallback(() => {
    stop();
    setTimeout(() => start(), 200);
  }, [start, stop]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) start();
    return () => {
      mountedRef.current = false;
      if (recoverTimer.current) clearTimeout(recoverTimer.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Reattach the stream if the <video> element mounts later.
  const attach = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  return { videoRef, attach, status, errorMessage, start, stop, retry, isActive: status === "active" };
};
