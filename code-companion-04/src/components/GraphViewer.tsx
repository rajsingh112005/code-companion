import { GitFork, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GraphViewerProps {
  className?: string;
}

export function GraphViewer({ className }: GraphViewerProps) {
  return (
    <div className={cn("relative rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Dependency Graph</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative h-[400px] bg-gradient-to-br from-background to-card p-6">
        <div className="h-full w-full rounded-lg border border-dashed border-border bg-background/40 flex items-center justify-center text-sm text-muted-foreground">
          Dependency graph visualization will appear after indexing.
        </div>
      </div>
    </div>
  );
}
