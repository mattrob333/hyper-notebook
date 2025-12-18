import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-lg" />
          <span className="text-xl font-bold">Hyper Notebook</span>
        </div>
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI-Powered Research &
            <span className="text-primary"> Content Creation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your research workflow with intelligent notebooks. 
            Upload sources, chat with AI, and generate professional documents in minutes.
          </p>
          <div className="pt-4">
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </SignInButton>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <FeatureCard 
            icon={BookOpen}
            title="Smart Notebooks"
            description="Organize research by topic. Upload PDFs, URLs, and text. AI summarizes everything automatically."
          />
          <FeatureCard 
            icon={Zap}
            title="AI Chat & Generation"
            description="Chat with your sources using GPT-4, Claude, or Gemini. Generate reports, emails, and presentations."
          />
          <FeatureCard 
            icon={Users}
            title="Team Collaboration"
            description="Share notebooks with your team. Everyone gets their own workspace with shared access."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-center text-muted-foreground">
        <p>© 2024 Hyper Notebook. Built for modern research teams.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
