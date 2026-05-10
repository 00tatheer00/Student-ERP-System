import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function PortalParent() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'parent') return;
    api
      .get('/portal/parent/children')
      .then((res) => {
        setChildren(res.data);
        if (res.data[0]?._id) setSelectedId(res.data[0]._id);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load children'));
  }, [user]);

  useEffect(() => {
    if (!selectedId || user?.role !== 'parent') return;
    api
      .get(`/portal/parent/student/${selectedId}/summary`)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, [selectedId, user]);

  if (user?.role !== 'parent') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Parent portal is only available for parent accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">Parent portal</h1>
      {error && <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm">{error}</div>}

      {children.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 text-sm">
          No linked students. An administrator must set <code className="bg-amber-100 px-1 rounded">parentOfStudentIds</code>{' '}
          on your account.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
            <select
              className="border rounded-lg px-3 py-2 w-full max-w-md"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {children.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.studentId} — {c.fullName}
                </option>
              ))}
            </select>
          </div>

          {summary && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-slate-800 mb-2">{summary.fullName}</h3>
                <p className="text-sm text-slate-500 mb-4">{summary.studentId}</p>
                <h4 className="text-sm font-medium text-slate-600 mb-1">Attendance</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.attendance?.percentage != null ? `${summary.attendance.percentage}%` : '—'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {summary.attendance?.present ?? 0} present / {summary.attendance?.total ?? 0} sessions
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <h4 className="text-sm font-medium text-slate-600 mb-1">Fees</h4>
                <p className="text-slate-700">
                  Balance:{' '}
                  <span className="font-bold text-amber-700">
                    Rs. {(summary.fees?.balance ?? 0).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Paid Rs. {(summary.fees?.totalPaid ?? 0).toLocaleString()} of{' '}
                  {(summary.fees?.totalDue ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
