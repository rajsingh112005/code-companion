import { Link } from 'react-router-dom';
import { Github, Zap, GitCompare, BookOpen, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiateGitHubOAuth, isAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: MessageSquare,
    title: 'Chat with Your Code',
    description: 'Ask questions about your codebase and get instant, context-aware answers powered by AI.',
  },
  {
    icon: GitCompare,
    title: 'Impact Analysis',
    description: 'Visualize how changes propagate through your codebase before you commit.',
  },
  {
    icon: BookOpen,
    title: 'Smart Onboarding',
    description: 'Get personalized guidance for new team members based on their tasks.',
  },
  {
    icon: Sparkles,
    title: 'Project Generator',
    description: 'Generate complete project structures from a simple idea description.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-bold">CB</span>
            </div>
            <span className="text-xl font-bold">CodeBrain</span>
          </div>
          <Button variant="outline" onClick={initiateGitHubOAuth}>
            <Github className="w-4 h-4" />
            Sign in with GitHub
          </Button>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-up">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Codebase Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Understand Your
            <br />
            <span className="text-gradient">Codebase Instantly</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Connect your GitHub repositories and unlock AI-powered insights. 
            Chat with your code, analyze change impact, and onboard faster than ever.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Button variant="hero" size="xl" onClick={initiateGitHubOAuth}>
              <Github className="w-5 h-5" />
              Connect GitHub
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to
            <br />
            <span className="text-gradient">master your codebase</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From intelligent code search to automated documentation, 
            CodeBrain gives your team superpowers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-subtle animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-card border border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to supercharge your development?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of developers who use CodeBrain to understand 
            and navigate their codebases faster.
          </p>
          <Button variant="hero" size="xl" onClick={initiateGitHubOAuth}>
            <Github className="w-5 h-5" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CB</span>
            </div>
            <span className="font-semibold">CodeBrain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 CodeBrain. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
