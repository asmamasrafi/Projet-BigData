import { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Globe, MapPin } from "lucide-react";
import { allEvents } from "@/data/mockData";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface AttackLocation {
  name: string;
  coordinates: [number, number];
  attacks: number;
  malicious: number;
  country: string;
}

const CITY_COORDS: { name: string; country: string; coords: [number, number] }[] = [
  { name: "Moscow", country: "RU", coords: [37.62, 55.75] },
  { name: "Beijing", country: "CN", coords: [116.4, 39.9] },
  { name: "Shanghai", country: "CN", coords: [121.47, 31.23] },
  { name: "São Paulo", country: "BR", coords: [-46.63, -23.55] },
  { name: "Lagos", country: "NG", coords: [3.39, 6.45] },
  { name: "Mumbai", country: "IN", coords: [72.88, 19.08] },
  { name: "Tehran", country: "IR", coords: [51.39, 35.69] },
  { name: "Pyongyang", country: "KP", coords: [125.75, 39.02] },
  { name: "Bucharest", country: "RO", coords: [26.1, 44.43] },
  { name: "Jakarta", country: "ID", coords: [106.85, -6.21] },
  { name: "New York", country: "US", coords: [-74.0, 40.71] },
  { name: "London", country: "GB", coords: [-0.12, 51.51] },
  { name: "Berlin", country: "DE", coords: [13.4, 52.52] },
  { name: "Tokyo", country: "JP", coords: [139.69, 35.69] },
  { name: "Kyiv", country: "UA", coords: [30.52, 50.45] },
  { name: "Istanbul", country: "TR", coords: [28.98, 41.01] },
  { name: "Riyadh", country: "SA", coords: [46.72, 24.69] },
  { name: "Buenos Aires", country: "AR", coords: [-58.38, -34.6] },
  { name: "Nairobi", country: "KE", coords: [36.82, -1.29] },
  { name: "Hanoi", country: "VN", coords: [105.85, 21.03] },
];

function generateLocations(): AttackLocation[] {
  return CITY_COORDS.map((city) => {
    const attacks = Math.floor(Math.random() * 80) + 5;
    const malicious = Math.floor(attacks * (0.2 + Math.random() * 0.6));
    return {
      name: city.name,
      coordinates: city.coords,
      attacks,
      malicious,
      country: city.country,
    };
  }).sort((a, b) => b.attacks - a.attacks);
}

function markerSize(attacks: number) {
  return Math.max(4, Math.min(16, attacks / 5));
}

function markerColor(malicious: number, total: number) {
  const ratio = malicious / total;
  if (ratio > 0.5) return "hsl(0, 85%, 55%)";
  if (ratio > 0.25) return "hsl(30, 95%, 55%)";
  return "hsl(160, 100%, 45%)";
}

export default function AttackMap() {
  const locations = useMemo(generateLocations, []);
  const totalAttacks = allEvents.length;
  const topLocations = locations.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="w-6 h-6 text-neon-cyan" />
          Attack Map
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Geographic distribution of detected threats</p>
      </div>

      {/* Map */}
      <div className="cyber-card overflow-hidden p-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [20, 20] }}
          style={{ width: "100%", height: "auto", background: "hsl(220, 20%, 7%)" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="hsl(220, 15%, 14%)"
                    stroke="hsl(220, 15%, 20%)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "hsl(220, 15%, 20%)", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {locations.map((loc) => {
              const size = markerSize(loc.attacks);
              const color = markerColor(loc.malicious, loc.attacks);
              return (
                <Marker key={loc.name} coordinates={loc.coordinates}>
                  <circle r={size} fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1} />
                  <circle r={size * 0.4} fill={color} fillOpacity={0.9} />
                  <title>{`${loc.name} (${loc.country}): ${loc.attacks} attacks, ${loc.malicious} malicious`}</title>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Origins</p>
          <p className="text-3xl font-bold neon-text-blue mt-1">{locations.length}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Attacks</p>
          <p className="text-3xl font-bold neon-text-red mt-1">{totalAttacks}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Source</p>
          <p className="text-xl font-bold neon-text-orange mt-1">{locations[0]?.name}</p>
          <p className="text-xs text-muted-foreground">{locations[0]?.attacks} attacks</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Countries</p>
          <p className="text-3xl font-bold neon-text-green mt-1">{new Set(locations.map(l => l.country)).size}</p>
        </div>
      </div>

      {/* Top Locations Table */}
      <div className="cyber-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neon-red" />
          Top Attack Origins
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["#", "City", "Country", "Attacks", "Malicious", "Severity"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topLocations.map((loc, i) => {
                const ratio = loc.malicious / loc.attacks;
                const severity = ratio > 0.5 ? "Critical" : ratio > 0.25 ? "High" : "Medium";
                const sevClass = ratio > 0.5 ? "neon-text-red" : ratio > 0.25 ? "neon-text-orange" : "neon-text-green";
                return (
                  <tr key={loc.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{loc.name}</td>
                    <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{loc.country}</td>
                    <td className="py-2 px-3 neon-text-blue font-mono">{loc.attacks}</td>
                    <td className="py-2 px-3 neon-text-red font-mono">{loc.malicious}</td>
                    <td className="py-2 px-3"><span className={`text-xs font-medium ${sevClass}`}>{severity}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
