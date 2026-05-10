import { useState, useEffect } from 'react';
import { HeartHandshake } from 'lucide-react';
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
      <div className="erp-card-pad flex min-h-[240px] items-center justify-center">
        <p className="erp-muted text-center">Parent portal is only available for parent accounts.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="erp-h1 inline-flex items-center gap-2">
          <HeartHandshake className="h-7 w-7 text-emerald-600" strokeWidth={2} />
          Parent portal
        </h1>
        <p className="erp-muted mt-1.5">Attendance and fee summary for linked students.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </div>
      )}

      {children.length === 0 ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-6 text-sm font-medium text-amber-950 shadow-sm">
          No linked students. An administrator must set{' '}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs">parentOfStudentIds</code> on
          your account.
        </div>
      ) : (
        <>
          <div className="erp-card-pad">
            <label htmlFor="child-select" className="erp-label">
              Student
            </label>
            <select
              id="child-select"
              className="erp-select mt-1 max-w-md"
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="erp-card-pad">
                <h3 className="text-lg font-semibold text-zinc-900">{summary.fullName}</h3>
                <p className="erp-muted mt-1 font-mono text-xs">{summary.studentId}</p>
                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-zinc-500">Attendance</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-700 tabular-nums">
                  {summary.attendance?.percentage != null ? `${summary.attendance.percentage}%` : '—'}
                </p>
                <p className="erp-muted mt-2">
                  {summary.attendance?.present ?? 0} present / {summary.attendance?.total ?? 0} sessions
                </p>
              </div>
              <div className="erp-card-pad">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Fees</p>
                <p className="erp-muted mt-4">Outstanding balance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-amber-700 tabular-nums">
                  Rs. {(summary.fees?.balance ?? 0).toLocaleString()}
                </p>
                <p className="erp-muted mt-4">
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
