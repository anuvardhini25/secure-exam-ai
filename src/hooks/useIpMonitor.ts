import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  enabled?: boolean;
  pollIntervalMs?: number;
  onIpChange?: (previous: string, next: string) => void;
}

/**
 * Server-side public IP monitoring. The IP is resolved by an edge function
 * from the request headers - never trusted from the client.
 */
export const useIpMonitor = ({ enabled = true, pollIntervalMs = 60000, onIpChange }: Options = {}) => {
  const [ip, setIp] = useState<string>("");
  const [initialIp, setInitialIp] = useState<string>("");
  const [ipChanges, setIpChanges] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const ipRef = useRef("");
  const changeRef = useRef(onIpChange);
  changeRef.current = onIpChange;

  const fetchIp = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("session-ip");
      if (error) throw error;
      const next: string = data?.ip || "unknown";
      if (!ipRef.current) {
        ipRef.current = next;
        setIp(next);
        setInitialIp(next);
      } else if (next !== ipRef.current && next !== "unknown") {
        const prev = ipRef.current;
        ipRef.current = next;
        setIp(next);
        setIpChanges((c) => c + 1);
        changeRef.current?.(prev, next);
      }
    } catch {
      /* network hiccup - keep last known value */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchIp();
    const id = setInterval(fetchIp, pollIntervalMs);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [enabled, pollIntervalMs, fetchIp]);

  return { ip, initialIp, ipChanges, online, loading, refresh: fetchIp };
};
