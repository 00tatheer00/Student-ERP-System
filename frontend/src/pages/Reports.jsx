import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    if (['admin', 'hod'].includes(user?.role)) {
      api.get('/dashboard').then((res) => setDashboard(res.data)).catch(() => setDashboard(null));
    }
    if (user?.role === 'admin') {
      api.get('/activity-logs').then((res) => setActivityLogs(res.data)).catch(() => {});
    }
  }, [user]);

  const canViewReports = ['admin', 'hod'].includes(user?.role);

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">You don't have permission to view reports.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>

      {dashboard && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Summary Report</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold">{dashboard.totalStudents}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-slate-500 text-sm">Fee Collected</p>
              <p className="text-2xl font-bold text-green-600">
                Rs. {(dashboard.feeCollection?.total || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-slate-500 text-sm">Fee Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                Rs. {(dashboard.feeCollection?.pending || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-slate-500 text-sm">Attendance %</p>
              <p className="text-2xl font-bold text-blue-600">{dashboard.attendancePercentage || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Logs</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Action</th>
                  <th className="text-left p-4">Module</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log._id} className="border-t hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">{log.userId?.fullName || '-'}</td>
                    <td className="p-4">{log.action}</td>
                    <td className="p-4">{log.module}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
