'use client'

import React from 'react';
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function AppShell({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="mt-6 text-slate-400 font-medium animate-pulse tracking-wide uppercase text-xs">Initializing Platform...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {process.env.NEXT_PUBLIC_APP_ENV === 'staging' && (
                <div className="bg-amber-500 text-white text-[10px] uppercase font-bold text-center py-1 tracking-widest fixed top-0 w-full z-[60]">
                    Staging Environment - v1.0.0
                </div>
            )}

            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="transition-all duration-300 md:pl-72 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
}
