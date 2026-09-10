// Shared proctoring types, configuration and helpers for SecureExam AI.

export type Severity = "Low" | "Medium" | "High";

export type ProctorCategory = "camera" | "network" | "browser";

export interface ProctorEvent {
  id: string;
  type: string;
  category: ProctorCategory;
  severity: Severity;
  points: number;
  details: string;
  timestamp: string;
  detectedPeopleCount?: number;
  ip?: string;
  previousIp?: string;
}

export interface ProctorConfig {
  multiplePersonThresholdMs: number;
  noFaceThresholdMs: number;
  lookingAwayThresholdMs: number;
  eventCooldownMs: number;
  detectionIntervalMs: number;
  ipChangeDetectionEnabled: boolean;
  ipPollIntervalMs: number;
  autoSubmitEnabled: boolean;
  autoSubmitScore: number;
  weights: {
    multiplePerson: number;
    noFace: number;
    lookingAway: number;
    cameraDisconnected: number;
    ipChange: number;
    tabSwitch: number;
    fullscreenExit: number;
    copyPaste: number;
    rightClick: number;
  };
}

export const DEFAULT_PROCTOR_CONFIG: ProctorConfig = {
  multiplePersonThresholdMs: 5000,
  noFaceThresholdMs: 8000,
  lookingAwayThresholdMs: 5000,
  eventCooldownMs: 15000,
  detectionIntervalMs: 700,
  ipChangeDetectionEnabled: true,
  ipPollIntervalMs: 60000,
  autoSubmitEnabled: true,
  autoSubmitScore: 80,
  weights: {
    multiplePerson: 25,
    noFace: 15,
    lookingAway: 10,
    cameraDisconnected: 15,
    ipChange: 15,
    tabSwitch: 20,
    fullscreenExit: 20,
    copyPaste: 30,
    rightClick: 10,
  },
};

const CONFIG_KEY = "secureexam_proctor_config";

export const loadProctorConfig = (): ProctorConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_PROCTOR_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROCTOR_CONFIG,
      ...parsed,
      weights: { ...DEFAULT_PROCTOR_CONFIG.weights, ...(parsed.weights || {}) },
    };
  } catch {
    return DEFAULT_PROCTOR_CONFIG;
  }
};

export const saveProctorConfig = (cfg: ProctorConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
};

export const severityForPoints = (points: number): Severity =>
  points >= 20 ? "High" : points >= 12 ? "Medium" : "Low";

export const riskLabel = (score: number): Severity =>
  score <= 30 ? "Low" : score <= 60 ? "Medium" : "High";

export const categoryOf = (type: string): ProctorCategory => {
  if (/camera|people|person|face|looking/i.test(type)) return "camera";
  if (/ip|network/i.test(type)) return "network";
  return "browser";
};

export interface ProctorSummary {
  totalEvents: number;
  multiplePerson: number;
  faceMissing: number;
  lookingAway: number;
  tabSwitch: number;
  fullscreenExit: number;
  copyPaste: number;
  rightClick: number;
  cameraInterruptions: number;
  ipChanges: number;
  maxPeopleDetected: number;
}

export const summarizeEvents = (events: ProctorEvent[] = []): ProctorSummary => {
  const count = (re: RegExp) => events.filter((e) => re.test(e.type)).length;
  return {
    totalEvents: events.length,
    multiplePerson: count(/multiple people/i),
    faceMissing: count(/face missing|candidate not detected/i),
    lookingAway: count(/looking away/i),
    tabSwitch: count(/tab switch/i),
    fullscreenExit: count(/fullscreen/i),
    copyPaste: count(/copy\/paste/i),
    rightClick: count(/right click/i),
    cameraInterruptions: count(/camera/i),
    ipChanges: count(/ip address changed/i),
    maxPeopleDetected: events.reduce((m, e) => Math.max(m, e.detectedPeopleCount || 0), 1),
  };
};

export const formatClock = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
};
