import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Enrollments() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [terms, setTerms] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: '',
    courseCode: '',
    academicTermId: '',
  });
  const [filters, setFilters] = useState({ academicTermId: '', status: '' });
  const [error, setError] = useState('');

  const canStaff = ['admin', 'reception'].includes(user?.role);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.academicTermId) params.append('academicTermId', filters.academicTermId);
    if (filters.status) params.append('status', filters.status);
    api
      .get(`/enrollments?${params}`)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [filters.academicTermId, filters.status]);

  useEffect(() => {
    if (!canStaff) return;
    api.get('/academic-terms').then((res) => setTerms(res.data)).catch(() => {});
    api.get('/students').then((res) => setStudents(res.data)).catch(() => {});
  }, [canStaff]);

  useEffect(() => {
    if (!canStaff) return;
    load();
  }, [canStaff, load]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/enrollments', form);
      setForm({ ...form, courseCode: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    }
  };

  const drop = async (id) => {
    if (!confirm('Mark this enrollment as dropped?')) return;
    try {
      await api.patch(`/enrollments/${id}/drop`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Drop failed');
    }
  };

  if (!canStaff) {
    return (
      <div className="erp-card-pad flex min-h-[240px] items-center justify-center">
        <p className="erp-muted text-center">Enrollment management requires admin or reception access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="erp-h1">Course enrollment</h1>
        <p className="erp-muted mt-1">Register students within term windows and prerequisites.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </div>
      )}

      <div className="erp-card-pad">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Register student</h2>
        <form onSubmit={submit} className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-5">
            <label className="erp-label">Student</label>
            <select
              className="erp-select mt-1"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              required
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} — {s.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="erp-label">Course code</label>
            <input
              className="erp-input mt-1 uppercase"
              value={form.courseCode}
              onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
              placeholder="CS201"
              required
            />
          </div>
          <div className="lg:col-span-3">
            <label className="erp-label">Term</label>
            <select
              className="erp-select mt-1"
              value={form.academicTermId}
              onChange={(e) => setForm((f) => ({ ...f, academicTermId: e.target.value }))}
              required
            >
              <option value="">Select term</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1 flex lg:justify-end">
            <button type="submit" className="erp-btn-accent w-full lg:w-auto">
              Enroll
            </button>
          </div>
        </form>
      </div>

      <div className="erp-card-pad">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            className="erp-select w-auto min-w-[160px]"
            value={filters.academicTermId}
            onChange={(e) => setFilters((f) => ({ ...f, academicTermId: e.target.value }))}
          >
            <option value="">All terms</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="erp-select w-auto min-w-[140px]"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <div className="erp-table-shell !shadow-none">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td className="max-w-[220px]">
                      {r.studentId?.studentId
                        ? `${r.studentId.studentId} — ${r.studentId.fullName}`
                        : String(r.studentId)}
                    </td>
                    <td className="font-mono text-xs font-semibold">{r.courseCode}</td>
                    <td>{r.academicTermId?.label || '—'}</td>
                    <td>
                      <span className={r.status === 'enrolled' ? 'erp-badge-ok' : 'erp-badge-warn'}>{r.status}</span>
                    </td>
                    <td className="text-right">
                      {r.status === 'enrolled' && (
                        <button type="button" onClick={() => drop(r._id)} className="erp-link text-red-700 hover:text-red-600">
                          Drop
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
