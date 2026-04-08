export interface ThreatEvent {
  id: string;
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  protocol: string;
  action: string;
  threat_label: "malicious" | "suspicious" | "benign";
  threat_type: string;
  bytes_transferred: number;
}

const threatTypes = [
  "SQL Injection", "XSS", "Brute Force", "DDoS", "Port Scan",
  "Phishing", "Malware", "Ransomware", "Man-in-the-Middle", "DNS Spoofing"
];

const protocols = ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "SSH", "FTP", "SMTP"];
const actions = ["blocked", "allowed", "flagged", "dropped"];
const labels: ThreatEvent["threat_label"][] = ["malicious", "suspicious", "benign"];

function randomIP() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d.toISOString();
}

export function generateEvents(count: number, daysBack = 30): ThreatEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `evt-${i.toString().padStart(5, "0")}`,
    timestamp: randomDate(daysBack),
    source_ip: randomIP(),
    dest_ip: randomIP(),
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    threat_label: labels[Math.floor(Math.random() * 3)],
    threat_type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
    bytes_transferred: Math.floor(Math.random() * 50000) + 100,
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const allEvents = generateEvents(500);

export const recentEvents = allEvents.slice(0, 50);

export function getMetrics(events: ThreatEvent[]) {
  const total = events.length;
  const malicious = events.filter(e => e.threat_label === "malicious").length;
  const suspicious = events.filter(e => e.threat_label === "suspicious").length;
  const benign = events.filter(e => e.threat_label === "benign").length;
  const blocked = events.filter(e => e.action === "blocked").length;
  return { total, malicious, suspicious, benign, blocked };
}

export function getThreatDistribution(events: ThreatEvent[]) {
  const dist: Record<string, number> = {};
  events.forEach(e => { dist[e.threat_type] = (dist[e.threat_type] || 0) + 1; });
  return Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function getAttacksOverTime(events: ThreatEvent[]) {
  const byDay: Record<string, { malicious: number; suspicious: number; benign: number }> = {};
  events.forEach(e => {
    const day = e.timestamp.slice(0, 10);
    if (!byDay[day]) byDay[day] = { malicious: 0, suspicious: 0, benign: 0 };
    byDay[day][e.threat_label]++;
  });
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date: date.slice(5), ...counts }));
}

export function getBytesByThreatType(events: ThreatEvent[]) {
  const dist: Record<string, number> = {};
  events.forEach(e => { dist[e.threat_type] = (dist[e.threat_type] || 0) + e.bytes_transferred; });
  return Object.entries(dist).map(([name, bytes]) => ({ name, bytes: Math.round(bytes / 1024) })).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
}

export function getIPAnalysis(ip: string, events: ThreatEvent[]) {
  const matches = events.filter(e => e.source_ip === ip || e.dest_ip === ip);
  if (matches.length === 0) {
    // Generate fake data for any searched IP
    const fakeCount = Math.floor(Math.random() * 20) + 3;
    const fakeEvents = generateEvents(fakeCount, 7).map(e => ({ ...e, source_ip: ip }));
    return analyzeIP(ip, fakeEvents);
  }
  return analyzeIP(ip, matches);
}

function analyzeIP(ip: string, matches: ThreatEvent[]) {
  const malCount = matches.filter(e => e.threat_label === "malicious").length;
  const susCount = matches.filter(e => e.threat_label === "suspicious").length;
  const score = Math.min(100, Math.round((malCount * 10 + susCount * 5) / matches.length * 10));
  const attackTypes = [...new Set(matches.map(e => e.threat_type))];
  const lastActivity = matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;
  const recommendations: string[] = [];
  if (score > 70) recommendations.push("🚫 Block this IP immediately");
  if (score > 50) recommendations.push("⚠️ Add to watchlist");
  if (score > 30) recommendations.push("🔍 Investigate traffic patterns");
  recommendations.push("📊 Continue monitoring");
  return { ip, score, totalAttacks: matches.length, malicious: malCount, suspicious: susCount, attackTypes, lastActivity, recommendations, events: matches.slice(0, 10) };
}

export function getAttackPatterns(events: ThreatEvent[]) {
  const patterns = [
    { type: "SQL Injection", icon: "Database", description: "Attempts to inject malicious SQL queries", events: events.filter(e => e.threat_type === "SQL Injection") },
    { type: "XSS", icon: "Code", description: "Cross-site scripting attack attempts", events: events.filter(e => e.threat_type === "XSS") },
    { type: "Brute Force", icon: "Key", description: "Repeated login/auth attempts", events: events.filter(e => e.threat_type === "Brute Force") },
    { type: "DDoS", icon: "Zap", description: "Distributed denial-of-service attacks", events: events.filter(e => e.threat_type === "DDoS") },
    { type: "Port Scan", icon: "Search", description: "Network reconnaissance scanning", events: events.filter(e => e.threat_type === "Port Scan") },
    { type: "Phishing", icon: "Mail", description: "Social engineering email attacks", events: events.filter(e => e.threat_type === "Phishing") },
  ];
  return patterns.map(p => ({
    ...p,
    count: p.events.length,
    malicious: p.events.filter(e => e.threat_label === "malicious").length,
    blocked: p.events.filter(e => e.action === "blocked").length,
    trend: Math.floor(Math.random() * 40) - 20,
  }));
}
