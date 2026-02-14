import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const userid=params.get('user_id');
      const username=params.get('name');
      if (success === 'true') {
        setStatus('success');
        login();
        
        setTimeout(() => navigate(`/dashboard?user_id=${userid}&name=${username}`), 1500);
      } else {
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg">Completing authentication...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl">✓</div>
            <p className="text-lg">Successfully authenticated! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl">✗</div>
            <p className="text-lg">Authentication failed. Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
