'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  id: number;
  email: string;
  role: string;
  employee_id: number | null;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; detail?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    // Set a timeout to ensure loading state doesn't hang indefinitely
    const timeoutId = setTimeout(() => {
      console.warn('[Auth] Initial auth check timed out after 5 seconds');
      setLoading(false);
    }, 5000);

    if (token) {
      fetchUser(token).finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      clearTimeout(timeoutId);
      setLoading(false);
    }

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(4000) // 4 second timeout for the fetch itself
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('[Auth] User authenticated:', userData.email);
      } else if (response.status === 401) {
        console.log('[Auth] Token expired, attempting refresh...');
        // Try refresh
        const refreshed = await refresh();
        if (!refreshed) {
          console.log('[Auth] Refresh failed, logging out');
          logout();
        } else {
          console.log('[Auth] Token refreshed successfully');
          // Fetch user again with new token
          const newToken = localStorage.getItem('auth_token');
          if (newToken) {
            const retryResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${newToken}` }
            });
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
            }
          }
        }
      } else {
        console.warn('[Auth] Unexpected response status:', response.status);
        logout();
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.error('[Auth] Request timed out - backend may be unavailable');
      } else {
        console.error('[Auth] Failed to fetch user:', error);
      }
      // Don't logout on network errors, just clear loading state
      // User can still navigate and try to login
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refresh_token=${refreshToken}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        // No need to fetchUser here, the calling function will continue or we can just update state
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log(`[Auth] Attempting login for: ${email} to ${API_BASE_URL}/api/auth/login`);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Ensure cookies are sent/received
        body: JSON.stringify({ email, password })
      });

      console.log(`[Auth] Login response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('[Auth] Login successful, saving tokens');
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Use the user data directly from login response if available to avoid an extra network call
        if (data.user) {
          setUser(data.user);
        } else {
          await fetchUser(data.access_token);
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('[Auth] Login failed error data:', errorData);
        return { success: false, detail: errorData.errors?.[0]?.msg || errorData.detail || 'Login failed' };
      }
    } catch (error) {
      return { success: false, detail: 'Connection error' };
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      fetch(`${API_BASE_URL}/api/auth/logout?refresh_token=${refreshToken}`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => { });
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
