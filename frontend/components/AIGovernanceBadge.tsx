"use client";

import React from 'react';

interface AIGovernanceBadgeProps {
    confidence?: number;
    domain?: string;
}

export default function AIGovernanceBadge({ confidence = 0.95, domain = "General" }: AIGovernanceBadgeProps) {
    return (
        <div className="flex items-center space-x-2 py-1 px-3 bg-indigo-50 border border-indigo-100 rounded-full w-fit">
            <div className="relative">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                AI Audited: {domain} • {(confidence * 100).toFixed(0)}% Confidence
            </span>
            <div className="group relative">
                <svg className="w-3 h-3 text-indigo-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    This decision was processed via the Enterprise AI Governance layer. Traceability, bias checks, and ethical auditing have been applied. [Learn More](/admin/governance)
                </div>
            </div>
        </div>
    );
}
