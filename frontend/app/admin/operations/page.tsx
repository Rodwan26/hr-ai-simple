"use client";

import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { config } from '@/lib/config';

export default function AdminOperationsPage() {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const [activeTasks, setActiveTasks] = useState<any[]>([]);

    useEffect(() => {
        // Poll metrics from backend
        const fetchData = async () => {
            try {
                const healthRes = await fetch(`${config.apiBaseUrl}/health`);
                const healthData = await healthRes.json();
                setHealth(healthData);

                // Fetch Prometheus metrics and parse them (simplification for this dashboard)
                const metricsRes = await fetch(`${config.apiBaseUrl}/metrics`);
                const text = await metricsRes.text();

                // Mocking some data derived from parsed metrics for visualization
                // In a real production system, this dashboard would query a Prometheus/Grafana API
                setMetrics([
                    { time: '10:00', latency: 0.5, requests: 120 },
                    { time: '10:05', latency: 0.8, requests: 150 },
                    { time: '10:10', latency: 1.2, requests: 180 },
                    { time: '10:15', latency: 0.6, requests: 140 },
                    { time: '10:20', latency: 0.4, requests: 110 },
                ]);

                setActiveTasks([
                    { type: 'Resume Analysis', active: 2 },
                    { type: 'Interview Generation', active: 5 },
                    { type: 'Wellbeing Assessment', active: 1 },
                ]);

            } catch (err) {
                console.error("Failed to fetch metrics", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-indigo-900">Operations & Performance</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">System Status</h3>
                    <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className="text-xl font-bold">{health?.status || 'Unknown'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">v{health?.version} | {health?.environment}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Workload</h3>
                    <span className="text-2xl font-bold text-indigo-600">83%</span>
                    <p className="text-xs text-gray-400 mt-2">Near capacity (High Load)</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Avg. Latency</h3>
                    <span className="text-2xl font-bold text-orange-500">620ms</span>
                    <p className="text-xs text-gray-400 mt-2">+12% from last hour</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold mb-6">Real-time Latency (Seconds)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Line type="monotone" dataKey="latency" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold mb-6">Active Background Tasks</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeTasks} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="type" type="category" width={150} axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} />
                            <Tooltip cursor={{ fill: '#F9FAFB' }} />
                            <Bar dataKey="active" radius={[0, 4, 4, 0]}>
                                {activeTasks.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#818CF8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold">Anomalies & Alerts</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4">Component</th>
                            <th className="px-6 py-4">Message</th>
                            <th className="px-6 py-4">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        <tr>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase">Critical</span></td>
                            <td className="px-6 py-4 font-medium text-gray-900">AI Service</td>
                            <td className="px-6 py-4 text-gray-600">Spike in 503 errors detected in Resume Domain (Org: CloudTech)</td>
                            <td className="px-6 py-4 text-gray-400">2 mins ago</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-bold uppercase">Warning</span></td>
                            <td className="px-6 py-4 font-medium text-gray-900">Background Jobs</td>
                            <td className="px-6 py-4 text-gray-600">Task queue latency exceeded SLA (Threshold: 5s, Current: 8.2s)</td>
                            <td className="px-6 py-4 text-gray-400">15 mins ago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
