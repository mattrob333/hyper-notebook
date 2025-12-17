import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  ImagePlus,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { LetterheadSettings as LetterheadSettingsType } from '@shared/schema';

interface LetterheadSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  currentSettings?: LetterheadSettingsType | null;
}

export default function LetterheadSettings({
  open,
  onOpenChange,
  notebookId,
  currentSettings,
}: LetterheadSettingsProps) {
  const [enabled, setEnabled] = useState(currentSettings?.enabled ?? false);
  const [position, setPosition] = useState<'left' | 'center' | 'right'>(
    currentSettings?.position ?? 'left'
  );
  const [logoUrl, setLogoUrl] = useState(currentSettings?.logoUrl ?? '');
  const [companyName, setCompanyName] = useState(currentSettings?.companyName ?? '');
  const [tagline, setTagline] = useState(currentSettings?.tagline ?? '');
  
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (settings: LetterheadSettingsType) => {
      const res = await apiRequest('PATCH', `/api/notebooks/${notebookId}`, {
        letterhead: settings,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notebooks/${notebookId}`] });
      toast({ title: 'Letterhead saved', description: 'Your letterhead settings have been updated' });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      enabled,
      position,
      logoUrl: logoUrl || undefined,
      companyName: companyName || undefined,
      tagline: tagline || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Letterhead Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Letterhead</Label>
              <p className="text-xs text-muted-foreground">
                Show letterhead on all reports from this notebook
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* Position */}
              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-2">
                  <Button
                    variant={position === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPosition('left')}
                    className="flex-1 gap-2"
                  >
                    <AlignLeft className="w-4 h-4" />
                    Left
                  </Button>
                  <Button
                    variant={position === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPosition('center')}
                    className="flex-1 gap-2"
                  >
                    <AlignCenter className="w-4 h-4" />
                    Center
                  </Button>
                  <Button
                    variant={position === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPosition('right')}
                    className="flex-1 gap-2"
                  >
                    <AlignRight className="w-4 h-4" />
                    Right
                  </Button>
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo-url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>
                {logoUrl && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline (optional)</Label>
                <Input
                  id="tagline"
                  placeholder="Innovation at its finest"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-white">
                  <div
                    className={`pb-3 border-b ${
                      position === 'center'
                        ? 'text-center'
                        : position === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className={`h-10 mb-2 ${
                          position === 'center'
                            ? 'mx-auto'
                            : position === 'right'
                            ? 'ml-auto'
                            : ''
                        }`}
                      />
                    )}
                    {companyName && (
                      <div className="font-semibold text-gray-900">{companyName}</div>
                    )}
                    {tagline && (
                      <div className="text-sm text-gray-500">{tagline}</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
