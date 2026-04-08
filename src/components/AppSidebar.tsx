import { Shield, Activity, Search, BarChart3, Clock, ChevronLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: Shield },
  { title: "Real-Time", url: "/realtime", icon: Activity },
  { title: "IP Analysis", url: "/ip-analysis", icon: Search },
  { title: "Attack Patterns", url: "/patterns", icon: BarChart3 },
  { title: "Threat Timeline", url: "/timeline", icon: Clock },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center cyber-glow-green">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h1 className="text-sm font-bold text-foreground tracking-wider">CYBER<span className="text-primary">SHIELD</span></h1>
              <p className="text-[10px] text-muted-foreground">Lambda Architecture</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="cyber-card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <span className="text-xs text-primary font-medium">System Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Batch + Speed layers online</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="flex items-center justify-center p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
