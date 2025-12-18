import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmailBuilderProvider } from "@/contexts/EmailBuilderContext";
import { LeadProvider } from "@/contexts/LeadContext";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import NotebooksDashboard from "@/pages/notebooks";
import SettingsPage from "@/pages/settings";
import LandingPage from "@/pages/landing";

const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
          <LeadProvider>
            <Toaster />
            {isClerkAvailable ? (
              <>
                <SignedIn>
                  <Router />
                </SignedIn>
                <SignedOut>
                  <LandingPage />
                </SignedOut>
              </>
            ) : (
              <Router />
            )}
          </LeadProvider>
        </EmailBuilderProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
