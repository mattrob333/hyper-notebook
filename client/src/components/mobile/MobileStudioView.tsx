import { useState } from "react";
import { 
  AudioLines, 
  BookOpen, 
  HelpCircle, 
  BarChart3, 
  Presentation,
  Pencil,
  Play,
  Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateOption {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  available: boolean;
}

interface GeneratedMedia {
  id: string;
  title: string;
  type: string;
  sourceCount: number;
  createdAt: string;
  duration?: string;
}

interface MobileStudioViewProps {
  notebookId?: string;
  onGenerate?: (type: string) => void;
}

const GENERATE_OPTIONS: GenerateOption[] = [
  { 
    id: 'audio', 
    label: 'Audio Overview', 
    icon: AudioLines, 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    available: true 
  },
  { 
    id: 'flashcards', 
    label: 'Flashcards', 
    icon: BookOpen, 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    available: true 
  },
  { 
    id: 'quiz', 
    label: 'Quiz', 
    icon: HelpCircle, 
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    available: true 
  },
  { 
    id: 'infographic', 
    label: 'Infographic', 
    icon: BarChart3, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    available: true 
  },
  { 
    id: 'slides', 
    label: 'Slide Deck', 
    icon: Presentation, 
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    available: true 
  },
];

export default function MobileStudioView({
  notebookId,
  onGenerate,
}: MobileStudioViewProps) {
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([
    // Example data - would come from API
    {
      id: '1',
      title: 'Building an AI Cognitive...',
      type: 'audio',
      sourceCount: 26,
      createdAt: '3d ago',
      duration: '14:11',
    },
    {
      id: '2',
      title: 'Cognitive Engine Transforms Procure...',
      type: 'audio',
      sourceCount: 7,
      createdAt: '6d ago',
    },
  ]);

  const handleGenerate = (optionId: string) => {
    onGenerate?.(optionId);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Generate New Section */}
      <div className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Generate new
        </h2>
        
        <div className="space-y-2">
          {GENERATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            
            return (
              <button
                key={option.id}
                onClick={() => handleGenerate(option.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                  option.bgColor,
                  "hover:opacity-80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", option.color)} />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated Media Section */}
      <div className="p-4 pt-2">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Generated media
        </h2>
        
        <div className="space-y-3">
          {generatedMedia.map((media) => (
            <div
              key={media.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <AudioLines className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {media.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {media.duration && `${media.duration} • `}
                  {media.sourceCount} sources • {media.createdAt}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted"
                >
                  <Waves className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {generatedMedia.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No generated content yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Select an option above to generate content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
