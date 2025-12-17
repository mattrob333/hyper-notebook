import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Maximize2, 
  Minimize2, 
  Download, 
  X,
  Presentation,
  ArrowLeft
} from 'lucide-react';

interface Slide {
  title: string;
  bullets: string[];
}

interface SlideViewerProps {
  slides: Slide[];
  title?: string;
  onClose?: () => void;
}

export default function SlideViewer({ slides, title, onClose }: SlideViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (slides.length === 0) return;

    const content = slides.map((slide, i) => 
      `# Slide ${i + 1}: ${slide.title}\n\n${slide.bullets.map(b => `- ${b}`).join('\n')}\n`
    ).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'presentation'}-slides.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Presentation className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No slides generated yet</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Presentation className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="font-medium text-sm">{title || 'Presentation'}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {slides.length} slides
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download as Markdown">
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {onClose && !isFullscreen && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Slides - Stacked Vertically */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {slides.map((slide, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Slide Number Label */}
              <div className="w-full max-w-4xl mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                  Slide {index + 1}
                </span>
              </div>
              
              {/* 16:9 Slide Card */}
              <div 
                className="w-full max-w-4xl aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700/50 p-6 md:p-10 flex flex-col"
              >
                {/* Slide Title */}
                <h2 className="text-xl md:text-3xl font-bold text-white mb-4 md:mb-6">
                  {slide.title}
                </h2>
                
                {/* Bullet Points */}
                <ul className="space-y-2 md:space-y-3 flex-1">
                  {slide.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-base md:text-lg text-slate-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Slide Number Badge */}
                <div className="flex justify-end mt-4">
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                    {index + 1} / {slides.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
