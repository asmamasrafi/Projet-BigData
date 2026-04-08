import { Shield, AlertTriangle, Bug, ShieldCheck, ShieldOff } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { allEvents, getMetrics, getThreatDistribution, getAttacksOverTime, getBytesByThreatType } from "@/data/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from "recharts";

const NEON_COLORS = {
  green: "hsl(160, 100%, 45%)",
  red: "hsl(0, 85%, 55%)",
  orange: "hsl(30, 95%, 55%)",
  blue: "hsl(200, 100%, 50%)",
  cyan: "hsl(185, 100%, 50%)",
  purple: "hsl(270, 80%, 60%)",
};

const PIE_COLORS = [NEON_COLORS.red, NEON_COLORS.orange, NEON_COLORS.green];

export default function DashboardOverview() {
  const metrics = getMetrics(allEvents);
  const distribution = getThreatDistribution(allEvents);
  const attacksOverTime = getAttacksOverTime(allEvents);
  const bytesData = getBytesByThreatType(allEvents);

  const pieData = [
    { name: "Malicious", value: metrics.malicious },
    { name: "Suspicious", value: metrics.suspicious },
    { name: "Benign", value: metrics.benign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Lambda Architecture — Batch + Speed Layer Analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Threats" value={metrics.total} icon={Shield} variant="blue" subtitle="Last 30 days" />
        <StatCard title="Malicious" value={metrics.malicious} icon={Bug} variant="red" subtitle={`${((metrics.malicious / metrics.total) * 100).toFixed(1)}% of total`} />
        <StatCard title="Suspicious" value={metrics.suspicious} icon={AlertTriangle} variant="orange" subtitle="Requires review" />
        <StatCard title="Blocked" value={metrics.blocked} icon={ShieldOff} variant="green" subtitle="Auto-mitigated" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Distribution Pie */}
        <div className="cyber-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Threat Classification</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 90%)" }} />
              <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attacks Over Time */}
        <div className="cyber-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Attacks Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attacksOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 90%)" }} />
              <Line type="monotone" dataKey="malicious" stroke={NEON_COLORS.red} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="suspicious" stroke={NEON_COLORS.orange} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="benign" stroke={NEON_COLORS.green} strokeWidth={2} dot={false} />
              <Legend formatter={(value) => <span className="text-xs text-muted-foreground capitalize">{value}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bytes by Threat Type */}
      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Data Transferred by Threat Type (KB)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bytesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 90%)" }} />
            <Bar dataKey="bytes" fill={NEON_COLORS.cyan} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Threat Types Table */}
      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Top Threat Types</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Threat Type</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Count</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {distribution.slice(0, 6).map((d) => (
                <tr key={d.name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="py-2 px-3 font-mono text-foreground">{d.name}</td>
                  <td className="py-2 px-3 text-right neon-text-blue">{d.value}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{((d.value / metrics.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
