import { useState } from "react";
import { Settings, RotateCcw, Save } from "lucide-react";
import {
  loadProctorConfig,
  saveProctorConfig,
  DEFAULT_PROCTOR_CONFIG,
  type ProctorConfig,
} from "@/lib/proctoring";
import { toast } from "sonner";

const thresholdFields: { key: keyof ProctorConfig; label: string; hint: string }[] = [
  { key: "multiplePersonThresholdMs", label: "Multiple people duration (ms)", hint: "How long extra people must stay in frame" },
  { key: "noFaceThresholdMs", label: "Face missing duration (ms)", hint: "How long the candidate can be absent" },
  { key: "lookingAwayThresholdMs", label: "Looking away duration (ms)", hint: "How long attention can drift" },
  { key: "eventCooldownMs", label: "Event cooldown (ms)", hint: "Minimum gap between identical events" },
  { key: "detectionIntervalMs", label: "Detection interval (ms)", hint: "How often the camera feed is analysed" },
  { key: "ipPollIntervalMs", label: "Network check interval (ms)", hint: "How often the address is re-checked" },
  { key: "autoSubmitScore", label: "Auto-submit risk score", hint: "Exam submits automatically at or above this" },
];

const weightLabels: Record<keyof ProctorConfig["weights"], string> = {
  multiplePerson: "Multiple people",
  noFace: "Candidate not detected",
  lookingAway: "Looking away",
  cameraDisconnected: "Camera interrupted",
  ipChange: "Address changed",
  tabSwitch: "Tab switch",
  fullscreenExit: "Fullscreen exit",
  copyPaste: "Copy / paste",
  rightClick: "Right click",
};

const ProctorSettings = () => {
  const [cfg, setCfg] = useState<ProctorConfig>(() => loadProctorConfig());

  const setNum = (key: keyof ProctorConfig, value: string) =>
    setCfg((c) => ({ ...c, [key]: Math.max(0, Number(value) || 0) }));

  const setWeight = (key: keyof ProctorConfig["weights"], value: string) =>
    setCfg((c) => ({ ...c, weights: { ...c.weights, [key]: Math.max(0, Number(value) || 0) } }));

  const save = () => {
    saveProctorConfig(cfg);
    toast.success("Proctoring settings saved");
  };

  const reset = () => {
    setCfg(DEFAULT_PROCTOR_CONFIG);
    saveProctorConfig(DEFAULT_PROCTOR_CONFIG);
    toast.success("Restored default settings");
  };

  return (
    <div className="glass rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Proctoring Settings</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition">
            <RotateCcw className="w-3.5 h-3.5" /> Defaults
          </button>
          <button onClick={save} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg gradient-bg text-primary-foreground font-medium">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {thresholdFields.map((f) => (
          <label key={String(f.key)} className="block">
            <span className="text-xs font-medium">{f.label}</span>
            <input
              type="number"
              value={cfg[f.key] as number}
              onChange={(e) => setNum(f.key, e.target.value)}
              className="mt-1 w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-[11px] text-muted-foreground">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 mt-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cfg.autoSubmitEnabled}
            onChange={(e) => setCfg((c) => ({ ...c, autoSubmitEnabled: e.target.checked }))}
            className="accent-primary w-4 h-4"
          />
          Auto-submit on severe risk
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cfg.ipChangeDetectionEnabled}
            onChange={(e) => setCfg((c) => ({ ...c, ipChangeDetectionEnabled: e.target.checked }))}
            className="accent-primary w-4 h-4"
          />
          Monitor address changes
        </label>
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-semibold mb-3">Risk weights</h4>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(Object.keys(weightLabels) as (keyof ProctorConfig["weights"])[]).map((k) => (
            <label key={k} className="block">
              <span className="text-xs font-medium">{weightLabels[k]}</span>
              <input
                type="number"
                value={cfg.weights[k]}
                onChange={(e) => setWeight(k, e.target.value)}
                className="mt-1 w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProctorSettings;
