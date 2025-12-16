import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Share2,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InfographicViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string;
  title?: string;
  isLoading?: boolean;
}

export default function InfographicViewer({ 
  open, 
  onOpenChange, 
  imageUrl, 
  title = 'Infographic',
  isLoading = false
}: InfographicViewerProps) {
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-infographic.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Downloaded!', description: 'Infographic saved to your device.' });
    } catch (error) {
      toast({ 
        title: 'Download failed', 
        description: 'Could not download the infographic.',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this infographic: ${title}`,
          url: imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast({ title: 'Link copied!', description: 'Infographic URL copied to clipboard.' });
      }
    } catch (error) {
      toast({ 
        title: 'Share failed', 
        description: 'Could not share the infographic.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={handleShare} disabled={!imageUrl}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!imageUrl}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        {/* Image Container */}
        <div className="flex-1 overflow-auto bg-muted/30 min-h-[500px] flex items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="text-sm">Generating your infographic...</p>
              <p className="text-xs">This may take a moment</p>
            </div>
          ) : imageUrl ? (
            <div 
              className="transition-transform duration-200 cursor-move"
              style={{ transform: `scale(${zoom})` }}
            >
              <img 
                src={imageUrl} 
                alt={title}
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <ImageIcon className="w-16 h-16" />
              <p className="text-sm">No infographic generated yet</p>
              <p className="text-xs">Click Generate to create one</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
