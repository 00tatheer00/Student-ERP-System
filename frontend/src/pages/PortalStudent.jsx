import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function PortalStudent() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState(null);
  const [terms, setTerms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollForm, setEnrollForm] = useState({ courseCode: '', academicTermId: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const sid = user?.linkedStudentId;

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/portal/student/me'),
      sid ? api.get(`/degree-requirements/audit/${sid}`) : Promise.resolve({ data: null }),
      api.get('/academic-terms'),
      api.get('/courses'),
      api.get('/enrollments'),
    ])
      .then(([me, aud, t, c, e]) => {
        setData(me.data);
        setAudit(aud.data);
        setTerms(t.data);
        setCourses(c.data);
        setEnrollments(e.data);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load portal'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [sid]);

  const exportGdpr = async () => {
    if (!sid) return;
    try {
      const res = await api.get(`/compliance/gdpr/student/${sid}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${sid}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Export failed');
    }
  };

  const submitEnroll = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/enrollments', {
        courseCode: enrollForm.courseCode.trim(),
        academicTermId: enrollForm.academicTermId,
      });
      setEnrollForm({ courseCode: '', academicTermId: enrollForm.academicTermId });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const dropEnrollment = async (id) => {
    if (!confirm('Drop this course?')) return;
    try {
      await api.patch(`/enrollments/${id}/drop`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Drop failed');
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Student portal is only available for student accounts.</p>
      </div>
    );
  }

  if (!sid) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-amber-900">
        Your account is not linked to a student record. Ask an administrator to link{' '}
        <code className="bg-amber-100 px-1 rounded">linkedStudentId</code> for your user.
      </div>
    );
  }

  if (loading) {
    return <div className="text-slate-500">Loading your portal…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800">Student portal</h1>
      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      {data?.student && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">{data.student.fullName}</h2>
          <p className="text-slate-600 text-sm">
            {data.student.studentId} · {data.student.department} {data.student.program} · Semester{' '}
            {data.student.semester}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Attendance</h3>
          <p className="text-3xl font-bold text-blue-600">
            {data?.attendance?.percentage != null ? `${data.attendance.percentage}%` : '—'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {data?.attendance?.present ?? 0} present / {data?.attendance?.total ?? 0} sessions
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Fees</h3>
          <p className="text-slate-600">
            Balance:{' '}
            <span className="font-bold text-amber-700">
              Rs. {(data?.fees?.balance ?? 0).toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Paid Rs. {(data?.fees?.totalPaid ?? 0).toLocaleString()} of{' '}
            {(data?.fees?.totalDue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-slate-800 mb-3">Transcript summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Semester</th>
                <th className="text-left p-3">GPA</th>
                <th className="text-left p-3">CGPA</th>
                <th className="text-left p-3">Courses</th>
              </tr>
            </thead>
            <tbody>
              {(data?.transcriptSummary || []).map((row) => (
                <tr key={row.semester} className="border-t">
                  <td className="p-3">{row.semester}</td>
                  <td className="p-3">{row.GPA}</td>
                  <td className="p-3">{row.CGPA}</td>
                  <td className="p-3">{row.courses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {audit && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Degree audit</h3>
          <p className="text-sm text-slate-600 mb-2">{audit.planTitle}</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-2xl font-bold text-emerald-600">{audit.progressPercent ?? 0}%</div>
            <span className="text-slate-500 text-sm">of required courses satisfied</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Remaining</p>
          <ul className="list-disc list-inside text-sm text-slate-600">
            {(audit.remaining || []).length ? (
              audit.remaining.map((c) => <li key={c}>{c}</li>)
            ) : (
              <li>None — all required courses recorded.</li>
            )}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-slate-800 mb-3">Course enrollment</h3>
        <form onSubmit={submitEnroll} className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Term</label>
            <select
              className="border rounded-lg px-3 py-2 min-w-[180px]"
              value={enrollForm.academicTermId}
              onChange={(e) => setEnrollForm((f) => ({ ...f, academicTermId: e.target.value }))}
              required
            >
              <option value="">Select term</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.label} ({new Date(t.enrollmentOpenAt).toLocaleDateString()} –{' '}
                  {new Date(t.enrollmentCloseAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Course code</label>
            <select
              className="border rounded-lg px-3 py-2 min-w-[140px]"
              value={enrollForm.courseCode}
              onChange={(e) => setEnrollForm((f) => ({ ...f, courseCode: e.target.value }))}
              required
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c.courseCode}>
                  {c.courseCode} — {c.courseName}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Enroll
          </button>
        </form>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Course</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-3">{row.courseCode}</td>
                <td className="p-3 capitalize">{row.status}</td>
                <td className="p-3">
                  {row.status === 'enrolled' && (
                    <button type="button" onClick={() => dropEnrollment(row._id)} className="text-red-600 text-sm hover:underline">
                      Drop
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-100 rounded-xl p-6">
        <h3 className="font-semibold text-slate-800 mb-2">Privacy</h3>
        <p className="text-sm text-slate-600 mb-3">Download a JSON bundle of your profile data held in this ERP.</p>
        <button type="button" onClick={exportGdpr} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">
          Export my data (GDPR-style)
        </button>
      </div>
    </div>
  );
}
