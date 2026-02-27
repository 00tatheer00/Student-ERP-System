import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'hod'] },
  { path: '/students', label: 'Students', icon: '👥', roles: ['admin', 'reception', 'hod'] },
  { path: '/courses', label: 'Courses', icon: '📚', roles: ['admin', 'teacher', 'reception', 'hod'] },
  { path: '/attendance', label: 'Attendance', icon: '✓', roles: ['admin', 'teacher', 'hod'] },
  { path: '/results', label: 'Results', icon: '📝', roles: ['admin', 'teacher', 'hod'] },
  { path: '/fees', label: 'Fees', icon: '💰', roles: ['admin', 'reception', 'hod'] },
  { path: '/fines', label: 'Fines', icon: '⚠️', roles: ['admin', 'reception', 'hod'] },
  { path: '/departments', label: 'Departments', icon: '🏛️', roles: ['admin', 'teacher', 'reception', 'hod'] },
  { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'hod'] },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white fixed h-full transition-all duration-300 z-40`}
      >
        <div className="p-4 border-b border-slate-700">
          <h1 className={`font-bold truncate ${sidebarOpen ? 'text-lg' : 'text-sm'}`}>
            {sidebarOpen ? 'UCS ERP' : 'UCS'}
          </h1>
          <p className="text-xs text-slate-400 truncate">Student ERP System</p>
        </div>
        <nav className="mt-4">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            ☰
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.fullName} <span className="text-slate-400">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
