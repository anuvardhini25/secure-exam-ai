import { useEffect, useRef, useState, type RefObject } from "react";

export interface DetectionState {
  modelLoading: boolean;
  modelReady: boolean;
  modelError: string;
  peopleCount: number;
  faceVisible: boolean;
  lookingAway: boolean;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  intervalMs?: number;
}

/**
 * Real-time face / person detection using TensorFlow.js BlazeFace.
 * The model is lazy-loaded and inference runs on a throttled interval
 * (never per animation frame) so the exam UI stays responsive.
 */
export const useFaceDetection = ({ videoRef, enabled, intervalMs = 700 }: Options): DetectionState => {
  const [state, setState] = useState<DetectionState>({
    modelLoading: false,
    modelReady: false,
    modelError: "",
    peopleCount: 0,
    faceVisible: false,
    lookingAway: false,
  });

  const modelRef = useRef<any>(null);
  const runningRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    cancelledRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      if (modelRef.current) return;
      setState((s) => ({ ...s, modelLoading: true, modelError: "" }));
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        const blazeface = await import("@tensorflow-models/blazeface");
        const model = await blazeface.load();
        if (cancelledRef.current) return;
        modelRef.current = model;
        setState((s) => ({ ...s, modelLoading: false, modelReady: true }));
      } catch (err) {
        if (cancelledRef.current) return;
        setState((s) => ({
          ...s,
          modelLoading: false,
          modelReady: false,
          modelError: "AI detection model could not be loaded.",
        }));
      }
    };

    const tick = async () => {
      if (cancelledRef.current) return;
      const video = videoRef.current;
      const model = modelRef.current;
      if (model && video && video.readyState >= 2 && video.videoWidth > 0 && !runningRef.current) {
        runningRef.current = true;
        try {
          const predictions: any[] = await model.estimateFaces(video, false);
          if (!cancelledRef.current) {
            const count = predictions.length;
            let away = false;
            if (count === 1) {
              const p = predictions[0];
              const lm = p.landmarks as number[][] | undefined;
              if (lm && lm.length >= 4) {
                const [rightEye, leftEye, nose] = lm;
                const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
                const eyeDist = Math.abs(leftEye[0] - rightEye[0]) || 1;
                away = Math.abs(nose[0] - eyeMidX) / eyeDist > 0.42;
              }
            }
            setState((s) =>
              s.peopleCount === count && s.faceVisible === count > 0 && s.lookingAway === away
                ? s
                : { ...s, peopleCount: count, faceVisible: count > 0, lookingAway: away },
            );
          }
        } catch {
          /* transient inference error - ignore */
        } finally {
          runningRef.current = false;
        }
      }
      if (!cancelledRef.current) timer = setTimeout(tick, intervalMs);
    };

    load().then(() => {
      if (!cancelledRef.current) tick();
    });

    return () => {
      cancelledRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, intervalMs, videoRef]);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, peopleCount: 0, faceVisible: false, lookingAway: false }));
    }
  }, [enabled]);

  return state;
};
