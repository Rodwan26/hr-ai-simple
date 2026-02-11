'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                    <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h2>
                    <p className="text-sm text-red-600 mb-4">{this.state.error?.message || 'A rendering error occurred.'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
