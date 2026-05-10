import { useState, useEffect } from 'react';
import { GraduationCap, Shield } from 'lucide-react';
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
      <div className="erp-card-pad flex min-h-[240px] items-center justify-center">
        <p className="erp-muted text-center">Student portal is only available for student accounts.</p>
      </div>
    );
  }

  if (!sid) {
    return (
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-6 text-sm font-medium text-amber-950 shadow-sm">
        Your account is not linked to a student record. Ask an administrator to link{' '}
        <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs">linkedStudentId</code> for your
        user.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="erp-card-pad flex min-h-[200px] items-center justify-center gap-3">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500/25 border-t-emerald-600" />
        <p className="erp-muted">Loading your portal…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1 inline-flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-emerald-600" strokeWidth={2} />
            Student portal
          </h1>
          <p className="erp-muted mt-1.5">Read-only academic snapshot, enrollment, and privacy export.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          {error}
        </div>
      )}

      {data?.student && (
        <div className="erp-card-pad relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-emerald-500/[0.07] blur-3xl" />
          <h2 className="text-lg font-semibold text-zinc-900">{data.student.fullName}</h2>
          <p className="erp-muted mt-1">
            {data.student.studentId} · {data.student.department} {data.student.program} · Semester{' '}
            {data.student.semester}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="erp-card-pad">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Attendance</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700 tabular-nums">
            {data?.attendance?.percentage != null ? `${data.attendance.percentage}%` : '—'}
          </p>
          <p className="erp-muted mt-2">
            {data?.attendance?.present ?? 0} present / {data?.attendance?.total ?? 0} sessions
          </p>
        </div>
        <div className="erp-card-pad">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Fees</h3>
          <p className="erp-muted mt-3">Outstanding balance</p>
          <p className="text-3xl font-semibold tracking-tight text-amber-700 tabular-nums">
            Rs. {(data?.fees?.balance ?? 0).toLocaleString()}
          </p>
          <p className="erp-muted mt-2">
            Paid Rs. {(data?.fees?.totalPaid ?? 0).toLocaleString()} of{' '}
            {(data?.fees?.totalDue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="erp-card-pad">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Transcript summary</h3>
        <div className="erp-table-shell !shadow-none">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>GPA</th>
                  <th>CGPA</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {(data?.transcriptSummary || []).map((row) => (
                  <tr key={row.semester}>
                    <td className="font-medium">{row.semester}</td>
                    <td>{row.GPA}</td>
                    <td>{row.CGPA}</td>
                    <td>{row.courses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {audit && (
        <div className="erp-card-pad border-emerald-500/15 bg-gradient-to-br from-white to-emerald-50/40">
          <h3 className="text-base font-semibold text-zinc-900">Degree audit</h3>
          <p className="erp-muted mt-1">{audit.planTitle}</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="text-4xl font-semibold tracking-tight text-emerald-700 tabular-nums">
              {audit.progressPercent ?? 0}%
            </div>
            <span className="erp-muted pb-1">of required courses satisfied</span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-zinc-500">Remaining</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
            {(audit.remaining || []).length ? (
              audit.remaining.map((c) => <li key={c}>{c}</li>)
            ) : (
              <li>None — all required courses recorded.</li>
            )}
          </ul>
        </div>
      )}

      <div className="erp-card-pad">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Course enrollment</h3>
        <form onSubmit={submitEnroll} className="mb-6 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="erp-label">Term</label>
            <select
              className="erp-select"
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
          <div className="min-w-[200px] flex-1">
            <label className="erp-label">Course</label>
            <select
              className="erp-select"
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
          <button type="submit" className="erp-btn-accent">
            Enroll
          </button>
        </form>
        <div className="erp-table-shell !shadow-none">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {enrollments.map((row) => (
                  <tr key={row._id}>
                    <td className="font-mono text-xs font-semibold">{row.courseCode}</td>
                    <td>
                      <span className={row.status === 'enrolled' ? 'erp-badge-ok' : 'erp-badge-warn'}>
                        {row.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {row.status === 'enrolled' && (
                        <button type="button" onClick={() => dropEnrollment(row._id)} className="erp-link text-red-700 hover:text-red-600">
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

      <div className="erp-card-pad border-zinc-900/10 bg-zinc-950 text-zinc-100">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Privacy</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Download a JSON bundle of profile data held in this ERP.
            </p>
            <button type="button" onClick={exportGdpr} className="erp-btn-secondary mt-4 border-white/10 bg-white/10 text-white hover:bg-white/15">
              Export my data (GDPR-style)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
