import { useEffect, useRef } from "react";
import type { ProctorConfig } from "@/lib/proctoring";
import type { CameraStatus } from "@/hooks/useCamera";

export interface RaisedEvent {
  type: string;
  points: number;
  details: string;
  voice: string;
  peopleCount?: number;
}

interface Options {
  active: boolean;
  config: ProctorConfig;
  peopleCount: number;
  faceVisible: boolean;
  lookingAway: boolean;
  detectionReady: boolean;
  cameraStatus: CameraStatus;
  onEvent: (e: RaisedEvent) => void;
}

type CondKey = "multi" | "noFace" | "away" | "cameraLost";

/**
 * Turns continuous detection signals into discrete proctoring events using
 * per-condition thresholds, cooldowns and state tracking, so a condition that
 * persists never produces one event per video frame.
 */
export const useDetectionEvents = ({
  active,
  config,
  peopleCount,
  faceVisible,
  lookingAway,
  detectionReady,
  cameraStatus,
  onEvent,
}: Options) => {
  const signals = useRef({ peopleCount, faceVisible, lookingAway, detectionReady, cameraStatus, active });
  signals.current = { peopleCount, faceVisible, lookingAway, detectionReady, cameraStatus, active };

  const cfgRef = useRef(config);
  cfgRef.current = config;
  const emitRef = useRef(onEvent);
  emitRef.current = onEvent;

  const stateRef = useRef<Record<CondKey, { since: number | null; lastFired: number }>>({
    multi: { since: null, lastFired: 0 },
    noFace: { since: null, lastFired: 0 },
    away: { since: null, lastFired: 0 },
    cameraLost: { since: null, lastFired: 0 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const s = signals.current;
      const cfg = cfgRef.current;
      const now = Date.now();

      const evaluate = (
        key: CondKey,
        condition: boolean,
        thresholdMs: number,
        build: (heldMs: number) => RaisedEvent,
      ) => {
        const st = stateRef.current[key];
        if (!condition) {
          st.since = null;
          return;
        }
        if (st.since === null) {
          st.since = now;
          return;
        }
        const held = now - st.since;
        if (held >= thresholdMs && now - st.lastFired >= cfg.eventCooldownMs) {
          st.lastFired = now;
          emitRef.current(build(held));
        }
      };

      if (!s.active) return;

      const camOk = s.cameraStatus === "active";
      const detecting = camOk && s.detectionReady;

      evaluate(
        "cameraLost",
        !camOk && s.cameraStatus !== "requesting" && s.cameraStatus !== "idle",
        3000,
        () => ({
          type: "Camera Disconnected",
          points: cfg.weights.cameraDisconnected,
          details: `Camera unavailable (${s.cameraStatus}) during the exam`,
          voice: "Your camera is not available. Please restore your camera immediately.",
        }),
      );

      evaluate(
        "multi",
        detecting && s.peopleCount > 1,
        cfg.multiplePersonThresholdMs,
        (held) => ({
          type: "Multiple People",
          points: cfg.weights.multiplePerson,
          details: `${s.peopleCount} people detected for ${Math.round(held / 1000)} seconds`,
          voice: "Multiple people detected in the camera. This is a serious violation.",
          peopleCount: s.peopleCount,
        }),
      );

      evaluate(
        "noFace",
        detecting && s.peopleCount === 0,
        cfg.noFaceThresholdMs,
        (held) => ({
          type: "Face Missing",
          points: cfg.weights.noFace,
          details: `No face detected for ${Math.round(held / 1000)} seconds`,
          voice: "Candidate not detected in front of the camera.",
          peopleCount: 0,
        }),
      );

      evaluate(
        "away",
        detecting && s.peopleCount === 1 && s.lookingAway,
        cfg.lookingAwayThresholdMs,
        (held) => ({
          type: "Looking Away",
          points: cfg.weights.lookingAway,
          details: `Candidate looked away from the screen for ${Math.round(held / 1000)} seconds`,
          voice: "Please keep looking at your screen.",
          peopleCount: 1,
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);
};
