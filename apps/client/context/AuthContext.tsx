import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type User = {
    id: string;
    email: string;
    tier: string;
};

export type AuthContextType = {
    user: User | null;
    token: string | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, tier: string) => Promise<void>;
    signOut: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

import { API_URL } from '../config/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function initAuth() {
            try {
                let storedToken = null;
                if (Platform.OS === 'web') {
                    storedToken = localStorage.getItem('session_token');
                } else {
                    storedToken = await SecureStore.getItemAsync('session_token');
                }

                if (storedToken) {
                    // Verify token by trying to fetch profile
                    const response = await fetch(`${API_URL}/profile/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });

                    if (response.ok) {
                        setToken(storedToken);
                        // In a real app we would fetch the user details at this step, we'll mark as logged in.
                        setUser({ id: 'existing', email: 'user@edunexus.com', tier: 'Junior' });
                    } else {
                        // Invalid/expired token
                        if (Platform.OS === 'web') {
                            localStorage.removeItem('session_token');
                        } else {
                            await SecureStore.deleteItemAsync('session_token');
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load session auth', e);
            } finally {
                setIsLoading(false);
            }
        }
        initAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to login');

        if (Platform.OS === 'web') {
            localStorage.setItem('session_token', data.token);
        } else {
            await SecureStore.setItemAsync('session_token', data.token);
        }
        setToken(data.token);
        // Dummy user set to skip needing an extra API route just for /me User details
        setUser({ id: 'new_session', email, tier: 'Junior' });
    };

    const register = async (email: string, pass: string, tier: string) => {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, tier })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to register');
    };

    const signOut = async () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem('session_token');
        } else {
            await SecureStore.deleteItemAsync('session_token');
        }
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};
