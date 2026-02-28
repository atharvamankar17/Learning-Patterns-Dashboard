import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClassProvider } from "@/contexts/ClassContext";
import Dashboard from "./pages/Dashboard";
import Clusters from "./pages/Clusters";
import Students from "./pages/Students";
import Warnings from "./pages/Warnings";
import Fairness from "./pages/Fairness";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <ClassProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clusters" element={<Clusters />} />
                <Route path="/students" element={<Students />} />
                <Route path="/warnings" element={<Warnings />} />
                <Route path="/fairness" element={<Fairness />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClassProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
