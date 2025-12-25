import { useState } from 'react';
import { ChevronDown, GitBranch, Check } from 'lucide-react';
import { Repository } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RepoSelectorProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onSelect: (repo: Repository) => void;
  className?: string;
}

export function RepoSelector({ repositories, selectedRepo, onSelect, className }: RepoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-secondary rounded-lg border border-border hover:bg-secondary/80 transition-colors w-full min-w-[240px]"
      >
        <GitBranch className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left font-medium">
          {selectedRepo ? selectedRepo.fullName : 'Select repository'}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-scale-in">
          {repositories.map((repo) => (
            <button
              key={repo.id}
              onClick={() => {
                onSelect(repo);
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-secondary transition-colors text-left"
            >
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{repo.fullName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{repo.language}</span>
                  <span>•</span>
                  <span>{repo.filesCount} files</span>
                </div>
              </div>
              {selectedRepo?.id === repo.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
              <StatusBadge status={repo.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Repository['status'] }) {
  const config = {
    indexed: { label: 'Indexed', className: 'bg-success/20 text-success' },
    indexing: { label: 'Indexing...', className: 'bg-warning/20 text-warning' },
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  };

  const { label, className } = config[status];

  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", className)}>
      {label}
    </span>
  );
}
