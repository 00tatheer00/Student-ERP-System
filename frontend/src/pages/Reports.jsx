import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  const [compliancePreview, setCompliancePreview] = useState(null);

  useEffect(() => {
    if (['admin', 'hod'].includes(user?.role)) {
      api.get('/dashboard').then((res) => setDashboard(res.data)).catch(() => setDashboard(null));
    }
    if (user?.role === 'admin') {
      api.get('/activity-logs').then((res) => setActivityLogs(res.data)).catch(() => {});
    }
  }, [user]);

  const canViewReports = ['admin', 'hod', 'reception', 'teacher'].includes(user?.role);
  const canAttendanceInsight = ['admin', 'hod', 'teacher'].includes(user?.role);
  const canFeeInsights = ['admin', 'hod', 'reception'].includes(user?.role);
  const canHecExport = ['admin', 'hod'].includes(user?.role);

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">You don't have permission to view reports.</div>
      </div>
    );
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchAttendancePreview = () => {
    api
      .get('/compliance/insights/attendance-sheet')
      .then((res) => setCompliancePreview({ title: 'Attendance sheet (sample)', body: res.data }))
      .catch(() => setCompliancePreview({ title: 'Error', body: { message: 'Failed to load' } }));
  };

  const fetchFeeCollection = () => {
    api
      .get('/compliance/insights/fee-collection')
      .then((res) => setCompliancePreview({ title: 'Fee collection summary', body: res.data }))
      .catch(() => setCompliancePreview({ title: 'Error', body: { message: 'Failed to load' } }));
  };

  const fetchDefaulters = () => {
    api
      .get('/compliance/insights/fee-defaulters')
      .then((res) => setCompliancePreview({ title: 'Fee defaulters', body: res.data }))
      .catch(() => setCompliancePreview({ title: 'Error', body: { message: 'Failed to load' } }));
  };

  const downloadHec = async () => {
    try {
      const res = await api.get('/compliance/insights/hec-students-export', { responseType: 'blob' });
      downloadBlob(res.data, 'hec-style-students.csv');
    } catch {
      alert('Could not download HEC-style export.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Compliance & exports</h2>
        <p className="text-sm text-slate-600 mb-4">
          Term-wise attendance JSON, fee summaries, defaulters, and HEC-style student CSV (role-restricted on the API).
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {canAttendanceInsight && (
            <button
              type="button"
              onClick={fetchAttendancePreview}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900"
            >
              Attendance sheet (JSON preview)
            </button>
          )}
          {canFeeInsights && (
            <>
              <button
                type="button"
                onClick={fetchFeeCollection}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm hover:bg-emerald-800"
              >
                Fee collection summary
              </button>
              <button
                type="button"
                onClick={fetchDefaulters}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-800"
              >
                Defaulters list
              </button>
            </>
          )}
          {canHecExport && (
            <button
              type="button"
              onClick={downloadHec}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800"
            >
              Download HEC-style CSV
            </button>
          )}
        </div>
        {compliancePreview && (
          <pre className="text-xs bg-slate-50 border rounded-lg p-4 max-h-72 overflow-auto overflow-x-auto">
            {JSON.stringify(compliancePreview.body, null, 2)}
          </pre>
        )}
      </div>

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
