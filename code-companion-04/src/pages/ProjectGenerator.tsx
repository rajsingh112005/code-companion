import { useState } from 'react';
import { Sparkles, Folder, FileCode, ChevronRight, Loader2 } from 'lucide-react';
import { TaskForm } from '@/components/TaskForm';
import { generateProject, ProjectStructure } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ProjectGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ stack: string[]; structure: ProjectStructure } | null>(null);

  const handleSubmit = async (idea: string) => {
    setIsLoading(true);
    try {
      const generatedResult = await generateProject(idea);
      setResult(generatedResult);
    } catch (error) {
      console.error('Failed to generate project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Generator</h1>
        <p className="text-muted-foreground">
          Generate complete project structures from a simple idea description
        </p>
      </div>

      {/* Input Form */}
      <div className="mb-8 p-6 rounded-xl bg-card border border-border">
        <TaskForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="e.g., A SaaS dashboard for tracking customer subscriptions with Stripe integration..."
          label="Describe your project idea"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Generating your project...</p>
        </div>
      ) : result ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tech Stack */}
          <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-up">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-semibold">Recommended Stack</h3>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {result.stack.map((tech, index) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-secondary rounded-full text-sm font-medium animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Folder Structure */}
          <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="p-2 rounded-lg bg-info/20 text-info">
                <Folder className="w-4 h-4" />
              </div>
              <h3 className="font-semibold">Project Structure</h3>
            </div>
            <div className="p-4 font-mono text-sm">
              <FolderTree node={result.structure} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to Create</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Describe your project idea above and we'll generate a complete 
            project structure with recommended technologies.
          </p>
        </div>
      )}
    </div>
  );
}

function FolderTree({ node, depth = 0 }: { node: ProjectStructure; depth?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 py-1 hover:text-primary transition-colors w-full text-left",
          depth > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {isFolder && hasChildren && (
          <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
        )}
        {!hasChildren && <span className="w-3" />}
        {isFolder ? (
          <Folder className="w-4 h-4 text-info" />
        ) : (
          <FileCode className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={cn(isFolder && "font-medium")}>{node.name}</span>
      </button>
      
      {isFolder && hasChildren && isOpen && (
        <div>
          {node.children!.map((child, index) => (
            <FolderTree key={`${child.name}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
