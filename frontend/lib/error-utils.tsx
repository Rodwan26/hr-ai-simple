'use client';

import React from 'react';

/**
 * Standardizes error data into an array of objects with msg and field.
 * Handles: 
 * - Array of errors: [{ field?, msg }]
 * - Object error: { field?, msg }
 * - FastAPI details: { detail: ... }
 * - String error
 */
export function normalizeErrors(errors: any): Array<{ field?: string; msg: string }> {
    if (!errors) return [];

    // 1. Array of standardized errors
    if (Array.isArray(errors)) {
        return errors.map(err => {
            if (typeof err === 'string') return { msg: err };
            return {
                field: err.field || undefined,
                msg: err.msg || err.message || JSON.stringify(err)
            };
        });
    }

    // 2. Single object error
    if (typeof errors === 'object') {
        // Check for FastAPI "detail" string or list
        if (errors.detail && Array.isArray(errors.detail)) {
            return errors.detail.map((err: any) => ({
                field: err.loc?.[err.loc.length - 1] || 'unknown',
                msg: err.msg
            }));
        }
        if (errors.detail && typeof errors.detail === 'string') {
            return [{ msg: errors.detail }];
        }

        // Standard single error object
        return [{
            field: errors.field || undefined,
            msg: errors.msg || errors.message || JSON.stringify(errors)
        }];
    }

    // 3. Simple string
    return [{ msg: String(errors) }];
}

/**
 * Reusable React component to render errors safely.
 */
export function ErrorDisplay({ errors, className = "" }: { errors: any; className?: string }) {
    const normalized = normalizeErrors(errors);

    if (normalized.length === 0) return null;

    return (
        <div className={`space-y-1 ${className}`}>
            {normalized.map((err, idx) => (
                <div
                    key={idx}
                    className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        {err.field && <span className="font-bold uppercase text-[10px] mr-2 opacity-70">[{err.field}]</span>}
                        {err.msg}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Helper to render errors inline (older style or specific cases)
 */
export function renderErrors(errors: any) {
    return <ErrorDisplay errors={errors} />;
}
