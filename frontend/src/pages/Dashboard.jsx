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
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data)).catch(() => setData(null));
  }, []);

  const canViewDashboard = ['admin', 'hod'].includes(user?.role);

  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">You don't have permission to view the dashboard.</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Welcome back, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <p className="text-slate-500 text-sm">Total Students</p>
          <p className="text-3xl font-bold text-slate-800">{data.totalStudents || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <p className="text-slate-500 text-sm">Fee Collected</p>
          <p className="text-3xl font-bold text-green-600">
            Rs. {(data.feeCollection?.total || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <p className="text-slate-500 text-sm">Attendance %</p>
          <p className="text-3xl font-bold text-blue-600">{data.attendancePercentage || 0}%</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <p className="text-slate-500 text-sm">Pending Fines</p>
          <p className="text-3xl font-bold text-amber-600">
            Rs. {(data.finesSummary?.pending || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">Students by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {deptData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">Semester Strength</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={semData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Students" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">GPA Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(data.gpaDistribution || {}).map(([name, value]) => ({
                name,
                value,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" name="Students" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.attendanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#22c55e" name="Attendance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Program Enrollment</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-slate-500">BS (4 Years)</p>
            <p className="text-2xl font-bold text-blue-600">{data.byProgram?.BS || 0}</p>
          </div>
          <div>
            <p className="text-slate-500">MS (2 Years)</p>
            <p className="text-2xl font-bold text-green-600">{data.byProgram?.MS || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
