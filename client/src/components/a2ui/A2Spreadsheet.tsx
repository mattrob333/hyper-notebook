import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Table2, 
  User,
  Mail,
  Building2,
  Check,
  X,
  Pencil
} from 'lucide-react';
import type { Lead, SpreadsheetContent } from '@shared/schema';

interface A2SpreadsheetProps {
  data: SpreadsheetContent;
  title?: string;
  onSelectLead?: (lead: Lead | null) => void;
  selectedLeadIndex?: number | null;
  onDataUpdate?: (data: SpreadsheetContent) => void;
}

export default function A2Spreadsheet({ 
  data, 
  title,
  onSelectLead,
  selectedLeadIndex,
  onDataUpdate
}: A2SpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { headers, rows, detectedColumns } = data;

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleRowClick = useCallback((rowIndex: number) => {
    if (editingCell) return; // Don't select while editing
    
    const row = rows[rowIndex];
    if (!row) return;

    // Try to find name/email/company from row data if not in detectedColumns
    // Check headers for common patterns
    const findValue = (patterns: RegExp[]) => {
      for (const header of headers) {
        const lowerHeader = header.toLowerCase();
        for (const pattern of patterns) {
          if (pattern.test(lowerHeader) && row[header]) {
            return row[header];
          }
        }
      }
      return undefined;
    };

    const email = detectedColumns.email ? row[detectedColumns.email] : findValue([/email/, /e-mail/]);
    const name = detectedColumns.name 
      ? row[detectedColumns.name] 
      : detectedColumns.firstName && detectedColumns.lastName
        ? `${row[detectedColumns.firstName] || ''} ${row[detectedColumns.lastName] || ''}`.trim()
        : findValue([/^name$/, /^name\s/, /\sname$/, /respondent/, /contact/]);
    const company = detectedColumns.company ? row[detectedColumns.company] : findValue([/company/, /org/]);

    // Build lead object from row data
    const lead: Lead = {
      rowIndex,
      data: row,
      email,
      name,
      company,
    };

    console.log('Selected lead:', lead);

    // Toggle selection
    if (selectedLeadIndex === rowIndex) {
      onSelectLead?.(null);
    } else {
      onSelectLead?.(lead);
    }
  }, [rows, headers, detectedColumns, selectedLeadIndex, onSelectLead, editingCell]);

  const handleCellDoubleClick = useCallback((rowIndex: number, column: string) => {
    setEditingCell({ rowIndex, column });
    setEditValue(rows[rowIndex][column] || '');
  }, [rows]);

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const { rowIndex, column } = editingCell;
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [column]: editValue };
    
    const updatedData: SpreadsheetContent = {
      ...data,
      rows: newRows,
    };
    
    onDataUpdate?.(updatedData);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, rows, data, onDataUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleExportCSV = useCallback(() => {
    // Reconstruct CSV from data
    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(h => {
          const val = row[h] || '';
          // Escape quotes and wrap in quotes if contains comma
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileName || 'export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [headers, rows, data.fileName]);

  // Get column icon based on detected type
  const getColumnIcon = (header: string) => {
    if (detectedColumns.email === header) return <Mail className="w-3 h-3 text-blue-500" />;
    if (detectedColumns.name === header || detectedColumns.firstName === header || detectedColumns.lastName === header) {
      return <User className="w-3 h-3 text-green-500" />;
    }
    if (detectedColumns.company === header) return <Building2 className="w-3 h-3 text-purple-500" />;
    return null;
  };

  if (!headers.length || !rows.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Table2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No data in spreadsheet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Table2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="font-medium text-sm">{title || data.fileName || 'Spreadsheet'}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {rows.length} rows · {headers.length} columns
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedLeadIndex !== null && selectedLeadIndex !== undefined && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Row {selectedLeadIndex + 1} selected
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Table - with horizontal and vertical scroll */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 border-b">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-12">
                  #
                </th>
                {headers.map((header) => (
                  <th 
                    key={header} 
                    className="px-3 py-2 text-left text-xs font-medium text-muted-foreground min-w-[120px] max-w-[250px]"
                  >
                    <div className="flex items-center gap-1.5">
                      {getColumnIcon(header)}
                      <span className="truncate">{header}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => handleRowClick(rowIndex)}
                  className={`
                    border-b border-border/50 cursor-pointer transition-colors
                    ${selectedLeadIndex === rowIndex 
                      ? 'bg-primary/10 hover:bg-primary/15' 
                      : 'hover:bg-muted/50'
                    }
                  `}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                    {selectedLeadIndex === rowIndex ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      rowIndex + 1
                    )}
                  </td>
                  {headers.map((header) => (
                    <td 
                      key={header}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleCellDoubleClick(rowIndex, header);
                      }}
                      className="px-3 py-2 min-w-[120px] max-w-[250px]"
                    >
                      {editingCell?.rowIndex === rowIndex && editingCell?.column === header ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSaveEdit}
                            className="h-7 text-sm py-0"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0"
                            onClick={handleSaveEdit}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="group flex items-center gap-1">
                          <span className="truncate">{row[header] || ''}</span>
                          <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t text-xs text-muted-foreground bg-muted/20">
        Click a row to select as lead · Double-click a cell to edit
      </div>
    </div>
  );
}
