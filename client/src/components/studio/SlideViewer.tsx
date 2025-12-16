import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Download, 
  X,
  Presentation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
  }, [goToPrevious, goToNext, isFullscreen]);

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

  const currentSlide = slides[currentIndex];

  const SlideContent = () => (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isFullscreen ? 'bg-background' : ''}`}>
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{title || 'Presentation'}</span>
          <span className="text-xs text-muted-foreground">
            Slide {currentIndex + 1} of {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slide Canvas */}
      <div className={`flex-1 flex items-center justify-center p-6 ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'min-h-[400px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`w-full max-w-4xl aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl p-8 md:p-12 flex flex-col justify-center ${isFullscreen ? 'scale-110' : ''}`}
          >
            {/* Slide Title */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8">
              {currentSlide.title}
            </h2>
            
            {/* Bullet Points */}
            <ul className="space-y-3 md:space-y-4">
              {currentSlide.bullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 text-lg md:text-xl text-slate-200"
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>{bullet}</span>
                </motion.li>
              ))}
            </ul>

            {/* Slide Number Badge */}
            <div className="absolute bottom-4 right-4 text-xs text-slate-500">
              {currentIndex + 1} / {slides.length}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Thumbnail Strip */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-md px-2">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`shrink-0 w-16 h-10 rounded border-2 transition-all text-[6px] p-1 overflow-hidden ${
                i === currentIndex 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-bold truncate text-foreground">{slide.title}</div>
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === slides.length - 1}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return <SlideContent />;
}
