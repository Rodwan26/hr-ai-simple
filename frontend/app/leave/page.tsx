'use client';

import { useState, useEffect } from 'react';
import {
    getLeaveBalance,
    getLeaveRequests,
    submitLeaveRequest,
    checkLeaveEligibility,
    approveLeaveRequest,
    rejectLeaveRequest,
    LeaveBalance,
    LeaveRequest
} from '../../lib/api';

export default function LeavePage() {
    const [employeeId, setEmployeeId] = useState('emp001'); // Mock logged-in user
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [leaveType, setLeaveType] = useState('Vacation');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [daysCount, setDaysCount] = useState<number>(0);
    const [eligibilityWarning, setEligibilityWarning] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const balanceData = await getLeaveBalance(employeeId);
            setBalances(balanceData);
            const requestData = await getLeaveRequests(employeeId);
            setRequests(requestData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    useEffect(() => {
        const days = calculateDays(startDate, endDate);
        setDaysCount(days);
        if (days > 0) {
            checkEligibility(days);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, leaveType]);

    const checkEligibility = async (days: number) => {
        try {
            const result = await checkLeaveEligibility(employeeId, leaveType, days);
            if (!result.eligible) {
                setEligibilityWarning(result.reason);
            } else {
                setEligibilityWarning(null);
            }
        } catch (e) {
            console.error("Check eligibility failed", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await submitLeaveRequest({
                employee_id: employeeId,
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                days_count: daysCount,
                reason: reason,
            });
            // Refresh
            fetchData();
            // Reset form
            setReason('');
            setStartDate('');
            setEndDate('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Admin Mock Actions
    const handleApprove = async (id: number) => {
        try {
            await approveLeaveRequest(id);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Leave Management System</h1>

                {/* User Switcher (Mock) */}
                <div className="mb-6">
                    <label className="mr-2 font-medium">Viewing as Employee:</label>
                    <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="border rounded px-2 py-1"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Balance & Request Form */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Balance Card */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Balances</h2>
                            {loading ? <p>Loading...</p> : (
                                <div className="space-y-4">
                                    {balances.map((b) => (
                                        <div key={b.id} className="flex justify-between items-center bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-900">{b.leave_type}</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-blue-600">{b.remaining_days}</span>
                                                <span className="text-xs text-blue-400">of {b.total_days} days</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Request Form */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Request Leave</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                                    <select
                                        value={leaveType}
                                        onChange={(e) => setLeaveType(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option>Vacation</option>
                                        <option>Sick</option>
                                        <option>Personal</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            required
                                        />
                                    </div>
                                </div>

                                {daysCount > 0 && (
                                    <div className="text-sm bg-gray-100 p-2 rounded flex justify-between">
                                        <span>Duration:</span>
                                        <span className="font-bold">{daysCount} days</span>
                                    </div>
                                )}

                                {eligibilityWarning && (
                                    <div className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                                        ⚠ {eligibilityWarning}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        placeholder="Why are you taking leave?"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !!eligibilityWarning}
                                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${submitting || !!eligibilityWarning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Requests</h2>
                            {loading && requests.length === 0 ? <p>Loading...</p> : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Insight</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {requests.map((req) => (
                                                <tr key={req.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{req.leave_type}</div>
                                                        <div className="text-xs text-gray-500">{req.days_count} days</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{req.start_date}</div>
                                                        <div className="text-xs text-gray-500">to {req.end_date}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-gray-500 max-w-xs truncate" title={req.ai_reasoning || ''}>
                                                            {req.ai_decision ? (
                                                                <span className="font-bold text-indigo-600">[{req.ai_decision}] </span>
                                                            ) : null}
                                                            {req.ai_reasoning}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {/* Demo Actions for testing approval flow */}
                                                        {req.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleApprove(req.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                                                            >
                                                                Approve (Demo)
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {requests.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        No requests found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
