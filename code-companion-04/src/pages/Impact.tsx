import { useState, useEffect } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle, Info, FileCode } from 'lucide-react';
import { RepoSelector } from '@/components/RepoSelector';
import { GraphViewer } from '@/components/GraphViewer';
import { Button } from '@/components/ui/button';
import { fetchRepositories, analyzeImpact, Repository, ImpactFile } from '@/lib/api';
import { cn } from '@/lib/utils';

const mockFiles = [
  'src/auth/AuthProvider.tsx',
  'src/components/UserProfile.tsx',
  'src/hooks/useAuth.ts',
  'src/api/users.ts',
  'src/pages/Login.tsx',
];

export default function Impact() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false);
  const [impactFiles, setImpactFiles] = useState<ImpactFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('No user_id found. Please log in.');
      return;
    }
    
    const repos = await fetchRepositories(userId);
    setRepositories(repos);
    const indexedRepo = repos.find(r => r.status === 'indexed');
    if (indexedRepo) {
      setSelectedRepo(indexedRepo);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedRepo || !selectedFile) return;
    
    setIsAnalyzing(true);
    try {
      const files = await analyzeImpact(selectedRepo.id, selectedFile);
      setImpactFiles(files);
    } catch (error) {
      console.error('Failed to analyze impact:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const impactCounts = {
    high: impactFiles.filter(f => f.impact === 'high').length,
    medium: impactFiles.filter(f => f.impact === 'medium').length,
    low: impactFiles.filter(f => f.impact === 'low').length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Impact Analysis</h1>
        <p className="text-muted-foreground">
          Visualize how changes propagate through your codebase
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl bg-card border border-border">
        <RepoSelector
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={setSelectedRepo}
        />

        {/* File Selector */}
        <div className="relative">
          <button
            onClick={() => setIsFileDropdownOpen(!isFileDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 bg-secondary rounded-lg border border-border hover:bg-secondary/80 transition-colors min-w-[280px]"
          >
            <FileCode className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-left font-medium truncate">
              {selectedFile || 'Select a file to analyze'}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isFileDropdownOpen && "rotate-180")} />
          </button>

          {isFileDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-scale-in max-h-[300px] overflow-y-auto">
              {mockFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => {
                    setSelectedFile(file);
                    setIsFileDropdownOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full hover:bg-secondary transition-colors text-left font-mono text-sm"
                >
                  <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {file}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleAnalyze}
          disabled={!selectedRepo || !selectedFile || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Impact'}
        </Button>
      </div>

      {/* Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Graph */}
        <GraphViewer className="h-[500px]" />

        {/* Affected Files */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Affected Files</h3>
            {impactFiles.length > 0 && (
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  {impactCounts.high} High
                </span>
                <span className="flex items-center gap-1 text-warning">
                  <AlertCircle className="w-3 h-3" />
                  {impactCounts.medium} Medium
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Info className="w-3 h-3" />
                  {impactCounts.low} Low
                </span>
              </div>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {impactFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Select a file and click "Analyze Impact" to see affected files</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {impactFiles.map((file, index) => (
                  <ImpactFileItem key={file.path} file={file} index={index} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactFileItem({ file, index }: { file: ImpactFile; index: number }) {
  const config = {
    high: { 
      icon: AlertTriangle, 
      className: 'text-destructive bg-destructive/10',
      label: 'High Impact'
    },
    medium: { 
      icon: AlertCircle, 
      className: 'text-warning bg-warning/10',
      label: 'Medium Impact'
    },
    low: { 
      icon: Info, 
      className: 'text-muted-foreground bg-muted',
      label: 'Low Impact'
    },
  };

  const { icon: Icon, className, label } = config[file.impact];

  return (
    <li 
      className="p-4 hover:bg-secondary/50 transition-colors animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", className)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm truncate">{file.path}</p>
          <p className="text-sm text-muted-foreground mt-1">{file.reason}</p>
        </div>
        <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", className)}>
          {label}
        </span>
      </div>
    </li>
  );
}
