'use client';

import React from 'react';

interface SourceCitation {
    document_id: number;
    filename: string;
    chunk_index: number;
    snippet?: string;
    similarity: number;
    version?: string;
}

interface TrustMetadata {
    confidence_score: number;
    confidence_level: 'high' | 'medium' | 'low';
    ai_model: string;
    reasoning?: string;
    timestamp?: string;
    is_fallback: boolean;
    fallback_reason?: string;
    sources?: SourceCitation[];
}

interface TrustBadgeProps {
    trust: TrustMetadata;
    showSources?: boolean;
    onSourceClick?: (source: SourceCitation) => void;
}

const confidenceConfig = {
    high: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✓',
        label: 'High Confidence',
    },
    medium: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '◐',
        label: 'Medium Confidence',
    },
    low: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '○',
        label: 'Low Confidence',
    },
};

export const TrustBadge: React.FC<TrustBadgeProps> = ({ trust, showSources = true, onSourceClick }) => {
    const config = confidenceConfig[trust.confidence_level] || confidenceConfig.low;

    if (trust.is_fallback) {
        return (
            <div className="trust-badge fallback p-3 rounded-lg bg-gray-100 border border-gray-300">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">ⓘ</span>
                    <span className="text-sm text-gray-600">{trust.fallback_reason || 'No relevant information found.'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="trust-badge space-y-3">
            {/* Confidence Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
                <span>{config.icon}</span>
                <span className="text-sm font-medium">{config.label}</span>
                <span className="text-xs opacity-75">({Math.round(trust.confidence_score * 100)}%)</span>
            </div>

            {/* Model & Reasoning */}
            {trust.reasoning && (
                <p className="text-xs text-gray-500 italic">{trust.reasoning}</p>
            )}

            {/* Sources/Citations */}
            {showSources && trust.sources && trust.sources.length > 0 && (
                <div className="sources mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                        {trust.sources.map((source, idx) => (
                            <button
                                key={`${source.document_id}-${source.chunk_index}`}
                                onClick={() => onSourceClick?.(source)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                title={source.snippet}
                            >
                                <span>📄</span>
                                <span className="font-medium">{source.filename}</span>
                                {source.version && (
                                    <span className="text-blue-500 text-[10px]">v{source.version}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrustBadge;
