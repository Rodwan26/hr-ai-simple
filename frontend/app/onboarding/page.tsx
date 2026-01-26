'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OnboardingEmployee, OnboardingStatus } from '@/lib/api'
import { createOnboardingEmployee, deleteOnboardingEmployee, listOnboardingEmployees } from '@/lib/api'
import { EmployeeCard } from '@/components/onboarding/EmployeeCard'

export default function OnboardingDashboardPage() {
  const [employees, setEmployees] = useState<OnboardingEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // New employee form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')
  const [startDate, setStartDate] = useState('')
  const [managerName, setManagerName] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listOnboardingEmployees()
      setEmployees(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean))
    return Array.from(set).sort()
  }, [employees])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (deptFilter !== 'all' && e.department !== deptFilter) return false
      if (!q) return true
      return (
        e.employee_name.toLowerCase().includes(q) ||
        e.employee_email.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      )
    })
  }, [employees, search, statusFilter, deptFilter])

  async function onDelete(id: number) {
    if (!confirm('Delete this onboarding employee and all related data?')) return
    await deleteOnboardingEmployee(id)
    await load()
  }

  async function onCreate() {
    if (!name.trim() || !email.trim() || !position.trim() || !department.trim() || !startDate) return
    setSaving(true)
    try {
      await createOnboardingEmployee({
        employee_name: name.trim(),
        employee_email: email.trim(),
        position: position.trim(),
        department: department.trim(),
        start_date: startDate,
        manager_name: managerName.trim() ? managerName.trim() : undefined,
      })
      setShowAdd(false)
      setName('')
      setEmail('')
      setPosition('')
      setDepartment('')
      setStartDate('')
      setManagerName('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Onboarding Assistant</h1>
              <p className="text-gray-600 mt-1">Create onboarding plans, track progress, and answer questions with AI.</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              + Add New Employee
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role, department…"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              onClick={() => void load()}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

        {loading ? (
          <div className="text-gray-600 text-center py-10">Loading onboarding employees…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center text-gray-600">
            <div className="text-4xl mb-2">👋</div>
            No onboarding employees yet. Click <span className="font-semibold">Add New Employee</span> to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <EmployeeCard key={e.id} employee={e} onDelete={onDelete} />
            ))}
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Add onboarding employee</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Manager (optional)</label>
                  <input
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !name.trim() || !email.trim() || !position.trim() || !department.trim() || !startDate}
                  onClick={() => void onCreate()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

