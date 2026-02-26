'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';

interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export function useAuth() {
  
  const [loading, setLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);
  
  
  const { 
    user, 
    email, 
    isLoggedIn, 
    login: storeLogin, 
    logout: storeLogout, 
    updateUser,
    checkAuth 
  } = useAuthStore();

  
  useEffect(() => {
    setIsClient(true);
  }, []);

  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initAuth = async () => {
      setLoading(true);
      
      const hasStoredAuth = checkAuth();
      
      if (hasStoredAuth && email) {
        
        try {
          const response = await fetch('/api/auth/mylog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (response.ok && data.status === 'loggedin') {
            updateUser(data);
          } else {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('email');
              sessionStorage.removeItem('user');
            }
            storeLogout();
          }
        } catch (error) {
          console.error('Auth verification error:', error);
        }
      }
      
      setLoading(false);
    };

    initAuth();

    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email' || e.key === 'user') {
        checkAuth();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('auth-change', () => checkAuth());
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-change', () => checkAuth());
      }
    };
  }, [checkAuth, email, storeLogout, updateUser]);

  
  const login = async (email: string) => {
    try {
      setLoading(true);
      
      
      if (typeof window !== 'undefined') {
      
        sessionStorage.setItem('email', email);
      }

      
      const response = await fetch('/api/auth/mylog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'loggedin') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('user', JSON.stringify(data));
        }

        storeLogin(email, data);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const logout = async () => {
    try {
      setLoading(true);
      
      const currentEmail = email || (typeof window !== 'undefined' ? sessionStorage.getItem('email') : null);

      if (currentEmail) {
        
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail, reason: 'manual' }),
        });

        if (response.ok) {
          console.log('✅ Logout API successful');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
      }
      
    
      storeLogout();

      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
      setLoading(false);
    }
  };

  
  const refreshAuth = async () => {
    setLoading(true);
    await checkAuth();
    

    const currentEmail = email || (typeof window !== 'undefined' ? sessionStorage.getItem('email') : null);
    if (currentEmail) {
      try {
        const response = await fetch('/api/auth/mylog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail }),
        });

        const data = await response.json();

        if (response.ok && data.status === 'loggedin') {
          updateUser(data);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('user', JSON.stringify(data));
          }
        } else {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('email');
            sessionStorage.removeItem('user');
          }
          storeLogout();
        }
      } catch (error) {
        console.error('Refresh auth error:', error);
      }
    }
    setLoading(false);
  };

  const getEmail = () => {
    if (typeof window !== 'undefined') {
      return email || sessionStorage.getItem('email');
    }
    return email;
  };

  return {
    isLoggedIn,
    loading,
    user,
    userId: user?.id || user?.userId || null,
    
  
    login,
    logout,
    refreshAuth,
    
    email: getEmail(),
    isClient, 
  };
}