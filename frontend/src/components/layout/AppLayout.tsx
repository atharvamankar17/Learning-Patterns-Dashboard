import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Moon, Sun, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassSelection } from "@/contexts/ClassContext";
import { ChatBot } from "@/components/chat/ChatBot";

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const { selectedClass, setSelectedClass, availableClasses } = useClassSelection();

  const handleRefresh = () => {
    qc.invalidateQueries();
    toast.success("Data refreshed");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              <h1 className="font-heading text-lg font-semibold text-foreground tracking-tight">
                Learning Patterns
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[140px] h-8 text-xs font-medium bg-secondary/50 border-none">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls} value={cls} className="text-xs">
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border-l pl-3 ml-1 border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  aria-label="Refresh data"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle dark mode"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <ChatBot />
    </SidebarProvider>
  );
}
