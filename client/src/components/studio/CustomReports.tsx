import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Clock, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Report {
  id: string;
  name: string;
  type: 'analysis' | 'summary' | 'comparison';
  createdAt: Date;
}

interface CustomReportsProps {
  reports: Report[];
  onDeleteReport: (id: string) => void;
  onDownloadReport: (id: string) => void;
}

const typeColors: Record<Report['type'], string> = {
  analysis: 'bg-chart-1/20 text-chart-1',
  summary: 'bg-chart-2/20 text-chart-2',
  comparison: 'bg-chart-3/20 text-chart-3',
};

export default function CustomReports({ reports, onDeleteReport, onDownloadReport }: CustomReportsProps) {
  return (
    <div className="h-full flex flex-col" data-testid="custom-reports">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No reports yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reports generated from workflows will appear here
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="group flex items-start gap-3 p-3 rounded-md hover-elevate"
                data-testid={`report-item-${report.id}`}
              >
                <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={typeColors[report.type]}>
                      {report.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDownloadReport(report.id)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDeleteReport(report.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
