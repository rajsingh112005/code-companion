import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, RotateCcw, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { RepoSelector } from '@/components/RepoSelector';
import { ChatWindow } from '@/components/ChatWindow';
import { FormattedMessage } from '@/components/FormattedMessage';
import { 
  fetchLoadedRepositories, 
  createNewChat,
  getUserChats,
  getChatMessages,
  deleteChat,
  clearChat,
  sendMessageToChat,
  Repository, 
  ChatMessage,
  ChatSession 
} from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function Chat() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userId] = useState(() => localStorage.getItem('user_id') || '');
  const [inputValue, setInputValue] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const appendToAssistantMessage = useCallback((chunk: string) => {
    if (!chunk) return;

    setMessages(prev => {
      let messageId = streamingMessageIdRef.current;
      if (!messageId) {
        messageId = `assistant-${Date.now()}`;
        streamingMessageIdRef.current = messageId;
        return [...prev, {
          id: messageId,
          role: 'assistant',
          content: chunk,
          timestamp: new Date().toISOString(),
        }];
      }

      return prev.map(msg => msg.id === messageId
        ? { ...msg, content: `${msg.content}${chunk}` }
        : msg
      );
    });
  }, []);

  const loadRepositories = useCallback(async () => {
    if (!userId) {
      console.error('No user_id found. Please log in.');
      return;
    }
    
    const repos = await fetchLoadedRepositories(userId);
    setRepositories(repos);
    if (repos.length > 0) {
      setSelectedRepo(repos[0]);
    }
  }, [userId]);

  const loadChats = useCallback(async () => {
    if (!selectedRepo || !userId) return;
    
    const chatList = await getUserChats(userId, selectedRepo.id);
    setChats(chatList);
    
    if (chatList.length > 0) {
      setSelectedChat(chatList[0]);
    } else {
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedRepo, userId]);

  const loadMessages = useCallback(async () => {
    if (!selectedChat || !userId) return;
    
    const loadedMessages = await getChatMessages(selectedChat.id, userId);
    setMessages(loadedMessages);
  }, [selectedChat, userId]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  useEffect(() => {
    if (selectedRepo) {
      loadChats();
    }
  }, [selectedRepo, loadChats]);

  useEffect(() => {
    if (selectedChat) {
      setSidebarCollapsed(true);
      loadMessages();
    }
  }, [selectedChat, loadMessages]);

  const startStreaming = useCallback(() => {
    if (!selectedChat) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    streamingMessageIdRef.current = null;
    setIsLoading(true);

    const streamUrl = `${backendBase}/chat/stream/?chat_id=${selectedChat.id}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        streamingMessageIdRef.current = null;
        setIsLoading(false);
        es.close();
        eventSourceRef.current = null;
        loadMessages();
        return;
      }
      
      if (event.data === '[LOADING]') {
        setIsLoading(true);
        return;
      }
      
      if (event.data.startsWith('[ANSWER]')) {
        const answer = event.data.substring(8); // Remove '[ANSWER]' prefix
        appendToAssistantMessage(answer);
        return;
      }
      
      appendToAssistantMessage(event.data);
    };

    es.onerror = (error) => {
      console.error('SSE error:', error);
      setIsLoading(false);
      es.close();
      eventSourceRef.current = null;
    };
  }, [selectedChat, backendBase, appendToAssistantMessage, loadMessages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleStartNewChat = async () => {
    if (!selectedRepo || !userId) return;
    
    setIsLoading(true);
    try {
      const result = await createNewChat(userId, selectedRepo.id);
      if (result.status === 'success' && result.chat_id) {
        await loadChats();
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!userId || !window.confirm('Are you sure you want to delete this chat?')) return;
    
    setIsLoading(true);
    try {
      const result = await deleteChat(chatId, userId);
      if (result.status === 'success') {
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
        await loadChats();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!selectedChat || !userId || !window.confirm('Are you sure you want to clear all messages in this chat?')) return;
    
    setIsLoading(true);
    try {
      const result = await clearChat(selectedChat.id, userId);
      if (result.status === 'success') {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat: ChatSession) => {
    setSelectedChat(chat);
  };

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    setSelectedChat(null);
    setMessages([]);
    setSidebarCollapsed(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !selectedChat || !userId || isLoading) return;
    
    const messageContent = inputValue.trim();
    setInputValue('');
    streamingMessageIdRef.current = null;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    try {
      const result = await sendMessageToChat(selectedChat.id, userId, messageContent);
      if (result.status === 'success') {
        startStreaming();
      } else {
        console.error('Failed to send message:', result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-semibold">Chat with Your Code</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your codebase
          </p>
        </div>
        <RepoSelector
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={handleSelectRepo}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {selectedRepo && (
          <>
            <div
              className={`border-r border-border flex flex-col bg-card transition-all duration-300 overflow-hidden ${
                sidebarCollapsed ? 'w-0' : 'w-64'
              }`}
            >
              <div className="p-4 border-b border-border flex-shrink-0">
                <Button
                  onClick={handleStartNewChat}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No chats yet. Start a new chat to begin!
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {chats.map((chat, index) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                          selectedChat?.id === chat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-accent'
                        }`}
                      >
                        <div
                          onClick={() => handleSelectChat(chat)}
                          className="flex-1 min-w-0"
                        >
                          <div className="text-sm font-medium truncate">
                            Chat #{index + 1}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {new Date(chat.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs opacity-70">
                            {chat.message_count} messages
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 p-1 hover:bg-destructive/20 rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="px-2 border-r border-border bg-card hover:bg-accent transition-colors flex-shrink-0"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedRepo ? (
            selectedChat ? (
              <>
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
                  <div className="flex-1">
                    <h2 className="font-semibold text-sm">
                      {selectedRepo.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Chat created on {new Date(selectedChat.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                    >
                      {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleClearChat}
                      disabled={isLoading || messages.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Start typing to begin your chat!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {msg.role === 'user' ? (
                              <p className="text-sm">{msg.content}</p>
                            ) : (
                              <div className="text-sm prose prose-invert max-w-none">
                                <FormattedMessage content={msg.content} isAssistant={true} />
                              </div>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-border p-4 bg-card">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">No Chat Selected</h2>
                  <p className="text-muted-foreground mb-6">
                    Select an existing chat or start a new one to begin
                  </p>
                  {!sidebarCollapsed && (
                    <Button onClick={handleStartNewChat} disabled={isLoading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  Select a repository to start chatting
                </p>
                <RepoSelector
                  repositories={repositories}
                  selectedRepo={selectedRepo}
                  onSelect={handleSelectRepo}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


