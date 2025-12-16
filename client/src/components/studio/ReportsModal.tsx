import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sparkles,
  FileText,
  BookOpen,
  GraduationCap,
  Newspaper,
  Compass,
  Route,
  FileCode,
  Lightbulb,
  Monitor,
  Check,
  Plus,
  Pencil,
  X,
  Save
} from "lucide-react";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isCustom?: boolean;
}

interface ReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReport: (reportType: ReportType) => void;
}

const defaultReportTypes: ReportType[] = [
  {
    id: 'create-your-own',
    name: 'Create Your Own',
    description: 'Craft reports your way by specifying structure, style, tone, and more',
    icon: Pencil,
  },
  {
    id: 'briefing-doc',
    name: 'Briefing Doc',
    description: 'Overview of your sources featuring key insights and quotes',
    icon: FileText,
  },
  {
    id: 'study-guide',
    name: 'Study Guide',
    description: 'Short-answer quiz, suggested essay questions, and glossary of key terms',
    icon: GraduationCap,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Insightful takeaways distilled into a highly readable article',
    icon: Newspaper,
  },
  {
    id: 'strategic-plan',
    name: 'Strategic Plan',
    description: 'A blueprint for developing a next-generation, AI-native interactive workbook using...',
    icon: Route,
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'A technical handoff document for an AI-powered Cognitive Procurement Engine',
    icon: FileCode,
  },
  {
    id: 'concept-explainer',
    name: 'Concept Explainer',
    description: 'Learn about Agent Engineering, a new discipline for building reliable AI...',
    icon: Lightbulb,
  },
  {
    id: 'technology-overview',
    name: 'Technology Overview',
    description: 'Discover A2UI, a protocol that allows AI agents to create user interfaces',
    icon: Monitor,
  },
];

export default function ReportsModal({ open, onOpenChange, onSelectReport }: ReportsModalProps) {
  const [customReports, setCustomReports] = useState<ReportType[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const handleAddCustomReport = () => {
    if (customName.trim()) {
      const newReport: ReportType = {
        id: `custom-${Date.now()}`,
        name: customName.trim(),
        description: customDescription.trim() || 'Custom report type',
        icon: FileText,
        isCustom: true,
      };
      setCustomReports([...customReports, newReport]);
      setCustomName('');
      setCustomDescription('');
      setIsAddingCustom(false);
    }
  };

  const handleDeleteCustomReport = (id: string) => {
    setCustomReports(customReports.filter(r => r.id !== id));
  };

  const allReportTypes = [...defaultReportTypes, ...customReports];
  const suggestedReports = allReportTypes.slice(4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-5 h-5" />
            Create report
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {allReportTypes.slice(0, 4).map((report) => (
                  <ReportTypeCard 
                    key={report.id} 
                    report={report} 
                    onClick={() => {
                      onSelectReport(report);
                      onOpenChange(false);
                    }}
                    onDelete={report.isCustom ? () => handleDeleteCustomReport(report.id) : undefined}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Suggested Format</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {suggestedReports.map((report) => (
                  <ReportTypeCard 
                    key={report.id} 
                    report={report} 
                    onClick={() => {
                      onSelectReport(report);
                      onOpenChange(false);
                    }}
                    onDelete={report.isCustom ? () => handleDeleteCustomReport(report.id) : undefined}
                  />
                ))}
              </div>
            </div>

            {isAddingCustom ? (
              <Card className="p-4 rounded-xl">
                <div className="space-y-3">
                  <Input
                    placeholder="Report type name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="rounded-lg"
                    data-testid="input-custom-report-name"
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="rounded-lg resize-none"
                    rows={2}
                    data-testid="input-custom-report-description"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomName('');
                        setCustomDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="rounded-lg gap-2"
                      onClick={handleAddCustomReport}
                      disabled={!customName.trim()}
                      data-testid="button-save-custom-report"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button 
                variant="outline" 
                className="w-full rounded-xl gap-2"
                onClick={() => setIsAddingCustom(true)}
                data-testid="button-add-custom-report"
              >
                <Plus className="w-4 h-4" />
                Add Custom Report Type
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ReportTypeCardProps {
  report: ReportType;
  onClick: () => void;
  onDelete?: () => void;
}

function ReportTypeCard({ report, onClick, onDelete }: ReportTypeCardProps) {
  const Icon = report.icon;
  
  return (
    <Card 
      className="p-4 rounded-xl cursor-pointer hover-elevate transition-all group relative"
      onClick={onClick}
      data-testid={`report-type-${report.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">{report.name}</h4>
            {report.isCustom && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Custom</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {report.description}
          </p>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            data-testid={`button-delete-report-${report.id}`}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}
