'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, AuditLog } from '@/lib/api';

export default function AuditDashboard() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEntity, setFilterEntity] = useState('');
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        loadLogs();
    }, [filterEntity, filterAction]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(filterEntity || undefined, filterAction || undefined);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string | Date, includeTime: boolean = true) => {
        const d = new Date(date);
        if (includeTime) {
            return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
        return d.toISOString().split('T')[0];
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Timestamp', 'Action', 'Entity', 'User ID', 'Role', 'AI Recommended', 'Details'];
        const rows = logs.map(log => [
            log.id,
            log.timestamp,
            log.action,
            log.entity_type,
            log.user_id || 'System',
            log.user_role || 'N/A',
            log.ai_recommended ? 'Yes' : 'No',
            JSON.stringify(log.details).replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${formatDate(new Date(), false)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit & Compliance</h1>
                    <p className="text-gray-600 mt-2">Track all critical actions and AI-driven decisions.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                >
                    Export to CSV
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Entity</label>
                        <select
                            value={filterEntity}
                            onChange={(e) => setFilterEntity(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">All Entities</option>
                            <option value="interview">Interview</option>
                            <option value="resume">Resume</option>
                            <option value="payroll">Payroll</option>
                            <option value="employee">Onboarding</option>
                            <option value="document">Document</option>
                            <option value="wellbeing_assessment">Wellbeing</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Action</label>
                        <input
                            type="text"
                            placeholder="e.g. submit_feedback"
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User / Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Impact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        Loading audit trail...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">UID: {log.user_id || 'Sys'}</div>
                                            <div className="text-xs text-gray-500 uppercase">{log.user_role || 'System'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                                            {log.entity_type} #{log.entity_id || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.ai_recommended ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                                        <circle cx="4" cy="4" r="3" />
                                                    </svg>
                                                    AI Derived
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Manual</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <pre className="text-xs text-gray-400 max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </pre>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
