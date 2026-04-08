import { Database, Code, Key, Zap, Search, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { allEvents, getAttackPatterns } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const iconMap: Record<string, React.ElementType> = {
  Database, Code, Key, Zap, Search, Mail,
};

const NEON_COLORS = {
  red: "hsl(0, 85%, 55%)",
  cyan: "hsl(185, 100%, 50%)",
  green: "hsl(160, 100%, 45%)",
};

export default function AttackPatterns() {
  const patterns = getAttackPatterns(allEvents);
  const chartData = patterns.map(p => ({ name: p.type, total: p.count, blocked: p.blocked }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attack Patterns</h1>
        <p className="text-sm text-muted-foreground mt-1">Batch Layer — Historical pattern analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patterns.map(p => {
          const Icon = iconMap[p.icon] || Shield;
          return (
            <div key={p.type} className="cyber-card hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-neon-red/10">
                    <Icon className="w-4 h-4 text-neon-red" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.type}</h3>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold neon-text-blue">{p.count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Malicious</p>
                  <p className="text-lg font-bold neon-text-red">{p.malicious}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                  <p className="text-lg font-bold neon-text-green">{p.blocked}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {p.trend > 0 ? (
                  <><TrendingUp className="w-3.5 h-3.5 text-neon-red" /><span className="neon-text-red">+{p.trend}%</span></>
                ) : (
                  <><TrendingDown className="w-3.5 h-3.5 text-neon-green" /><span className="neon-text-green">{p.trend}%</span></>
                )}
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Attack Volume Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 90%)" }} />
            <Bar dataKey="total" fill={NEON_COLORS.red} radius={[4, 4, 0, 0]} name="Total" />
            <Bar dataKey="blocked" fill={NEON_COLORS.green} radius={[4, 4, 0, 0]} name="Blocked" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Shield } from "lucide-react";
