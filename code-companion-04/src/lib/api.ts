interface RepositoryResponse {
  id: string;
  name: string;
  full_name?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
  language?: string;
}

interface MessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  status: 'indexed' | 'indexing' | 'pending';
  lastUpdated: string;
  language: string;
  filesCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  fileReferences?: string[];
}


export interface OnboardingResponse {
  whereToStart: string[];
  filesToRead: string[];
  warnings: string[];
}

export interface ProjectStructure {
  name: string;
  type: 'folder' | 'file';
  children?: ProjectStructure[];
}

export async function fetchRepositories(userid: string): Promise<Repository[]> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/get_repo?user_id=${userid}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const data = await response.json();
    return data.repositories.map((repo: RepositoryResponse) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name || '',
      status: 'indexed' as const,
      lastUpdated: repo.updated_at || '',
      language: repo.language || 'Unknown',
      filesCount: 0, 
    }));
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

export async function fetchLoadedRepositories(userid: string): Promise<Repository[]> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/loaded_repo?user_id=${userid}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch loaded repositories');
    }
    
    const data = await response.json();
    return data.repositories.map((repo: RepositoryResponse) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.name,
      status: 'indexed' as const,
      lastUpdated: repo.created_at || '',
      language: 'Unknown',
      filesCount: 0, 
    }));
  } catch (error) {
    console.error('Error fetching loaded repositories:', error);
    return [];
  }
}

export async function loadRepository(userId: string, repoFullName: string): Promise<void> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  const repoUrl = `https://github.com/${repoFullName}`;
  
  const response = await fetch(`${backendBase}/load-repo?user_id=${userId}&repo_url=${encodeURIComponent(repoUrl)}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to load repository');
  }
  
  return response.json();
}

export async function sendChatMessage(repoId: string, message: string): Promise<ChatMessage> {
  throw new Error('sendChatMessage is not implemented for the live backend.');
}

export interface ChatSession {
  id: string;
  project_id: string;
  created_at: string;
  message_count: number;
}

export async function createNewChat(userId: string, projectId: string): Promise<{status: string; chat_id?: string; error?: string}> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/create?user_id=${userId}&project_id=${projectId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chat');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
    return {status: 'error', error: String(error)};
  }
}

export async function getUserChats(userId: string, projectId: string): Promise<ChatSession[]> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/list?user_id=${userId}&project_id=${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }
    
    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
}

export async function getChatMessages(chatId: string, userId: string): Promise<ChatMessage[]> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/messages?chat_id=${chatId}&user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const data = await response.json();
    return data.messages?.map((msg: MessageResponse) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
    })) || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function sendMessageToChat(chatId: string, userId: string, content: string): Promise<{status: string; message_id?: string; error?: string}> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/send-message?chat_id=${chatId}&user_id=${userId}&content=${encodeURIComponent(content)}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return {status: 'error', error: String(error)};
  }
}

export async function clearChat(chatId: string, userId: string): Promise<{status: string; error?: string}> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/clear?chat_id=${chatId}&user_id=${userId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear chat');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error clearing chat:', error);
    return {status: 'error', error: String(error)};
  }
}

export async function deleteChat(chatId: string, userId: string): Promise<{status: string; error?: string}> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendBase}/chat/delete?chat_id=${chatId}&user_id=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error deleting chat:', error);
    return {status: 'error', error: String(error)};
  }
}


export async function getOnboardingInfo(repoId: string, task: string): Promise<OnboardingResponse> {
  throw new Error('Onboarding insights are not implemented for the live backend.');
}

export async function generateProject(idea: string): Promise<{ stack: string[]; structure: ProjectStructure }> {
  throw new Error('Project generation is not implemented for the live backend.');
}

