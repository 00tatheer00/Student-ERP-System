import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { decodeAttendanceScan } from '../utils/attendanceScan';

function statusBadge(status) {
  if (status === 'present') return 'erp-badge-ok';
  if (status === 'late') return 'erp-badge-warn';
  if (status === 'excused') return 'erp-badge-warn';
  return 'erp-badge-bad';
}

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    studentId: '',
    courseCode: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [scanForm, setScanForm] = useState({
    studentId: '',
    courseCode: '',
    status: 'present',
    method: 'manual',
  });
  const [scannerRaw, setScannerRaw] = useState('');
  const [qrStudent, setQrStudent] = useState(null);
  const scannerInputRef = useRef(null);

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data));
    api.get('/courses').then((res) => setCourses(res.data));
  }, []);

  useEffect(() => {
    scannerInputRef.current?.focus();
  }, []);

  const fetchAttendance = () => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.date) params.append('date', filters.date);
    api.get(`/attendance?${params}`).then((res) => {
      setAttendance(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const markAttendance = async (overrides = {}) => {
    const payload = { ...scanForm, ...overrides };
    if (!payload.courseCode || !payload.studentId) {
      alert('Choose a course and scan the card (or pick a student manually).');
      return;
    }
    try {
      await api.post('/attendance/scan', payload);
      alert('Attendance marked successfully');
      setScanForm((f) => ({
        ...f,
        studentId: '',
        method: 'manual',
      }));
      setScannerRaw('');
      scannerInputRef.current?.focus();
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleScanFormSubmit = async (e) => {
    e.preventDefault();
    await markAttendance();
  };

  const applyPayloadFromScanner = (raw) => {
    const id = decodeAttendanceScan(raw);
    if (id) {
      setScanForm((f) => ({ ...f, studentId: id, method: 'qr' }));
      return true;
    }
    setScanForm((f) => ({ ...f, studentId: '', method: f.method }));
    return false;
  };

  const onScannerInputChange = (e) => {
    const v = e.target.value;
    setScannerRaw(v);
    applyPayloadFromScanner(v.trim());
  };

  const onScannerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const id = decodeAttendanceScan(scannerRaw.trim());
      if (id && scanForm.courseCode) {
        markAttendance({ studentId: id, method: 'qr' });
      }
    }
  };

  const onManualStudentChange = (value) => {
    setScannerRaw('');
    if (!value) {
      setScanForm((f) => ({ ...f, studentId: '', method: 'manual' }));
      return;
    }
    setScanForm((f) => ({ ...f, studentId: value, method: 'manual' }));
  };

  const showQr = async (studentId) => {
    try {
      const res = await api.get(`/attendance/qr/${studentId}`);
      setQrStudent(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate QR');
    }
  };

  const resolvedStudent = students.find((s) => s._id === scanForm.studentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="erp-h1">Attendance</h1>
        <p className="erp-muted mt-1">QR scanning, manual entry, and session history.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="erp-card-pad">
          <h2 className="text-base font-semibold text-zinc-900">Mark attendance</h2>
          <p className="erp-muted mt-2 text-sm leading-relaxed">
            Plug in a USB QR scanner (or pair a Bluetooth scanner). Focus the scanner field — devices typically emulate a
            keyboard. Use the same QR as on the back of the printed ID card.
          </p>
          <form onSubmit={handleScanFormSubmit} className="mt-6 space-y-4">
            <div>
              <label className="erp-label">Course</label>
              <select
                value={scanForm.courseCode}
                onChange={(e) => setScanForm({ ...scanForm, courseCode: e.target.value })}
                className="erp-select mt-1"
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

            <div>
              <label className="erp-label">QR scanner / paste</label>
              <input
                ref={scannerInputRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Focus here, then scan student ID card (back side)"
                value={scannerRaw}
                onChange={onScannerInputChange}
                onKeyDown={onScannerKeyDown}
                className="erp-input mt-1 border-emerald-200/80 font-mono text-sm shadow-inner focus:border-emerald-400 focus:ring-emerald-500/20"
              />
              {resolvedStudent ? (
                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  Recognized: {resolvedStudent.studentId} — {resolvedStudent.fullName}
                </p>
              ) : scannerRaw.trim() ? (
                <p className="mt-2 text-sm font-medium text-amber-800">Could not parse scan — try again or use manual select.</p>
              ) : null}
            </div>

            <div>
              <label className="erp-label">Or select student manually</label>
              <select
                value={scanForm.studentId && scanForm.method === 'manual' ? scanForm.studentId : ''}
                onChange={(e) => onManualStudentChange(e.target.value)}
                className="erp-select mt-1"
              >
                <option value="">None (use scanner)</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.studentId} — {s.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">Status</label>
              <select
                value={scanForm.status}
                onChange={(e) => setScanForm({ ...scanForm, status: e.target.value })}
                className="erp-select mt-1"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!scanForm.studentId || !scanForm.courseCode}
              className="erp-btn-accent w-full disabled:pointer-events-none disabled:opacity-40"
            >
              Mark attendance
            </button>
          </form>
        </div>

        <div className="erp-card-pad">
          <h2 className="text-base font-semibold text-zinc-900">QR preview</h2>
          <p className="erp-muted mt-2 text-sm">
            On-screen preview only; printed cards use the identical attendance payload.
          </p>
          <div className="mt-6 space-y-4">
            <select
              onChange={(e) => e.target.value && showQr(e.target.value)}
              className="erp-select"
              defaultValue=""
            >
              <option value="">Select student for QR preview</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} — {s.fullName}
                </option>
              ))}
            </select>
            {qrStudent && (
              <div className="flex flex-col items-center rounded-2xl border border-zinc-100 bg-zinc-50/90 p-6">
                <img src={qrStudent.qrCode} alt="Attendance QR" className="h-48 w-48" />
                <p className="mt-3 font-mono text-sm font-medium text-zinc-700">{qrStudent.studentId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="erp-card-pad">
        <h2 className="text-base font-semibold text-zinc-900">Attendance records</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
            className="erp-select w-auto min-w-[160px]"
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.studentId}
              </option>
            ))}
          </select>
          <select
            value={filters.courseCode}
            onChange={(e) => setFilters({ ...filters, courseCode: e.target.value })}
            className="erp-select w-auto min-w-[140px]"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c.courseCode}>
                {c.courseCode}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="erp-input w-auto"
          />
        </div>
        {loading ? (
          <p className="erp-muted mt-6">Loading…</p>
        ) : (
          <div className="erp-table-shell mt-6 !shadow-none">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a._id}>
                      <td className="font-medium">
                        {a.studentId?.studentId || a.studentId} — {a.studentId?.fullName || '-'}
                      </td>
                      <td className="font-mono text-xs">{a.courseCode}</td>
                      <td className="tabular-nums text-zinc-600">{new Date(a.date).toLocaleDateString()}</td>
                      <td>
                        <span className={statusBadge(a.status)}>{a.status}</span>
                      </td>
                      <td className="text-zinc-600">{a.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
