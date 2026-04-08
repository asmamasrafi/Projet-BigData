import { useState } from "react";
import { Search, AlertTriangle, Shield, Clock, Crosshair } from "lucide-react";
import { allEvents, getIPAnalysis } from "@/data/mockData";

export default function IPAnalysis() {
  const [searchIP, setSearchIP] = useState("");
  const [result, setResult] = useState<ReturnType<typeof getIPAnalysis> | null>(null);

  const handleSearch = () => {
    if (!searchIP.trim()) return;
    setResult(getIPAnalysis(searchIP.trim(), allEvents));
  };

  const scoreColor = (score: number) => {
    if (score > 70) return "neon-text-red";
    if (score > 40) return "neon-text-orange";
    return "neon-text-green";
  };

  const scoreGlow = (score: number) => {
    if (score > 70) return "cyber-glow-red";
    if (score > 40) return "";
    return "cyber-glow-green";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Crosshair className="w-6 h-6 text-neon-blue" />
          IP Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Batch + Speed Layer — Combined threat intelligence</p>
      </div>

      <div className="cyber-card">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchIP}
              onChange={e => setSearchIP(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
            Analyze
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Threat Score */}
            <div className={`cyber-card text-center ${scoreGlow(result.score)}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Threat Score</p>
              <p className={`text-5xl font-bold ${scoreColor(result.score)}`}>{result.score}</p>
              <p className="text-xs text-muted-foreground mt-2">/100</p>
            </div>

            {/* Attack Stats */}
            <div className="cyber-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Attack Statistics</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Attacks</span>
                  <span className="font-mono text-foreground">{result.totalAttacks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Malicious</span>
                  <span className="font-mono neon-text-red">{result.malicious}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Suspicious</span>
                  <span className="font-mono neon-text-orange">{result.suspicious}</span>
                </div>
              </div>
            </div>

            {/* Last Activity */}
            <div className="cyber-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Details</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Last seen:</span>
                  <span className="font-mono text-xs text-foreground">{result.lastActivity ? new Date(result.lastActivity).toLocaleString() : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono text-foreground">{result.ip}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attack Types */}
          <div className="cyber-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Attack Types Detected</h3>
            <div className="flex flex-wrap gap-2">
              {result.attackTypes.map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-neon-red/10 text-neon-red text-xs font-medium border border-neon-red/20">{t}</span>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="cyber-card">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-orange" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {result.recommendations.map((r, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-secondary/50 text-sm text-secondary-foreground">{r}</div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="cyber-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Events from this IP</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Time", "Protocol", "Type", "Label", "Action"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.events.map((e, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1.5 px-3 font-mono text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-xs">{e.protocol}</td>
                      <td className="py-1.5 px-3 text-xs text-foreground">{e.threat_type}</td>
                      <td className="py-1.5 px-3">
                        <span className={`text-xs ${e.threat_label === "malicious" ? "neon-text-red" : e.threat_label === "suspicious" ? "neon-text-orange" : "neon-text-green"}`}>
                          {e.threat_label}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{e.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
