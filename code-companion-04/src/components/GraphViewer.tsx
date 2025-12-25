import { GitFork, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GraphViewerProps {
  className?: string;
}

export function GraphViewer({ className }: GraphViewerProps) {
  return (
    <div className={cn("relative rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Dependency Graph</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Graph Canvas Placeholder */}
      <div className="relative h-[400px] bg-gradient-to-br from-background to-card p-6">
        {/* Mock graph nodes */}
        <svg className="w-full h-full" viewBox="0 0 400 300">
          {/* Connection lines */}
          <line x1="200" y1="50" x2="100" y2="130" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />
          <line x1="200" y1="50" x2="300" y2="130" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />
          <line x1="100" y1="130" x2="70" y2="220" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />
          <line x1="100" y1="130" x2="150" y2="220" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />
          <line x1="300" y1="130" x2="250" y2="220" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />
          <line x1="300" y1="130" x2="330" y2="220" stroke="hsl(199 89% 48% / 0.3)" strokeWidth="2" />

          {/* Root node */}
          <g className="animate-pulse-glow">
            <circle cx="200" cy="50" r="24" fill="hsl(199 89% 48%)" />
            <text x="200" y="55" textAnchor="middle" fill="hsl(222 47% 6%)" fontSize="10" fontWeight="600">App</text>
          </g>

          {/* Level 1 nodes */}
          <g>
            <circle cx="100" cy="130" r="20" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="100" y="135" textAnchor="middle" fill="hsl(210 40% 98%)" fontSize="9">Auth</text>
          </g>
          <g>
            <circle cx="300" cy="130" r="20" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="300" y="135" textAnchor="middle" fill="hsl(210 40% 98%)" fontSize="9">API</text>
          </g>

          {/* Level 2 nodes */}
          <g>
            <circle cx="70" cy="220" r="16" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="70" y="224" textAnchor="middle" fill="hsl(215 20% 55%)" fontSize="8">JWT</text>
          </g>
          <g>
            <circle cx="150" cy="220" r="16" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="150" y="224" textAnchor="middle" fill="hsl(215 20% 55%)" fontSize="8">OAuth</text>
          </g>
          <g>
            <circle cx="250" cy="220" r="16" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="250" y="224" textAnchor="middle" fill="hsl(215 20% 55%)" fontSize="8">REST</text>
          </g>
          <g>
            <circle cx="330" cy="220" r="16" fill="hsl(222 30% 14%)" stroke="hsl(222 30% 18%)" strokeWidth="2" />
            <text x="330" y="224" textAnchor="middle" fill="hsl(215 20% 55%)" fontSize="8">GQL</text>
          </g>
        </svg>

        {/* Interactive hint */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
          Click nodes to explore dependencies
        </div>
      </div>
    </div>
  );
}
