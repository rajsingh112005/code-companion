import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  onSubmit: (task: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function TaskForm({ 
  onSubmit, 
  isLoading, 
  placeholder = "Describe your task or question...",
  label = "What would you like to work on?",
  className 
}: TaskFormProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[120px] px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none transition-colors placeholder:text-muted-foreground"
          rows={4}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!value.trim() || isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit
          </>
        )}
      </Button>
    </form>
  );
}
