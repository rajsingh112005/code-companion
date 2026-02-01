// Mock API functions for the codebase intelligence platform

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

// Mock repositories data
export const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'frontend-app',
    fullName: 'acme/frontend-app',
    status: 'indexed',
    lastUpdated: '2024-01-15T10:30:00Z',
    language: 'TypeScript',
    filesCount: 342,
  },
  {
    id: '2',
    name: 'api-service',
    fullName: 'acme/api-service',
    status: 'indexed',
    lastUpdated: '2024-01-14T08:15:00Z',
    language: 'Python',
    filesCount: 128,
  },
  {
    id: '3',
    name: 'ml-pipeline',
    fullName: 'acme/ml-pipeline',
    status: 'indexing',
    lastUpdated: '2024-01-15T12:00:00Z',
    language: 'Python',
    filesCount: 89,
  },
  {
    id: '4',
    name: 'mobile-app',
    fullName: 'acme/mobile-app',
    status: 'pending',
    lastUpdated: '2024-01-10T15:45:00Z',
    language: 'React Native',
    filesCount: 256,
  },
];

// Mock chat responses
export const mockChatResponses = [
  "Based on my analysis of the codebase, the authentication flow starts in `src/auth/AuthProvider.tsx` and uses JWT tokens stored in httpOnly cookies. The token refresh logic is handled by `src/lib/tokenRefresh.ts`.",
  "I found 3 main API endpoints for user management in `src/api/users/`. The `createUser` function validates input using Zod schemas defined in `src/schemas/user.schema.ts`.",
  "The component you're looking for is `DataTable.tsx` in the components folder. It uses TanStack Table for virtualization and supports sorting, filtering, and pagination.",
];


// Mock onboarding response
export const mockOnboardingResponse: OnboardingResponse = {
  whereToStart: [
    'Begin with the README.md for project overview',
    'Check src/App.tsx for the main application structure',
    'Review src/routes/ for navigation patterns',
  ],
  filesToRead: [
    'src/config/index.ts - Configuration and environment variables',
    'src/lib/api.ts - API client setup and interceptors',
    'src/hooks/useAuth.ts - Authentication patterns',
    'src/components/Layout.tsx - Main layout structure',
  ],
  warnings: [
    'Legacy code in src/utils/deprecated/ - avoid using these',
    'Database migrations pending in migrations/ folder',
    'Some tests are skipped in __tests__/integration/',
  ],
};

// Mock project structure
export const mockProjectStructure: ProjectStructure = {
  name: 'my-saas-app',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'Button.tsx', type: 'file' },
            { name: 'Input.tsx', type: 'file' },
            { name: 'Modal.tsx', type: 'file' },
          ],
        },
        {
          name: 'pages',
          type: 'folder',
          children: [
            { name: 'Home.tsx', type: 'file' },
            { name: 'Dashboard.tsx', type: 'file' },
            { name: 'Settings.tsx', type: 'file' },
          ],
        },
        { name: 'App.tsx', type: 'file' },
        { name: 'index.tsx', type: 'file' },
      ],
    },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ],
};

// API functions
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
    return mockRepositories;
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
    return mockRepositories;
  }
}

export async function loadRepository(userId: string, repoFullName: string): Promise<void> {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  // Convert full_name to repo URL
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
  await new Promise(resolve => setTimeout(resolve, 1500));
  const randomResponse = mockChatResponses[Math.floor(Math.random() * mockChatResponses.length)];
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: randomResponse,
    timestamp: new Date().toISOString(),
    fileReferences: ['src/auth/AuthProvider.tsx', 'src/lib/tokenRefresh.ts'],
  };
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
  await new Promise(resolve => setTimeout(resolve, 1200));
  return mockOnboardingResponse;
}

export async function generateProject(idea: string): Promise<{ stack: string[]; structure: ProjectStructure }> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vercel'],
    structure: mockProjectStructure,
  };
}

