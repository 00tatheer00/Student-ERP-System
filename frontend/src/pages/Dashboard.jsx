import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, Wallet, Percent, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#059669', '#6366f1', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data)).catch(() => setData(null));
  }, []);

  const canViewDashboard = ['admin', 'hod'].includes(user?.role);

  if (!canViewDashboard) {
    return (
      <div className="erp-card-pad flex min-h-[280px] items-center justify-center">
        <p className="erp-muted text-center">You don&apos;t have permission to view the dashboard.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="erp-card-pad flex min-h-[280px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/25 border-t-emerald-600" />
          <p className="erp-muted">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const deptData = Object.entries(data.byDepartment || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const semData = Object.entries(data.bySemester || {})
    .sort((a, b) => a[0] - b[0])
    .map(([name, value]) => ({ name: `Sem ${name}`, value }));

  const stats = [
    {
      label: 'Total students',
      value: data.totalStudents || 0,
      sub: 'Active records',
      Icon: Users,
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Fee collected',
      value: `Rs. ${(data.feeCollection?.total || 0).toLocaleString()}`,
      sub: 'All semesters',
      Icon: Wallet,
      tone: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Attendance rate',
      value: `${data.attendancePercentage || 0}%`,
      sub: 'Campus-wide',
      Icon: Percent,
      tone: 'from-cyan-500 to-teal-500',
    },
    {
      label: 'Pending fines',
      value: `Rs. ${(data.finesSummary?.pending || 0).toLocaleString()}`,
      sub: 'Outstanding',
      Icon: AlertCircle,
      tone: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="erp-h1">Dashboard</h1>
        <p className="erp-muted mt-1.5">
          Welcome back, <span className="font-semibold text-zinc-700">{user?.fullName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, Icon: I, tone }) => (
          <div key={label} className="erp-stat">
            <div className={`erp-stat-accent bg-gradient-to-r ${tone}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
                <p className="erp-muted mt-1">{sub}</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-zinc-100">
                <I className="h-5 w-5 text-zinc-600" strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="erp-card-pad">
          <h2 className="mb-6 text-base font-semibold text-zinc-900">Students by department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={102}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {deptData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="erp-card-pad">
          <h2 className="mb-6 text-base font-semibold text-zinc-900">Semester strength</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={semData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(24,24,27,0.03)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
                }}
              />
              <Bar dataKey="value" fill="#059669" name="Students" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="erp-card-pad">
          <h2 className="mb-6 text-base font-semibold text-zinc-900">GPA distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(data.gpaDistribution || {}).map(([name, value]) => ({
                name,
                value,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(24,24,27,0.03)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
                }}
              />
              <Bar dataKey="value" fill="#6366f1" name="Students" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="erp-card-pad">
          <h2 className="mb-6 text-base font-semibold text-zinc-900">Attendance trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.attendanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                name="Attendance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="erp-card-pad">
        <h2 className="mb-6 text-base font-semibold text-zinc-900">Program enrollment</h2>
        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">BS (4 years)</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-700">{data.byProgram?.BS || 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">MS (2 years)</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-indigo-700">{data.byProgram?.MS || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
