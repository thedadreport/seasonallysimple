'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  
  // Check if we're in development mode
  useEffect(() => {
    setIsDevMode(process.env.NODE_ENV === 'development');
  }, []);
  
  const router = useRouter();
  
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // For development mode, use direct login API
      if (isDevMode) {
        try {
          const devResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });
          
          if (!devResponse.ok) {
            setError('Login failed in development mode. This should not happen.');
          } else {
            // Simulate successful login
            setTimeout(() => {
              router.push('/');
              router.refresh();
            }, 500);
          }
          return;
        } catch (devError) {
          console.error('Dev login error:', devError);
          setError('Error in development login route');
          return;
        }
      }
      
      if (isLogin) {
        // Use NextAuth for login
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        
        if (result?.error) {
          setError('Invalid email or password');
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        // Handle registration through our API endpoint
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Registration failed. Please try again.');
        } else {
          // Auto login after successful registration
          const signInResult = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
          
          if (signInResult?.error) {
            setError('Account created but failed to log in. Please try logging in.');
          } else {
            router.push('/');
            router.refresh();
          }
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Social sign-in handler
  const handleSocialSignIn = (provider: string) => {
    // For development mode, simply redirect without actual auth
    if (isDevMode) {
      setLoading(true);
      setTimeout(() => {
        // Simulate successful login
        router.push('/');
        router.refresh();
      }, 500);
      return;
    }
    
    // Actual social sign-in
    setLoading(true);
    signIn(provider, { callbackUrl: '/' });
  };
  
  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to access your recipes and meal plans' 
              : 'Join us for personalized seasonal recipes'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {isDevMode && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md mb-6">
            <p className="font-medium">Development Mode Active</p>
            <p className="text-sm">Authentication is simulated. Any email/password will work.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-navy font-medium mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-navy font-medium mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full input-field"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-navy font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-field"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-navy font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field"
              required
              minLength={6}
            />
          </div>
          
          {isLogin && (
            <div className="text-right">
              <Link href="/forgot-password" className="text-sage text-sm hover:underline">
                Forgot your password?
              </Link>
            </div>
          )}
          
          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={loading}
          >
            {loading 
              ? 'Please wait...' 
              : isLogin ? 'Sign In' : 'Create Account'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sage hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-4">
            Or continue with
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleSocialSignIn('google')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-center hover:bg-gray-50 transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-600">
        By signing in or creating an account, you agree to our{' '}
        <Link href="/terms" className="text-sage hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-sage hover:underline">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}