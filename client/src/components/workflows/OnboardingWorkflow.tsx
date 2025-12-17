import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Save,
  User,
  Briefcase,
  Globe,
  MessageSquare,
  AlertTriangle,
  Target,
  FileText,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWorkflowProps {
  onComplete: (profileData: ProfileData) => void;
  onCancel: () => void;
  notebookId?: string;
}

interface ProfileData {
  role: string;
  tasks: string[];
  taskHours: Record<string, number>;
  sources: string[];
  sourceFrequency: Record<string, string>;
  communication: string[];
  painPoints: string[];
  painSeverity: number;
  goals: string[];
  goalPriority: string;
}

const ROLES = [
  { id: 'sales', label: 'Sales & Business Development', icon: '📊', description: 'Client acquisition, pipeline management, revenue growth' },
  { id: 'marketing', label: 'Marketing & Communications', icon: '📣', description: 'Brand awareness, content creation, campaigns' },
  { id: 'operations', label: 'Operations & Project Management', icon: '⚙️', description: 'Process optimization, team coordination, delivery' },
  { id: 'executive', label: 'Executive & Leadership', icon: '💼', description: 'Strategy, decision-making, organizational direction' },
  { id: 'technical', label: 'Technical & Engineering', icon: '🔧', description: 'Product development, technical architecture, innovation' },
  { id: 'other', label: 'Other Role', icon: '📝', description: 'Something different from the above' },
];

interface DynamicOption {
  id: string;
  label: string;
  icon: string;
  description?: string;
  examples?: string;
  severity?: string;
  impact?: string;
}

// Default fallback options (used if AI generation fails)
const DEFAULT_TASKS: DynamicOption[] = [
  { id: 'research', label: 'Research & Analysis', icon: '🔍' },
  { id: 'meetings', label: 'Meetings & Calls', icon: '👥' },
  { id: 'content', label: 'Creating Content', icon: '✍️' },
  { id: 'data', label: 'Data & Reporting', icon: '📊' },
  { id: 'coordination', label: 'Coordinating Projects', icon: '🔄' },
];

const DEFAULT_dynamicSources: DynamicOption[] = [
  { id: 'news', label: 'News & Industry Sites', icon: '📰', examples: 'TechCrunch, Bloomberg' },
  { id: 'social', label: 'Social Media & Communities', icon: '💬', examples: 'LinkedIn, Twitter' },
  { id: 'internal', label: 'Internal Documents', icon: '📁', examples: 'Company wiki, Notion' },
  { id: 'reports', label: 'Research Reports', icon: '📊', examples: 'Gartner, Forrester' },
];

const DEFAULT_dynamicComm: DynamicOption[] = [
  { id: 'email', label: 'Email Updates', icon: '📧' },
  { id: 'slack', label: 'Slack/Teams Messages', icon: '💬' },
  { id: 'meetings', label: 'Team Meetings', icon: '🗓️' },
  { id: 'reports', label: 'Written Reports', icon: '📄' },
];

const DEFAULT_dynamicPains: DynamicOption[] = [
  { id: 'scattered', label: 'Information is scattered everywhere', icon: '🔀', severity: 'high' },
  { id: 'slow', label: 'Takes too long to find what I need', icon: '⏱️', severity: 'high' },
  { id: 'manual', label: 'Too much manual work', icon: '✋', severity: 'medium' },
  { id: 'insights', label: 'Hard to get actionable insights', icon: '🤷', severity: 'high' },
];

const DEFAULT_dynamicGoals: DynamicOption[] = [
  { id: 'time', label: 'Save time on research', icon: '⏰', impact: 'Reduce research time by 50%+' },
  { id: 'decisions', label: 'Make better decisions', icon: '🎯', impact: 'Data-driven insights' },
  { id: 'automate', label: 'Automate repetitive tasks', icon: '🤖', impact: 'Focus on high-value work' },
  { id: 'informed', label: 'Stay informed automatically', icon: '📡', impact: 'Never miss updates' },
];

export default function OnboardingWorkflow({ onComplete, onCancel, notebookId }: OnboardingWorkflowProps) {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const { toast } = useToast();
  
  // Profile state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskHours, setTaskHours] = useState<Record<string, number>>({});
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sourceFrequency, setSourceFrequency] = useState<Record<string, string>>({});
  const [selectedComm, setSelectedComm] = useState<string[]>([]);
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [painSeverity, setPainSeverity] = useState(50);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [goalPriority, setGoalPriority] = useState<string>('');
  
  // Dynamic options state (AI-generated based on previous answers)
  // Start empty - will be populated by AI generation (fallbacks used only on error)
  const [dynamicTasks, setDynamicTasks] = useState<DynamicOption[]>([]);
  const [dynamicSources, setDynamicSources] = useState<DynamicOption[]>([]);
  const [dynamicComm, setDynamicComm] = useState<DynamicOption[]>([]);
  const [dynamicPains, setDynamicPains] = useState<DynamicOption[]>([]);
  const [dynamicGoals, setDynamicGoals] = useState<DynamicOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const steps = [
    { title: 'Your Role', icon: User },
    { title: 'Daily Tasks', icon: Briefcase },
    { title: 'Information Sources', icon: Globe },
    { title: 'Team Communication', icon: MessageSquare },
    { title: 'Pain Points', icon: AlertTriangle },
    { title: 'Goals', icon: Target },
    { title: 'Your Profile', icon: FileText },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (step) {
      case 0: return selectedRole !== '';
      case 1: return selectedTasks.length > 0;
      case 2: return selectedSources.length > 0;
      case 3: return selectedComm.length > 0;
      case 4: return selectedPains.length > 0;
      case 5: return selectedGoals.length > 0 && goalPriority !== '';
      case 6: return summaryContent !== '';
      default: return false;
    }
  };

  // Generate dynamic options for the next step based on previous answers
  const generateDynamicOptions = useCallback(async (nextStep: number) => {
    setIsLoadingOptions(true);
    const roleInfo = ROLES.find(r => r.id === selectedRole);
    
    const prompts: Record<number, string> = {
      1: `For someone in "${roleInfo?.label}" role (${roleInfo?.description}), generate 6 specific daily tasks they likely perform. Return ONLY a JSON array like: [{"id": "task1", "label": "Task Name", "icon": "emoji"}]`,
      2: `For a "${roleInfo?.label}" who spends time on: ${selectedTasks.map(t => dynamicTasks.find(task => task.id === t)?.label).join(', ')}, what information sources would they need? Generate 5 specific sources. Return ONLY a JSON array like: [{"id": "src1", "label": "Source Name", "icon": "emoji", "examples": "Example sites"}]`,
      3: `For a "${roleInfo?.label}" who uses ${selectedSources.map(s => dynamicSources.find(src => src.id === s)?.label).join(', ')} for information, how do they likely share insights with their team? Generate 5 communication methods. Return ONLY a JSON array like: [{"id": "comm1", "label": "Method Name", "icon": "emoji"}]`,
      4: `For a "${roleInfo?.label}" who communicates via ${selectedComm.map(c => dynamicComm.find(comm => comm.id === c)?.label).join(', ')}, what are their likely pain points with information management? Generate 5 specific challenges. Return ONLY a JSON array like: [{"id": "pain1", "label": "Pain Point", "icon": "emoji", "severity": "high|medium|low"}]`,
      5: `For a "${roleInfo?.label}" struggling with: ${selectedPains.map(p => dynamicPains.find(pain => pain.id === p)?.label).join('; ')}, what goals would they have for a knowledge management tool? Generate 5 specific goals. Return ONLY a JSON array like: [{"id": "goal1", "label": "Goal", "icon": "emoji", "impact": "Impact description"}]`,
    };

    if (!prompts[nextStep]) {
      setIsLoadingOptions(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[nextStep] }],
          model: 'anthropic/claude-sonnet-4.5',
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) content += data.token;
            } catch {}
          }
        }
      }

      // Parse the JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const options = JSON.parse(jsonMatch[0]) as DynamicOption[];
        switch (nextStep) {
          case 1: setDynamicTasks(options); break;
          case 2: setDynamicSources(options); break;
          case 3: setDynamicComm(options); break;
          case 4: setDynamicPains(options); break;
          case 5: setDynamicGoals(options); break;
        }
      }
    } catch (error) {
      console.error('Failed to generate dynamic options:', error);
      // Use fallbacks on error
      switch (nextStep) {
        case 1: setDynamicTasks(DEFAULT_TASKS); break;
        case 2: setDynamicSources(DEFAULT_dynamicSources); break;
        case 3: setDynamicComm(DEFAULT_dynamicComm); break;
        case 4: setDynamicPains(DEFAULT_dynamicPains); break;
        case 5: setDynamicGoals(DEFAULT_dynamicGoals); break;
      }
    } finally {
      setIsLoadingOptions(false);
    }
  }, [selectedRole, selectedTasks, selectedSources, selectedComm, selectedPains, dynamicTasks, dynamicSources, dynamicComm, dynamicPains]);

  const generateSummary = useCallback(async () => {
    setIsGenerating(true);
    
    const roleInfo = ROLES.find(r => r.id === selectedRole);
    const tasksInfo = selectedTasks.map(t => dynamicTasks.find((task: DynamicOption) => task.id === t)?.label).join(', ');
    const sourcesInfo = selectedSources.map(s => dynamicSources.find((src: DynamicOption) => src.id === s)?.label).join(', ');
    const commInfo = selectedComm.map(c => dynamicComm.find((comm: DynamicOption) => comm.id === c)?.label).join(', ');
    const painsInfo = selectedPains.map(p => dynamicPains.find((pain: DynamicOption) => pain.id === p)?.label).join('; ');
    const goalsInfo = selectedGoals.map(g => dynamicGoals.find((goal: DynamicOption) => goal.id === g)?.label).join(', ');
    const priorityGoal = dynamicGoals.find((g: DynamicOption) => g.id === goalPriority);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a professional user profile summary in markdown format based on this onboarding data:

**Role**: ${roleInfo?.label} - ${roleInfo?.description}
**Primary Tasks**: ${tasksInfo}
**Information Sources**: ${sourcesInfo}
**Communication Methods**: ${commInfo}
**Pain Points** (Severity: ${painSeverity}%): ${painsInfo}
**Goals**: ${goalsInfo}
**Top Priority Goal**: ${priorityGoal?.label} - ${priorityGoal?.impact}

Create a well-formatted markdown document with:
1. A header with their role
2. An "About" section summarizing their work style
3. A "Daily Focus" section about their tasks
4. An "Information Diet" section about their sources
5. A "Collaboration Style" section
6. A "Challenges" section about their pain points
7. A "Success Metrics" section about their goals
8. Recommendations for how this tool can help them

Make it professional, concise, and actionable. Use markdown formatting with headers, bullet points, and bold text.`
          }],
          model: 'anthropic/claude-sonnet-4.5',
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                content += data.token;
                setSummaryContent(content);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate summary', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedRole, selectedTasks, selectedSources, selectedComm, selectedPains, painSeverity, selectedGoals, goalPriority, toast]);

  const handleNext = async () => {
    if (step === 5) {
      // Moving to summary step - generate it
      setStep(6);
      await generateSummary();
    } else if (step < 6) {
      const nextStep = step + 1;
      setStep(nextStep);
      // Generate dynamic options for the next step (steps 1-5)
      if (nextStep >= 1 && nextStep <= 5) {
        generateDynamicOptions(nextStep);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest('POST', '/api/sources', {
        notebookId: notebookId || null,
        type: 'text',
        category: 'context',
        name: `User Profile - ${ROLES.find(r => r.id === selectedRole)?.label || 'Unknown'}`,
        content: summaryContent,
        metadata: {
          generatedBy: 'onboarding-workflow',
          timestamp: new Date().toISOString(),
          role: selectedRole,
          tasks: selectedTasks,
          sources: selectedSources,
          communication: selectedComm,
          painPoints: selectedPains,
          goals: selectedGoals,
          priority: goalPriority,
        }
      });
      
      toast({ title: 'Profile Saved!', description: 'Your profile has been saved to Sources.' });
      
      onComplete({
        role: selectedRole,
        tasks: selectedTasks,
        taskHours,
        sources: selectedSources,
        sourceFrequency,
        communication: selectedComm,
        painPoints: selectedPains,
        painSeverity,
        goals: selectedGoals,
        goalPriority,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Select the role that best describes your work:</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedRole === role.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{role.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                      </div>
                      {selectedRole === role.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {isLoadingOptions ? 'Generating personalized options for your role...' : 'What do you spend most of your time on? (Select all that apply)'}
            </p>
            {isLoadingOptions ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Analyzing your role...</span>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              {dynamicTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTasks.includes(task.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedTasks.includes(task.id)) {
                      setSelectedTasks(selectedTasks.filter(t => t !== task.id));
                    } else {
                      setSelectedTasks([...selectedTasks, task.id]);
                    }
                  }}
                >
                  <Checkbox checked={selectedTasks.includes(task.id)} />
                  <span className="text-lg">{task.icon}</span>
                  <Label className="cursor-pointer flex-1">{task.label}</Label>
                </div>
              ))}
            </div>
            )}
            {!isLoadingOptions && selectedTasks.length > 0 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-3">How many hours per week on each?</h4>
                {selectedTasks.map(taskId => {
                  const task = dynamicTasks.find(t => t.id === taskId);
                  return (
                    <div key={taskId} className="flex items-center gap-4 mb-3">
                      <span className="w-40 text-sm">{task?.label}</span>
                      <Slider
                        value={[taskHours[taskId] || 5]}
                        onValueChange={([val]) => setTaskHours({ ...taskHours, [taskId]: val })}
                        max={40}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-16 text-sm text-right">{taskHours[taskId] || 5}h/wk</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Where do you typically get information for your work?</p>
            <Accordion type="multiple" className="w-full">
              {dynamicSources.map((source) => (
                <AccordionItem key={source.id} value={source.id}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSources([...selectedSources, source.id]);
                        } else {
                          setSelectedSources(selectedSources.filter(s => s !== source.id));
                        }
                      }}
                    />
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>{source.icon}</span>
                        <span>{source.label}</span>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="pl-10 pb-2">
                      <p className="text-sm text-muted-foreground mb-2">Examples: {source.examples}</p>
                      {selectedSources.includes(source.id) && (
                        <Tabs defaultValue="daily" onValueChange={(val) => setSourceFrequency({ ...sourceFrequency, [source.id]: val })}>
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="rarely">Rarely</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">How do you share information with your team?</p>
            <div className="flex flex-wrap gap-2">
              {dynamicComm.map((comm) => (
                <Badge
                  key={comm.id}
                  variant={selectedComm.includes(comm.id) ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    selectedComm.includes(comm.id) ? '' : 'hover:bg-primary/10'
                  }`}
                  onClick={() => {
                    if (selectedComm.includes(comm.id)) {
                      setSelectedComm(selectedComm.filter(c => c !== comm.id));
                    } else {
                      setSelectedComm([...selectedComm, comm.id]);
                    }
                  }}
                >
                  <span className="mr-2">{comm.icon}</span>
                  {comm.label}
                </Badge>
              ))}
            </div>
            {selectedComm.length > 0 && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  You selected <strong>{selectedComm.length}</strong> communication method{selectedComm.length > 1 ? 's' : ''}.
                  We'll help you create content formatted for: {selectedComm.map(c => dynamicComm.find(comm => comm.id === c)?.label).join(', ')}.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">What challenges do you face with information management?</p>
            <div className="space-y-2">
              {dynamicPains.map((pain) => (
                <div
                  key={pain.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPains.includes(pain.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedPains.includes(pain.id)) {
                      setSelectedPains(selectedPains.filter(p => p !== pain.id));
                    } else {
                      setSelectedPains([...selectedPains, pain.id]);
                    }
                  }}
                >
                  <Checkbox checked={selectedPains.includes(pain.id)} />
                  <span className="flex-1">{pain.label}</span>
                  <Badge variant={pain.severity === 'high' ? 'destructive' : pain.severity === 'medium' ? 'default' : 'secondary'}>
                    {pain.severity}
                  </Badge>
                </div>
              ))}
            </div>
            {selectedPains.length > 0 && (
              <div className="mt-6">
                <Label className="text-sm mb-2 block">How much does this impact your productivity?</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Minor</span>
                  <Slider
                    value={[painSeverity]}
                    onValueChange={([val]) => setPainSeverity(val)}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">Major</span>
                  <Badge variant="outline">{painSeverity}%</Badge>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">What do you want to achieve with this tool?</p>
            <div className="grid grid-cols-2 gap-3">
              {dynamicGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className={`cursor-pointer transition-all ${
                    selectedGoals.includes(goal.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  } ${goalPriority === goal.id ? 'ring-2 ring-yellow-500/50' : ''}`}
                  onClick={() => {
                    if (selectedGoals.includes(goal.id)) {
                      setSelectedGoals(selectedGoals.filter(g => g !== goal.id));
                      if (goalPriority === goal.id) setGoalPriority('');
                    } else {
                      setSelectedGoals([...selectedGoals, goal.id]);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Checkbox checked={selectedGoals.includes(goal.id)} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{goal.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{goal.impact}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedGoals.length > 0 && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm mb-3 block font-medium">Which is your #1 priority? (click to select)</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedGoals.map(goalId => {
                    const goal = dynamicGoals.find(g => g.id === goalId);
                    const isSelected = goalPriority === goalId;
                    return (
                      <Button
                        key={goalId}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={isSelected ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGoalPriority(goalId);
                        }}
                      >
                        {isSelected && '⭐ '}
                        {goal?.label}
                      </Button>
                    );
                  })}
                </div>
                {!goalPriority && (
                  <p className="text-xs text-amber-500 mt-2">Please select your top priority to continue</p>
                )}
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating your personalized profile...</p>
              </div>
            ) : summaryContent ? (
              <ScrollArea className="h-[400px] rounded-lg border bg-card">
                <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                  <ReactMarkdown>{summaryContent}</ReactMarkdown>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground">Ready to generate your profile summary</p>
                <Button onClick={generateSummary} className="mt-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Summary
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                    i < step ? 'bg-primary text-primary-foreground' :
                    i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
              );
            })}
          </div>
          <Badge variant="outline">{Math.round(progress)}%</Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4">{steps[step].title}</CardTitle>
        <CardDescription>Step {step + 1} of {steps.length}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : onCancel()}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        {step === 6 ? (
          <Button
            onClick={handleSave}
            disabled={!canProceed() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save to Sources
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
