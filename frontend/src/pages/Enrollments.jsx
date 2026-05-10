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
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Enrollment management requires admin or reception access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Course enrollment</h1>
      {error && <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Register student</h2>
        <form onSubmit={submit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Student</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
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
          <div>
            <label className="block text-xs text-slate-500 mb-1">Course code</label>
            <input
              className="w-full border rounded-lg px-3 py-2 uppercase"
              value={form.courseCode}
              onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
              placeholder="CS201"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Term</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
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
          <div className="lg:col-span-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Enroll
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            className="border rounded-lg px-3 py-2"
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
            className="border rounded-lg px-3 py-2"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Course</th>
                <th className="text-left p-3">Term</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">
                    {r.studentId?.studentId ? `${r.studentId.studentId} — ${r.studentId.fullName}` : String(r.studentId)}
                  </td>
                  <td className="p-3">{r.courseCode}</td>
                  <td className="p-3">{r.academicTermId?.label || '—'}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="p-3">
                    {r.status === 'enrolled' && (
                      <button type="button" onClick={() => drop(r._id)} className="text-red-600 hover:underline">
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
  );
}
