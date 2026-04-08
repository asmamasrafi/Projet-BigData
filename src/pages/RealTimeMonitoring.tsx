import { useState, useEffect, useCallback } from "react";
import { Activity, Pause, Play } from "lucide-react";
import { generateEvents, type ThreatEvent } from "@/data/mockData";

export default function RealTimeMonitoring() {
  const [events, setEvents] = useState<ThreatEvent[]>(() => generateEvents(30, 1));
  const [paused, setPaused] = useState(false);

  const addEvent = useCallback(() => {
    const newEvent = generateEvents(1, 0)[0];
    newEvent.timestamp = new Date().toISOString();
    setEvents(prev => [newEvent, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(addEvent, 2500);
    return () => clearInterval(interval);
  }, [paused, addEvent]);

  const labelClass = (label: ThreatEvent["threat_label"]) => {
    switch (label) {
      case "malicious": return "threat-row-malicious";
      case "suspicious": return "threat-row-suspicious";
      default: return "threat-row-benign";
    }
  };

  const labelBadge = (label: ThreatEvent["threat_label"]) => {
    const styles = {
      malicious: "bg-neon-red/15 text-neon-red",
      suspicious: "bg-neon-orange/15 text-neon-orange",
      benign: "bg-neon-green/15 text-neon-green",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[label]}`}>{label}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Real-Time Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Speed Layer — Live threat stream</p>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm"
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
        <span>{paused ? "Stream paused" : "Live — auto-refreshing every 2.5s"}</span>
        <span className="ml-auto">{events.length} events loaded</span>
      </div>

      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Timestamp", "Source IP", "Dest IP", "Protocol", "Threat", "Action"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e.id + i} className={`border-b border-border/30 transition-colors hover:bg-secondary/30 ${labelClass(e.threat_label)}`}>
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-foreground">{e.source_ip}</td>
                  <td className="py-2 px-3 font-mono text-xs text-foreground">{e.dest_ip}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-xs text-secondary-foreground">{e.protocol}</span>
                  </td>
                  <td className="py-2 px-3">{labelBadge(e.threat_label)}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs font-medium ${e.action === "blocked" ? "neon-text-green" : e.action === "allowed" ? "neon-text-red" : "text-muted-foreground"}`}>
                      {e.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
