export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  githubUsername: string;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem('isAuthenticated') === 'true';
}

export function login(): void {
  localStorage.setItem('isAuthenticated', 'true');
}

export function logout(): void {
  localStorage.removeItem('isAuthenticated');
}

export async function getCurrentUser(): Promise<User | null> {
  if (isAuthenticated()) {
    try{
      const response= await fetch(`http://localhost:8000/user/${getUserId()}`);
      if(!response.ok){
         throw new Error('Failed to fetch repositories');
      }
      const data= await response.json();

      const us={
        id:data.id,
        name:data.name,
        email:data.email,
        avatar:data.avatar_url,
        githubUsername:data.github_id
      }
      return us as User;
      
    }
    catch(error){
      console.error('Error fetching user:', error);
    }
  }
  return null;
}

export function getUserId(): string | null {
  return localStorage.getItem('user_id');
}

export function initiateGitHubOAuth(): void {
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const url = `${backendBase}/login/github`;
  window.location.href = url;
}
  
