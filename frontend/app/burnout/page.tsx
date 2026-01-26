"use client"

import { useState, useEffect } from 'react'
import {
    getBurnoutDashboard,
    trackMetric,
    analyzeBurnout,
    BurnoutAssessment,
    PerformanceMetric
} from '../../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BurnoutPage() {
    const [employeeId, setEmployeeId] = useState<number>(1)
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [dashboardData, setDashboardData] = useState<{
        assessment: BurnoutAssessment | null
        metrics: PerformanceMetric[]
    } | null>(null)

    // Form state
    const [hours, setHours] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const loadData = async () => {
        console.log("Loading data for employee:", employeeId)
        setLoading(true)
        try {
            const data = await getBurnoutDashboard(employeeId)
            console.log("Data loaded:", data)
            setDashboardData(data)
        } catch (e) {
            console.error("Load error:", e)
            alert("Failed to load dashboard")
        } finally {
            console.log("Setting loading to false")
            setLoading(false)
        }
    }

    const handleLogHours = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await trackMetric({
                employee_id: employeeId,
                metric_type: 'work_hours',
                value: parseFloat(hours),
                date: date
            })
            alert("Hours logged")
            setHours('')
            await loadData()
        } catch (e) {
            alert("Failed to log hours")
        }
    }

    const handleAnalyze = async () => {
        setAnalyzing(true)
        try {
            const result = await analyzeBurnout(employeeId)
            console.log("Analysis result:", result)
            // Update local state immediately with the result
            setDashboardData(prev => prev ? { ...prev, assessment: result } : { assessment: result, metrics: [] })
            await loadData()
        } catch (e) {
            console.error(e)
            alert("Analysis failed")
        } finally {
            setAnalyzing(false)
        }
    }

    useEffect(() => {
        if (employeeId) {
            loadData()
        }
    }, [employeeId])

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'low': return 'bg-green-100 text-green-800'
            case 'medium': return 'bg-yellow-100 text-yellow-800'
            case 'high': return 'bg-orange-100 text-orange-800'
            case 'critical': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Prepare chart data
    const chartData = dashboardData?.metrics
        .filter(m => m.metric_type === 'work_hours')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(m => ({
            date: m.date,
            value: m.value
        })) || []

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Performance & Burnout Detection</h1>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <label className="text-sm font-medium text-gray-700">Employee ID:</label>
                    <input
                        type="number"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(parseInt(e.target.value))}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                    />
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Dashboard - Left Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Performance Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Work Hours Trend (Last 30 Entries)</h2>
                        <div className="h-80 w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#4f46e5" activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                                    {loading ? 'Loading data...' : 'No work hours data available'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
                        <div className="flex justify-between items-start">
                            <h2 className="text-lg font-medium text-gray-900">AI Risk Assessment</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(dashboardData?.assessment?.risk_level || 'unknown')}`}>
                                {dashboardData?.assessment?.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </span>
                        </div>

                        <div className="mt-4 prose prose-sm text-gray-500">
                            <p className="whitespace-pre-wrap">{dashboardData?.assessment?.ai_analysis || "No analysis available. Click 'Run AI Analysis' to generate."}</p>
                        </div>

                        {dashboardData?.assessment?.recommendations && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-900">Recommendations:</h3>
                                <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                    {dashboardData.assessment.recommendations.map((rec: string, i: number) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                            </button>
                        </div>
                    </div>

                    {/* Recent Metrics Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Recent Metrics</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dashboardData?.metrics.slice(0, 10).map((metric) => (
                                        <tr key={metric.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.metric_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.value}</td>
                                        </tr>
                                    ))}
                                    {(!dashboardData?.metrics || dashboardData.metrics.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No recent metrics</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column - Actions */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Log Hours Card */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Log Work Hours</h2>
                        <form onSubmit={handleLogHours} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    required
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    placeholder="e.g. 8.5"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Log Hours'}
                            </button>
                        </form>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Warning Signs</h2>
                        {dashboardData?.assessment?.indicators && dashboardData.assessment.indicators.length > 0 ? (
                            <ul className="space-y-2">
                                {dashboardData.assessment.indicators.map((sign: string, i: number) => (
                                    <li key={i} className="flex items-start text-sm text-gray-600">
                                        <span className="text-red-500 mr-2">⚠️</span>
                                        {sign}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No warning signs detected.</p>
                        )}
                    </div>

                    {/* Performance Review Status (Placeholder) */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Review Status</h2>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Next Review:</span>
                            <span className="text-sm font-medium text-gray-900">In 2 months</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-xs text-gray-400">Previous Score: 8.5/10</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
