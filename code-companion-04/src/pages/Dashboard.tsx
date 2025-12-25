import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, MessageSquare, GitBranch, Clock, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchRepositories, Repository, loadRepository } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Developer');
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user_id');
  const username = searchParams.get('name');

  useEffect(() => {
    // Load username from localStorage or URL params
    const storedName = localStorage.getItem('username');
    if (username) {
      localStorage.setItem('username', username);
      setUserName(username);
    } else if (storedName) {
      setUserName(storedName);
    }
  }, [username]);

  useEffect(() => {
    let userIdToUse = userId;
    
    if (userId) {
      localStorage.setItem('user_id', userId);
    } else {
      userIdToUse = localStorage.getItem('user_id');
    }
    if (userIdToUse) {
      loadRepositories(userIdToUse);
    }
  }, [userId]);

  const loadRepositories = async (uid: string) => {
    setIsLoading(true);
    const repos = await fetchRepositories(uid);
    setRepositories(repos);
    setIsLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userName.split(' ')[0] || 'Developer'}
        </h1>
        <p className="text-muted-foreground">
          Manage your connected repositories and start exploring your code.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickActionCard 
          icon={MessageSquare} 
          label="Start Chat" 
          href="/chat"
          color="primary"
        />
        <QuickActionCard 
          icon={GitBranch} 
          label="Impact Analysis" 
          href="/impact"
          color="warning"
        />
        <QuickActionCard 
          icon={Plus} 
          label="Add Repository" 
          href="#"
          color="success"
        />
        <QuickActionCard 
          icon={RefreshCw} 
          label="Re-index All" 
          href="#"
          color="info"
        />
      </div>

      {/* Repositories List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Repositories</h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Add Repository
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border animate-pulse">
                <div className="h-6 bg-secondary rounded w-1/3 mb-3" />
                <div className="h-4 bg-secondary rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {repositories.map((repo, index) => (
              <RepoCard key={repo.id} repo={repo} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ 
  icon: Icon, 
  label, 
  href,
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string;
  color: 'primary' | 'warning' | 'success' | 'info';
}) {
  const colorClasses = {
    primary: 'bg-primary/20 text-primary',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
    info: 'bg-info/20 text-info',
  };

  return (
    <Link 
      to={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-glow-subtle group"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium">{label}</span>
      <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
    </Link>
  );
}

function RepoCard({ repo, index }: { repo: Repository; index: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const statusConfig = {
    indexed: { label: 'Indexed', className: 'bg-success/20 text-success' },
    indexing: { label: 'Indexing...', className: 'bg-warning/20 text-warning animate-pulse' },
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[repo.status];

  const handleLoadProject = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      await loadRepository(userId, repo.fullName);
      alert(`Started loading ${repo.fullName}`);
    } catch (error) {
      console.error('Failed to load repository:', error);
      alert('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all animate-fade-up group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{repo.fullName}</h3>
            <span className={cn("px-2.5 py-0.5 text-xs font-medium rounded-full", status.className)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {repo.language}
            </span>
            <span>{repo.filesCount} files</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(repo.lastUpdated).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={handleLoadProject}
            disabled={isLoading || repo.status === 'indexing'}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
