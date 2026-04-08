import { Clock } from "lucide-react";
import { allEvents } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useMemo } from "react";

const NEON_COLORS = {
  green: "hsl(160, 100%, 45%)",
  red: "hsl(0, 85%, 55%)",
  orange: "hsl(30, 95%, 55%)",
  blue: "hsl(200, 100%, 50%)",
};

type TimeRange = "7d" | "14d" | "30d";

export default function ThreatTimeline() {
  const [range, setRange] = useState<TimeRange>("30d");

  const filteredEvents = useMemo(() => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allEvents.filter(e => new Date(e.timestamp) >= cutoff);
  }, [range]);

  const hourlyData = useMemo(() => {
    const byHour: Record<string, { malicious: number; suspicious: number; benign: number; total: number }> = {};
    filteredEvents.forEach(e => {
      const key = e.timestamp.slice(0, 13);
      if (!byHour[key]) byHour[key] = { malicious: 0, suspicious: 0, benign: 0, total: 0 };
      byHour[key][e.threat_label]++;
      byHour[key].total++;
    });
    return Object.entries(byHour)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, data]) => ({ time: time.slice(5).replace("T", " ") + "h", ...data }));
  }, [filteredEvents]);

  const timelineEvents = useMemo(() => {
    return filteredEvents.slice(0, 30).map(e => ({
      ...e,
      time: new Date(e.timestamp).toLocaleString(),
    }));
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-neon-purple" />
            Threat Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Evolution of threats over time</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["7d", "14d", "30d"] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Area Chart */}
      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Threat Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
            <XAxis dataKey="time" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 90%)" }} />
            <Area type="monotone" dataKey="malicious" stackId="1" stroke={NEON_COLORS.red} fill={NEON_COLORS.red} fillOpacity={0.15} />
            <Area type="monotone" dataKey="suspicious" stackId="1" stroke={NEON_COLORS.orange} fill={NEON_COLORS.orange} fillOpacity={0.15} />
            <Area type="monotone" dataKey="benign" stackId="1" stroke={NEON_COLORS.green} fill={NEON_COLORS.green} fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline */}
      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Threat Events</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {timelineEvents.map((e, i) => {
              const dotColor = e.threat_label === "malicious" ? "bg-neon-red" : e.threat_label === "suspicious" ? "bg-neon-orange" : "bg-neon-green";
              return (
                <div key={i} className="flex gap-4 pl-2">
                  <div className="relative flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${dotColor} mt-1.5 ring-2 ring-background`} />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">{e.source_ip}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-xs text-foreground">{e.dest_ip}</span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-xs text-secondary-foreground">{e.protocol}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{e.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{e.threat_type}</span>
                      <span className={`text-xs ${e.threat_label === "malicious" ? "neon-text-red" : e.threat_label === "suspicious" ? "neon-text-orange" : "neon-text-green"}`}>
                        {e.threat_label}
                      </span>
                      <span className={`text-xs ${e.action === "blocked" ? "neon-text-green" : "text-muted-foreground"}`}>{e.action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
