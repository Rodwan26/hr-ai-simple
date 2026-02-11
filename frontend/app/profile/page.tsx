'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
    getLeaveBalance,
    getLeaveRequests,
    getPayrollHistory,
    getOnboardingTasks,
    getOnboardingDocuments,
    signOnboardingDocument,
    completeOnboardingTask,
    LeaveBalance,
    LeaveRequest,
    Payroll,
    OnboardingTask,
    OnboardingDocument
} from '@/lib/api';
import {
    UserCircleIcon,
    CalendarIcon,
    BanknotesIcon,
    ClipboardDocumentCheckIcon,
    DocumentArrowUpIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [tasks, setTasks] = useState<OnboardingTask[]>([]);
    const [docs, setDocs] = useState<OnboardingDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const empId = user!.id.toString();
            const [lb, lr, ph, ot, od] = await Promise.all([
                getLeaveBalance(empId),
                getLeaveRequests(empId),
                getPayrollHistory(empId),
                getOnboardingTasks(user!.id),
                getOnboardingDocuments(user!.id)
            ]);
            setLeaveBalance(lb);
            setLeaveRequests(lr);
            setPayrolls(ph);
            setTasks(ot);
            setDocs(od);
        } catch (err) {
            console.error('Failed to load profile data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignDoc = async (docId: number) => {
        try {
            await signOnboardingDocument(docId);
            loadData();
        } catch (err) {
            alert('Failed to sign document');
        }
    };

    if (!user) return <div className="p-8 text-center">Please login to view your profile.</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-6 flex items-center gap-6">
                    <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-12 w-12 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{user.email.split('@')[0]}</h1>
                        <p className="text-slate-500">{user.role.replace('_', ' ')} • {user.department || 'General'}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    {['overview', 'leave', 'payroll', 'onboarding'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">

                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CalendarIcon className="h-6 w-6 text-blue-500" />
                                        <h2 className="text-lg font-semibold">Active Leaves</h2>
                                    </div>
                                    <p className="text-3xl font-bold">{leaveRequests.filter(r => r.status === 'pending').length}</p>
                                    <p className="text-sm text-slate-500 mt-1">Pending approval</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-500" />
                                        <h2 className="text-lg font-semibold">Onboarding</h2>
                                    </div>
                                    <p className="text-3xl font-bold">{tasks.filter(t => t.is_completed).length} / {tasks.length}</p>
                                    <p className="text-sm text-slate-500 mt-1">Tasks completed</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <BanknotesIcon className="h-6 w-6 text-amber-500" />
                                        <h2 className="text-lg font-semibold">Latest Pay</h2>
                                    </div>
                                    <p className="text-3xl font-bold">${payrolls[0]?.net_salary.toLocaleString() || '0'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{payrolls[0] ? `${payrolls[0].month}/${payrolls[0].year}` : 'No data'}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leave' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold mb-6">Leave Balances</h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    {leaveBalance.map(b => (
                                        <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                            <p className="text-sm text-slate-500 mb-1">{b.leave_type}</p>
                                            <p className="text-2xl font-bold text-indigo-600">{b.remaining_days}</p>
                                            <p className="text-xs text-slate-400">Total: {b.total_days} days</p>
                                        </div>
                                    ))}
                                </div>
                                <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 italic text-slate-400">
                                                <th className="py-3 px-4">Period</th>
                                                <th className="py-3 px-4">Type</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">AI Insight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaveRequests.map(r => (
                                                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4">{r.start_date} to {r.end_date}</td>
                                                    <td className="py-3 px-4 capitalize">{r.leave_type}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-600 italic">
                                                        {r.ai_decision ? `${r.ai_decision}: ${r.ai_reasoning?.slice(0, 40)}...` : 'Processing...'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold mb-6">Payroll History</h2>
                                <div className="space-y-4">
                                    {payrolls.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                    <BanknotesIcon className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Month {p.month}, {p.year}</p>
                                                    <p className="text-xs text-slate-500">Net: ${p.net_salary.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors">
                                                View Payslip
                                            </button>
                                        </div>
                                    ))}
                                    {payrolls.length === 0 && <p className="text-center text-slate-500 py-8">No payroll records found.</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'onboarding' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold mb-6">Onboarding Tasks</h2>
                                    <div className="space-y-4">
                                        {tasks.map(t => (
                                            <div key={t.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all group">
                                                <button
                                                    onClick={async () => { await completeOnboardingTask(t.id); loadData(); }}
                                                    disabled={t.is_completed}
                                                    className={`mt-1 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${t.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-indigo-400'
                                                        }`}
                                                >
                                                    {t.is_completed && <CheckCircleIcon className="h-5 w-5 text-white" />}
                                                </button>
                                                <div>
                                                    <p className={`font-semibold ${t.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                        {t.task_title}
                                                    </p>
                                                    <p className="text-sm text-slate-500 line-clamp-2">{t.task_description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold mb-6">Required Documents</h2>
                                    <div className="space-y-4">
                                        {docs.map(d => (
                                            <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <DocumentArrowUpIcon className="h-6 w-6 text-slate-400" />
                                                    <div>
                                                        <p className="font-semibold">{d.document_name}</p>
                                                        <p className="text-xs text-slate-500">Type: {d.document_type}</p>
                                                    </div>
                                                </div>
                                                {d.is_signed ? (
                                                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircleIcon className="h-5 w-5" /> Signed
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSignDoc(d.id)}
                                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                                    >
                                                        Sign
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {docs.length === 0 && <p className="text-center text-slate-500 py-8">No documents assigned yet.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
