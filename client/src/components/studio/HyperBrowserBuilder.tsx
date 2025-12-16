import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Zap, 
  ChevronDown,
  Terminal,
  FileCode,
  Settings,
  RotateCcw,
  Minimize2,
  Pause,
  Square,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface HyperBrowserBuilderProps {
  onBack: () => void;
  onRun: (script: string) => void;
  onMinimize: () => void;
}

const defaultScript = `/**
 * Hacker News Top Stories
 * 
 * This script navigates to Hacker News and extracts the top 10 stories
 * with their titles and links.
 */

// Full puppeteer API is available

const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

// Navigate to Hacker News
await page.goto("https://news.ycombinator.com", {
  timeout: 30000
});

console.log("Loaded Hacker News homepage");

// Extract the top 10 stories
const storyRows = await page.evaluate(() => {
  const stories: Array<{ title: string; link: string; rank: number }> = [];
  
  const storyRows = document.querySelectorAll('.athing');
  
  for (let i = 0; i < Math.min(10, storyRows.length); i++) {
    const row = storyRows[i];
    const rankEl = row.querySelector('.rank');
    const titleEl = row.querySelector('.titleline > a');
    
    if (!rankEl || !titleEl) continue;
    
    stories.push({
      rank: parseInt(rankEl.textContent?.replace('.', '') || '0'),
      title: titleEl.textContent || '',
      link: (titleEl as HTMLAnchorElement).href
    });
  }
  
  return stories;
});

console.log("Extracted stories:", storyRows);
`;

export default function HyperBrowserBuilder({ onBack, onRun, onMinimize }: HyperBrowserBuilderProps) {
  const [script, setScript] = useState(defaultScript);
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor');
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [showBrowser, setShowBrowser] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setShowBrowser(true);
    setActiveTab('output');
    setBrowserUrl('https://news.ycombinator.com');
    setOutput([
      '> Initializing Hyperbrowser...',
      '> Connecting to browser instance...',
      '> Running script...',
    ]);
    
    onRun(script);
    
    setTimeout(() => {
      setOutput(prev => [...prev, 
        '> Navigating to https://news.ycombinator.com',
        '> Loaded Hacker News homepage',
        '> Extracting stories...',
        '> Found 10 stories',
        '> Script completed successfully'
      ]);
      setIsRunning(false);
    }, 2000);
  };

  const handlePause = () => {
    setIsRunning(false);
    setOutput(prev => [...prev, '> Script paused']);
  };

  const handleStop = () => {
    setIsRunning(false);
    setShowBrowser(false);
    setOutput(prev => [...prev, '> Script stopped']);
  };

  const handleRefresh = () => {
    setOutput(prev => [...prev, '> Refreshing browser...']);
  };

  const handleMinimizeAndRun = () => {
    if (!isRunning) {
      handleRun();
    }
    onMinimize();
  };

  return (
    <div className="flex flex-col h-full" data-testid="hyperbrowser-builder">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/20 rounded-lg">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Hacker News Stories</span>
          </div>
          <span className="text-xs text-muted-foreground">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={handleMinimizeAndRun}
            data-testid="button-minimize"
          >
            <Minimize2 className="w-4 h-4" />
            Run & Minimize
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg gap-2" data-testid="button-save-script">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={handleRun}
            disabled={isRunning}
            data-testid="button-run-script"
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 text-xs">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Overview
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs bg-muted">
          Playground
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Browser
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Scrape
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Crawl
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Extract
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - API Docs */}
        <div className="w-44 border-r border-border/50 p-2 shrink-0">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground px-2 py-1">Hyperbrowser APIs</div>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Quickstart
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Sessions
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Agents
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Data Extraction
              </Button>
              <div className="text-xs text-muted-foreground px-2 py-1 mt-4">Account</div>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Profiles
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                <ChevronDown className="w-3 h-3 mr-1" />
                Extensions
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'output')} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <TabsList className="h-8 rounded-lg bg-muted/50">
                <TabsTrigger value="editor" className="h-6 rounded-md text-xs gap-1">
                  <FileCode className="w-3 h-3" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="output" className="h-6 rounded-md text-xs gap-1">
                  <Terminal className="w-3 h-3" />
                  Output Logs
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
              <div className="h-full bg-[#1e1e1e] p-4 font-mono text-sm overflow-auto">
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full h-full bg-transparent text-[#d4d4d4] resize-none outline-none font-mono text-xs leading-relaxed"
                  spellCheck={false}
                  data-testid="textarea-script"
                />
              </div>
            </TabsContent>

            <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
              <div className="h-full bg-[#1e1e1e] p-4 font-mono text-xs">
                <ScrollArea className="h-full">
                  {output.map((line, i) => (
                    <div key={i} className="text-[#6a9955]">{line}</div>
                  ))}
                  {isRunning && (
                    <div className="text-amber-400 animate-pulse">Running...</div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right - Browser Preview (Larger) */}
        <div className="w-[400px] border-l border-border/50 flex flex-col shrink-0">
          {/* Browser Header */}
          <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-background/50 rounded text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{browserUrl}</span>
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center">
            {showBrowser ? (
              <div className="w-full h-full p-4">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-orange-500 text-4xl font-bold mb-2">Y</div>
                    <div className="text-gray-800 text-sm font-medium">Hacker News</div>
                    <div className="text-gray-500 text-xs mt-2">
                      {isRunning ? 'Extracting stories...' : 'Browser session active'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <Zap className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click Run to launch the browser
                </p>
                <p className="text-xs text-muted-foreground">
                  Your workflow will execute and appear here
                </p>
              </div>
            )}
          </div>

          {/* Browser Controls */}
          <div className="p-3 border-t border-border/50 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {isRunning ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 rounded-lg"
                      onClick={handlePause}
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 rounded-lg"
                      onClick={handleStop}
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    className="h-8 gap-1 rounded-lg"
                    onClick={handleRun}
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={!showBrowser}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {showBrowser && (
                  <div className="text-xs text-muted-foreground">
                    {isRunning ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Running
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Ready
                      </span>
                    )}
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1 rounded-lg text-xs"
                  onClick={onMinimize}
                  disabled={!showBrowser}
                >
                  <Minimize2 className="w-3 h-3" />
                  Minimize
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
