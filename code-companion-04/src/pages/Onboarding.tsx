import { useState, useEffect } from 'react';
import { BookOpen, FileText, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { RepoSelector } from '@/components/RepoSelector';
import { TaskForm } from '@/components/TaskForm';
import { fetchLoadedRepositories, getOnboardingInfo, Repository, OnboardingResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [response, setResponse] = useState<OnboardingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('No user_id found. Please log in.');
      return;
    }
    
    const repos = await fetchLoadedRepositories(userId);
    setRepositories(repos);
    if (repos.length > 0) {
      setSelectedRepo(repos[0]);
    }
  };

  const handleSubmit = async (task: string) => {
    if (!selectedRepo) return;
    
    setIsLoading(true);
    try {
      const result = await getOnboardingInfo(selectedRepo.id, task);
      setResponse(result);
    } catch (error) {
      console.error('Failed to get onboarding info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding Assistant</h1>
        <p className="text-muted-foreground">
          Get personalized guidance for new team members based on their tasks
        </p>
      </div>

      {/* Repo Selector */}
      <div className="mb-8">
        <RepoSelector
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={setSelectedRepo}
        />
      </div>

      {/* Task Form */}
      <div className="mb-8 p-6 rounded-xl bg-card border border-border">
        <TaskForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="e.g., I need to add a new payment integration..."
          label="What task are you working on?"
        />
      </div>

      {/* Response Panels */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : response ? (
        <div className="grid md:grid-cols-3 gap-6">
          <ResponsePanel
            icon={Lightbulb}
            title="Where to Start"
            items={response.whereToStart}
            color="primary"
          />
          <ResponsePanel
            icon={FileText}
            title="Files to Read"
            items={response.filesToRead}
            color="info"
            isCode
          />
          <ResponsePanel
            icon={AlertTriangle}
            title="Warnings"
            items={response.warnings}
            color="warning"
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Describe your task to get personalized onboarding guidance
          </p>
        </div>
      )}
    </div>
  );
}

function ResponsePanel({ 
  icon: Icon, 
  title, 
  items, 
  color,
  isCode
}: { 
  icon: React.ElementType; 
  title: string; 
  items: string[]; 
  color: 'primary' | 'info' | 'warning';
  isCode?: boolean;
}) {
  const colorClasses = {
    primary: 'bg-primary/20 text-primary',
    info: 'bg-info/20 text-info',
    warning: 'bg-warning/20 text-warning',
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-up">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="p-4 space-y-3">
        {items.map((item, index) => (
          <li 
            key={index}
            className={cn(
              "text-sm",
              isCode ? "font-mono text-code-text bg-code-bg p-2 rounded-lg" : "text-muted-foreground"
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
