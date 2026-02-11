'use client';

import { useState, useEffect } from 'react';
import {
    calculatePayroll,
    getPayrollHistory,
    getPayrollDetails,
    askPayrollQuestion,
    explainPayslip,
    Payroll,
    SalaryComponent,
    TrustedAIResponse,
    lockPayroll,
    validateAllPayroll,
    downloadAllPayslips
} from '@/lib/api';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import TrustedAIOutput from '@/components/TrustedAIOutput';

export default function PayrollPage() {
    const [employeeId, setEmployeeId] = useState('emp001');
    const [history, setHistory] = useState<Payroll[]>([]);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculation Form
    const [baseSalary, setBaseSalary] = useState(5000);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // AI Chat
    const [question, setQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState<TrustedAIResponse<{ answer: string }> | null>(null);
    const [askingAi, setAskingAi] = useState(false);
    const [explaining, setExplaining] = useState(false);
    const [explanation, setExplanation] = useState<TrustedAIResponse<{ explanation: string }> | null>(null);

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    const fetchHistory = async () => {
        try {
            const data = await getPayrollHistory(employeeId);
            setHistory(data);
            if (data.length > 0 && !selectedPayroll) {
                handleSelectPayroll(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            await calculatePayroll(employeeId, month, year, baseSalary);
            await fetchHistory();
        } catch (e: any) {
            alert(e.message || 'Calculation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLock = async () => {
        if (!confirm(`Are you sure you want to lock payroll for ${month}/${year}? This cannot be undone.`)) return;
        try {
            const res = await lockPayroll(month, year);
            alert(res.message);
        } catch (e: any) {
            alert(e.message || 'Failed to lock payroll');
        }
    };

    const handleSelectPayroll = async (id: number) => {
        try {
            const data = await getPayrollDetails(id);
            setSelectedPayroll(data.payroll);
            setComponents(data.components);
            setExplanation(null); // Reset explanation on new selection
        } catch (e) {
            console.error(e);
        }
    };

    const handleAskAi = async () => {
        if (!question) return;
        setAskingAi(true);
        try {
            const context = selectedPayroll ? `Current viewing payslip for ${selectedPayroll.month}/${selectedPayroll.year} with net salary ${selectedPayroll.net_salary}` : '';
            const res = await askPayrollQuestion(question, context);
            setAiAnswer(res);
        } catch (e) {
            console.error(e);
        } finally {
            setAskingAi(false);
        }
    };

    const handleExplain = async () => {
        if (!selectedPayroll) return;
        setExplaining(true);
        try {
            const res = await explainPayslip(selectedPayroll.id);
            setExplanation(res);
        } catch (e) {
            console.error(e);
        } finally {
            setExplaining(false);
        }
    };

    const [validating, setValidating] = useState(false);
    const [validationResults, setValidationResults] = useState<any>(null);

    const handleValidateAll = async () => {
        setValidating(true);
        setValidationResults(null);
        try {
            const res = await validateAllPayroll(month, year);
            setValidationResults(res);
            if (res.valid) {
                alert("All employees passed validation!");
            } else {
                alert(`Validation failed for ${res.errors.length} employees.`);
            }
        } catch (e: any) {
            alert(e.message || 'Validation failed');
        } finally {
            setValidating(false);
        }
    };

    const handleDownloadAll = async () => {
        try {
            await downloadAllPayslips(month, year);
        } catch (e: any) {
            alert(e.message || 'Download failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Payroll Assistant</h1>

                {/* User Configuration */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-medium mb-4">Payroll Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* ... (existing inputs) ... */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                            <input
                                type="number"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(Number(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Month/Year</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    min="1" max="12"
                                />
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleCalculate}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {loading ? 'Processing...' : 'Run Payroll'}
                            </button>
                            <button
                                onClick={handleLock}
                                className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-900 flex items-center justify-center"
                                title="Lock this period"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {/* Bulk Actions */}
                    <div className="mt-4 flex space-x-4 border-t pt-4">
                        <button
                            onClick={handleValidateAll}
                            disabled={validating}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                        >
                            {validating ? 'Validating...' : 'Validate All Prereqs'}
                        </button>
                        <button
                            onClick={handleDownloadAll}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Download All Payslips (ZIP)
                        </button>
                    </div>

                    {validationResults && !validationResults.valid && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <h3 className="font-bold text-red-800">Validation Errors</h3>
                            <ul className="list-disc pl-5 text-red-700">
                                {validationResults.errors.map((err: any, idx: number) => (
                                    <li key={idx}>Emp #{err.employee_id} ({err.name}): {err.error}</li>
                                ))}
                            </ul>
                            {validationResults.warnings.length > 0 && (
                                <div className="mt-2">
                                    <h3 className="font-bold text-yellow-800">Warnings</h3>
                                    <ul className="list-disc pl-5 text-yellow-700">
                                        {validationResults.warnings.map((warn: any, idx: number) => (
                                            <li key={idx}>Emp #{warn.employee_id} ({warn.name}): {warn.warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ... (rest of the component) ... */}
                    {/* Left: History List */}
                    <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium mb-4">Payslip History</h2>
                        <div className="space-y-3">
                            {history.length === 0 && <p className="text-gray-500">No records found.</p>}
                            {history.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelectPayroll(p.id)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPayroll?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">{p.month}/{p.year}</span>
                                        <span className="text-green-600 font-bold">${p.net_salary.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Status: {p.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Payslip Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {selectedPayroll ? (
                            <>
                                <div className="bg-white shadow rounded-lg p-6 border-t-4 border-blue-600">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Payslip</h2>
                                            <p className="text-gray-500">Period: {selectedPayroll.month}/{selectedPayroll.year}</p>
                                        </div>
                                        <button
                                            onClick={handleExplain}
                                            disabled={explaining}
                                            className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 flex items-center"
                                        >
                                            ✨ {explaining ? 'Analyzing...' : 'Explain with AI'}
                                        </button>
                                    </div>

                                    {explanation && (
                                        <TrustedAIOutput
                                            response={explanation}
                                            title="AI Payslip Analysis"
                                            className="mb-6"
                                        />
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-lg border-b pb-2">
                                            <span className="font-medium">Base Salary</span>
                                            <span>${selectedPayroll.base_salary.toLocaleString()}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Earnings</h3>
                                            {components.filter(c => c.component_type === 'allowance' || c.component_type === 'bonus').map(c => (
                                                <div key={c.id} className="flex justify-between text-sm text-gray-600 pl-4">
                                                    <span>{c.name}</span>
                                                    <span>+${c.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Deductions</h3>
                                            {components.filter(c => c.component_type === 'deduction').map(c => (
                                                <div key={c.id} className="flex justify-between text-sm text-red-600 pl-4">
                                                    <span>{c.name}</span>
                                                    <span>-${c.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between text-xl font-bold border-t pt-4 mt-4">
                                            <span>Net Pay</span>
                                            <span className="text-green-600">${selectedPayroll.net_salary.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Assistant */}
                                <div className="bg-white shadow rounded-lg p-6">
                                    <h3 className="text-lg font-medium mb-4">Payroll Assistant</h3>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            placeholder="Ask about taxes, bonuses, or policy..."
                                            className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                                        />
                                        <button
                                            onClick={handleAskAi}
                                            disabled={askingAi || !question}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                        >
                                            Ask
                                        </button>
                                    </div>
                                    {aiAnswer && (
                                        <div className="mt-4">
                                            <TrustedAIOutput response={aiAnswer} title="AI Answer" />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-white shadow rounded-lg text-gray-500">
                                Select a payslip to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
