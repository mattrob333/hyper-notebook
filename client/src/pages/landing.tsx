import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Zap, 
  Globe, 
  Presentation, 
  Mail, 
  FileSpreadsheet,
  Brain,
  Search,
  CheckCircle2,
  X
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Notebook
          </span>
        </div>
        <SignInButton mode="modal">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Sign In</Button>
        </SignInButton>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            NotebookLM Alternative with Superpowers
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Research Smarter.
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Create Faster.</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-2">
            The AI research assistant that goes beyond chat. Deep web research, professional document generation, 
            and multi-model AI — all in one powerful notebook.
          </p>
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton mode="modal">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-emerald-600 hover:bg-emerald-700">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Get Started Free
              </Button>
            </SignInButton>
          </div>
        </div>

        {/* Why Smart Notebook */}
        <div className="mt-16 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Why <span className="text-emerald-400">Smart Notebook</span> over NotebookLM?
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            We built the features researchers actually need — deep web research, professional exports, and AI model choice.
          </p>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
            <ComparisonCard 
              title="Deep Research"
              description="AI autonomously explores the web, gathers sources, and creates comprehensive research reports with citations."
              hasFeature={true}
              competitorHas={false}
              icon={Search}
            />
            <ComparisonCard 
              title="Professional Documents"
              description="Generate polished reports, slide decks, infographics, and emails — not just chat responses."
              hasFeature={true}
              competitorHas={false}
              icon={FileText}
            />
            <ComparisonCard 
              title="Choose Your AI Model"
              description="Use GPT-4, Claude, Gemini, or other models via OpenRouter. Not locked to one provider."
              hasFeature={true}
              competitorHas={false}
              icon={Brain}
            />
            <ComparisonCard 
              title="CSV & Spreadsheet Analysis"
              description="Upload CSVs and spreadsheets. AI analyzes data and creates visualizations."
              hasFeature={true}
              competitorHas={false}
              icon={FileSpreadsheet}
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Everything You Need for AI-Powered Research
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard 
              icon={Search}
              title="Deep Web Research"
              description="Enter a topic and let AI autonomously research the web, gathering sources and synthesizing findings."
            />
            <FeatureCard 
              icon={Globe}
              title="URL & PDF Ingestion"
              description="Add any webpage, PDF, or text. AI extracts and summarizes content automatically."
            />
            <FeatureCard 
              icon={Brain}
              title="Multi-Model AI Chat"
              description="Chat with your sources using GPT-4, Claude, Gemini, or 100+ models via OpenRouter."
            />
            <FeatureCard 
              icon={FileText}
              title="Report Generation"
              description="Generate professional reports with proper formatting, citations, and export to multiple formats."
            />
            <FeatureCard 
              icon={Presentation}
              title="Slide Deck Builder"
              description="Create presentation-ready slides from your research with AI-generated content and structure."
            />
            <FeatureCard 
              icon={Mail}
              title="Email Composer"
              description="Draft professional emails based on your research with customizable tone and format."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 sm:mt-24 py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base px-4">
        <p>© 2024 Smart Notebook. The smarter way to research.</p>
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
    <div className="p-5 sm:p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-900 hover:border-emerald-500/30 transition-all">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function ComparisonCard({ 
  icon: Icon, 
  title, 
  description, 
  hasFeature, 
  competitorHas 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  hasFeature: boolean;
  competitorHas: boolean;
}) {
  return (
    <div className="p-5 sm:p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold mb-1">{title}</h3>
          <p className="text-gray-400 text-sm mb-3">{description}</p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              {hasFeature ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <X className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-300">Smart Notebook</span>
            </div>
            <div className="flex items-center gap-1.5">
              {competitorHas ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <X className="w-4 h-4 text-red-400" />
              )}
              <span className="text-gray-500">NotebookLM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
