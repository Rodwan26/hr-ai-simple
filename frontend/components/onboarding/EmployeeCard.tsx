import Link from 'next/link'
import type { OnboardingEmployee } from '@/lib/api'

function statusBadge(status: OnboardingEmployee['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

export function EmployeeCard({
  employee,
  onDelete,
}: {
  employee: OnboardingEmployee
  onDelete: (id: number) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 truncate">{employee.employee_name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(employee.status)}`}>
              {employee.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{employee.employee_email}</p>
          <p className="text-sm text-gray-500 mt-1">
            {employee.position} • {employee.department}
          </p>
          <p className="text-xs text-gray-500 mt-1">Start: {new Date(employee.start_date).toLocaleDateString()}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold text-indigo-700">{employee.completion_percentage}%</div>
          <div className="text-xs text-gray-500">complete</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, employee.completion_percentage))}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/onboarding/${employee.id}`}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(employee.id)}
          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

