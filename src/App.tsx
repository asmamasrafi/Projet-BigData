import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import DashboardOverview from "@/pages/DashboardOverview";
import RealTimeMonitoring from "@/pages/RealTimeMonitoring";
import IPAnalysis from "@/pages/IPAnalysis";
import AttackPatterns from "@/pages/AttackPatterns";
import ThreatTimeline from "@/pages/ThreatTimeline";
import AttackMap from "@/pages/AttackMap";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/realtime" element={<RealTimeMonitoring />} />
            <Route path="/ip-analysis" element={<IPAnalysis />} />
            <Route path="/patterns" element={<AttackPatterns />} />
            <Route path="/timeline" element={<ThreatTimeline />} />
            <Route path="/map" element={<AttackMap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
