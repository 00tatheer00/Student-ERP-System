import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  FileText,
  Wallet,
  AlertTriangle,
  Building2,
  BarChart3,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard, roles: ['admin', 'hod'] },
  { path: '/portal/student', label: 'My portal', Icon: GraduationCap, roles: ['student'] },
  { path: '/portal/parent', label: 'Parent portal', Icon: HeartHandshake, roles: ['parent'] },
  { path: '/students', label: 'Students', Icon: Users, roles: ['admin', 'reception', 'hod'] },
  { path: '/courses', label: 'Courses', Icon: BookOpen, roles: ['admin', 'teacher', 'reception', 'hod'] },
  { path: '/attendance', label: 'Attendance', Icon: CheckSquare, roles: ['admin', 'teacher', 'hod'] },
  { path: '/results', label: 'Results', Icon: FileText, roles: ['admin', 'teacher', 'hod'] },
  { path: '/fees', label: 'Fees', Icon: Wallet, roles: ['admin', 'reception', 'hod'] },
  { path: '/fines', label: 'Fines', Icon: AlertTriangle, roles: ['admin', 'reception', 'hod'] },
  { path: '/departments', label: 'Departments', Icon: Building2, roles: ['admin', 'teacher', 'reception', 'hod'] },
  { path: '/reports', label: 'Reports', Icon: BarChart3, roles: ['admin', 'hod', 'reception', 'teacher'] },
  { path: '/enrollments', label: 'Enrollment', Icon: ClipboardList, roles: ['admin', 'reception'] },
];

function roleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = sidebarOpen ? 'w-[272px]' : 'w-[76px]';
  const mainMargin = sidebarOpen ? 'ml-[272px]' : 'ml-[76px]';

  return (
    <div className="min-h-screen flex bg-transparent">
      <aside
        className={`${sidebarWidth} fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-zinc-950 text-zinc-300 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out`}
      >
        <div className="relative overflow-hidden border-b border-white/[0.06] px-4 py-5">
          <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-900/40">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[15px] font-bold tracking-tight text-white">UCS ERP</h1>
                <p className="truncate text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                  Academic Suite
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNav.map((item) => {
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    sidebarOpen ? '' : 'justify-center px-2',
                    isActive
                      ? 'bg-white/[0.09] text-white shadow-inner shadow-black/20 ring-1 ring-white/[0.08]'
                      : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-200',
                      ].join(' ')}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    </span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                    {sidebarOpen && (
                      <span
                        className={[
                          'ml-auto h-1.5 w-1.5 shrink-0 rounded-full transition-opacity',
                          isActive ? 'bg-emerald-400 opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div
            className={[
              'flex items-center gap-3 rounded-xl bg-zinc-900/80 px-3 py-2.5 ring-1 ring-white/[0.05]',
              sidebarOpen ? '' : 'justify-center px-2',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-xs font-bold text-white ring-2 ring-zinc-700">
              {(user?.fullName || '?')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
                <p className="truncate text-xs text-zinc-500">{roleLabel(user?.role)}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`min-h-screen flex-1 transition-[margin] duration-300 ease-out ${mainMargin}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="erp-btn-ghost rounded-xl !px-3 !py-2 text-zinc-600"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-zinc-900">{user?.fullName}</p>
              <p className="text-xs text-zinc-500">{roleLabel(user?.role)}</p>
            </div>
            <button type="button" onClick={handleLogout} className="erp-btn-secondary !gap-1.5 !py-2">
              <LogOut className="h-4 w-4 text-zinc-500" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
