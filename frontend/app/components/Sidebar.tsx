'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  HeartIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentDuplicateIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  UserIcon, 
  ArrowLeftOnRectangleIcon, 
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isHR = user && (user.role === 'HR_ADMIN' || user.role === 'HR_STAFF');

  const navigation = [
    { name: 'Help Desk', href: '/', icon: HomeIcon, current: pathname === '/' },
    ...(isHR ? [
      { name: 'Resumes', href: '/resumes', icon: DocumentTextIcon, current: pathname.startsWith('/resumes') },
      { name: 'Wellbeing Hub', href: '/risk', icon: HeartIcon, current: pathname.startsWith('/risk') },
      { name: 'Interviews', href: '/interviews', icon: ChatBubbleLeftRightIcon, current: pathname.startsWith('/interviews') },
    ] : []),
    { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon, current: pathname.startsWith('/documents') },
    { name: 'Onboarding', href: '/onboarding', icon: UserGroupIcon, current: pathname.startsWith('/onboarding') },
    { name: 'Leave', href: '/leave', icon: CalendarIcon, current: pathname.startsWith('/leave') },
    { name: 'My Profile', href: '/profile', icon: UserIcon, current: pathname.startsWith('/profile') },
    ...(isHR ? [
      { name: 'Wellbeing Trends', href: '/burnout', icon: ChartBarIcon, current: pathname.startsWith('/burnout') },
      { name: 'Payroll', href: '/payroll', icon: BanknotesIcon, current: pathname.startsWith('/payroll') },
    ] : []),
  ];

  return (
    <div className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 bg-slate-900 text-white z-50 shadow-xl border-r border-slate-800">
      {/* Brand Logo */}
      <div className="flex items-center justify-center h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-500 transition-colors">
            <span className="text-xl font-bold text-white">HR</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AI Platform</h1>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-6 pb-4 px-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
              ${item.current 
                ? 'bg-indigo-600/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
              }
            `}
          >
            <item.icon
              className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                item.current ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white'
              }`}
              aria-hidden="true"
            />
            {item.name}
            {item.current && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            )}
          </Link>
        ))}
      </div>

      {/* User & Logout Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        {user ? (
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-md">
                   {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                   <p className="text-sm font-medium text-white truncate">{user.email}</p>
                   <p className="text-xs text-slate-400 truncate capitalize">{user.role?.replace('_', ' ').toLowerCase()}</p>
                </div>
             </div>
             
             <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2 border border-red-900/30 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
