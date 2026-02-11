"use client";

import React, { useState } from 'react';
import { TrustedAIResponse, TrustMetadata } from '@/lib/api';

interface TrustedAIOutputProps {
    response: TrustedAIResponse | null | undefined;
    title?: string;
    className?: string;
    showContent?: boolean; // If true, renders response.content. If false, parent renders content using response.data
    fallbackMessage?: string;
    children?: React.ReactNode;
}

export default function TrustedAIOutput({
    response,
    title = "AI Analysis",
    className = "",
    showContent = true,
    fallbackMessage = "AI analysis not available.",
    children
}: TrustedAIOutputProps) {
    const [showDetails, setShowDetails] = useState(false);

    if (!response || !response.trust) {
        return (
            <div className={`p-4 bg-gray-50 rounded-lg text-gray-500 italic text-sm border border-gray-100 ${className}`}>
                {fallbackMessage}
            </div>
        );
    }

    const { content, trust } = response;
    const { confidence_score, confidence_level, reasoning, sources, is_fallback, fallback_reason } = trust;

    // Determine Color based on confidence
    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-100";
        if (score >= 0.5) return "text-amber-600 bg-amber-50 border-amber-100";
        return "text-red-600 bg-red-50 border-red-100";
    };

    const confidenceBadge = (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getConfidenceColor(confidence_score)}`}>
            {confidence_level ? confidence_level.toUpperCase() : "UNKNOWN"} ({Math.round(confidence_score * 100)}%)
        </span>
    );

    return (
        <div className={`border rounded-lg bg-white overflow-hidden shadow-sm ${className}`}>
            {/* Header / Metadata Strip */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {title}
                    </span>
                    {confidenceBadge}
                </div>
                {reasoning && (
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline transition-colors"
                    >
                        {showDetails ? "Hide Reasoning" : "Why?"}
                    </button>
                )}
            </div>

            {/* Human Confirmation Warning */}
            {trust.requires_human_confirmation && (
                <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 border-b border-amber-100 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <strong>Review Required:</strong> High-impact analysis detected. Please verify before taking action.
                    </div>
                </div>
            )}

            {/* Fallback Warning */}
            {is_fallback && (
                <div className="bg-orange-50 px-4 py-2 text-xs text-orange-800 border-b border-orange-100 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <strong>Fallback Mode:</strong> {fallback_reason || "Standard AI unavailable."}
                    </div>
                </div>
            )}

            {/* Reasoning Panel */}
            {showDetails && reasoning && (
                <div className="bg-slate-50 px-4 py-3 text-sm text-slate-700 border-b border-slate-100 animate-in slide-in-from-top-1 duration-200">
                    <p className="font-semibold text-xs text-slate-500 mb-1">AI REASONING:</p>
                    {reasoning}
                </div>
            )}

            {/* Main Content */}
            <div className="p-4 text-sm text-slate-800">
                {children ? (
                    children
                ) : showContent ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {content || <span className="text-gray-400 italic">No text content available.</span>}
                    </div>
                ) : null}
            </div>

            {/* Citations / Sources */}
            {sources && sources.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-500 mr-2">SOURCES:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {sources.map((source, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center max-w-xs truncate bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-100 cursor-help"
                                title={`Source: ${source.source_file} (Chunk ${source.chunk_id})`}
                            >
                                📄 {source.source_file}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
