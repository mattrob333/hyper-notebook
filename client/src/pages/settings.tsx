import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Key,
  Palette,
  Bell,
  User,
  Shield,
  Zap,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  Volume2,
  Globe,
  Database,
} from "lucide-react";

interface APIKeyConfig {
  name: string;
  key: string;
  envVar: string;
  description: string;
  docsUrl?: string;
  isConfigured: boolean;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeyConfig[]>([
    {
      name: "OpenRouter",
      key: "",
      envVar: "OPENROUTER_API_KEY",
      description: "Powers AI content generation (slides, summaries, etc.)",
      docsUrl: "https://openrouter.ai/keys",
      isConfigured: false,
    },
    {
      name: "OpenAI",
      key: "",
      envVar: "OPENAI_API_KEY",
      description: "Alternative AI provider for content generation",
      docsUrl: "https://platform.openai.com/api-keys",
      isConfigured: false,
    },
    {
      name: "Google Gemini",
      key: "",
      envVar: "GEMINI_API_KEY",
      description: "Used for image generation and advanced AI features",
      docsUrl: "https://aistudio.google.com/app/apikey",
      isConfigured: false,
    },
    {
      name: "ElevenLabs",
      key: "",
      envVar: "ELEVENLABS_API_KEY",
      description: "Text-to-speech for audio overviews",
      docsUrl: "https://elevenlabs.io/app/settings/api-keys",
      isConfigured: false,
    },
    {
      name: "Hyperbrowser",
      key: "",
      envVar: "HYPERBROWSER_API_KEY",
      description: "Web scraping for deep research features",
      docsUrl: "https://hyperbrowser.ai",
      isConfigured: false,
    },
  ]);
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  // Appearance settings
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("emerald");
  const [fontSize, setFontSize] = useState("medium");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // AI settings
  const [defaultModel, setDefaultModel] = useState("google/gemini-3-flash-preview");
  const [streamResponses, setStreamResponses] = useState(true);
  const [maxTokens, setMaxTokens] = useState("4096");
  
  // Check API key status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/settings/status");
        if (response.ok) {
          const data = await response.json();
          setApiKeys(prev => prev.map(key => ({
            ...key,
            isConfigured: data.configuredKeys?.includes(key.envVar) || false,
          })));
        }
      } catch (error) {
        console.log("Settings status check skipped");
      }
    };
    checkApiStatus();
  }, []);

  const toggleKeyVisibility = (envVar: string) => {
    setShowKeys(prev => ({ ...prev, [envVar]: !prev[envVar] }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem("hyper-notebook-settings", JSON.stringify({
      theme,
      accentColor,
      fontSize,
      emailNotifications,
      soundEnabled,
      autoSave,
      defaultModel,
      streamResponses,
      maxTokens,
    }));
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  };

  const accentColors = [
    { name: "Emerald", value: "emerald", color: "#10b981" },
    { name: "Blue", value: "blue", color: "#3b82f6" },
    { name: "Purple", value: "purple", color: "#8b5cf6" },
    { name: "Rose", value: "rose", color: "#f43f5e" },
    { name: "Orange", value: "orange", color: "#f97316" },
    { name: "Cyan", value: "cyan", color: "#06b6d4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your Hyper Notebook</p>
              </div>
            </div>
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50">
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  API Keys Configuration
                </CardTitle>
                <CardDescription>
                  Configure your API keys to enable AI features. Keys are stored securely in your .env file on the server.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.envVar} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${apiKey.isConfigured ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                            {apiKey.isConfigured ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <Label className="text-base font-medium">{apiKey.name}</Label>
                            <p className="text-xs text-muted-foreground">{apiKey.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiKey.isConfigured && (
                            <span className="text-xs text-emerald-500 font-medium">Configured</span>
                          )}
                          {apiKey.docsUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open(apiKey.docsUrl, '_blank')}
                            >
                              Get Key →
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKeys[apiKey.envVar] ? "text" : "password"}
                            placeholder={apiKey.isConfigured ? "••••••••••••••••" : `Enter your ${apiKey.name} API key`}
                            value={apiKey.key}
                            onChange={(e) => {
                              setApiKeys(prev => prev.map(k => 
                                k.envVar === apiKey.envVar ? { ...k, key: e.target.value } : k
                              ));
                            }}
                            className="pr-10 font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => toggleKeyVisibility(apiKey.envVar)}
                          >
                            {showKeys[apiKey.envVar] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        Environment variable: {apiKey.envVar}
                      </p>
                      <Separator />
                    </div>
                  ))}
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Note:</strong> API keys entered here are for reference only. 
                      To configure keys, add them to your <code className="bg-muted px-1 rounded">.env</code> file 
                      in the project root and restart the server.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how Hyper Notebook looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="flex gap-3">
                    {["light", "dark", "system"].map((t) => (
                      <Button
                        key={t}
                        variant={theme === t ? "default" : "outline"}
                        className="flex-1 capitalize"
                        onClick={() => setTheme(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          accentColor === color.value 
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' 
                            : 'border-transparent hover:scale-110'
                        }`}
                        style={{ 
                          backgroundColor: color.color,
                          borderColor: accentColor === color.value ? color.color : 'transparent',
                        }}
                        onClick={() => setAccentColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-3">
                  <Label>Font Size</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Configure AI behavior and model preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Model */}
                <div className="space-y-3">
                  <Label>Default AI Model</Label>
                  <Select value={defaultModel} onValueChange={setDefaultModel}>
                    <SelectTrigger className="w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (Fast)</SelectItem>
                      <SelectItem value="google/gemini-3-pro-preview">Gemini 3 Pro (Powerful)</SelectItem>
                      <SelectItem value="anthropic/claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                      <SelectItem value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 (Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The model used for generating content, summaries, and AI features.
                  </p>
                </div>

                <Separator />

                {/* Stream Responses */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stream Responses</Label>
                    <p className="text-xs text-muted-foreground">
                      Show AI responses as they're generated
                    </p>
                  </div>
                  <Switch
                    checked={streamResponses}
                    onCheckedChange={setStreamResponses}
                  />
                </div>

                <Separator />

                {/* Max Tokens */}
                <div className="space-y-3">
                  <Label>Max Output Tokens</Label>
                  <Select value={maxTokens} onValueChange={setMaxTokens}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024">1,024 (Short)</SelectItem>
                      <SelectItem value="2048">2,048 (Medium)</SelectItem>
                      <SelectItem value="4096">4,096 (Long)</SelectItem>
                      <SelectItem value="8192">8,192 (Very Long)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Maximum length of AI-generated content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Manage notifications and general preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <Label>Auto Save</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically save your work as you type
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <Separator />

                {/* Sound Effects */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Volume2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <Label>Sound Effects</Label>
                      <p className="text-xs text-muted-foreground">
                        Play sounds for notifications and actions
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>

                <Separator />

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates about your notebooks via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
