'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled Frontend Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                <p className="text-slate-500 mb-8">
                    We encountered an unexpected error. Our team has been notified.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-200 transition"
                    >
                        Go to Homepage
                    </button>
                </div>
                {process.env.NODE_ENV !== 'production' && (
                    <div className="mt-8 p-4 bg-slate-50 rounded-lg text-left overflow-auto max-h-40">
                        <p className="text-xs font-mono text-red-500">{error.message}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-2">{error.stack}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
