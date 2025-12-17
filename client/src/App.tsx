import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmailBuilderProvider } from "@/contexts/EmailBuilderContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import NotebooksDashboard from "@/pages/notebooks";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={NotebooksDashboard} />
      <Route path="/notebook/:id" component={Home} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EmailBuilderProvider>
          <Toaster />
          <Router />
        </EmailBuilderProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
