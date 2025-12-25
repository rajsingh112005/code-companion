import { useState, useEffect } from 'react';
import { RepoSelector } from '@/components/RepoSelector';
import { ChatWindow } from '@/components/ChatWindow';
import { fetchRepositories, sendChatMessage, Repository, ChatMessage } from '@/lib/api';

export default function Chat() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    
    const repos = await fetchRepositories(userId);
    setRepositories(repos);
    // Auto-select first indexed repo
    const indexedRepo = repos.find(r => r.status === 'indexed');
    if (indexedRepo) {
      setSelectedRepo(indexedRepo);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedRepo) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Get AI response
    setIsLoading(true);
    try {
      const response = await sendChatMessage(selectedRepo.id, content);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold">Chat with Your Code</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your codebase
          </p>
        </div>
        <RepoSelector
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={setSelectedRepo}
        />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {selectedRepo ? (
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Select a repository to start chatting
              </p>
              <RepoSelector
                repositories={repositories}
                selectedRepo={selectedRepo}
                onSelect={setSelectedRepo}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
