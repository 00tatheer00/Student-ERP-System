import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { decodeAttendanceScan } from '../utils/attendanceScan';

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
      <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Mark attendance</h2>
          <p className="text-sm text-slate-600 mb-4">
            Plug in a USB QR scanner (or pair a Bluetooth scanner). Click in the scanner field below — most devices act
            like a keyboard and type the code, then press Enter. Use the same QR as on the back of the printed ID card.
          </p>
          <form onSubmit={handleScanFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                value={scanForm.courseCode}
                onChange={(e) => setScanForm({ ...scanForm, courseCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
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
              <label className="block text-sm font-medium mb-1">QR scanner / paste scan</label>
              <input
                ref={scannerInputRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Focus here, then scan student ID card (back side)"
                value={scannerRaw}
                onChange={onScannerInputChange}
                onKeyDown={onScannerKeyDown}
                className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {resolvedStudent ? (
                <p className="mt-2 text-sm text-green-700 font-medium">
                  Recognized: {resolvedStudent.studentId} — {resolvedStudent.fullName}
                </p>
              ) : scannerRaw.trim() ? (
                <p className="mt-2 text-sm text-amber-700">Could not parse scan — try again or use manual select.</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or select student manually</label>
              <select
                value={scanForm.studentId && scanForm.method === 'manual' ? scanForm.studentId : ''}
                onChange={(e) => onManualStudentChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
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
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={scanForm.status}
                onChange={(e) => setScanForm({ ...scanForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
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
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium"
            >
              Mark attendance
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Preview QR (same data as ID card back)</h2>
          <p className="text-sm text-slate-600 mb-4">
            On-screen preview only; printed cards use the identical attendance payload.
          </p>
          <div className="space-y-4">
            <select
              onChange={(e) => e.target.value && showQr(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select student for QR preview</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} — {s.fullName}
                </option>
              ))}
            </select>
            {qrStudent && (
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                <img src={qrStudent.qrCode} alt="Attendance QR" className="w-48 h-48" />
                <p className="mt-2 font-mono text-sm">{qrStudent.studentId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Attendance records</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
            className="px-3 py-2 border rounded-lg"
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
            className="px-3 py-2 border rounded-lg"
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
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">Course</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Method</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a._id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      {a.studentId?.studentId || a.studentId} — {a.studentId?.fullName || '-'}
                    </td>
                    <td className="p-4">{a.courseCode}</td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          a.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : a.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4">{a.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
