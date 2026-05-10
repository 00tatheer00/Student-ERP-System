import { useState, useEffect } from 'react';
import { FileJson, Wallet, Users, Download } from 'lucide-react';
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
      <div className="erp-card-pad flex min-h-[240px] items-center justify-center">
        <p className="erp-muted text-center">You don&apos;t have permission to view reports.</p>
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
      <div>
        <h1 className="erp-h1">Reports & analytics</h1>
        <p className="erp-muted mt-1">Compliance exports and institutional summaries.</p>
      </div>

      <div className="erp-card-pad">
        <h2 className="text-base font-semibold text-zinc-900">Compliance & exports</h2>
        <p className="erp-muted mt-2 max-w-3xl">
          Term-wise attendance JSON, fee summaries, defaulters, and HEC-style student CSV (role-restricted on the API).
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {canAttendanceInsight && (
            <button type="button" onClick={fetchAttendancePreview} className="erp-btn-primary">
              <FileJson className="h-4 w-4 opacity-90" />
              Attendance (JSON)
            </button>
          )}
          {canFeeInsights && (
            <>
              <button type="button" onClick={fetchFeeCollection} className="erp-btn-accent">
                <Wallet className="h-4 w-4 opacity-90" />
                Fee collection
              </button>
              <button type="button" onClick={fetchDefaulters} className="erp-btn-secondary">
                <Users className="h-4 w-4 text-zinc-500" />
                Defaulters
              </button>
            </>
          )}
          {canHecExport && (
            <button type="button" onClick={downloadHec} className="erp-btn-secondary border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-50">
              <Download className="h-4 w-4 text-emerald-700" />
              HEC-style CSV
            </button>
          )}
        </div>
        {compliancePreview && (
          <pre className="mt-5 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-700">
            {JSON.stringify(compliancePreview.body, null, 2)}
          </pre>
        )}
      </div>

      {dashboard && (
        <div className="erp-card-pad">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Summary</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Students</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{dashboard.totalStudents}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/70">Fee collected</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-800">
                Rs. {(dashboard.feeCollection?.total || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Fee pending</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">
                Rs. {(dashboard.feeCollection?.pending || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-900/70">Attendance</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-cyan-900">{dashboard.attendancePercentage || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="erp-card-pad">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Activity logs</h2>
          <div className="erp-table-shell max-h-96 !shadow-none">
            <div className="overflow-auto">
              <table className="erp-table">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="whitespace-nowrap text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="font-medium">{log.userId?.fullName || '-'}</td>
                      <td>{log.action}</td>
                      <td className="text-zinc-600">{log.module}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
