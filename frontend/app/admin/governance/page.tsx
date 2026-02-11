"use client";

import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { config } from '@/lib/config';

const BIAS_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function GovernanceDashboard() {
    const [governanceData, setGovernanceData] = useState<any>(null);
    const [ethicalLogs, setEthicalLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            // In production, this would fetch from /api/governance/summary
            // For now, we simulate the data based on the new models
            setGovernanceData({
                activeModels: [
                    { domain: 'Resume', version: '1.2.0', model: 'gpt-4', trustScore: 0.98 },
                    { domain: 'Interview', version: '2.1.5', model: 'gemini-pro', trustScore: 0.94 },
                    { domain: 'Wellbeing', version: '1.0.1', model: 'gpt-4', trustScore: 0.99 },
                ],
                biasTrends: [
                    { date: '2024-01', bias: 0.05 },
                    { date: '2024-02', bias: 0.04 },
                    { date: '2024-03', bias: 0.07 },
                    { date: '2024-04', bias: 0.03 },
                ],
                fairnessRadar: [
                    { subject: 'Gender', A: 95, fullMark: 100 },
                    { subject: 'Ethnicity', A: 92, fullMark: 100 },
                    { subject: 'Age', A: 98, fullMark: 100 },
                    { subject: 'Disability', A: 90, fullMark: 100 },
                    { subject: 'Location', A: 99, fullMark: 100 },
                ]
            });

            setEthicalLogs([
                { id: 1, domain: 'Resume', type: 'Bias Warning', status: 'Flagged', confidence: 0.85, timestamp: '10 mins ago' },
                { id: 2, domain: 'Interview', type: 'Low Confidence', status: 'Reviewed', confidence: 0.45, timestamp: '1 hour ago' },
                { id: 3, domain: 'Wellbeing', type: 'Consistent', status: 'Auto-Approved', confidence: 0.99, timestamp: '2 hours ago' },
            ]);
        };

        fetchData();
    }, []);

    if (!governanceData) return <div className="p-8 text-center text-gray-500">Loading Governance Data...</div>;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Governance & Ethics</h1>
                    <p className="text-slate-500 mt-1">Provenance tracking and bias monitoring for enterprise AI decisioning.</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">
                    Initiate Ethical Audit
                </button>
            </div>

            {/* Model Registry Section */}
            <h2 className="text-xl font-bold mb-4 text-slate-800">Active Model Registry</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {governanceData.activeModels.map((m: any) => (
                    <div key={m.domain} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded uppercasetracking-wider">{m.domain}</span>
                            <span className="text-xs text-slate-400 font-mono">v{m.version}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{m.model}</h3>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-slate-500">Trust Score</span>
                            <span className="text-sm font-bold text-emerald-600">{(m.trustScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${m.trustScore * 100}%` }}></div>
                        </div>
                        <button className="w-full mt-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition">
                            Rollback Model
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Bias Trends */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                    <h3 className="text-lg font-bold mb-6">Bias Score Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={governanceData.biasTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="bias" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Fairness Radar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
                    <h3 className="text-lg font-bold mb-6">Fairness Assessment (Aggregate)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={governanceData.fairnessRadar}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                            <Radar name="Fairness" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ethical Audit Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Ethical Audit Log</h3>
                    <span className="text-sm text-slate-500">Last 24 Hours</span>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Domain</th>
                            <th className="px-6 py-4">Issue Type</th>
                            <th className="px-6 py-4">Confidence</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {ethicalLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${log.status === 'Flagged' ? 'bg-red-100 text-red-600' :
                                            log.status === 'Reviewed' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">{log.domain}</td>
                                <td className="px-6 py-4 text-slate-600">{log.type}</td>
                                <td className="px-6 py-4 font-mono text-slate-400">{(log.confidence * 100).toFixed(0)}%</td>
                                <td className="px-6 py-4 text-slate-400">{log.timestamp}</td>
                                <td className="px-6 py-4">
                                    <button className="text-indigo-600 font-semibold hover:underline">Review Decision</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
