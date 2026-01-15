/**
 * ExpertAgentsDrawer
 *
 * A drawer component that sits above the chat input showing active AI persona agents.
 * Features:
 * - Collapsed: Shows overlapping avatar circles with team label
 * - Expanded: Department tabs with agent cards for selection
 * - Create new persona functionality
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Users,
  Briefcase,
  Code,
  Megaphone,
  LineChart,
  Lightbulb,
  Settings,
  Scale,
  Crown,
  Check,
} from 'lucide-react';
import { useNextMethodStore } from '@/lib/store';
import type { PersonaAgent as StorePersonaAgent } from '@/lib/store';

// Department configuration with icons and colors
const DEPARTMENTS = [
  { id: 'leadership', label: 'Leadership', icon: Crown, color: 'text-purple-400' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-pink-400' },
  { id: 'sales', label: 'Sales', icon: LineChart, color: 'text-green-400' },
  { id: 'development', label: 'Development', icon: Code, color: 'text-blue-400' },
  { id: 'research', label: 'Research', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'operations', label: 'Operations', icon: Settings, color: 'text-orange-400' },
  { id: 'finance', label: 'Finance', icon: Briefcase, color: 'text-emerald-400' },
  { id: 'legal', label: 'Legal', icon: Scale, color: 'text-red-400' },
] as const;

type DepartmentId = typeof DEPARTMENTS[number]['id'];

// Stock avatars for demo/default personas
const STOCK_AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/89.jpg',
  'https://randomuser.me/api/portraits/men/86.jpg',
  'https://randomuser.me/api/portraits/women/91.jpg',
  'https://randomuser.me/api/portraits/men/94.jpg',
];

// Default personas by department (for demo)
const DEFAULT_PERSONAS: StorePersonaAgent[] = [
  // Marketing Team
  {
    id: 'marketing-1',
    name: 'Sarah Chen',
    role: 'Marketing Director',
    department: 'marketing',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    characterSheet: 'Experienced marketing leader focused on brand strategy and growth.',
    voiceStyle: { tone: 'Strategic', vocabulary: ['ROI', 'brand equity', 'market share'], patterns: ['data-driven'] },
    expertiseAreas: ['Brand Strategy', 'Digital Marketing', 'Campaign Management'],
  },
  {
    id: 'marketing-2',
    name: 'Mike Rodriguez',
    role: 'Content Strategist',
    department: 'marketing',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    characterSheet: 'Creative content specialist with expertise in storytelling.',
    voiceStyle: { tone: 'Creative', vocabulary: ['narrative', 'engagement', 'storytelling'], patterns: ['metaphorical'] },
    expertiseAreas: ['Content Marketing', 'SEO', 'Social Media'],
  },
  {
    id: 'marketing-3',
    name: 'Emma Wilson',
    role: 'Growth Manager',
    department: 'marketing',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    characterSheet: 'Growth-focused marketer specializing in acquisition and retention.',
    voiceStyle: { tone: 'Analytical', vocabulary: ['conversion', 'funnel', 'LTV'], patterns: ['metrics-focused'] },
    expertiseAreas: ['Growth Hacking', 'User Acquisition', 'A/B Testing'],
  },
  // Sales Team
  {
    id: 'sales-1',
    name: 'James Thompson',
    role: 'Sales Director',
    department: 'sales',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    characterSheet: 'Seasoned sales leader with enterprise deal experience.',
    voiceStyle: { tone: 'Persuasive', vocabulary: ['pipeline', 'close rate', 'quota'], patterns: ['outcome-oriented'] },
    expertiseAreas: ['Enterprise Sales', 'Negotiation', 'Account Management'],
  },
  {
    id: 'sales-2',
    name: 'Lisa Park',
    role: 'Business Development',
    department: 'sales',
    avatarUrl: 'https://randomuser.me/api/portraits/women/89.jpg',
    characterSheet: 'Relationship builder focused on strategic partnerships.',
    voiceStyle: { tone: 'Collaborative', vocabulary: ['partnership', 'synergy', 'value prop'], patterns: ['relationship-focused'] },
    expertiseAreas: ['Partnerships', 'Lead Generation', 'Cold Outreach'],
  },
  // Development Team
  {
    id: 'dev-1',
    name: 'Alex Kumar',
    role: 'Tech Lead',
    department: 'development',
    avatarUrl: 'https://randomuser.me/api/portraits/men/86.jpg',
    characterSheet: 'Technical architect with full-stack expertise.',
    voiceStyle: { tone: 'Technical', vocabulary: ['architecture', 'scalability', 'performance'], patterns: ['precise'] },
    expertiseAreas: ['System Design', 'Code Review', 'Technical Strategy'],
  },
  {
    id: 'dev-2',
    name: 'Jordan Lee',
    role: 'Senior Engineer',
    department: 'development',
    avatarUrl: 'https://randomuser.me/api/portraits/women/91.jpg',
    characterSheet: 'Detail-oriented developer focused on code quality.',
    voiceStyle: { tone: 'Methodical', vocabulary: ['refactor', 'optimization', 'best practices'], patterns: ['systematic'] },
    expertiseAreas: ['Frontend', 'React', 'TypeScript'],
  },
  // Research Team
  {
    id: 'research-1',
    name: 'Dr. Rachel Foster',
    role: 'Research Lead',
    department: 'research',
    avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    characterSheet: 'Data scientist with expertise in market research.',
    voiceStyle: { tone: 'Analytical', vocabulary: ['hypothesis', 'correlation', 'insights'], patterns: ['evidence-based'] },
    expertiseAreas: ['Market Research', 'Data Analysis', 'User Studies'],
  },
];

// Avatar component with hover tooltip
function PersonaAvatar({
  persona,
  index,
  totalItems,
  size = 'md',
  isHovered,
  onHover,
  onLeave,
  isSelected,
  onClick,
}: {
  persona: StorePersonaAgent;
  index: number;
  totalItems: number;
  size?: 'sm' | 'md' | 'lg';
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className="relative group flex items-center justify-center cursor-pointer"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        marginLeft: index === 0 ? 0 : '-0.5rem',
        zIndex: totalItems - index,
      }}
    >
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 200,
                damping: 20,
              },
            }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -top-16 whitespace-nowrap flex text-xs flex-col items-center justify-center rounded-xl bg-popover z-50 shadow-lg px-4 py-2 border border-border min-w-max"
          >
            <div className="font-bold text-foreground relative z-30 text-sm text-center">
              {persona.name}
            </div>
            <div className="text-muted-foreground text-xs text-center">
              {persona.role}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05, zIndex: 100 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <img
          src={persona.avatarUrl || STOCK_AVATARS[0]}
          alt={persona.name}
          className={cn(
            'object-cover rounded-full border-2 transition duration-300',
            sizeClasses[size],
            isSelected
              ? 'border-primary ring-2 ring-primary/50'
              : 'border-background'
          )}
        />
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Avatar Group for collapsed state
function AvatarGroup({
  personas,
  maxVisible = 4,
  size = 'md',
  label,
  onAvatarClick,
}: {
  personas: StorePersonaAgent[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onAvatarClick?: (persona: StorePersonaAgent) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visiblePersonas = personas.slice(0, maxVisible);
  const remainingCount = personas.length - maxVisible;

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (personas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Users className="h-4 w-4" />
        <span>No agents selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {visiblePersonas.map((persona, index) => (
          <PersonaAvatar
            key={persona.id}
            persona={persona}
            index={index}
            totalItems={visiblePersonas.length}
            size={size}
            isHovered={hoveredId === persona.id}
            onHover={() => setHoveredId(persona.id)}
            onLeave={() => setHoveredId(null)}
            onClick={() => onAvatarClick?.(persona)}
          />
        ))}

        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground font-medium ml-[-0.5rem]',
              sizeClasses[size]
            )}
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>

      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

// Department Tab Button
function DepartmentTab({
  department,
  isActive,
  onClick,
  personaCount,
}: {
  department: typeof DEPARTMENTS[number];
  isActive: boolean;
  onClick: () => void;
  personaCount: number;
}) {
  const Icon = department.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : department.color)} />
      <span>{department.label}</span>
      {personaCount > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {personaCount}
        </Badge>
      )}
    </button>
  );
}

// Persona Card for selection
function PersonaCard({
  persona,
  isSelected,
  onSelect,
}: {
  persona: StorePersonaAgent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border',
        isSelected
          ? 'bg-primary/10 border-primary/50'
          : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border'
      )}
    >
      <img
        src={persona.avatarUrl || STOCK_AVATARS[0]}
        alt={persona.name}
        className={cn(
          'h-12 w-12 rounded-full object-cover border-2',
          isSelected ? 'border-primary' : 'border-background'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{persona.name}</div>
        <div className="text-xs text-muted-foreground truncate">{persona.role}</div>
        {persona.expertiseAreas && persona.expertiseAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {persona.expertiseAreas.slice(0, 2).map((area) => (
              <Badge key={area} variant="outline" className="text-[10px] px-1.5 py-0">
                {area}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {isSelected && (
        <div className="shrink-0">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Create Persona Dialog
function CreatePersonaDialog({
  open,
  onOpenChange,
  onCreatePersona,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePersona: (persona: Omit<StorePersonaAgent, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<DepartmentId>('marketing');
  const [characterSheet, setCharacterSheet] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(STOCK_AVATARS[Math.floor(Math.random() * STOCK_AVATARS.length)]);

  const handleCreate = () => {
    if (!name || !role) return;

    onCreatePersona({
      name,
      role,
      department,
      characterSheet: characterSheet || `${name} is a ${role} specializing in their field.`,
      avatarUrl,
      voiceStyle: { tone: 'Professional', vocabulary: [], patterns: [] },
      expertiseAreas: [],
    });

    // Reset form
    setName('');
    setRole('');
    setDepartment('marketing');
    setCharacterSheet('');
    setAvatarUrl(STOCK_AVATARS[Math.floor(Math.random() * STOCK_AVATARS.length)]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="h-16 w-16 rounded-full object-cover border-2 border-border"
            />
            <div className="flex-1">
              <label className="text-sm font-medium">Avatar</label>
              <div className="flex gap-1 mt-1 flex-wrap">
                {STOCK_AVATARS.slice(0, 6).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatarUrl(url)}
                    className={cn(
                      'h-8 w-8 rounded-full overflow-hidden border-2 transition-all',
                      avatarUrl === url ? 'border-primary scale-110' : 'border-transparent hover:border-border'
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sarah Chen"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Marketing Director"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <Select value={department} onValueChange={(v) => setDepartment(v as DepartmentId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <dept.icon className={cn('h-4 w-4', dept.color)} />
                      {dept.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Background (Optional)</label>
            <Textarea
              value={characterSheet}
              onChange={(e) => setCharacterSheet(e.target.value)}
              placeholder="Describe this agent's background, expertise, and communication style..."
              rows={3}
            />
          </div>

          <Button onClick={handleCreate} className="w-full" disabled={!name || !role}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main ExpertAgentsDrawer Component
interface ExpertAgentsDrawerProps {
  className?: string;
}

export function ExpertAgentsDrawer({ className }: ExpertAgentsDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentId>('marketing');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Store state
  const availablePersonas = useNextMethodStore((state) => state.availablePersonas);
  const selectedPersonaIds = useNextMethodStore((state) => state.selectedPersonaIds);
  const selectPersona = useNextMethodStore((state) => state.selectPersona);
  const deselectPersona = useNextMethodStore((state) => state.deselectPersona);
  const setPersonas = useNextMethodStore((state) => state.setPersonas);
  const isDebateActive = useNextMethodStore((state) => state.isDebateActive);
  const startDebate = useNextMethodStore((state) => state.startDebate);

  // Initialize with default personas if empty
  useState(() => {
    if (availablePersonas.length === 0) {
      setPersonas(DEFAULT_PERSONAS);
    }
  });

  // Get selected personas
  const selectedPersonas = availablePersonas.filter((p) =>
    selectedPersonaIds.includes(p.id)
  );

  // Get personas by department
  const getPersonasByDepartment = (dept: DepartmentId) =>
    availablePersonas.filter((p) => p.department === dept);

  // Toggle persona selection
  const togglePersona = (personaId: string) => {
    if (selectedPersonaIds.includes(personaId)) {
      deselectPersona(personaId);
    } else {
      selectPersona(personaId);
    }
  };

  // Handle creating new persona
  const handleCreatePersona = (newPersona: Omit<StorePersonaAgent, 'id'>) => {
    const persona: StorePersonaAgent = {
      ...newPersona,
      id: `custom-${Date.now()}`,
    };
    setPersonas([...availablePersonas, persona]);
  };

  // Get active department label
  const getActiveTeamLabel = () => {
    if (selectedPersonas.length === 0) return '';
    const departments = [...new Set(selectedPersonas.map((p) => p.department))];
    if (departments.length === 1) {
      const dept = DEPARTMENTS.find((d) => d.id === departments[0]);
      return dept?.label + ' Team';
    }
    return 'Mixed Team';
  };

  return (
    <div className={cn('relative', className)}>
      {/* Collapsed State - Avatar Row */}
      <motion.div
        layout
        className={cn(
          'flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0 border-border/50 bg-muted/30 cursor-pointer transition-colors hover:bg-muted/50',
          isExpanded && 'rounded-b-none'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <AvatarGroup
          personas={selectedPersonas}
          maxVisible={4}
          size="sm"
          label={getActiveTeamLabel()}
        />

        <div className="flex items-center gap-2">
          {selectedPersonas.length >= 2 && !isDebateActive && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                startDebate();
              }}
            >
              Start Debate
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Expanded Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden border border-t-0 border-border/50 rounded-b-xl bg-background/95 backdrop-blur-sm"
          >
            {/* Department Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-border/50 overflow-x-auto">
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="flex gap-1">
                  {DEPARTMENTS.map((dept) => (
                    <DepartmentTab
                      key={dept.id}
                      department={dept}
                      isActive={activeDepartment === dept.id}
                      onClick={() => setActiveDepartment(dept.id)}
                      personaCount={getPersonasByDepartment(dept.id).length}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Personas Grid */}
            <ScrollArea className="h-[280px]">
              <div className="p-3 space-y-2">
                {getPersonasByDepartment(activeDepartment).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents in this department</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Agent
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {getPersonasByDepartment(activeDepartment).map((persona) => (
                      <PersonaCard
                        key={persona.id}
                        persona={persona}
                        isSelected={selectedPersonaIds.includes(persona.id)}
                        onSelect={() => togglePersona(persona.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer with Add Button */}
            <div className="flex items-center justify-between p-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {selectedPersonas.length} agent{selectedPersonas.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Agent
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Persona Dialog */}
      <CreatePersonaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreatePersona={handleCreatePersona}
      />
    </div>
  );
}

export default ExpertAgentsDrawer;
